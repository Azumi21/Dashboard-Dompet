import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  FileSpreadsheet
} from 'lucide-react';
import {
  AppData,
  Transaction,
  TransactionType,
  Kategori,
  Rekening
} from '../types/finance';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface TransaksiViewProps {
  appData: AppData;
  onOpenAddModal: (type?: TransactionType) => void;
  onEditTransaction: (t: Transaction) => void;
  onDeleteTransaction: (t: Transaction) => void;
  initialTypeFilter?: TransactionType | 'Semua';
}

export const TransaksiView: React.FC<TransaksiViewProps> = ({
  appData,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  initialTypeFilter = 'Semua',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenis, setFilterJenis] = useState<string>(initialTypeFilter);
  const [filterKategori, setFilterKategori] = useState<string>('Semua');
  const [filterRekening, setFilterRekening] = useState<string>('Semua');
  const [filterDateStart, setFilterDateStart] = useState<string>('');
  const [filterDateEnd, setFilterDateEnd] = useState<string>('');
  const [sortBy, setSortBy] = useState<'tanggal_desc' | 'tanggal_asc' | 'nominal_desc' | 'nominal_asc'>('tanggal_desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Filter & Search
  const filteredTransactions = useMemo(() => {
    return appData.transaksi
      .filter((t) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchDesc = t.deskripsi?.toLowerCase().includes(q);
          const matchCat = t.kategori?.toLowerCase().includes(q);
          const matchRek = t.rekening?.toLowerCase().includes(q);
          const matchId = t.id_transaksi?.toLowerCase().includes(q);
          const matchNote = t.catatan?.toLowerCase().includes(q);
          if (!matchDesc && !matchCat && !matchRek && !matchId && !matchNote) return false;
        }

        // Filter Jenis
        if (filterJenis !== 'Semua' && t.jenis !== filterJenis) {
          return false;
        }

        // Filter Kategori
        if (filterKategori !== 'Semua' && t.kategori !== filterKategori) {
          return false;
        }

        // Filter Rekening
        if (filterRekening !== 'Semua') {
          if (t.rekening !== filterRekening && t.rekening_tujuan !== filterRekening) {
            return false;
          }
        }

        // Filter Date Range
        if (filterDateStart && t.tanggal < filterDateStart) {
          return false;
        }
        if (filterDateEnd && t.tanggal > filterDateEnd) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'tanggal_desc') {
          return b.tanggal.localeCompare(a.tanggal);
        }
        if (sortBy === 'tanggal_asc') {
          return a.tanggal.localeCompare(b.tanggal);
        }
        if (sortBy === 'nominal_desc') {
          return Number(b.nominal) - Number(a.nominal);
        }
        if (sortBy === 'nominal_asc') {
          return Number(a.nominal) - Number(b.nominal);
        }
        return 0;
      });
  }, [
    appData.transaksi,
    searchQuery,
    filterJenis,
    filterKategori,
    filterRekening,
    filterDateStart,
    filterDateEnd,
    sortBy,
  ]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const resetFilters = () => {
    setSearchQuery('');
    setFilterJenis('Semua');
    setFilterKategori('Semua');
    setFilterRekening('Semua');
    setFilterDateStart('');
    setFilterDateEnd('');
    setSortBy('tanggal_desc');
    setCurrentPage(1);
  };

  // Summaries of the current filter view
  const currentTotalIn = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.jenis === 'Pemasukan')
      .reduce((sum, t) => sum + Number(t.nominal || 0), 0);
  }, [filteredTransactions]);

  const currentTotalOut = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.jenis === 'Pengeluaran')
      .reduce((sum, t) => sum + Number(t.nominal || 0), 0);
  }, [filteredTransactions]);

  return (
    <div className="space-y-5">
      {/* Top Bar: Search, Filters, Add Button */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari deskripsi, kategori, rekening, ID transaksi..."
              className="w-full pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={() => onOpenAddModal()}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#15856c] hover:bg-[#116c58] rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Transaksi</span>
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Filter Jenis */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Jenis
            </label>
            <select
              value={filterJenis}
              onChange={(e) => {
                setFilterJenis(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="Semua">Semua Jenis</option>
              <option value="Pemasukan">Pemasukan</option>
              <option value="Pengeluaran">Pengeluaran</option>
              <option value="Transfer">Transfer</option>
            </select>
          </div>

          {/* Filter Kategori */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Kategori
            </label>
            <select
              value={filterKategori}
              onChange={(e) => {
                setFilterKategori(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="Semua">Semua Kategori</option>
              {appData.kategori.map((k) => (
                <option key={k.id_kategori} value={k.nama_kategori}>
                  {k.nama_kategori}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Rekening */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Rekening
            </label>
            <select
              value={filterRekening}
              onChange={(e) => {
                setFilterRekening(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="Semua">Semua Rekening</option>
              {appData.rekening.map((r) => (
                <option key={r.id_rekening} value={r.nama_rekening}>
                  {r.nama_rekening}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tanggal Mulai */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={filterDateStart}
              onChange={(e) => {
                setFilterDateStart(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Filter Tanggal Sampai */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={filterDateEnd}
              onChange={(e) => {
                setFilterDateEnd(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Sorting */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Urutkan
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="tanggal_desc">Tanggal Terbaru</option>
              <option value="tanggal_asc">Tanggal Terlama</option>
              <option value="nominal_desc">Nominal Terbesar</option>
              <option value="nominal_asc">Nominal Terkecil</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Tags & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>
              Ditemukan: <strong className="text-slate-800 dark:text-slate-200">{filteredTransactions.length}</strong> transaksi
            </span>
            <span>
              Total Masuk: <strong className="text-[#15856c] dark:text-emerald-400">{formatRupiah(currentTotalIn)}</strong>
            </span>
            <span>
              Total Keluar: <strong className="text-rose-600">{formatRupiah(currentTotalOut)}</strong>
            </span>
          </div>

          {(searchQuery || filterJenis !== 'Semua' || filterKategori !== 'Semua' || filterRekening !== 'Semua' || filterDateStart || filterDateEnd) && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-500 hover:text-rose-600 font-semibold"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-3 px-4">ID Transaksi</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4">Deskripsi</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Rekening</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileSpreadsheet className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-medium">Tidak ada transaksi yang cocok dengan filter</p>
                      <button
                        onClick={resetFilters}
                        className="text-xs text-emerald-600 hover:underline font-semibold mt-1"
                      >
                        Reset filter pencarian
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((t) => {
                  const isIncome = t.jenis === 'Pemasukan';
                  const isExpense = t.jenis === 'Pengeluaran';
                  const isTransfer = t.jenis === 'Transfer';

                  return (
                    <tr
                      key={t.id_transaksi}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {t.id_transaksi}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatDateIndo(t.tanggal)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isExpense
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {isIncome && <ArrowDownLeft className="w-3.5 h-3.5" />}
                          {isExpense && <ArrowUpRight className="w-3.5 h-3.5" />}
                          {isTransfer && <ArrowLeftRight className="w-3.5 h-3.5" />}
                          <span>{t.jenis}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white max-w-xs">
                        <div className="truncate">{t.deskripsi}</div>
                        {t.catatan && (
                          <div className="text-[10px] text-slate-400 truncate">{t.catatan}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {t.kategori}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {t.rekening}
                        {t.rekening_tujuan && (
                          <span className="text-blue-500 font-medium"> → {t.rekening_tujuan}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {t.metode || '-'}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-bold font-mono text-sm whitespace-nowrap ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isExpense
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {isIncome ? '+' : isExpense ? '-' : ''}
                        {formatRupiah(t.nominal)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditTransaction(t)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Transaksi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(t)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredTransactions.length > itemsPerPage && (
          <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Halaman {currentPage} dari {totalPages} ({filteredTransactions.length} transaksi)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
