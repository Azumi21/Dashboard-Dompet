import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Check } from 'lucide-react';
import { Kategori, Rekening, Transaction, TransactionType } from '../../types/finance';
import { formatRupiah, generateId } from '../../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  transactionToEdit?: Transaction | null;
  initialType?: TransactionType;
  rekenings: Rekening[];
  kategoris: Kategori[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transactionToEdit,
  initialType = 'Pengeluaran',
  rekenings,
  kategoris,
}) => {
  const [jenis, setJenis] = useState<TransactionType>(initialType);
  const [tanggal, setTanggal] = useState<string>('');
  const [kategori, setKategori] = useState<string>('');
  const [nominal, setNominal] = useState<number>(0);
  const [displayNominal, setDisplayNominal] = useState<string>('');
  const [rekening, setRekening] = useState<string>('');
  const [rekeningTujuan, setRekeningTujuan] = useState<string>('');
  const [metode, setMetode] = useState<string>('Transfer Bank');
  const [deskripsi, setDeskripsi] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (transactionToEdit) {
      setJenis(transactionToEdit.jenis);
      setTanggal(transactionToEdit.tanggal || '');
      setKategori(transactionToEdit.kategori || '');
      setNominal(transactionToEdit.nominal || 0);
      setDisplayNominal(transactionToEdit.nominal ? String(transactionToEdit.nominal) : '');
      setRekening(transactionToEdit.rekening || '');
      setRekeningTujuan(transactionToEdit.rekening_tujuan || '');
      setMetode(transactionToEdit.metode || 'Transfer Bank');
      setDeskripsi(transactionToEdit.deskripsi || '');
      setCatatan(transactionToEdit.catatan || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setJenis(initialType);
      setTanggal(today);
      setNominal(0);
      setDisplayNominal('');
      setDeskripsi('');
      setCatatan('');
      setMetode('Transfer Bank');

      const activeAccounts = rekenings.filter(r => r.status === 'Aktif');
      if (activeAccounts.length > 0) {
        setRekening(activeAccounts[0].nama_rekening);
        if (activeAccounts.length > 1) {
          setRekeningTujuan(activeAccounts[1].nama_rekening);
        }
      }

      // Default category
      const filteredCats = kategoris.filter(k => k.jenis === initialType && k.status === 'Aktif');
      if (filteredCats.length > 0) {
        setKategori(filteredCats[0].nama_kategori);
      } else {
        setKategori(initialType === 'Transfer' ? 'Transfer' : 'Lainnya');
      }
    }
    setErrorMsg('');
  }, [isOpen, transactionToEdit, initialType, rekenings, kategoris]);

  // Adjust categories when jenis changes
  const handleJenisChange = (newJenis: TransactionType) => {
    setJenis(newJenis);
    if (newJenis === 'Transfer') {
      setKategori('Transfer Antar Rekening');
      if (rekening && !rekeningTujuan) {
        const other = rekenings.find(r => r.nama_rekening !== rekening);
        if (other) setRekeningTujuan(other.nama_rekening);
      }
    } else {
      const matchCats = kategoris.filter(k => k.jenis === newJenis && k.status === 'Aktif');
      if (matchCats.length > 0) {
        setKategori(matchCats[0].nama_kategori);
      } else {
        setKategori('Lainnya');
      }
    }
  };

  const handleNominalInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const num = rawVal ? parseInt(rawVal, 10) : 0;
    setNominal(num);
    setDisplayNominal(rawVal ? num.toLocaleString('id-ID') : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal) {
      setErrorMsg('Tanggal wajib diisi');
      return;
    }
    if (!nominal || nominal <= 0) {
      setErrorMsg('Nominal wajib angka dan lebih dari 0');
      return;
    }
    if (!rekening) {
      setErrorMsg('Rekening asal wajib dipilih');
      return;
    }
    if (jenis === 'Transfer' && (!rekeningTujuan || rekening === rekeningTujuan)) {
      setErrorMsg('Rekening tujuan tidak boleh sama dengan rekening asal');
      return;
    }
    if (!deskripsi.trim()) {
      setErrorMsg('Deskripsi transaksi wajib diisi');
      return;
    }

    const payload: Transaction = {
      id_transaksi: transactionToEdit ? transactionToEdit.id_transaksi : generateId('TRX'),
      tanggal,
      jenis,
      kategori: jenis === 'Transfer' ? 'Transfer' : (kategori || 'Lainnya'),
      nominal,
      rekening,
      rekening_tujuan: jenis === 'Transfer' ? rekeningTujuan : undefined,
      metode,
      deskripsi: deskripsi.trim(),
      catatan: catatan.trim() || undefined,
      timestamp: transactionToEdit?.timestamp || new Date().toISOString(),
    };

    onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  const filteredCategories = kategoris.filter(k => k.jenis === jenis && k.status === 'Aktif');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {transactionToEdit ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
              {errorMsg}
            </div>
          )}

          {/* Segmented Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Jenis Transaksi
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => handleJenisChange('Pengeluaran')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-md transition-all ${
                  jenis === 'Pengeluaran'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Pengeluaran</span>
              </button>
              <button
                type="button"
                onClick={() => handleJenisChange('Pemasukan')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-md transition-all ${
                  jenis === 'Pemasukan'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Pemasukan</span>
              </button>
              <button
                type="button"
                onClick={() => handleJenisChange('Transfer')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-md transition-all ${
                  jenis === 'Transfer'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Transfer</span>
              </button>
            </div>
          </div>

          {/* Nominal Input with Rp preview */}
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
                className="w-full pl-11 pr-4 py-2.5 text-base font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            {nominal > 0 && (
              <div className="text-xs text-slate-500 mt-1 font-mono">
                Terbaca: {formatRupiah(nominal)}
              </div>
            )}
          </div>

          {/* Tanggal & Metode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Tanggal <span className="text-rose-500">*</span>
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
                Metode Pembayaran
              </label>
              <select
                value={metode}
                onChange={(e) => setMetode(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
                <option value="Tunai">Tunai / Cash</option>
                <option value="Kartu Debit">Kartu Debit</option>
                <option value="E-Wallet">E-Wallet</option>
                <option value="Virtual Account">Virtual Account</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Kategori (jika bukan transfer) */}
          {jenis !== 'Transfer' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Kategori <span className="text-rose-500">*</span>
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {filteredCategories.map((c) => (
                  <option key={c.id_kategori} value={c.nama_kategori}>
                    {c.nama_kategori}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Rekening Asal & Tujuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                {jenis === 'Transfer' ? 'Dari Rekening (Asal)' : 'Rekening / Dompet'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <select
                value={rekening}
                onChange={(e) => setRekening(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {rekenings
                  .filter((r) => r.status === 'Aktif')
                  .map((r) => (
                    <option key={r.id_rekening} value={r.nama_rekening}>
                      {r.nama_rekening} ({r.jenis})
                    </option>
                  ))}
              </select>
            </div>

            {jenis === 'Transfer' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Ke Rekening (Tujuan) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={rekeningTujuan}
                  onChange={(e) => setRekeningTujuan(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="">-- Pilih Rekening Tujuan --</option>
                  {rekenings
                    .filter((r) => r.status === 'Aktif' && r.nama_rekening !== rekening)
                    .map((r) => (
                      <option key={r.id_rekening} value={r.nama_rekening}>
                        {r.nama_rekening} ({r.jenis})
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Deskripsi Transaksi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Contoh: Belanja mingguan di supermarket"
              className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Catatan (Opsional)
            </label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tambahkan detail catatan transaksi bila ada"
              className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Footer Submit */}
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
              <span>{transactionToEdit ? 'Simpan Perubahan' : 'Tambah Transaksi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
