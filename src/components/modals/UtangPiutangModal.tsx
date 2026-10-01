import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Utang, Piutang } from '../../types/finance';
import { formatRupiah, generateId } from '../../utils/formatters';

interface UtangPiutangModalProps {
  isOpen: boolean;
  type: 'utang' | 'piutang';
  onClose: () => void;
  onSaveUtang?: (item: Utang) => void;
  onSavePiutang?: (item: Piutang) => void;
  itemToEdit?: Utang | Piutang | null;
}

export const UtangPiutangModal: React.FC<UtangPiutangModalProps> = ({
  isOpen,
  type,
  onClose,
  onSaveUtang,
  onSavePiutang,
  itemToEdit,
}) => {
  const isDebt = type === 'utang';
  const [nama, setNama] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [nominal, setNominal] = useState<number>(0);
  const [displayNominal, setDisplayNominal] = useState('');
  const [jatuhTempo, setJatuhTempo] = useState('');
  const [status, setStatus] = useState<string>(isDebt ? 'Belum dibayar' : 'Belum diterima');
  const [catatan, setCatatan] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setNama(itemToEdit.nama);
      setTanggal(itemToEdit.tanggal);
      setNominal(itemToEdit.nominal);
      setDisplayNominal(itemToEdit.nominal ? String(itemToEdit.nominal) : '');
      setJatuhTempo(itemToEdit.jatuh_tempo || '');
      setStatus(itemToEdit.status);
      setCatatan(itemToEdit.catatan || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setNama('');
      setTanggal(today);
      setNominal(0);
      setDisplayNominal('');
      setJatuhTempo('');
      setStatus(isDebt ? 'Belum dibayar' : 'Belum diterima');
      setCatatan('');
    }
    setErrorMsg('');
  }, [isOpen, itemToEdit, isDebt]);

  const handleNominalInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const num = rawVal ? parseInt(rawVal, 10) : 0;
    setNominal(num);
    setDisplayNominal(rawVal ? num.toLocaleString('id-ID') : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setErrorMsg(isDebt ? 'Nama pemberi pinjaman wajib diisi' : 'Nama peminjam wajib diisi');
      return;
    }
    if (!nominal || nominal <= 0) {
      setErrorMsg('Nominal wajib lebih dari 0');
      return;
    }
    if (!tanggal) {
      setErrorMsg('Tanggal transaksi wajib diisi');
      return;
    }

    if (isDebt && onSaveUtang) {
      const payload: Utang = {
        id_utang: (itemToEdit as Utang)?.id_utang || generateId('DEBT'),
        nama: nama.trim(),
        tanggal,
        nominal,
        jatuh_tempo: jatuhTempo || '',
        status: status as any,
        catatan: catatan.trim() || undefined,
      };
      onSaveUtang(payload);
    } else if (!isDebt && onSavePiutang) {
      const payload: Piutang = {
        id_piutang: (itemToEdit as Piutang)?.id_piutang || generateId('AR'),
        nama: nama.trim(),
        tanggal,
        nominal,
        jatuh_tempo: jatuhTempo || '',
        status: status as any,
        catatan: catatan.trim() || undefined,
      };
      onSavePiutang(payload);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {itemToEdit ? `Edit Data ${isDebt ? 'Utang' : 'Piutang'}` : `Catat ${isDebt ? 'Utang Baru' : 'Piutang Baru'}`}
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
              {isDebt ? 'Nama Pemberi Pinjaman / Bank' : 'Nama Peminjam / Debitur'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder={isDebt ? 'Contoh: Mas Budi, Bank Mandiri' : 'Contoh: Rian (Teman), PT Klien'}
              className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Nominal (IDR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                Rp
              </div>
              <input
                type="text"
                value={displayNominal}
                onChange={handleNominalInput}
                placeholder="0"
                className="w-full pl-11 pr-4 py-2 text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            {nominal > 0 && (
              <p className="text-xs text-slate-500 mt-1 font-mono">{formatRupiah(nominal)}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Tanggal Mulai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Jatuh Tempo
              </label>
              <input
                type="date"
                value={jatuhTempo}
                onChange={(e) => setJatuhTempo(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Status Pembayaran
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              {isDebt ? (
                <>
                  <option value="Belum dibayar">Belum dibayar</option>
                  <option value="Sebagian">Sebagian</option>
                  <option value="Lunas">Lunas</option>
                </>
              ) : (
                <>
                  <option value="Belum diterima">Belum diterima</option>
                  <option value="Sebagian">Sebagian</option>
                  <option value="Lunas">Lunas</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Catatan (Opsional)
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Detail perjanjian atau sisa nominal"
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
              <span>Simpan Data</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
