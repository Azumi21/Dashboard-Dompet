import React, { useMemo, useState } from 'react';
import {
  Plus,
  Wallet,
  Building2,
  Smartphone,
  Banknote,
  TrendingUp,
  Edit2,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Receipt
} from 'lucide-react';
import { AppData, Rekening, Transaction } from '../types/finance';
import { formatRupiah, calculateAccountBalances, formatDateIndo } from '../utils/formatters';

interface RekeningViewProps {
  appData: AppData;
  onOpenAddModal: () => void;
  onEditRekening: (r: Rekening) => void;
  onDeleteRekening: (r: Rekening) => void;
}

export const RekeningView: React.FC<RekeningViewProps> = ({
  appData,
  onOpenAddModal,
  onEditRekening,
  onDeleteRekening,
}) => {
  const [selectedRekeningForHistory, setSelectedRekeningForHistory] = useState<Rekening | null>(null);

  // Automatically calculate current balance dynamically for each account
  const accountsWithBalances = useMemo(() => {
    return calculateAccountBalances(appData.rekening, appData.transaksi);
  }, [appData.rekening, appData.transaksi]);

  const totalSaldoSemua = useMemo(() => {
    return accountsWithBalances
      .filter((r) => r.status === 'Aktif')
      .reduce((sum, r) => sum + (r.saldo_sekarang || 0), 0);
  }, [accountsWithBalances]);

  // Account specific transactions history
  const selectedHistory = useMemo(() => {
    if (!selectedRekeningForHistory) return [];
    const accName = selectedRekeningForHistory.nama_rekening.trim().toLowerCase();
    const accId = selectedRekeningForHistory.id_rekening;

    return appData.transaksi
      .filter((t) => {
        const src = (t.rekening && t.rekening.trim().toLowerCase() === accName) || t.rekening === accId;
        const tgt = (t.rekening_tujuan && t.rekening_tujuan.trim().toLowerCase() === accName) || t.rekening_tujuan === accId;
        return src || tgt;
      })
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [selectedRekeningForHistory, appData.transaksi]);

  const getAccountIcon = (jenis: string) => {
    switch (jenis) {
      case 'Bank':
        return <Building2 className="w-5 h-5 text-blue-500" />;
      case 'E-Wallet':
        return <Smartphone className="w-5 h-5 text-indigo-500" />;
      case 'Tunai':
        return <Banknote className="w-5 h-5 text-emerald-500" />;
      default:
        return <Wallet className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Likuiditas Seluruh Rekening Aktif
          </span>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatRupiah(totalSaldoSemua)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Saldo dihitung otomatis: <span className="font-mono text-emerald-600 font-semibold">Saldo Awal + Masuk - Keluar + Transfer</span>
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-[#15856c] hover:bg-[#116c58] rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Rekening Baru</span>
        </button>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accountsWithBalances.map((rek) => {
          const isPositive = (rek.saldo_sekarang || 0) >= 0;

          return (
            <div
              key={rek.id_rekening}
              className={`p-5 rounded-xl bg-white dark:bg-slate-900 border shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                rek.status === 'Aktif'
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-slate-200/50 dark:border-slate-800/50 opacity-60'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                      {getAccountIcon(rek.jenis)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {rek.nama_rekening}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{rek.jenis}</span>
                        <span>&middot;</span>
                        <span className="font-mono">{rek.id_rekening}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditRekening(rek)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
                      title="Edit Rekening"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteRekening(rek)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                      title="Hapus Rekening"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Balance Display */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Saldo Real-time
                  </span>
                  <div
                    className={`text-2xl font-bold font-mono tracking-tight mt-0.5 ${
                      isPositive
                        ? 'text-slate-900 dark:text-white'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatRupiah(rek.saldo_sekarang)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                    <span>Saldo Awal: {formatRupiah(rek.saldo_awal)}</span>
                    <span className={rek.status === 'Aktif' ? 'text-emerald-600' : 'text-slate-400'}>
                      {rek.status}
                    </span>
                  </div>
                </div>

                {rek.catatan && (
                  <p className="mt-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    {rek.catatan}
                  </p>
                )}
              </div>

              {/* View History Button */}
              <button
                onClick={() => setSelectedRekeningForHistory(rek)}
                className="w-full py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Riwayat Transaksi Akun</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Account Transaction History Modal */}
      {selectedRekeningForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Riwayat Mutasi: {selectedRekeningForHistory.nama_rekening}
                </h3>
                <p className="text-xs text-slate-500">
                  Saldo Saat Ini: <strong className="text-emerald-600 font-mono">{formatRupiah(selectedRekeningForHistory.saldo_sekarang)}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedRekeningForHistory(null)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Tutup
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {selectedHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Belum ada transaksi yang tercatat pada rekening ini.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedHistory.map((t) => {
                    const accName = selectedRekeningForHistory.nama_rekening.trim().toLowerCase();
                    const isSrc = (t.rekening && t.rekening.trim().toLowerCase() === accName);
                    const isTgt = (t.rekening_tujuan && t.rekening_tujuan.trim().toLowerCase() === accName);

                    let isPlus = false;
                    if (t.jenis === 'Pemasukan' && isSrc) isPlus = true;
                    if (t.jenis === 'Transfer' && isTgt) isPlus = true;

                    return (
                      <div
                        key={t.id_transaksi}
                        className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              isPlus
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60'
                            }`}
                          >
                            {isPlus ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {t.deskripsi}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {formatDateIndo(t.tanggal)} &middot; {t.kategori} &middot; {t.metode}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`font-bold font-mono text-sm ${
                            isPlus ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isPlus ? '+' : '-'}
                          {formatRupiah(t.nominal)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
