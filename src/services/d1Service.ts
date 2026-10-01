/**
 * Service untuk komunikasi dengan Cloudflare D1 Database
 * Melalui Cloudflare Pages Functions (/api/d1)
 */
import { AppData, UserAccount } from '../types/finance';

export interface D1StatusResponse {
  success: boolean;
  message: string;
  database_id?: string;
  timestamp?: string;
  help?: string;
}

export interface D1LoadResponse {
  success: boolean;
  accounts?: UserAccount[];
  appData?: AppData | null;
  updatedAt?: string | null;
  message?: string;
}

export interface D1SyncResponse {
  success: boolean;
  message: string;
  updatedAt?: string;
}

export class D1Service {
  private static baseUrl = '/api/d1';

  /**
   * Cek apakah Cloudflare D1 Database terhubung dan aktif
   */
  static async checkStatus(): Promise<D1StatusResponse> {
    try {
      const res = await fetch(`${this.baseUrl}?action=ping`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        return {
          success: false,
          message: errJson?.message || `HTTP ${res.status}: Cloudflare D1 belum aktif`,
          help: errJson?.help,
          database_id: errJson?.database_id
        };
      }

      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        message: 'Endpoint /api/d1 siap dan aktif begitu dideploy ke Cloudflare Pages.'
      };
    }
  }

  /**
   * Muat seluruh data keuangan & profil akun dari Cloudflare D1
   */
  static async loadData(userId: string): Promise<D1LoadResponse> {
    try {
      const res = await fetch(`${this.baseUrl}?action=load&user_id=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal memuat data dari Cloudflare D1: ${err.message}`
      };
    }
  }

  /**
   * Simpan data keuangan & daftar akun ke Cloudflare D1
   */
  static async syncData(userId: string, appData: AppData, accounts: UserAccount[]): Promise<D1SyncResponse> {
    try {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          action: 'sync',
          user_id: userId,
          appData,
          accounts
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || `HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal menyimpan ke Cloudflare D1: ${err.message}`
      };
    }
  }

  /**
   * Simpan atau perbarui satu akun di Cloudflare D1
   */
  static async updateAccount(account: UserAccount): Promise<D1SyncResponse> {
    try {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          action: 'update_account',
          account
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || `HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal memperbarui akun: ${err.message}`
      };
    }
  }
}
