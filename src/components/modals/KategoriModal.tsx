import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Kategori } from '../../types/finance';
import { generateId } from '../../utils/formatters';

interface KategoriModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (kategori: Kategori) => void;
  kategoriToEdit?: Kategori | null;
  defaultJenis?: 'Pemasukan' | 'Pengeluaran';
}

export const KategoriModal: React.FC<KategoriModalProps> = ({
  isOpen,
  onClose,
  onSave,
  kategoriToEdit,
  defaultJenis = 'Pengeluaran',
}) => {
  const [nama, setNama] = useState('');
  const [jenis, setJenis] = useState<'Pemasukan' | 'Pengeluaran'>(defaultJenis);
  const [warna, setWarna] = useState('#10b981');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [errorMsg, setErrorMsg] = useState('');

  const presetColors = [
    '#10b981', '#059669', '#34d399', '#06b6d4', '#3b82f6',
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
    '#eab308', '#64748b'
  ];

  useEffect(() => {
    if (kategoriToEdit) {
      setNama(kategoriToEdit.nama_kategori);
      setJenis(kategoriToEdit.jenis);
      setWarna(kategoriToEdit.warna || '#10b981');
      setStatus(kategoriToEdit.status);
    } else {
      setNama('');
      setJenis(defaultJenis);
      setWarna(defaultJenis === 'Pemasukan' ? '#10b981' : '#f43f5e');
      setStatus('Aktif');
    }
    setErrorMsg('');
  }, [isOpen, kategoriToEdit, defaultJenis]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setErrorMsg('Nama kategori wajib diisi');
      return;
    }

    const payload: Kategori = {
      id_kategori: kategoriToEdit ? kategoriToEdit.id_kategori : generateId('CAT'),
      nama_kategori: nama.trim(),
      jenis,
      status,
      warna,
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
            {kategoriToEdit ? 'Edit Kategori' : 'Tambah Kategori Baru'}
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
              Jenis Kategori
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setJenis('Pengeluaran');
                  if (!kategoriToEdit) setWarna('#f43f5e');
                }}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-all ${
                  jenis === 'Pengeluaran'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => {
                  setJenis('Pemasukan');
                  if (!kategoriToEdit) setWarna('#10b981');
                }}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-all ${
                  jenis === 'Pemasukan'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Pemasukan
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Nama Kategori <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Makanan, Transportasi, Gaji Pokok"
              className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Warna Indikator
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              {presetColors.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setWarna(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    warna === color ? 'scale-125 border-slate-900 dark:border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Pilih warna ${color}`}
                />
              ))}
            </div>
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
              <span>Simpan Kategori</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
