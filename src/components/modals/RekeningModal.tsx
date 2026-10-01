import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Rekening, RekeningType } from '../../types/finance';
import { formatRupiah, generateId } from '../../utils/formatters';

interface RekeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rekening: Rekening) => void;
  rekeningToEdit?: Rekening | null;
}

export const RekeningModal: React.FC<RekeningModalProps> = ({
  isOpen,
  onClose,
  onSave,
  rekeningToEdit,
}) => {
  const [nama, setNama] = useState('');
  const [jenis, setJenis] = useState<RekeningType>('Bank');
  const [saldoAwal, setSaldoAwal] = useState<number>(0);
  const [displaySaldoAwal, setDisplaySaldoAwal] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [catatan, setCatatan] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (rekeningToEdit) {
      setNama(rekeningToEdit.nama_rekening);
      setJenis(rekeningToEdit.jenis);
      setSaldoAwal(rekeningToEdit.saldo_awal);
      setDisplaySaldoAwal(rekeningToEdit.saldo_awal ? String(rekeningToEdit.saldo_awal) : '0');
      setStatus(rekeningToEdit.status);
      setCatatan(rekeningToEdit.catatan || '');
    } else {
      setNama('');
      setJenis('Bank');
      setSaldoAwal(0);
      setDisplaySaldoAwal('');
      setStatus('Aktif');
      setCatatan('');
    }
    setErrorMsg('');
  }, [isOpen, rekeningToEdit]);

  const handleSaldoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const num = rawVal ? parseInt(rawVal, 10) : 0;
    setSaldoAwal(num);
    setDisplaySaldoAwal(rawVal ? num.toLocaleString('id-ID') : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setErrorMsg('Nama rekening wajib diisi');
      return;
    }

    const payload: Rekening = {
      id_rekening: rekeningToEdit ? rekeningToEdit.id_rekening : generateId('REC'),
      nama_rekening: nama.trim(),
      jenis,
      saldo_awal: saldoAwal || 0,
      status,
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
            {rekeningToEdit ? 'Edit Rekening / Dompet' : 'Tambah Rekening / Dompet'}
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
              Nama Rekening / Dompet <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: BCA Gaji, GoPay, Tunai, SeaBank"
              className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Jenis Akun
              </label>
              <select
                value={jenis}
                onChange={(e) => setJenis(e.target.value as RekeningType)}
                className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Bank">Bank</option>
                <option value="E-Wallet">E-Wallet</option>
                <option value="Tunai">Tunai / Cash</option>
                <option value="Investasi">Investasi</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Aktif' | 'Nonaktif')}
                className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Saldo Awal (IDR)
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
            <p className="text-[11px] text-slate-500 mt-1">
              Saldo akhir akan dihitung otomatis dari Saldo Awal + Transaksi.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Catatan (Opsional)
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Nomor rekening atau kegunaan akun"
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
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#15856c] hover:bg-[#116c58] rounded-xl shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Rekening</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
