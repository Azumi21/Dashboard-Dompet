import { AppData } from '../types/finance';
import { getInitialAppData } from '../data/demoData';
import { GasService } from './gasService';
import { AuthService } from './authService';

const DEFAULT_STORAGE_KEY = 'dompetku_app_data_v1';
const DEFAULT_GAS_URL_KEY = 'dompetku_gas_url_v1';

export class StorageService {
  private static getStorageKey(userId?: string): string {
    const target = userId || AuthService.getActiveAccount().id;
    return `dompetku_app_data_${target}`;
  }

  private static getGasKey(userId?: string): string {
    const target = userId || AuthService.getActiveAccount().id;
    return `dompetku_gas_url_${target}`;
  }

  /**
   * Ambil data dari localStorage untuk user tertentu (atau default)
   */
  static loadData(userId?: string): AppData {
    const key = this.getStorageKey(userId);
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.transaksi)) {
          return parsed;
        }
      }

      // Migrasi data legacy jika untuk acc_azmin
      if (userId === 'acc_azmin' || !userId) {
        const legacy = localStorage.getItem(DEFAULT_STORAGE_KEY);
        if (legacy) {
          const parsed = JSON.parse(legacy);
          if (parsed && Array.isArray(parsed.transaksi)) {
            this.saveData(parsed, userId);
            return parsed;
          }
        }
      }
    } catch (e) {
      console.error('Error parsing localStorage for user', userId, e);
    }

    const initial = getInitialAppData();
    this.saveData(initial, userId);
    return initial;
  }

  /**
   * Simpan data ke localStorage untuk user tertentu
   */
  static saveData(data: AppData, userId?: string): void {
    const key = this.getStorageKey(userId);
    try {
      localStorage.setItem(key, JSON.stringify(data));
      // Jika user azmin, sync juga ke default key demi backward compatibility
      if (userId === 'acc_azmin' || !userId) {
        localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }

  /**
   * Ambil URL Google Apps Script yang tersimpan untuk user
   */
  static getGasUrl(userId?: string): string {
    const key = this.getGasKey(userId);
    const userUrl = localStorage.getItem(key);
    if (userUrl) return userUrl;

    // Fallback ke general gas url
    return localStorage.getItem(DEFAULT_GAS_URL_KEY) || '';
  }

  /**
   * Simpan URL Google Apps Script untuk user
   */
  static setGasUrl(url: string, userId?: string): void {
    const key = this.getGasKey(userId);
    localStorage.setItem(key, url.trim());
    if (userId === 'acc_azmin' || !userId) {
      localStorage.setItem(DEFAULT_GAS_URL_KEY, url.trim());
    }
  }

  /**
   * Sinkronisasi data dari Google Spreadsheet ke lokal untuk user
   */
  static async syncFromSpreadsheet(userId?: string): Promise<{ success: boolean; message: string; data?: AppData }> {
    const url = this.getGasUrl(userId);
    if (!url) {
      return { success: false, message: 'URL Google Apps Script belum disetel. Hubungkan di menu Pengaturan.' };
    }
    const res = await GasService.fetchAllData(url);
    if (res.success && res.data) {
      this.saveData(res.data, userId);
      return { success: true, message: 'Data berhasil disinkronkan dari Google Spreadsheet!', data: res.data };
    }
    return { success: false, message: res.message || 'Gagal sinkronisasi data' };
  }

  /**
   * Unggah seluruh data lokal ke Google Spreadsheet (Push / Seed)
   */
  static async pushToSpreadsheet(userId?: string): Promise<{ success: boolean; message: string }> {
    const url = this.getGasUrl(userId);
    if (!url) {
      return { success: false, message: 'URL Google Apps Script belum disetel' };
    }
    const currentData = this.loadData(userId);
    const res = await GasService.seedAllData(url, currentData);
    return res;
  }

  /**
   * Reset data kembali ke demo awal untuk user
   */
  static resetToDemo(userId?: string): AppData {
    const initial = getInitialAppData();
    this.saveData(initial, userId);
    return initial;
  }

  /**
   * Ekspor seluruh data sebagai file JSON
   */
  static exportBackup(userId?: string): string {
    const data = this.loadData(userId);
    return JSON.stringify(data, null, 2);
  }

  /**
   * Impor data dari string JSON backup
   */
  static importBackup(jsonString: string, userId?: string): { success: boolean; data?: AppData; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.transaksi) && Array.isArray(parsed.rekening)) {
        this.saveData(parsed, userId);
        return { success: true, data: parsed, message: 'Data backup berhasil dipulihkan' };
      }
      return { success: false, message: 'Format data backup tidak sesuai' };
    } catch (e: any) {
      return { success: false, message: 'File JSON tidak valid: ' + e.message };
    }
  }
}
