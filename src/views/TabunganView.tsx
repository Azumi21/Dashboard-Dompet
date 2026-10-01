import React, { useState } from 'react';
import {
  Plus,
  PiggyBank,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  ArrowUpRight,
  Sparkles,
  Coins
} from 'lucide-react';
import { AppData, Tabungan } from '../types/finance';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface TabunganViewProps {
  appData: AppData;
  onOpenAddModal: () => void;
  onEditTabungan: (t: Tabungan) => void;
  onDeleteTabungan: (t: Tabungan) => void;
  onUpdateTabunganBalance: (tabunganId: string, addAmount: number) => void;
}

export const TabunganView: React.FC<TabunganViewProps> = ({
  appData,
  onOpenAddModal,
  onEditTabungan,
  onDeleteTabungan,
  onUpdateTabunganBalance,
}) => {
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<Tabungan | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [displayDeposit, setDisplayDeposit] = useState<string>('');

  const totalTerkumpul = appData.tabungan
    .filter((t) => t.status !== 'Dibatalkan')
    .reduce((sum, t) => sum + Number(t.saldo_awal || 0), 0);

  const totalTargetKeseluruhan = appData.tabungan
    .filter((t) => t.status !== 'Dibatalkan')
    .reduce((sum, t) => sum + Number(t.target_nominal || 0), 0);

  const handleOpenDeposit = (t: Tabungan) => {
    setSelectedTarget(t);
    setDepositAmount(0);
    setDisplayDeposit('');
    setDepositModalOpen(true);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTarget || depositAmount <= 0) return;
    onUpdateTabunganBalance(selectedTarget.id_tabungan, depositAmount);
    setDepositModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs uppercase font-semibold text-slate-500">
            Total Dana Tabungan Terkumpul
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatRupiah(totalTerkumpul)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {appData.tabungan.length} target impian terdaftar
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs uppercase font-semibold text-slate-500">
            Total Target Keseluruhan
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatRupiah(totalTargetKeseluruhan)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Tercapai {totalTargetKeseluruhan > 0 ? Math.round((totalTerkumpul / totalTargetKeseluruhan) * 100) : 0}% secara agregat
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[#15856c] dark:text-emerald-400 text-xs font-bold uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Target Impian</span>
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-1">Punya Target Baru?</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mulai rencanakan pembelian aset, liburan, atau dana darurat.
            </p>
          </div>
          <button
            onClick={onOpenAddModal}
            className="mt-3 w-full py-2 bg-[#15856c] hover:bg-[#116c58] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Target Baru</span>
          </button>
        </div>
      </div>

      {/* Tabungan Goals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {appData.tabungan.map((t) => {
          const current = t.saldo_awal || 0;
          const target = t.target_nominal || 1;
          const pct = Math.min(100, Math.round((current / target) * 100));
          const kekurangan = Math.max(0, target - current);
          const isFinished = current >= target || t.status === 'Tercapai';

          return (
            <div
              key={t.id_tabungan}
              className={`p-5 rounded-xl bg-white dark:bg-slate-900 border shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                isFinished
                  ? 'border-emerald-300 dark:border-emerald-800'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2.5 rounded-lg ${
                        isFinished
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-teal-50 text-teal-600 dark:bg-teal-950/60'
                      }`}
                    >
                      <PiggyBank className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {t.nama_target}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono">{t.id_tabungan}</span>
                        {t.target_tanggal && (
                          <>
                            <span>&middot;</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDateIndo(t.target_tanggal)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditTabungan(t)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
                      title="Edit Target"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTabungan(t)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                      title="Hapus Target"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Amounts */}
                <div className="mt-5 space-y-2">
                  <div className="flex justify-between items-baseline text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px]">Terkumpul:</span>
                      <div className="font-bold text-slate-900 dark:text-white text-base font-mono">
                        {formatRupiah(current)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[11px]">Target:</span>
                      <div className="font-semibold text-slate-600 dark:text-slate-300 font-mono">
                        {formatRupiah(target)}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isFinished ? 'bg-emerald-500' : 'bg-teal-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-teal-600 dark:text-teal-400">
                      {pct}% Terkumpul
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {isFinished ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Target Tercapai!
                        </span>
                      ) : (
                        `Kekurangan: ${formatRupiah(kekurangan)}`
                      )}
                    </span>
                  </div>
                </div>

                {t.catatan && (
                  <p className="mt-3 text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    {t.catatan}
                  </p>
                )}
              </div>

              {/* Deposit Quick Action */}
              <button
                onClick={() => handleOpenDeposit(t)}
                className="w-full py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 rounded-lg border border-teal-200 dark:border-teal-800 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>+ Setor Tabungan</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal Quick Deposit */}
      {depositModalOpen && selectedTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Setor Tabungan: {selectedTarget.nama_target}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tambahkan nominal uang yang Anda alokasikan untuk target ini.
            </p>

            <form onSubmit={handleDepositSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nominal Tambahan (IDR)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                    Rp
                  </div>
                  <input
                    type="text"
                    value={displayDeposit}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      const num = raw ? parseInt(raw, 10) : 0;
                      setDepositAmount(num);
                      setDisplayDeposit(raw ? num.toLocaleString('id-ID') : '');
                    }}
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 text-sm font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                {depositAmount > 0 && (
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    Total setelah setor: {formatRupiah(selectedTarget.saldo_awal + depositAmount)}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={depositAmount <= 0}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-md shadow-xs"
                >
                  Konfirmasi Setor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
