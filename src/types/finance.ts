/**
 * Tipe Data Finansial untuk DompetKu Dashboard
 */

export type TransactionType = 'Pemasukan' | 'Pengeluaran' | 'Transfer';

export interface Transaction {
  id_transaksi: string;
  tanggal: string; // YYYY-MM-DD
  jenis: TransactionType;
  kategori: string;
  nominal: number;
  rekening: string;
  rekening_tujuan?: string; // Khusus transfer
  metode: string;
  deskripsi: string;
  catatan?: string;
  timestamp?: string;
}

export type RekeningType = 'Bank' | 'E-Wallet' | 'Tunai' | 'Investasi' | 'Lainnya';

export interface Rekening {
  id_rekening: string;
  nama_rekening: string;
  jenis: RekeningType;
  saldo_awal: number;
  status: 'Aktif' | 'Nonaktif';
  catatan?: string;
  saldo_sekarang?: number; // Dihitung dinamis
}

export interface Kategori {
  id_kategori: string;
  nama_kategori: string;
  jenis: 'Pemasukan' | 'Pengeluaran';
  status: 'Aktif' | 'Nonaktif';
  warna?: string;
}

export interface Budget {
  id_budget: string;
  bulan: number; // 1 - 12
  tahun: number;
  kategori: string;
  nominal_budget: number;
  status: 'Aktif' | 'Nonaktif';
  // Computed fields
  terpakai?: number;
  sisa?: number;
  persentase?: number;
}

export interface Tabungan {
  id_tabungan: string;
  nama_target: string;
  target_nominal: number;
  saldo_awal: number;
  target_tanggal: string; // YYYY-MM-DD
  status: 'Berjalan' | 'Tercapai' | 'Dibatalkan';
  catatan?: string;
  terkumpul?: number; // Computed / total tabungan teralokasi
}

export type UtangStatus = 'Belum dibayar' | 'Sebagian' | 'Lunas';

export interface Utang {
  id_utang: string;
  nama: string; // Nama pemberi pinjaman / pihak yang kita pinjam
  tanggal: string;
  nominal: number;
  jatuh_tempo: string;
  status: UtangStatus;
  catatan?: string;
}

export type PiutangStatus = 'Belum diterima' | 'Sebagian' | 'Lunas';

export interface Piutang {
  id_piutang: string;
  nama: string; // Nama pihak yang meminjam ke kita
  tanggal: string;
  nominal: number;
  jatuh_tempo: string;
  status: PiutangStatus;
  catatan?: string;
}

export interface AppSetting {
  key: string;
  value: string;
}

export interface AppData {
  transaksi: Transaction[];
  rekening: Rekening[];
  kategori: Kategori[];
  budget: Budget[];
  tabungan: Tabungan[];
  utang: Utang[];
  piutang: Piutang[];
  setting: AppSetting[];
}

export type PeriodFilter = 'hari_ini' | 'minggu_ini' | 'bulan_ini' | 'tahun_ini' | 'custom';

export type NavigationMenu = 
  | 'dashboard'
  | 'transaksi'
  | 'pemasukan'
  | 'pengeluaran'
  | 'budget'
  | 'tabungan'
  | 'rekening'
  | 'utang_piutang'
  | 'laporan'
  | 'kategori'
  | 'pengaturan';

export type UserAvatarColor = 'emerald' | 'rose' | 'indigo' | 'amber' | 'sky' | 'purple' | 'teal' | 'orange';

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  role: string;
  avatarColor: UserAvatarColor;
  pin: string;
  createdAt: string;
}

