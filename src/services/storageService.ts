import { AppData, Budget, Kategori, Piutang, Rekening, Tabungan, Transaction, Utang } from '../types/finance';
import { getInitialAppData } from '../data/demoData';
import { GasService } from './gasService';

const STORAGE_KEY = 'dompetku_app_data_v1';
const GAS_URL_KEY = 'dompetku_gas_url_v1';

export class StorageService {
  /**
   * Ambil data dari localStorage atau inisialisasi dengan data demo
   */
  static loadData(): AppData {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.transaksi)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error parsing localStorage:', e);
    }
    const initial = getInitialAppData();
    this.saveData(initial);
    return initial;
  }

  /**
   * Simpan data ke localStorage
   */
  static saveData(data: AppData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }

  /**
   * Ambil URL Google Apps Script yang tersimpan
   */
  static getGasUrl(): string {
    return localStorage.getItem(GAS_URL_KEY) || '';
  }

  /**
   * Simpan URL Google Apps Script
   */
  static setGasUrl(url: string): void {
    localStorage.setItem(GAS_URL_KEY, url.trim());
  }

  /**
   * Sinkronisasi data dari Google Spreadsheet ke lokal
   */
  static async syncFromSpreadsheet(): Promise<{ success: boolean; message: string; data?: AppData }> {
    const url = this.getGasUrl();
    if (!url) {
      return { success: false, message: 'URL Google Apps Script belum disetel. Hubungkan di menu Pengaturan.' };
    }
    const res = await GasService.fetchAllData(url);
    if (res.success && res.data) {
      this.saveData(res.data);
      return { success: true, message: 'Data berhasil disinkronkan dari Google Spreadsheet!', data: res.data };
    }
    return { success: false, message: res.message || 'Gagal sinkronisasi data' };
  }

  /**
   * Unggah seluruh data lokal ke Google Spreadsheet (Push / Seed)
   */
  static async pushToSpreadsheet(): Promise<{ success: boolean; message: string }> {
    const url = this.getGasUrl();
    if (!url) {
      return { success: false, message: 'URL Google Apps Script belum disetel' };
    }
    const currentData = this.loadData();
    const res = await GasService.seedAllData(url, currentData);
    return res;
  }

  /**
   * Reset data kembali ke demo awal
   */
  static resetToDemo(): AppData {
    const initial = getInitialAppData();
    this.saveData(initial);
    return initial;
  }

  /**
   * Ekspor seluruh data sebagai file JSON
   */
  static exportBackup(): string {
    const data = this.loadData();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Impor data dari string JSON backup
   */
  static importBackup(jsonString: string): { success: boolean; data?: AppData; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.transaksi) && Array.isArray(parsed.rekening)) {
        this.saveData(parsed);
        return { success: true, data: parsed, message: 'Data backup berhasil dipulihkan' };
      }
      return { success: false, message: 'Format data backup tidak sesuai' };
    } catch (e: any) {
      return { success: false, message: 'File JSON tidak valid: ' + e.message };
    }
  }
}
