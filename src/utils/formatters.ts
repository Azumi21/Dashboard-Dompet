import { Rekening, Transaction } from '../types/finance';

/**
 * Format angka ke mata uang Rupiah
 * Contoh: 1500000 -> Rp 1.500.000
 */
export function formatRupiah(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return 'Rp 0';
  }
  const num = Math.round(Number(amount));
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format tanggal YYYY-MM-DD ke format Indonesia yang mudah dibaca
 * Contoh: 2026-10-01 -> 01 Okt 2026
 */
export function formatDateIndo(dateString: string | undefined | null, fullMonth = false): string {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      
      const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const longMonths = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

      const monthName = fullMonth ? longMonths[monthIdx] : shortMonths[monthIdx];
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      return `${dayStr} ${monthName || ''} ${year}`;
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: fullMonth ? 'long' : 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

/**
 * Buat ID unik terstandarisasi sesuai format
 * Contoh: TRX-20261001-001, REC-001, CAT-001, BUG-001, SAV-001, DEBT-001, AR-001
 */
export function generateId(prefix: string, existingList?: { [key: string]: any }[]): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateSegment = `${year}${month}${day}`;

  if (prefix === 'TRX') {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `TRX-${dateSegment}-${randomSuffix}`;
  }

  const randomNum = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${randomNum}`;
}

/**
 * Hitung saldo akhir rekening secara akurat dan dinamis:
 * Saldo akhir = Saldo awal + Pemasukan - Pengeluaran + Transfer Masuk - Transfer Keluar
 */
export function calculateAccountBalances(rekenings: Rekening[], transactions: Transaction[]): Rekening[] {
  return rekenings.map(rek => {
    const accName = rek.nama_rekening.trim().toLowerCase();
    const accId = rek.id_rekening;

    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    let totalTransferMasuk = 0;
    let totalTransferKeluar = 0;

    transactions.forEach(t => {
      const sourceMatches = (t.rekening && t.rekening.trim().toLowerCase() === accName) || t.rekening === accId;
      const targetMatches = (t.rekening_tujuan && t.rekening_tujuan.trim().toLowerCase() === accName) || t.rekening_tujuan === accId;

      if (t.jenis === 'Pemasukan' && sourceMatches) {
        totalPemasukan += Number(t.nominal || 0);
      } else if (t.jenis === 'Pengeluaran' && sourceMatches) {
        totalPengeluaran += Number(t.nominal || 0);
      } else if (t.jenis === 'Transfer') {
        if (sourceMatches) {
          totalTransferKeluar += Number(t.nominal || 0);
        }
        if (targetMatches) {
          totalTransferMasuk += Number(t.nominal || 0);
        }
      }
    });

    const saldoSekarang = Number(rek.saldo_awal || 0) + totalPemasukan - totalPengeluaran + totalTransferMasuk - totalTransferKeluar;

    return {
      ...rek,
      saldo_sekarang: saldoSekarang
    };
  });
}
