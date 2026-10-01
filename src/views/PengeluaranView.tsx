import React, { useMemo } from 'react';
import { Plus, ArrowUpRight, AlertTriangle, TrendingDown } from 'lucide-react';
import { AppData, Transaction } from '../types/finance';
import { formatRupiah } from '../utils/formatters';
import { TransaksiView } from './TransaksiView';

interface PengeluaranViewProps {
  appData: AppData;
  onOpenAddModal: () => void;
  onEditTransaction: (t: Transaction) => void;
  onDeleteTransaction: (t: Transaction) => void;
}

export const PengeluaranView: React.FC<PengeluaranViewProps> = ({
  appData,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const expenses = useMemo(() => {
    return appData.transaksi.filter((t) => t.jenis === 'Pengeluaran');
  }, [appData.transaksi]);

  const totalPengeluaran = useMemo(() => {
    return expenses.reduce((sum, t) => sum + Number(t.nominal || 0), 0);
  }, [expenses]);

  // Largest expense category
  const topExpenseCat = useMemo(() => {
    const map: { [cat: string]: number } = {};
    expenses.forEach((t) => {
      const c = t.kategori || 'Lainnya';
      map[c] = (map[c] || 0) + Number(t.nominal || 0);
    });
    let topName = '-';
    let topVal = 0;
    for (const [k, v] of Object.entries(map)) {
      if (v > topVal) {
        topVal = v;
        topName = k;
      }
    }
    return { name: topName, amount: topVal };
  }, [expenses]);

  return (
    <div className="space-y-6">
      {/* Overview Ribbon for Expenses */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Total Pengeluaran Keseluruhan</span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {formatRupiah(totalPengeluaran)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{expenses.length} catatan pengeluaran</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Pos Terbesar</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-2 truncate">
            {topExpenseCat.name}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Total {formatRupiah(topExpenseCat.amount)}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400">
              Catat Pengeluaran
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-1">Belanja atau Bayar Tagihan?</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pantau arus kas keluar secara disiplin agar tidak defisit.
            </p>
          </div>
          <button
            onClick={onOpenAddModal}
            className="mt-3 w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Filtered Transaksi Table with Pengeluaran preselected */}
      <TransaksiView
        appData={appData}
        initialTypeFilter="Pengeluaran"
        onOpenAddModal={() => onOpenAddModal()}
        onEditTransaction={onEditTransaction}
        onDeleteTransaction={onDeleteTransaction}
      />
    </div>
  );
};
