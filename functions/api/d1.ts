interface D1Database {
  prepare(query: string): any;
  batch(statements: any[]): Promise<any>;
  exec(query: string): Promise<any>;
}

interface Env {
  DB?: D1Database;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json;charset=utf-8'
};

async function ensureTables(db: D1Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT,
      pin TEXT NOT NULL,
      role TEXT,
      avatar_color TEXT,
      is_active INTEGER DEFAULT 1,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS user_finance (
      user_id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT
    );
  `);
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (!env.DB) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'D1 Database binding (DB) belum terhubung di Cloudflare Pages Dashboard.',
        database_id: 'e70a98f0-8274-47e8-992a-f85974ce1206',
        help: 'Buka Cloudflare Dashboard -> Workers & Pages -> Klik project Anda -> Settings -> Functions -> D1 database bindings -> Tambah binding bernama "DB" ke database ini.'
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
            message: 'Koneksi Cloudflare D1 Database Berhasil!',
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

    return new Response(JSON.stringify({ success: false, message: 'Method / Action tidak dikenali' }), { status: 400, headers: CORS_HEADERS });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: 'D1 Database Error: ' + (err.message || String(err)) }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
