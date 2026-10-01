import React, { useMemo } from 'react';
import { Plus, ArrowDownLeft, TrendingUp, Award } from 'lucide-react';
import { AppData, Transaction } from '../types/finance';
import { formatRupiah } from '../utils/formatters';
import { TransaksiView } from './TransaksiView';

interface PemasukanViewProps {
  appData: AppData;
  onOpenAddModal: () => void;
  onEditTransaction: (t: Transaction) => void;
  onDeleteTransaction: (t: Transaction) => void;
}

export const PemasukanView: React.FC<PemasukanViewProps> = ({
  appData,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const incomes = useMemo(() => {
    return appData.transaksi.filter((t) => t.jenis === 'Pemasukan');
  }, [appData.transaksi]);

  const totalPemasukan = useMemo(() => {
    return incomes.reduce((sum, t) => sum + Number(t.nominal || 0), 0);
  }, [incomes]);

  // Top source of income
  const topSource = useMemo(() => {
    const map: { [cat: string]: number } = {};
    incomes.forEach((t) => {
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
  }, [incomes]);

  return (
    <div className="space-y-6">
      {/* Overview Ribbon for Incomes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Total Pemasukan Keseluruhan</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {formatRupiah(totalPemasukan)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{incomes.length} catatan pemasukan</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Sumber Terbesar</span>
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-2 truncate">
            {topSource.name}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Total {formatRupiah(topSource.amount)}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-[#15856c] dark:text-emerald-400">
              Pencatatan Cepat
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-1">Ada Pemasukan Baru?</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Catat segera agar saldo rekening Anda tetap mutakhir.
            </p>
          </div>
          <button
            onClick={onOpenAddModal}
            className="mt-3 w-full py-2 bg-[#15856c] hover:bg-[#116c58] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pemasukan Sekarang</span>
          </button>
        </div>
      </div>

      {/* Filtered Transaksi Table with Pemasukan preselected */}
      <TransaksiView
        appData={appData}
        initialTypeFilter="Pemasukan"
        onOpenAddModal={() => onOpenAddModal()}
        onEditTransaction={onEditTransaction}
        onDeleteTransaction={onDeleteTransaction}
      />
    </div>
  );
};
