import { AppData, Budget, Kategori, Piutang, Rekening, Tabungan, Transaction, Utang } from '../types/finance';

export const initialRekenings: Rekening[] = [
  { id_rekening: 'REC-001', nama_rekening: 'BCA Utama', jenis: 'Bank', saldo_awal: 12500000, status: 'Aktif', catatan: 'Rekening gaji & tabungan utama' },
  { id_rekening: 'REC-002', nama_rekening: 'Mandiri Livin', jenis: 'Bank', saldo_awal: 4800000, status: 'Aktif', catatan: 'Belanja & transaksi harian' },
  { id_rekening: 'REC-003', nama_rekening: 'GoPay', jenis: 'E-Wallet', saldo_awal: 450000, status: 'Aktif', catatan: 'GoFood & transportasi' },
  { id_rekening: 'REC-004', nama_rekening: 'Dana', jenis: 'E-Wallet', saldo_awal: 250000, status: 'Aktif', catatan: 'Bayar tagihan & e-commerce' },
  { id_rekening: 'REC-005', nama_rekening: 'Dompet Tunai', jenis: 'Tunai', saldo_awal: 600000, status: 'Aktif', catatan: 'Uang kas darurat & parkir' },
  { id_rekening: 'REC-006', nama_rekening: 'SeaBank', jenis: 'Bank', saldo_awal: 8000000, status: 'Aktif', catatan: 'Bunga harian & dana darurat' },
];

export const initialKategoris: Kategori[] = [
  // Pemasukan
  { id_kategori: 'CAT-101', nama_kategori: 'Gaji Pokok', jenis: 'Pemasukan', status: 'Aktif', warna: '#10b981' },
  { id_kategori: 'CAT-102', nama_kategori: 'Freelance & Side Project', jenis: 'Pemasukan', status: 'Aktif', warna: '#059669' },
  { id_kategori: 'CAT-103', nama_kategori: 'Bonus & Tunjangan', jenis: 'Pemasukan', status: 'Aktif', warna: '#34d399' },
  { id_kategori: 'CAT-104', nama_kategori: 'Investasi & Dividen', jenis: 'Pemasukan', status: 'Aktif', warna: '#047857' },
  { id_kategori: 'CAT-105', nama_kategori: 'Lainnya (Pemasukan)', jenis: 'Pemasukan', status: 'Aktif', warna: '#6ee7b7' },
  
  // Pengeluaran
  { id_kategori: 'CAT-201', nama_kategori: 'Makanan & Minuman', jenis: 'Pengeluaran', status: 'Aktif', warna: '#f43f5e' },
  { id_kategori: 'CAT-202', nama_kategori: 'Transportasi & Bensin', jenis: 'Pengeluaran', status: 'Aktif', warna: '#f97316' },
  { id_kategori: 'CAT-203', nama_kategori: 'Belanja Bulanan', jenis: 'Pengeluaran', status: 'Aktif', warna: '#e11d48' },
  { id_kategori: 'CAT-204', nama_kategori: 'Tagihan & Utilitas', jenis: 'Pengeluaran', status: 'Aktif', warna: '#eab308' },
  { id_kategori: 'CAT-205', nama_kategori: 'Internet & Pulsa', jenis: 'Pengeluaran', status: 'Aktif', warna: '#06b6d4' },
  { id_kategori: 'CAT-206', nama_kategori: 'Hiburan & Liburan', jenis: 'Pengeluaran', status: 'Aktif', warna: '#8b5cf6' },
  { id_kategori: 'CAT-207', nama_kategori: 'Kesehatan & Obat', jenis: 'Pengeluaran', status: 'Aktif', warna: '#ec4899' },
  { id_kategori: 'CAT-208', nama_kategori: 'Pendidikan & Kursus', jenis: 'Pengeluaran', status: 'Aktif', warna: '#3b82f6' },
  { id_kategori: 'CAT-209', nama_kategori: 'Cicilan & Utang', jenis: 'Pengeluaran', status: 'Aktif', warna: '#be123c' },
  { id_kategori: 'CAT-210', nama_kategori: 'Lainnya (Pengeluaran)', jenis: 'Pengeluaran', status: 'Aktif', warna: '#94a3b8' },
];

export const initialTransactions: Transaction[] = [
  {
    id_transaksi: 'TRX-20260925-101',
    tanggal: '2026-09-25',
    jenis: 'Pemasukan',
    kategori: 'Gaji Pokok',
    nominal: 12500000,
    rekening: 'BCA Utama',
    metode: 'Transfer Bank',
    deskripsi: 'Gaji Bulanan September PT Tech Indonesia',
    catatan: 'Masuk tepat waktu'
  },
  {
    id_transaksi: 'TRX-20260926-102',
    tanggal: '2026-09-26',
    jenis: 'Transfer',
    kategori: 'Transfer',
    nominal: 2000000,
    rekening: 'BCA Utama',
    rekening_tujuan: 'Mandiri Livin',
    metode: 'Transfer Bank',
    deskripsi: 'Alokasi belanja harian ke Mandiri',
    catatan: 'Pindah dana bulanan'
  },
  {
    id_transaksi: 'TRX-20260926-103',
    tanggal: '2026-09-26',
    jenis: 'Pengeluaran',
    kategori: 'Belanja Bulanan',
    nominal: 1150000,
    rekening: 'Mandiri Livin',
    metode: 'Kartu Debit',
    deskripsi: 'Belanja bahan dapur Superindo',
    catatan: 'Kebutuhan pokok 2 minggu'
  },
  {
    id_transaksi: 'TRX-20260927-104',
    tanggal: '2026-09-27',
    jenis: 'Pengeluaran',
    kategori: 'Tagihan & Utilitas',
    nominal: 480000,
    rekening: 'Dana',
    metode: 'E-Wallet',
    deskripsi: 'Token Listrik PLN Rumah',
    catatan: 'Token 500k potong admin'
  },
  {
    id_transaksi: 'TRX-20260927-105',
    tanggal: '2026-09-27',
    jenis: 'Pengeluaran',
    kategori: 'Internet & Pulsa',
    nominal: 385000,
    rekening: 'BCA Utama',
    metode: 'Virtual Account',
    deskripsi: 'Langganan IndiHome 50 Mbps',
    catatan: 'Auto debet bulanan'
  },
  {
    id_transaksi: 'TRX-20260928-106',
    tanggal: '2026-09-28',
    jenis: 'Pemasukan',
    kategori: 'Freelance & Side Project',
    nominal: 3500000,
    rekening: 'BCA Utama',
    metode: 'Transfer Bank',
    deskripsi: 'Pelunasan Project Landing Page Klien',
    catatan: 'Termin ke-2'
  },
  {
    id_transaksi: 'TRX-20260928-107',
    tanggal: '2026-09-28',
    jenis: 'Pengeluaran',
    kategori: 'Transportasi & Bensin',
    nominal: 250000,
    rekening: 'Mandiri Livin',
    metode: 'QRIS',
    deskripsi: 'Isi Pertamax Mobil di SPBU Pertamina',
    catatan: 'Full tank'
  },
  {
    id_transaksi: 'TRX-20260929-108',
    tanggal: '2026-09-29',
    jenis: 'Pengeluaran',
    kategori: 'Makanan & Minuman',
    nominal: 65000,
    rekening: 'GoPay',
    metode: 'QRIS',
    deskripsi: 'Makan siang Ayam Geprek & Es Teh',
    catatan: 'Bareng rekan kantor'
  },
  {
    id_transaksi: 'TRX-20260929-109',
    tanggal: '2026-09-29',
    jenis: 'Pengeluaran',
    kategori: 'Makanan & Minuman',
    nominal: 45000,
    rekening: 'GoPay',
    metode: 'E-Wallet',
    deskripsi: 'Kopi Susu Gula Aren Tuku',
    catatan: 'Sore hari'
  },
  {
    id_transaksi: 'TRX-20260930-110',
    tanggal: '2026-09-30',
    jenis: 'Pengeluaran',
    kategori: 'Kesehatan & Obat',
    nominal: 180000,
    rekening: 'Mandiri Livin',
    metode: 'QRIS',
    deskripsi: 'Beli Multivitamin & Obat Flu di Guardian',
    catatan: 'Jaga daya tahan tubuh'
  },
  {
    id_transaksi: 'TRX-20260930-111',
    tanggal: '2026-09-30',
    jenis: 'Transfer',
    kategori: 'Transfer',
    nominal: 500000,
    rekening: 'BCA Utama',
    rekening_tujuan: 'GoPay',
    metode: 'Virtual Account',
    deskripsi: 'Top up GoPay untuk bekal seminggu',
    catatan: 'Admin Rp1.000'
  },
  {
    id_transaksi: 'TRX-20260930-112',
    tanggal: '2026-09-30',
    jenis: 'Pengeluaran',
    kategori: 'Pendidikan & Kursus',
    nominal: 350000,
    rekening: 'BCA Utama',
    metode: 'Kartu Debit',
    deskripsi: 'Langganan Kursus Udemy & Cloud Hosting',
    catatan: 'Upgrade skill web dev'
  },
  {
    id_transaksi: 'TRX-20261001-113',
    tanggal: '2026-10-01',
    jenis: 'Pemasukan',
    kategori: 'Investasi & Dividen',
    nominal: 420000,
    rekening: 'SeaBank',
    metode: 'Transfer Bank',
    deskripsi: 'Bunga Deposito & Dividen Reksadana',
    catatan: 'Pendapatan pasif bulanan'
  },
  {
    id_transaksi: 'TRX-20261001-114',
    tanggal: '2026-10-01',
    jenis: 'Pengeluaran',
    kategori: 'Makanan & Minuman',
    nominal: 85000,
    rekening: 'Dompet Tunai',
    metode: 'Tunai',
    deskripsi: 'Makan malam Bakmi GM bersama keluarga',
    catatan: 'Malam 1 Oktober'
  },
  {
    id_transaksi: 'TRX-20261001-115',
    tanggal: '2026-10-01',
    jenis: 'Pengeluaran',
    kategori: 'Hiburan & Liburan',
    nominal: 150000,
    rekening: 'Mandiri Livin',
    metode: 'QRIS',
    deskripsi: 'Tiket Bioskop XXI & Popcorn',
    catatan: 'Nonton film weekend'
  },
  {
    id_transaksi: 'TRX-20261001-116',
    tanggal: '2026-10-01',
    jenis: 'Pengeluaran',
    kategori: 'Transportasi & Bensin',
    nominal: 40000,
    rekening: 'GoPay',
    metode: 'E-Wallet',
    deskripsi: 'GoRide pulang kantor',
    catatan: 'Hindari macet'
  },
  {
    id_transaksi: 'TRX-20261001-117',
    tanggal: '2026-10-01',
    jenis: 'Transfer',
    kategori: 'Transfer',
    nominal: 1500000,
    rekening: 'BCA Utama',
    rekening_tujuan: 'SeaBank',
    metode: 'Transfer Bank',
    deskripsi: 'Setor ke tabungan dana darurat',
    catatan: 'Disimpan di SeaBank bunga 6%'
  },
  {
    id_transaksi: 'TRX-20261001-118',
    tanggal: '2026-10-01',
    jenis: 'Pengeluaran',
    kategori: 'Makanan & Minuman',
    nominal: 35000,
    rekening: 'Dompet Tunai',
    metode: 'Tunai',
    deskripsi: 'Sarapan Bubur Ayam Cianjur',
    catatan: 'Pagi hari'
  },
  {
    id_transaksi: 'TRX-20261001-119',
    tanggal: '2026-10-01',
    jenis: 'Pemasukan',
    kategori: 'Bonus & Tunjangan',
    nominal: 1200000,
    rekening: 'BCA Utama',
    metode: 'Transfer Bank',
    deskripsi: 'Insentif Performa Kuartal Q3',
    catatan: 'Bonus apresiasi kerja'
  },
  {
    id_transaksi: 'TRX-20261001-120',
    tanggal: '2026-10-01',
    jenis: 'Pengeluaran',
    kategori: 'Belanja Bulanan',
    nominal: 320000,
    rekening: 'Mandiri Livin',
    metode: 'QRIS',
    deskripsi: 'Beli sabun, deterjen, & perlengkapan rumah',
    catatan: 'Minimarket'
  }
];

export const initialBudgets: Budget[] = [
  { id_budget: 'BUG-001', bulan: 10, tahun: 2026, kategori: 'Makanan & Minuman', nominal_budget: 2500000, status: 'Aktif' },
  { id_budget: 'BUG-002', bulan: 10, tahun: 2026, kategori: 'Transportasi & Bensin', nominal_budget: 800000, status: 'Aktif' },
  { id_budget: 'BUG-003', bulan: 10, tahun: 2026, kategori: 'Belanja Bulanan', nominal_budget: 2000000, status: 'Aktif' },
  { id_budget: 'BUG-004', bulan: 10, tahun: 2026, kategori: 'Tagihan & Utilitas', nominal_budget: 1000000, status: 'Aktif' },
  { id_budget: 'BUG-005', bulan: 10, tahun: 2026, kategori: 'Hiburan & Liburan', nominal_budget: 600000, status: 'Aktif' },
];

export const initialTabungans: Tabungan[] = [
  {
    id_tabungan: 'SAV-001',
    nama_target: 'Dana Darurat 6 Bulan',
    target_nominal: 30000000,
    saldo_awal: 18500000,
    target_tanggal: '2026-12-31',
    status: 'Berjalan',
    catatan: 'Disimpan di instrumen likuid (SeaBank / Reksadana Pasar Uang)'
  },
  {
    id_tabungan: 'SAV-002',
    nama_target: 'Beli Laptop MacBook Pro M3',
    target_nominal: 25000000,
    saldo_awal: 16500000,
    target_tanggal: '2026-11-30',
    status: 'Berjalan',
    catatan: 'Upgrade perangkat kerja programmer'
  },
  {
    id_tabungan: 'SAV-003',
    nama_target: 'Liburan Akhir Tahun ke Jepang',
    target_nominal: 20000000,
    saldo_awal: 8000000,
    target_tanggal: '2027-04-15',
    status: 'Berjalan',
    catatan: 'Target tabungan rutin Rp 2 jt per bulan'
  }
];

export const initialUtangs: Utang[] = [
  {
    id_utang: 'DEBT-001',
    nama: 'Cicilan KPR BTN',
    tanggal: '2026-09-10',
    nominal: 2800000,
    jatuh_tempo: '2026-10-15',
    status: 'Belum dibayar',
    catatan: 'Debet otomatis rekening BTN tgl 15'
  },
  {
    id_utang: 'DEBT-002',
    nama: 'Pinjaman Renovasi Rumah Mas Budi',
    tanggal: '2026-08-01',
    nominal: 5000000,
    jatuh_tempo: '2026-12-01',
    status: 'Sebagian',
    catatan: 'Sudah dicicil 2.500.000, sisa 2.500.000'
  }
];

export const initialPiutangs: Piutang[] = [
  {
    id_piutang: 'AR-001',
    nama: 'Rian (Teman Kantor)',
    tanggal: '2026-09-15',
    nominal: 750000,
    jatuh_tempo: '2026-10-05',
    status: 'Belum diterima',
    catatan: 'Talangan beli tiket konser Coldplay'
  },
  {
    id_piutang: 'AR-002',
    nama: 'PT Solusi Pratama (Invoice Web)',
    tanggal: '2026-09-20',
    nominal: 2500000,
    jatuh_tempo: '2026-10-10',
    status: 'Belum diterima',
    catatan: 'Invoice termin terakhir project company profile'
  }
];

export const getInitialAppData = (): AppData => ({
  transaksi: initialTransactions,
  rekening: initialRekenings,
  kategori: initialKategoris,
  budget: initialBudgets,
  tabungan: initialTabungans,
  utang: initialUtangs,
  piutang: initialPiutangs,
  setting: [
    { key: 'gas_url', value: '' },
    { key: 'currency', value: 'IDR' },
    { key: 'theme', value: 'light' }
  ]
});
