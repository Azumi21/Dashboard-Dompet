import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  PieChart,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { AppData, Budget } from '../types/finance';
import { formatRupiah } from '../utils/formatters';

interface BudgetViewProps {
  appData: AppData;
  onOpenAddModal: () => void;
  onEditBudget: (b: Budget) => void;
  onDeleteBudget: (b: Budget) => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  appData,
  onOpenAddModal,
  onEditBudget,
  onDeleteBudget,
}) => {
  const currentDate = new Date();
  const [selectedBulan, setSelectedBulan] = useState<number>(currentDate.getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState<number>(currentDate.getFullYear());

  const months = [
    { num: 1, name: 'Januari' },
    { num: 2, name: 'Februari' },
    { num: 3, name: 'Maret' },
    { num: 4, name: 'April' },
    { num: 5, name: 'Mei' },
    { num: 6, name: 'Juni' },
    { num: 7, name: 'Juli' },
    { num: 8, name: 'Agustus' },
    { num: 9, name: 'September' },
    { num: 10, name: 'Oktober' },
    { num: 11, name: 'November' },
    { num: 12, name: 'Desember' },
  ];

  // Expenses in the selected month & year
  const monthExpenses = useMemo(() => {
    return appData.transaksi.filter((t) => {
      if (t.jenis !== 'Pengeluaran' || !t.tanggal) return false;
      const d = new Date(t.tanggal);
      return d.getMonth() + 1 === selectedBulan && d.getFullYear() === selectedTahun;
    });
  }, [appData.transaksi, selectedBulan, selectedTahun]);

  // Compute budget list for the selected month/year
  const activeBudgets = useMemo(() => {
    return appData.budget
      .filter((b) => b.bulan === selectedBulan && b.tahun === selectedTahun)
      .map((b) => {
        const spent = monthExpenses
          .filter((t) => t.kategori && t.kategori.toLowerCase() === b.kategori.toLowerCase())
          .reduce((sum, t) => sum + Number(t.nominal || 0), 0);

        const sisa = b.nominal_budget - spent;
        const persentase = b.nominal_budget > 0 ? Math.round((spent / b.nominal_budget) * 100) : 0;

        return {
          ...b,
          terpakai: spent,
          sisa,
          persentase,
        };
      });
  }, [appData.budget, monthExpenses, selectedBulan, selectedTahun]);

  // Totals
  const totalBudgeted = useMemo(() => {
    return activeBudgets.reduce((sum, b) => sum + Number(b.nominal_budget || 0), 0);
  }, [activeBudgets]);

  const totalSpentInBudgeted = useMemo(() => {
    return activeBudgets.reduce((sum, b) => sum + Number(b.terpakai || 0), 0);
  }, [activeBudgets]);

  const overBudgetCnt = useMemo(() => {
    return activeBudgets.filter((b) => (b.persentase || 0) > 100).length;
  }, [activeBudgets]);

  return (
    <div className="space-y-6">
      {/* Top Bar: Month Selector & Add Button */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <div className="flex items-center gap-2">
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              {months.map((m) => (
                <option key={m.num} value={m.num}>
                  {m.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(Number(e.target.value))}
              className="w-20 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#15856c] hover:bg-[#116c58] rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Budget Baru</span>
        </button>
      </div>

      {/* Over-budget Alert Warning if any */}
      {overBudgetCnt > 0 && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-red-700 dark:text-red-400 text-sm">
              Perhatian: {overBudgetCnt} Kategori Melebihi Batas Anggaran!
            </div>
            <p className="text-red-600 dark:text-red-300 mt-0.5">
              Pengeluaran pada kategori bertanda merah telah melampaui batas yang Anda tentukan. Disarankan untuk membatasi pengeluaran tambahan hingga akhir bulan.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs uppercase font-semibold text-slate-500">
            Total Anggaran Dialokasikan
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatRupiah(totalBudgeted)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Untuk {activeBudgets.length} pos pengeluaran
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs uppercase font-semibold text-slate-500">
            Total Dana Terpakai
          </span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {formatRupiah(totalSpentInBudgeted)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {totalBudgeted > 0 ? Math.round((totalSpentInBudgeted / totalBudgeted) * 100) : 0}% dari total anggaran
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs uppercase font-semibold text-slate-500">
            Sisa Batas Aman Keseluruhan
          </span>
          <div
            className={`text-2xl font-bold mt-1 ${
              totalBudgeted - totalSpentInBudgeted >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatRupiah(Math.max(0, totalBudgeted - totalSpentInBudgeted))}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {totalBudgeted - totalSpentInBudgeted >= 0 ? 'Masih dalam batas aman' : 'Melebihi batas aman'}
          </p>
        </div>
      </div>

      {/* Budget Cards Grid */}
      {activeBudgets.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <PieChart className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h4 className="font-semibold text-slate-700 dark:text-slate-300">
            Belum ada budget untuk periode ini
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Buat rencana anggaran kategori untuk bulan ini agar pengeluaran Anda terkontrol dengan baik.
          </p>
          <button
            onClick={onOpenAddModal}
            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Budget Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeBudgets.map((b) => {
            const pct = b.persentase || 0;
            // User requested criteria:
            // 0-70% normal, 70-90% warning, 90-100% hampir habis, >100% over budget
            let barColor = 'bg-emerald-500';
            let badgeBg = 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600';
            let statusLabel = 'Normal';

            if (pct > 100) {
              barColor = 'bg-red-600';
              badgeBg = 'bg-red-50 dark:bg-red-950/60 text-red-600 font-bold border border-red-200 dark:border-red-900';
              statusLabel = 'OVER BUDGET';
            } else if (pct >= 90) {
              barColor = 'bg-rose-500';
              badgeBg = 'bg-rose-50 dark:bg-rose-950/50 text-rose-600';
              statusLabel = 'Hampir Habis (90-100%)';
            } else if (pct >= 70) {
              barColor = 'bg-amber-500';
              badgeBg = 'bg-amber-50 dark:bg-amber-950/50 text-amber-600';
              statusLabel = 'Peringatan (70-90%)';
            }

            return (
              <div
                key={b.id_budget}
                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">
                          {b.kategori}
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${badgeBg}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Budget: <strong className="text-slate-800 dark:text-slate-200">{formatRupiah(b.nominal_budget)}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditBudget(b)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit Budget"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteBudget(b)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        title="Hapus Budget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${barColor}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-600 dark:text-slate-400">
                        Terpakai: <strong>{formatRupiah(b.terpakai)}</strong> ({pct}%)
                      </span>
                      <span className={b.sisa && b.sisa < 0 ? 'text-red-600 font-bold' : 'text-slate-500'}>
                        {b.sisa !== undefined && b.sisa >= 0
                          ? `Sisa: ${formatRupiah(b.sisa)}`
                          : `Over: ${formatRupiah(Math.abs(b.sisa || 0))}`}
                      </span>
                    </div>
                  </div>
                </div>

                {pct > 100 && (
                  <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Melebihi anggaran sebesar {formatRupiah(Math.abs(b.sisa || 0))}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
