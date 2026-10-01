/**
 * Service untuk komunikasi dengan Google Apps Script Web App API
 * Menghubungkan Website -> Google Apps Script -> Google Spreadsheet
 */

import { AppData, Transaction, Rekening, Kategori, Budget, Tabungan, Utang, Piutang } from '../types/finance';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export class GasService {
  /**
   * Ping / tes koneksi ke Google Apps Script Web App
   */
  static async testConnection(gasUrl: string): Promise<ApiResponse> {
    if (!gasUrl || !gasUrl.trim().startsWith('http')) {
      return { success: false, message: 'URL Google Apps Script tidak valid. Pastikan diawali https://script.google.com/macros/s/...' };
    }

    try {
      const url = new URL(gasUrl.trim());
      url.searchParams.set('action', 'ping');

      const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`Server merespons status HTTP ${response.status}`);
      }

      const json = await response.json();
      return json;
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal terhubung ke Google Apps Script: ${err.message || 'Cek kembali URL atau izin akses Web App (wajib: Anyone/Siapa Saja)'}`
      };
    }
  }

  /**
   * Ambil seluruh data dari Google Spreadsheet sekaligus (Fast Single Request)
   */
  static async fetchAllData(gasUrl: string): Promise<ApiResponse<AppData>> {
    if (!gasUrl || !gasUrl.trim()) {
      return { success: false, message: 'URL Google Apps Script belum diisi' };
    }

    try {
      const url = new URL(gasUrl.trim());
      url.searchParams.set('action', 'getAll');

      const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const json = await response.json();
      if (!json.success) {
        throw new Error(json.message || 'Gagal mengambil data dari Google Spreadsheet');
      }

      const sheets = json.data || {};
      
      const appData: AppData = {
        transaksi: (sheets.TRANSAKSI || []).map((t: any) => ({
          ...t,
          nominal: Number(t.nominal || 0)
        })),
        rekening: (sheets.REKENING || []).map((r: any) => ({
          ...r,
          saldo_awal: Number(r.saldo_awal || 0)
        })),
        kategori: sheets.KATEGORI || [],
        budget: (sheets.BUDGET || []).map((b: any) => ({
          ...b,
          bulan: Number(b.bulan || 1),
          tahun: Number(b.tahun || new Date().getFullYear()),
          nominal_budget: Number(b.nominal_budget || 0)
        })),
        tabungan: (sheets.TABUNGAN || []).map((s: any) => ({
          ...s,
          target_nominal: Number(s.target_nominal || 0),
          saldo_awal: Number(s.saldo_awal || 0)
        })),
        utang: (sheets.UTANG || []).map((u: any) => ({
          ...u,
          nominal: Number(u.nominal || 0)
        })),
        piutang: (sheets.PIUTANG || []).map((p: any) => ({
          ...p,
          nominal: Number(p.nominal || 0)
        })),
        setting: sheets.SETTING || []
      };

      return { success: true, message: 'Data berhasil disinkronkan', data: appData };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal memuat data dari Spreadsheet: ${err.message || 'Periksa koneksi internet'}`
      };
    }
  }

  /**
   * Kirim perintah POST ke Google Apps Script
   * Catatan: Menggunakan 'text/plain' untuk menghindari browser CORS preflight (OPTIONS)
   */
  private static async sendPost(gasUrl: string, payload: any): Promise<ApiResponse> {
    if (!gasUrl || !gasUrl.trim()) {
      return { success: false, message: 'URL Google Apps Script belum diisi' };
    }

    try {
      const response = await fetch(gasUrl.trim(), {
        method: 'POST',
        // 'text/plain' is standard trick for Google Apps Script to prevent CORS preflight blocking
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const json = await response.json();
      return json;
    } catch (err: any) {
      console.error('GAS Request Error:', err);
      return {
        success: false,
        message: `Koneksi ke Google Spreadsheet bermasalah: ${err.message || 'Cek izin Web App'}`
      };
    }
  }

  /**
   * Simpan (Create) baris data baru ke sheet target di Google Spreadsheet
   */
  static async createRecord(gasUrl: string, sheetName: string, data: any): Promise<ApiResponse> {
    return this.sendPost(gasUrl, {
      action: 'create',
      sheet: sheetName.toUpperCase(),
      data
    });
  }

  /**
   * Perbarui (Update) baris data di sheet target
   */
  static async updateRecord(gasUrl: string, sheetName: string, data: any, id?: string): Promise<ApiResponse> {
    return this.sendPost(gasUrl, {
      action: 'update',
      sheet: sheetName.toUpperCase(),
      data,
      id
    });
  }

  /**
   * Hapus (Delete) baris data dari sheet target berdasarkan ID
   */
  static async deleteRecord(gasUrl: string, sheetName: string, id: string): Promise<ApiResponse> {
    return this.sendPost(gasUrl, {
      action: 'delete',
      sheet: sheetName.toUpperCase(),
      id
    });
  }

  /**
   * Seed / Sync batch seluruh data lokal ke Google Spreadsheet
   */
  static async seedAllData(gasUrl: string, appData: AppData): Promise<ApiResponse> {
    return this.sendPost(gasUrl, {
      action: 'seed',
      allData: {
        TRANSAKSI: appData.transaksi,
        REKENING: appData.rekening,
        KATEGORI: appData.kategori,
        BUDGET: appData.budget,
        TABUNGAN: appData.tabungan,
        UTANG: appData.utang,
        PIUTANG: appData.piutang,
        SETTING: appData.setting
      }
    });
  }
}
