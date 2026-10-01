import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Tabungan } from '../../types/finance';
import { formatRupiah, generateId } from '../../utils/formatters';

interface TabunganModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tabungan: Tabungan) => void;
  tabunganToEdit?: Tabungan | null;
}

export const TabunganModal: React.FC<TabunganModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tabunganToEdit,
}) => {
  const [namaTarget, setNamaTarget] = useState('');
  const [targetNominal, setTargetNominal] = useState<number>(0);
  const [displayTarget, setDisplayTarget] = useState('');
  const [saldoAwal, setSaldoAwal] = useState<number>(0);
  const [displaySaldoAwal, setDisplaySaldoAwal] = useState('');
  const [targetTanggal, setTargetTanggal] = useState('');
  const [status, setStatus] = useState<'Berjalan' | 'Tercapai' | 'Dibatalkan'>('Berjalan');
  const [catatan, setCatatan] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (tabunganToEdit) {
      setNamaTarget(tabunganToEdit.nama_target);
      setTargetNominal(tabunganToEdit.target_nominal);
      setDisplayTarget(tabunganToEdit.target_nominal ? String(tabunganToEdit.target_nominal) : '');
      setSaldoAwal(tabunganToEdit.saldo_awal);
      setDisplaySaldoAwal(tabunganToEdit.saldo_awal ? String(tabunganToEdit.saldo_awal) : '');
      setTargetTanggal(tabunganToEdit.target_tanggal || '');
      setStatus(tabunganToEdit.status);
      setCatatan(tabunganToEdit.catatan || '');
    } else {
      setNamaTarget('');
      setTargetNominal(0);
      setDisplayTarget('');
      setSaldoAwal(0);
      setDisplaySaldoAwal('');
      setTargetTanggal('');
      setStatus('Berjalan');
      setCatatan('');
    }
    setErrorMsg('');
  }, [isOpen, tabunganToEdit]);

  const handleTargetInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const num = rawVal ? parseInt(rawVal, 10) : 0;
    setTargetNominal(num);
    setDisplayTarget(rawVal ? num.toLocaleString('id-ID') : '');
  };

  const handleSaldoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const num = rawVal ? parseInt(rawVal, 10) : 0;
    setSaldoAwal(num);
    setDisplaySaldoAwal(rawVal ? num.toLocaleString('id-ID') : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaTarget.trim()) {
      setErrorMsg('Nama target tabungan wajib diisi');
      return;
    }
    if (!targetNominal || targetNominal <= 0) {
      setErrorMsg('Target nominal dana harus lebih dari 0');
      return;
    }

    const payload: Tabungan = {
      id_tabungan: tabunganToEdit ? tabunganToEdit.id_tabungan : generateId('SAV'),
      nama_target: namaTarget.trim(),
      target_nominal: targetNominal,
      saldo_awal: saldoAwal || 0,
      target_tanggal: targetTanggal || '',
      status: saldoAwal >= targetNominal ? 'Tercapai' : status,
      catatan: catatan.trim() || undefined,
    };

    onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {tabunganToEdit ? 'Edit Target Tabungan' : 'Tambah Target Tabungan'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Nama Impian / Target <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={namaTarget}
              onChange={(e) => setNamaTarget(e.target.value)}
              placeholder="Contoh: Beli Laptop Baru, Dana Darurat, Liburan"
              className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Target Nominal Dana (IDR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                Rp
              </div>
              <input
                type="text"
                value={displayTarget}
                onChange={handleTargetInput}
                placeholder="0"
                className="w-full pl-11 pr-4 py-2 text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Dana Awal / Terkumpul Saat Ini (IDR)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                Rp
              </div>
              <input
                type="text"
                value={displaySaldoAwal}
                onChange={handleSaldoInput}
                placeholder="0"
                className="w-full pl-11 pr-4 py-2 text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            {targetNominal > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                Progress awal: {Math.min(100, Math.round(((saldoAwal || 0) / targetNominal) * 100))}% (Kekurangan: {formatRupiah(Math.max(0, targetNominal - (saldoAwal || 0)))})
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Target Tanggal
              </label>
              <input
                type="date"
                value={targetTanggal}
                onChange={(e) => setTargetTanggal(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Berjalan">Berjalan</option>
                <option value="Tercapai">Tercapai</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Catatan / Tempat Penyimpanan
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Disimpan di SeaBank bunga harian"
              className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Target</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
