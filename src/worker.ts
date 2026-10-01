interface D1Database {
  prepare(query: string): any;
  batch(statements: any[]): Promise<any>;
  exec(query: string): Promise<any>;
}

interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json;charset=utf-8'
};

async function ensureTables(db: D1Database) {
  await db.prepare('CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, name TEXT NOT NULL, username TEXT, pin TEXT NOT NULL, role TEXT, avatar_color TEXT, is_active INTEGER DEFAULT 1, updated_at TEXT);').run();
  await db.prepare('CREATE TABLE IF NOT EXISTS user_finance (user_id TEXT PRIMARY KEY, data_json TEXT NOT NULL, updated_at TEXT);').run();
  await db.prepare('CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT);').run();
}

async function handleD1Api(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (!env.DB) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'D1 Database binding (DB) belum aktif di Cloudflare.',
        database_id: 'e70a98f0-8274-47e8-992a-f85974ce1206'
      }),
      { status: 503, headers: CORS_HEADERS }
    );
  }

  const db = env.DB;
  const url = new URL(request.url);

  try {
    await ensureTables(db);

    if (request.method === 'GET') {
      const action = url.searchParams.get('action') || 'ping';

      if (action === 'ping') {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Koneksi Cloudflare D1 Database Aktif & Terhubung!',
            database_id: 'e70a98f0-8274-47e8-992a-f85974ce1206',
            timestamp: new Date().toISOString()
          }),
          { headers: CORS_HEADERS }
        );
      }

      if (action === 'load') {
        const userId = url.searchParams.get('user_id') || 'acc_azmin';

        // Load accounts
        const accountsRes = await db.prepare('SELECT * FROM accounts ORDER BY is_active DESC, updated_at DESC').all();
        const accounts = (accountsRes.results || []).map((row: any) => ({
          id: row.id,
          name: row.name,
          username: row.username,
          pin: row.pin,
          role: row.role,
          avatarColor: row.avatar_color,
          isActive: Boolean(row.is_active)
        }));

        // Load finance data for user
        const financeRes = await db.prepare('SELECT data_json, updated_at FROM user_finance WHERE user_id = ?').bind(userId).first();

        let appData = null;
        if (financeRes && financeRes.data_json) {
          try {
            appData = JSON.parse(financeRes.data_json as string);
          } catch (e) {
            console.error('Error parsing finance data from D1:', e);
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            accounts,
            appData,
            updatedAt: financeRes?.updated_at || null
          }),
          { headers: CORS_HEADERS }
        );
      }
    }

    if (request.method === 'POST') {
      const body = await request.json() as any;
      const action = body.action || 'sync';
      const now = new Date().toISOString();

      if (action === 'sync') {
        const userId = body.user_id || 'acc_azmin';
        const appData = body.appData;
        const accounts = body.accounts;

        // Upsert finance data
        if (appData) {
          await db
            .prepare(
              'INSERT INTO user_finance (user_id, data_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at'
            )
            .bind(userId, JSON.stringify(appData), now)
            .run();
        }

        // Upsert accounts
        if (Array.isArray(accounts) && accounts.length > 0) {
          const stmts = accounts.map((acc: any) =>
            db
              .prepare(
                'INSERT INTO accounts (id, name, username, pin, role, avatar_color, is_active, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, username = excluded.username, pin = excluded.pin, role = excluded.role, avatar_color = excluded.avatar_color, is_active = excluded.is_active, updated_at = excluded.updated_at'
              )
              .bind(
                acc.id,
                acc.name,
                acc.username || '',
                acc.pin,
                acc.role || 'Pribadi',
                acc.avatarColor || 'emerald',
                acc.isActive ? 1 : 0,
                now
              )
          );
          await db.batch(stmts);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Data & Akun berhasil disimpan ke Cloudflare D1!',
            updatedAt: now
          }),
          { headers: CORS_HEADERS }
        );
      }

      if (action === 'update_account') {
        const acc = body.account;
        if (!acc || !acc.id) {
          return new Response(JSON.stringify({ success: false, message: 'Data akun tidak lengkap' }), { status: 400, headers: CORS_HEADERS });
        }

        await db
          .prepare(
            'INSERT INTO accounts (id, name, username, pin, role, avatar_color, is_active, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, username = excluded.username, pin = excluded.pin, role = excluded.role, avatar_color = excluded.avatar_color, is_active = excluded.is_active, updated_at = excluded.updated_at'
          )
          .bind(
            acc.id,
            acc.name,
            acc.username || '',
            acc.pin,
            acc.role || 'Pribadi',
            acc.avatarColor || 'emerald',
            acc.isActive ? 1 : 0,
            now
          )
          .run();

        return new Response(
          JSON.stringify({ success: true, message: 'Akun berhasil diperbarui di Cloudflare D1' }),
          { headers: CORS_HEADERS }
        );
      }
    }

    return new Response(JSON.stringify({ success: false, message: 'Action tidak dikenali' }), { status: 400, headers: CORS_HEADERS });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: 'D1 Database Error: ' + (err.message || String(err)) }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Intercept D1 API requests
    if (url.pathname === '/api/d1' || url.pathname.startsWith('/api/d1/')) {
      return handleD1Api(request, env);
    }

    // Serve static assets from ./dist
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};
