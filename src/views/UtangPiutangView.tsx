import React, { useState } from 'react';
import {
  Plus,
  HandCoins,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  Check
} from 'lucide-react';
import { AppData, Utang, Piutang } from '../types/finance';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface UtangPiutangViewProps {
  appData: AppData;
  onOpenAddModal: (type: 'utang' | 'piutang') => void;
  onEditUtang: (u: Utang) => void;
  onDeleteUtang: (u: Utang) => void;
  onUpdateUtangStatus: (id: string, status: any) => void;
  onEditPiutang: (p: Piutang) => void;
  onDeletePiutang: (p: Piutang) => void;
  onUpdatePiutangStatus: (id: string, status: any) => void;
}

export const UtangPiutangView: React.FC<UtangPiutangViewProps> = ({
  appData,
  onOpenAddModal,
  onEditUtang,
  onDeleteUtang,
  onUpdateUtangStatus,
  onEditPiutang,
  onDeletePiutang,
  onUpdatePiutangStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'utang' | 'piutang'>('utang');

  const totalUtangAktif = appData.utang
    .filter((u) => u.status !== 'Lunas')
    .reduce((sum, u) => sum + Number(u.nominal || 0), 0);

  const totalPiutangAktif = appData.piutang
    .filter((p) => p.status !== 'Lunas')
    .reduce((sum, p) => sum + Number(p.nominal || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Utang Summary */}
        <div
          onClick={() => setActiveTab('utang')}
          className={`cursor-pointer p-5 rounded-xl border shadow-xs transition-all ${
            activeTab === 'utang'
              ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-400 dark:border-rose-800 ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
            <span>Utang Belum Lunas (Kewajiban)</span>
            <div className="p-2 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/70">
              <HandCoins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {formatRupiah(totalUtangAktif)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {appData.utang.filter((u) => u.status !== 'Lunas').length} utang yang perlu dibayar
          </p>
        </div>

        {/* Piutang Summary */}
        <div
          onClick={() => setActiveTab('piutang')}
          className={`cursor-pointer p-5 rounded-xl border shadow-xs transition-all ${
            activeTab === 'piutang'
              ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-400 dark:border-blue-800 ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
            <span>Piutang Belum Diterima (Hak)</span>
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/70">
              <HandCoins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {formatRupiah(totalPiutangAktif)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {appData.piutang.filter((p) => p.status !== 'Lunas').length} piutang belum tertagih
          </p>
        </div>

        {/* Action Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-[#15856c] dark:text-emerald-400">
              Pencatatan Rapi
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
              Catat {activeTab === 'utang' ? 'Utang' : 'Piutang'} Baru
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Jaga komitmen finansial dan pantau jatuh tempo tepat waktu.
            </p>
          </div>
          <button
            onClick={() => onOpenAddModal(activeTab)}
            className="mt-3 w-full py-2 bg-[#15856c] hover:bg-[#116c58] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah {activeTab === 'utang' ? 'Utang' : 'Piutang'}</span>
          </button>
        </div>
      </div>

      {/* Segmented Switcher & Table */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTab('utang')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'utang'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Daftar Utang ({appData.utang.length})
            </button>
            <button
              onClick={() => setActiveTab('piutang')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'piutang'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Daftar Piutang ({appData.piutang.length})
            </button>
          </div>

          <button
            onClick={() => onOpenAddModal(activeTab)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Data</span>
          </button>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">
                  {activeTab === 'utang' ? 'Pemberi Pinjaman' : 'Peminjam'}
                </th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Jatuh Tempo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Catatan</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Aksi & Ubah Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeTab === 'utang' ? (
                appData.utang.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      Tidak ada catatan utang. Keuangan Anda bebas dari utang tercatat!
                    </td>
                  </tr>
                ) : (
                  appData.utang.map((u) => {
                    const isLunas = u.status === 'Lunas';
                    return (
                      <tr key={u.id_utang} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{u.id_utang}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {u.nama}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {formatDateIndo(u.tanggal)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {u.jatuh_tempo ? (
                            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {formatDateIndo(u.jatuh_tempo)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                              isLunas
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                                : u.status === 'Sebagian'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600'
                            }`}
                          >
                            {isLunas && <CheckCircle2 className="w-3 h-3" />}
                            {u.status === 'Sebagian' && <Clock className="w-3 h-3" />}
                            {u.status === 'Belum dibayar' && <AlertCircle className="w-3 h-3" />}
                            <span>{u.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{u.catatan || '-'}</td>
                        <td className="py-3 px-4 text-right font-bold font-mono text-sm text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {formatRupiah(u.nominal)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {!isLunas && (
                              <button
                                onClick={() => onUpdateUtangStatus(u.id_utang, 'Lunas')}
                                className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 rounded-md border border-emerald-200 dark:border-emerald-800 transition-colors"
                                title="Tandai Sudah Lunas"
                              >
                                Tandai Lunas
                              </button>
                            )}
                            <button
                              onClick={() => onEditUtang(u)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteUtang(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )
              ) : (
                appData.piutang.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      Tidak ada catatan piutang.
                    </td>
                  </tr>
                ) : (
                  appData.piutang.map((p) => {
                    const isLunas = p.status === 'Lunas';
                    return (
                      <tr key={p.id_piutang} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{p.id_piutang}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {p.nama}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {formatDateIndo(p.tanggal)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {p.jatuh_tempo ? (
                            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {formatDateIndo(p.jatuh_tempo)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                              isLunas
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                                : p.status === 'Sebagian'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
                                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600'
                            }`}
                          >
                            {isLunas && <CheckCircle2 className="w-3 h-3" />}
                            {p.status === 'Sebagian' && <Clock className="w-3 h-3" />}
                            {p.status === 'Belum diterima' && <AlertCircle className="w-3 h-3" />}
                            <span>{p.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{p.catatan || '-'}</td>
                        <td className="py-3 px-4 text-right font-bold font-mono text-sm text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {formatRupiah(p.nominal)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {!isLunas && (
                              <button
                                onClick={() => onUpdatePiutangStatus(p.id_piutang, 'Lunas')}
                                className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 rounded-md border border-emerald-200 dark:border-emerald-800 transition-colors"
                                title="Tandai Sudah Diterima"
                              >
                                Tandai Lunas
                              </button>
                            )}
                            <button
                              onClick={() => onEditPiutang(p)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeletePiutang(p)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
