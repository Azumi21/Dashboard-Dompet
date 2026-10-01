import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Budget, Kategori } from '../../types/finance';
import { formatRupiah, generateId } from '../../utils/formatters';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (budget: Budget) => void;
  budgetToEdit?: Budget | null;
  kategoris: Kategori[];
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  budgetToEdit,
  kategoris,
}) => {
  const currentDate = new Date();
  const [bulan, setBulan] = useState<number>(currentDate.getMonth() + 1);
  const [tahun, setTahun] = useState<number>(currentDate.getFullYear());
  const [kategori, setKategori] = useState<string>('');
  const [nominal, setNominal] = useState<number>(0);
  const [displayNominal, setDisplayNominal] = useState<string>('');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [errorMsg, setErrorMsg] = useState('');

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

  const expenseCategories = kategoris.filter(k => k.jenis === 'Pengeluaran' && k.status === 'Aktif');

  useEffect(() => {
    if (budgetToEdit) {
      setBulan(budgetToEdit.bulan);
      setTahun(budgetToEdit.tahun);
      setKategori(budgetToEdit.kategori);
      setNominal(budgetToEdit.nominal_budget);
      setDisplayNominal(budgetToEdit.nominal_budget ? String(budgetToEdit.nominal_budget) : '');
      setStatus(budgetToEdit.status);
    } else {
      setBulan(currentDate.getMonth() + 1);
      setTahun(currentDate.getFullYear());
      setNominal(0);
      setDisplayNominal('');
      setStatus('Aktif');
      if (expenseCategories.length > 0) {
        setKategori(expenseCategories[0].nama_kategori);
      }
    }
    setErrorMsg('');
  }, [isOpen, budgetToEdit, kategoris]);

  const handleNominalInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const num = rawVal ? parseInt(rawVal, 10) : 0;
    setNominal(num);
    setDisplayNominal(rawVal ? num.toLocaleString('id-ID') : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kategori) {
      setErrorMsg('Pilih kategori pengeluaran untuk budget');
      return;
    }
    if (!nominal || nominal <= 0) {
      setErrorMsg('Nominal budget harus lebih dari 0');
      return;
    }

    const payload: Budget = {
      id_budget: budgetToEdit ? budgetToEdit.id_budget : generateId('BUG'),
      bulan,
      tahun,
      kategori,
      nominal_budget: nominal,
      status,
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
            {budgetToEdit ? 'Edit Anggaran / Budget' : 'Tambah Anggaran Bulanan'}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Bulan
              </label>
              <select
                value={bulan}
                onChange={(e) => setBulan(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {months.map((m) => (
                  <option key={m.num} value={m.num}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Tahun
              </label>
              <input
                type="number"
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Kategori Pengeluaran <span className="text-rose-500">*</span>
            </label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              {expenseCategories.map((c) => (
                <option key={c.id_kategori} value={c.nama_kategori}>
                  {c.nama_kategori}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Nominal Batas Budget (IDR) <span className="text-rose-500">*</span>
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
              <span>Simpan Budget</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
