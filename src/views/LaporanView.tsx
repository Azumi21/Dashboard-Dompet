import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Building2,
  PieChart,
  CheckCircle2
} from 'lucide-react';
import { AppData, PeriodFilter, Transaction } from '../types/finance';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface LaporanViewProps {
  appData: AppData;
}

export const LaporanView: React.FC<LaporanViewProps> = ({ appData }) => {
  const [period, setPeriod] = useState<PeriodFilter>('bulan_ini');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [reportType, setReportType] = useState<'kategori' | 'rekening' | 'bulanan'>('kategori');

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return appData.transaksi.filter((t) => {
      if (!t.tanggal) return false;
      const tDate = new Date(t.tanggal);

      if (period === 'hari_ini') return t.tanggal === todayStr;
      if (period === 'minggu_ini') {
        const firstDayOfWeek = new Date(now);
        const day = now.getDay() || 7;
        firstDayOfWeek.setDate(now.getDate() - day + 1);
        firstDayOfWeek.setHours(0, 0, 0, 0);
        return tDate >= firstDayOfWeek && tDate <= now;
      }
      if (period === 'bulan_ini') {
        return (
          tDate.getMonth() === now.getMonth() &&
          tDate.getFullYear() === now.getFullYear()
        );
      }
      if (period === 'tahun_ini') {
        return tDate.getFullYear() === now.getFullYear();
      }
      if (period === 'custom') {
        if (customStart && t.tanggal < customStart) return false;
        if (customEnd && t.tanggal > customEnd) return false;
        return true;
      }
      return true;
    });
  }, [appData.transaksi, period, customStart, customEnd]);

  // Aggregated totals
  const totalPemasukan = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.jenis === 'Pemasukan')
      .reduce((sum, t) => sum + Number(t.nominal || 0), 0);
  }, [filteredTransactions]);

  const totalPengeluaran = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.jenis === 'Pengeluaran')
      .reduce((sum, t) => sum + Number(t.nominal || 0), 0);
  }, [filteredTransactions]);

  const netCashFlow = totalPemasukan - totalPengeluaran;

  // Breakdown by Category
  const categoryBreakdown = useMemo(() => {
    const map: { [cat: string]: { inc: number; exp: number; count: number } } = {};
    filteredTransactions.forEach((t) => {
      const c = t.kategori || 'Lainnya';
      if (!map[c]) map[c] = { inc: 0, exp: 0, count: 0 };
      map[c].count += 1;
      if (t.jenis === 'Pemasukan') map[c].inc += Number(t.nominal || 0);
      if (t.jenis === 'Pengeluaran') map[c].exp += Number(t.nominal || 0);
    });

    return Object.entries(map)
      .map(([nama, data]) => ({
        nama,
        inc: data.inc,
        exp: data.exp,
        count: data.count,
        total: data.inc - data.exp,
      }))
      .sort((a, b) => b.exp - a.exp);
  }, [filteredTransactions]);

  // Breakdown by Rekening
  const rekeningBreakdown = useMemo(() => {
    const map: { [rek: string]: { inc: number; exp: number; count: number } } = {};
    filteredTransactions.forEach((t) => {
      const r = t.rekening || 'Lainnya';
      if (!map[r]) map[r] = { inc: 0, exp: 0, count: 0 };
      map[r].count += 1;
      if (t.jenis === 'Pemasukan') map[r].inc += Number(t.nominal || 0);
      if (t.jenis === 'Pengeluaran') map[r].exp += Number(t.nominal || 0);
    });

    return Object.entries(map).map(([nama, data]) => ({
      nama,
      inc: data.inc,
      exp: data.exp,
      count: data.count,
      net: data.inc - data.exp,
    }));
  }, [filteredTransactions]);

  // Export to CSV Function
  const exportToCSV = () => {
    const headers = ['ID Transaksi', 'Tanggal', 'Jenis', 'Kategori', 'Rekening', 'Metode', 'Nominal', 'Deskripsi', 'Catatan'];
    const rows = filteredTransactions.map((t) => [
      `"${t.id_transaksi}"`,
      `"${t.tanggal}"`,
      `"${t.jenis}"`,
      `"${t.kategori}"`,
      `"${t.rekening}${t.rekening_tujuan ? ' -> ' + t.rekening_tujuan : ''}"`,
      `"${t.metode || ''}"`,
      t.nominal,
      `"${(t.deskripsi || '').replace(/"/g, '""')}"`,
      `"${(t.catatan || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Keuangan_DompetKu_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Export Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Period Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {(
            [
              { id: 'hari_ini', label: 'Hari Ini' },
              { id: 'minggu_ini', label: 'Minggu Ini' },
              { id: 'bulan_ini', label: 'Bulan Ini' },
              { id: 'tahun_ini', label: 'Tahun Ini' },
              { id: 'custom', label: 'Kustom' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                period === tab.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Export & Print Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {period === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
          <span className="font-semibold text-slate-600 dark:text-slate-400">Rentang Tanggal Laporan:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
          />
          <span className="text-slate-400">s/d</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
          />
        </div>
      )}

      {/* Financial Statement Summary Card */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs print:shadow-none print:border-none">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Laporan Arus Kas & Laba-Rugi Pribadi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Periode: <strong className="text-slate-700 dark:text-slate-300 uppercase">{period.replace('_', ' ')}</strong> ({filteredTransactions.length} transaksi)
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Tanggal Cetak:</span>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {formatDateIndo(new Date().toISOString().split('T')[0], true)}
              </div>
            </div>
          </div>
        </div>

        {/* 4 Summary Numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
              Total Pemasukan
            </span>
            <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1">
              {formatRupiah(totalPemasukan)}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase">
              Total Pengeluaran
            </span>
            <div className="text-xl font-bold font-mono text-rose-700 dark:text-rose-300 mt-1">
              {formatRupiah(totalPengeluaran)}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
              Net Cash Flow
            </span>
            <div
              className={`text-xl font-bold font-mono mt-1 ${
                netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatRupiah(netCashFlow)}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
              Total Transaksi
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {filteredTransactions.length}
            </div>
          </div>
        </div>

        {/* Report View Tabs */}
        <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setReportType('kategori')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              reportType === 'kategori'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Berdasarkan Kategori
          </button>
          <button
            onClick={() => setReportType('rekening')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              reportType === 'rekening'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Berdasarkan Rekening
          </button>
        </div>

        {/* Report Tables */}
        {reportType === 'kategori' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-center">Jumlah Transaksi</th>
                  <th className="py-2.5 px-3 text-right">Pemasukan</th>
                  <th className="py-2.5 px-3 text-right">Pengeluaran</th>
                  <th className="py-2.5 px-3 text-right">Selisih Bersih</th>
                  <th className="py-2.5 px-3 text-right">% dari Total Pengeluaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {categoryBreakdown.map((row) => {
                  const pct = totalPengeluaran > 0 && row.exp > 0 ? ((row.exp / totalPengeluaran) * 100).toFixed(1) : '0';
                  return (
                    <tr key={row.nama} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                        {row.nama}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500">{row.count}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-600">
                        {row.inc > 0 ? formatRupiah(row.inc) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-600">
                        {row.exp > 0 ? formatRupiah(row.exp) : '-'}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold ${
                          row.total >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {formatRupiah(row.total)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500 font-sans">
                        {row.exp > 0 ? `${pct}%` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-2.5 px-3">Rekening / Dompet</th>
                  <th className="py-2.5 px-3 text-center">Jumlah Transaksi</th>
                  <th className="py-2.5 px-3 text-right">Uang Masuk</th>
                  <th className="py-2.5 px-3 text-right">Uang Keluar</th>
                  <th className="py-2.5 px-3 text-right">Perubahan Bersih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {rekeningBreakdown.map((row) => (
                  <tr key={row.nama} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                      {row.nama}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-500">{row.count}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600">
                      {row.inc > 0 ? formatRupiah(row.inc) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-600">
                      {row.exp > 0 ? formatRupiah(row.exp) : '-'}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold ${
                        row.net >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatRupiah(row.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
