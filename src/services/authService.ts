import { UserAccount, UserAvatarColor } from '../types/finance';

const ACCOUNTS_STORAGE_KEY = 'dompetku_users_list_v1';
const ACTIVE_USER_ID_KEY = 'dompetku_active_user_id';
const SECURITY_ENABLED_KEY = 'dompetku_security_enabled';
const SESSION_AUTH_KEY = 'dompetku_authenticated_session';
const PERSIST_AUTH_KEY = 'dompetku_authenticated_persist';
const AUTO_LOCK_MINUTES_KEY = 'dompetku_auto_lock_minutes';
const LAST_ACTIVITY_KEY = 'dompetku_last_activity';

const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: 'acc_azmin',
    name: 'Azmin',
    username: 'azmin',
    role: 'Akun Pribadi / Utama',
    avatarColor: 'emerald',
    pin: '123456',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'acc_pasangan',
    name: 'Pasangan',
    username: 'pasangan',
    role: 'Akun Pasangan / Istri',
    avatarColor: 'rose',
    pin: '123456',
    createdAt: '2026-01-02T00:00:00.000Z'
  },
  {
    id: 'acc_keluarga',
    name: 'Keluarga',
    username: 'keluarga',
    role: 'Akun Bersama / Rumah Tangga',
    avatarColor: 'indigo',
    pin: '123456',
    createdAt: '2026-01-03T00:00:00.000Z'
  }
];

export class AuthService {
  /**
   * Ambil seluruh daftar akun tersimpan
   */
  static getAccounts(): UserAccount[] {
    try {
      const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading accounts from localStorage:', e);
    }
    // Inisialisasi default 3 akun
    this.saveAccounts(DEFAULT_ACCOUNTS);
    return DEFAULT_ACCOUNTS;
  }

  /**
   * Simpan seluruh daftar akun
   */
  static saveAccounts(accounts: UserAccount[]): void {
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.error('Error saving accounts:', e);
    }
  }

  /**
   * Ambil akun aktif saat ini
   */
  static getActiveAccount(): UserAccount {
    const accounts = this.getAccounts();
    const activeId = localStorage.getItem(ACTIVE_USER_ID_KEY);
    const found = accounts.find((a) => a.id === activeId);
    if (found) return found;

    const fallback = accounts[0] || DEFAULT_ACCOUNTS[0];
    localStorage.setItem(ACTIVE_USER_ID_KEY, fallback.id);
    return fallback;
  }

  /**
   * Set akun aktif
   */
  static setActiveAccountId(userId: string): void {
    localStorage.setItem(ACTIVE_USER_ID_KEY, userId);
  }

  /**
   * Tambah akun baru
   */
  static createAccount(
    name: string,
    username: string,
    role: string,
    avatarColor: UserAvatarColor,
    pin: string
  ): UserAccount {
    const accounts = this.getAccounts();
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const id = `acc_${Date.now()}`;
    const newAcc: UserAccount = {
      id,
      name: name.trim(),
      username: cleanUsername || `user_${Date.now().toString().slice(-4)}`,
      role: role.trim() || 'Akun Tambahan',
      avatarColor,
      pin: pin.trim() || '123456',
      createdAt: new Date().toISOString()
    };

    const updated = [...accounts, newAcc];
    this.saveAccounts(updated);
    return newAcc;
  }

  /**
   * Perbarui profil akun
   */
  static updateAccount(
    id: string,
    updates: Partial<Omit<UserAccount, 'id' | 'createdAt'>>
  ): UserAccount | null {
    const accounts = this.getAccounts();
    const index = accounts.findIndex((a) => a.id === id);
    if (index === -1) return null;

    const current = accounts[index];
    const updated: UserAccount = {
      ...current,
      ...updates,
      name: updates.name ? updates.name.trim() : current.name,
      username: updates.username
        ? updates.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
        : current.username,
      pin: updates.pin ? updates.pin.trim() : current.pin
    };

    accounts[index] = updated;
    this.saveAccounts(accounts);
    return updated;
  }

  /**
   * Hapus akun (tidak bisa menghapus jika tinggal 1 akun)
   */
  static deleteAccount(id: string): boolean {
    const accounts = this.getAccounts();
    if (accounts.length <= 1) return false;

    const filtered = accounts.filter((a) => a.id !== id);
    this.saveAccounts(filtered);

    // Jika yang dihapus adalah akun aktif, pindah ke akun pertama
    const currentActive = this.getActiveAccount();
    if (currentActive.id === id) {
      this.setActiveAccountId(filtered[0].id);
    }
    return true;
  }

  /**
   * Reset PIN akun tertentu ke 123456
   */
  static resetAccountPin(id: string, defaultPin: string = '123456'): void {
    this.updateAccount(id, { pin: defaultPin });
  }

  /**
   * Ambil PIN dari user aktif atau user tertentu
   */
  static getStoredPin(userId?: string): string {
    const accounts = this.getAccounts();
    const targetId = userId || this.getActiveAccount().id;
    const found = accounts.find((a) => a.id === targetId);
    return found ? found.pin : '123456';
  }

  /**
   * Set PIN untuk user aktif atau user tertentu
   */
  static setPin(newPin: string, userId?: string): void {
    const targetId = userId || this.getActiveAccount().id;
    this.updateAccount(targetId, { pin: newPin.trim() });
  }

  /**
   * Reset PIN user aktif ke 123456
   */
  static resetToDefault(userId?: string): void {
    const targetId = userId || this.getActiveAccount().id;
    this.resetAccountPin(targetId, '123456');
  }

  /**
   * Login dengan memilih akun spesifik dan memasukkan PIN
   */
  static loginWithAccount(accountId: string, enteredPin: string, remember: boolean = false): boolean {
    const accounts = this.getAccounts();
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return false;

    if (enteredPin.trim() === target.pin.trim()) {
      this.setActiveAccountId(target.id);
      sessionStorage.setItem(SESSION_AUTH_KEY, target.id);
      if (remember) {
        localStorage.setItem(PERSIST_AUTH_KEY, target.id);
      } else {
        localStorage.removeItem(PERSIST_AUTH_KEY);
      }
      this.updateActivity();
      return true;
    }
    return false;
  }

  /**
   * Login dengan username dan PIN
   */
  static loginWithUsername(username: string, enteredPin: string, remember: boolean = false): {
    success: boolean;
    account?: UserAccount;
  } {
    const cleanUser = username.trim().toLowerCase();
    const accounts = this.getAccounts();
    const target = accounts.find(
      (a) => a.username.toLowerCase() === cleanUser || a.name.toLowerCase() === cleanUser
    );

    if (!target) return { success: false };

    if (enteredPin.trim() === target.pin.trim()) {
      this.setActiveAccountId(target.id);
      sessionStorage.setItem(SESSION_AUTH_KEY, target.id);
      if (remember) {
        localStorage.setItem(PERSIST_AUTH_KEY, target.id);
      } else {
        localStorage.removeItem(PERSIST_AUTH_KEY);
      }
      this.updateActivity();
      return { success: true, account: target };
    }
    return { success: false, account: target };
  }

  /**
   * Cek status kunci keamanan (aktif/nonaktif)
   */
  static isSecurityEnabled(): boolean {
    const val = localStorage.getItem(SECURITY_ENABLED_KEY);
    if (val === null) return true;
    return val === 'true';
  }

  static setSecurityEnabled(enabled: boolean): void {
    localStorage.setItem(SECURITY_ENABLED_KEY, enabled ? 'true' : 'false');
    if (!enabled) {
      const active = this.getActiveAccount();
      sessionStorage.setItem(SESSION_AUTH_KEY, active.id);
    }
  }

  static getAutoLockMinutes(): number {
    const val = localStorage.getItem(AUTO_LOCK_MINUTES_KEY);
    return val !== null ? parseInt(val, 10) : 15;
  }

  static setAutoLockMinutes(minutes: number): void {
    localStorage.setItem(AUTO_LOCK_MINUTES_KEY, minutes.toString());
  }

  static updateActivity(): void {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  }

  static isAuthenticated(): boolean {
    if (!this.isSecurityEnabled()) return true;

    const persistedUser = localStorage.getItem(PERSIST_AUTH_KEY);
    const sessionUser = sessionStorage.getItem(SESSION_AUTH_KEY);

    if (!persistedUser && !sessionUser) {
      return false;
    }

    // Auto lock check
    const autoLockMins = this.getAutoLockMinutes();
    if (autoLockMins > 0) {
      const lastActive = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
      if (lastActive > 0) {
        const diffMs = Date.now() - lastActive;
        const diffMins = diffMs / (1000 * 60);
        if (diffMins > autoLockMins) {
          this.logout();
          return false;
        }
      }
    }

    this.updateActivity();
    return true;
  }

  static logout(): void {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    localStorage.removeItem(PERSIST_AUTH_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  }
}
