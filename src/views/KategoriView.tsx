import React, { useState, useMemo } from 'react';
import {
  Plus,
  Tags,
  Edit2,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { AppData, Kategori } from '../types/finance';

interface KategoriViewProps {
  appData: AppData;
  onOpenAddModal: (jenis?: 'Pemasukan' | 'Pengeluaran') => void;
  onEditKategori: (k: Kategori) => void;
  onDeleteKategori: (k: Kategori) => void;
}

export const KategoriView: React.FC<KategoriViewProps> = ({
  appData,
  onOpenAddModal,
  onEditKategori,
  onDeleteKategori,
}) => {
  const [activeTab, setActiveTab] = useState<'Semua' | 'Pengeluaran' | 'Pemasukan'>('Semua');

  // Count usage of categories in transactions
  const categoryUsage = useMemo(() => {
    const map: { [name: string]: number } = {};
    appData.transaksi.forEach((t) => {
      const c = t.kategori || '';
      map[c] = (map[c] || 0) + 1;
    });
    return map;
  }, [appData.transaksi]);

  const filteredCategories = useMemo(() => {
    if (activeTab === 'Semua') return appData.kategori;
    return appData.kategori.filter((k) => k.jenis === activeTab);
  }, [appData.kategori, activeTab]);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Type Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('Semua')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'Semua'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Semua ({appData.kategori.length})
          </button>
          <button
            onClick={() => setActiveTab('Pengeluaran')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'Pengeluaran'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Pengeluaran ({appData.kategori.filter((k) => k.jenis === 'Pengeluaran').length})
          </button>
          <button
            onClick={() => setActiveTab('Pemasukan')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'Pemasukan'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Pemasukan ({appData.kategori.filter((k) => k.jenis === 'Pemasukan').length})
          </button>
        </div>

        <button
          onClick={() => onOpenAddModal(activeTab === 'Pemasukan' ? 'Pemasukan' : 'Pengeluaran')}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori Baru</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredCategories.map((k) => {
          const isIncome = k.jenis === 'Pemasukan';
          const usageCount = categoryUsage[k.nama_kategori] || 0;

          return (
            <div
              key={k.id_kategori}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: k.warna || (isIncome ? '#10b981' : '#f43f5e') }}
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {k.nama_kategori}
                    </h4>
                    <span className="font-mono text-[10px] text-slate-400">{k.id_kategori}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditKategori(k)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
                    title="Edit Kategori"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteKategori(k)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                    title="Hapus Kategori"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    isIncome ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {isIncome ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                  <span>{k.jenis}</span>
                </span>
                <span className="text-[11px]">
                  {usageCount} transaksi
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
