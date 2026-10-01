/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  AppData,
  Budget,
  Kategori,
  NavigationMenu,
  Piutang,
  Rekening,
  Tabungan,
  Transaction,
  TransactionType,
  Utang,
  UserAccount,
} from './types/finance';
import { StorageService } from './services/storageService';
import { GasService } from './services/gasService';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';

// Modals
import { TransactionModal } from './components/modals/TransactionModal';
import { RekeningModal } from './components/modals/RekeningModal';
import { KategoriModal } from './components/modals/KategoriModal';
import { BudgetModal } from './components/modals/BudgetModal';
import { TabunganModal } from './components/modals/TabunganModal';
import { UtangPiutangModal } from './components/modals/UtangPiutangModal';
import { SwitchAccountModal } from './components/modals/SwitchAccountModal';

// Views
import { DashboardView } from './views/DashboardView';
import { TransaksiView } from './views/TransaksiView';
import { PemasukanView } from './views/PemasukanView';
import { PengeluaranView } from './views/PengeluaranView';
import { BudgetView } from './views/BudgetView';
import { TabunganView } from './views/TabunganView';
import { RekeningView } from './views/RekeningView';
import { UtangPiutangView } from './views/UtangPiutangView';
import { LaporanView } from './views/LaporanView';
import { KategoriView } from './views/KategoriView';
import { PengaturanView } from './views/PengaturanView';
import { LoginView } from './views/LoginView';
import { AuthService } from './services/authService';

export default function App() {
  // Multi-User Active Account & List
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => AuthService.getActiveAccount());
  const [allAccounts, setAllAccounts] = useState<UserAccount[]>(() => AuthService.getAccounts());

  // Authentication & Privacy Lock State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => AuthService.isAuthenticated());

  // App Data & GAS URL
  const [appData, setAppData] = useState<AppData>(() => StorageService.loadData(AuthService.getActiveAccount().id));
  const [gasUrl, setGasUrl] = useState<string>(() => StorageService.getGasUrl(AuthService.getActiveAccount().id));
  const [currentMenu, setCurrentMenu] = useState<NavigationMenu>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('dompetku_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dompetku_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dompetku_theme', 'light');
    }
  }, [isDarkMode]);

  // Toast System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', title?: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type, title }]);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check for Quick Connect URL parameter (?sync=... or ?gas=...) from QR Code / Sync Link
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const syncToken = searchParams.get('sync');
      const incomingGas = searchParams.get('gas') || searchParams.get('connect');

      let targetGas = incomingGas || '';

      if (syncToken) {
        try {
          const jsonStr = decodeURIComponent(escape(atob(syncToken)));
          const payload = JSON.parse(jsonStr);
          if (payload) {
            if (Array.isArray(payload.accs) && payload.accs.length > 0) {
              AuthService.saveAccounts(payload.accs);
              const freshAccs = AuthService.getAccounts();
              setAllAccounts(freshAccs);
              setCurrentUser(freshAccs[0]);
            }
            if (payload.gas) {
              targetGas = payload.gas;
            }
          }
        } catch (e) {
          console.error('Error parsing sync token:', e);
        }
      }

      if (targetGas && targetGas.startsWith('http')) {
        StorageService.setGasUrl(targetGas, currentUser.id);
        setGasUrl(targetGas);

        setIsRefreshing(true);
        GasService.fetchAllData(targetGas).then((res) => {
          setIsRefreshing(false);
          if (res.success && res.data) {
            StorageService.saveData(res.data, currentUser.id);
            setAppData(res.data);
            const freshAccounts = AuthService.getAccounts();
            setAllAccounts(freshAccounts);
            const activeAcc = AuthService.getActiveAccount();
            setCurrentUser(activeAcc);
            showToast('Perangkat berhasil terhubung otomatis! Profil akun dan transaksi telah sinkron.', 'success', 'Sinkronisasi Berhasil');
          } else {
            showToast('URL Google Apps Script disimpan: ' + (res.message || ''), 'info', 'Terhubung');
          }
        });
      }

      if (syncToken || incomingGas) {
        // Bersihkan parameter query dari address bar browser
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.error('Error parsing connect url param:', e);
    }
  }, [currentUser.id, showToast]);

  // Switch Account PIN Verification State
  const [switchTargetUser, setSwitchTargetUser] = useState<UserAccount | null>(null);
  const [switchModalOpen, setSwitchModalOpen] = useState<boolean>(false);

  const handleRequestSwitchAccount = useCallback((newUser: UserAccount) => {
    if (newUser.id === currentUser.id) return;
    setSwitchTargetUser(newUser);
    setSwitchModalOpen(true);
  }, [currentUser.id]);

  const handleConfirmSwitchAccount = useCallback((verifiedUser: UserAccount) => {
    AuthService.setActiveAccountId(verifiedUser.id);
    setCurrentUser(verifiedUser);
    const data = StorageService.loadData(verifiedUser.id);
    setAppData(data);
    const userGas = StorageService.getGasUrl(verifiedUser.id);
    setGasUrl(userGas);
    setAllAccounts(AuthService.getAccounts());
    showToast(`Verifikasi PIN berhasil! Selamat datang, ${verifiedUser.name}.`, 'success', 'Beralih Akun');
  }, [showToast]);

  const handleLoginSuccess = useCallback((user: UserAccount) => {
    AuthService.setActiveAccountId(user.id);
    setCurrentUser(user);
    const data = StorageService.loadData(user.id);
    setAppData(data);
    const userGas = StorageService.getGasUrl(user.id);
    setGasUrl(userGas);
    setAllAccounts(AuthService.getAccounts());
    setIsAuthenticated(true);
    showToast(`Selamat datang, ${user.name}! Akses dompet dibuka.`, 'success', 'Login Berhasil');
  }, [showToast]);

  const handleLockApp = useCallback(() => {
    AuthService.logout();
    setIsAuthenticated(false);
    showToast('Aplikasi berhasil dikunci demi privasi Anda.', 'info', 'Terkunci');
  }, [showToast]);

  // Confirm Modal System
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Modal States
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [initialTxType, setInitialTxType] = useState<TransactionType>('Pengeluaran');

  const [rekeningModalOpen, setRekeningModalOpen] = useState(false);
  const [rekeningToEdit, setRekeningToEdit] = useState<Rekening | null>(null);

  const [kategoriModalOpen, setKategoriModalOpen] = useState(false);
  const [kategoriToEdit, setKategoriToEdit] = useState<Kategori | null>(null);
  const [defaultKategoriJenis, setDefaultKategoriJenis] = useState<'Pemasukan' | 'Pengeluaran'>('Pengeluaran');

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);

  const [tabunganModalOpen, setTabunganModalOpen] = useState(false);
  const [tabunganToEdit, setTabunganToEdit] = useState<Tabungan | null>(null);

  const [utangPiutangModalOpen, setUtangPiutangModalOpen] = useState(false);
  const [utangPiutangType, setUtangPiutangType] = useState<'utang' | 'piutang'>('utang');
  const [utangPiutangToEdit, setUtangPiutangToEdit] = useState<Utang | Piutang | null>(null);

  // Sync with Google Spreadsheet
  const handleRefreshData = async () => {
    if (!gasUrl) {
      showToast('Aplikasi berjalan di mode demo lokal. Hubungkan Google Spreadsheet di Pengaturan.', 'info', 'Mode Demo');
      return;
    }
    setIsRefreshing(true);
    const res = await StorageService.syncFromSpreadsheet();
    if (res.success && res.data) {
      setAppData(res.data);
      showToast('Data berhasil dimutakhirkan dari Google Spreadsheet.', 'success', 'Sinkronisasi');
    } else {
      showToast(res.message, 'error', 'Gagal Sinkronisasi');
    }
    setIsRefreshing(false);
  };

  // Push / Seed to Google Spreadsheet
  const handleSeedSpreadsheet = async () => {
    if (!gasUrl) {
      showToast('URL Google Apps Script belum diisi.', 'error');
      return;
    }
    setIsRefreshing(true);
    showToast('Mengunggah data awal ke Google Spreadsheet...', 'info');
    const res = await StorageService.pushToSpreadsheet();
    if (res.success) {
      showToast('Seluruh data berhasil disinkronkan ke Google Spreadsheet!', 'success', 'Berhasil');
    } else {
      showToast(res.message, 'error', 'Gagal');
    }
    setIsRefreshing(false);
  };

  // Save GAS URL
  const handleSaveGasUrl = (url: string) => {
    StorageService.setGasUrl(url);
    setGasUrl(url);
    showToast('URL Google Apps Script berhasil disimpan!', 'success');
  };

  // Reset to Demo Data
  const handleResetDemo = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset ke Data Demo?',
      message: 'Semua perubahan transaksi yang belum Anda unggah ke Spreadsheet akan digantikan dengan data demo 20+ transaksi.',
      onConfirm: () => {
        const fresh = StorageService.resetToDemo();
        setAppData(fresh);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast('Data berhasil di-reset ke data demo awal.', 'info', 'Reset Selesai');
      },
    });
  };

  // Import Backup JSON
  const handleImportBackup = (jsonStr: string) => {
    const res = StorageService.importBackup(jsonStr);
    if (res.success && res.data) {
      setAppData(res.data);
      const updatedAccounts = AuthService.getAccounts();
      setAllAccounts(updatedAccounts);
      const active = AuthService.getActiveAccount();
      setCurrentUser(active);
      const activeGas = StorageService.getGasUrl(active.id);
      setGasUrl(activeGas);
      showToast(res.message, 'success', 'Impor Cadangan');
    } else {
      showToast(res.message, 'error', 'Gagal Impor');
    }
  };

  // ================= CRUD: TRANSAKSI =================
  const handleSaveTransaction = async (tx: Transaction) => {
    const exists = appData.transaksi.some((t) => t.id_transaksi === tx.id_transaksi);
    let updatedTxList: Transaction[];

    if (exists) {
      updatedTxList = appData.transaksi.map((t) => (t.id_transaksi === tx.id_transaksi ? tx : t));
      showToast('Transaksi berhasil diperbarui!', 'success');
    } else {
      updatedTxList = [tx, ...appData.transaksi];
      showToast('Transaksi baru berhasil ditambahkan!', 'success');
    }

    const newData: AppData = { ...appData, transaksi: updatedTxList };
    setAppData(newData);
    StorageService.saveData(newData);

    // Sync to GAS if configured
    if (gasUrl) {
      if (exists) {
        GasService.updateRecord(gasUrl, 'TRANSAKSI', tx, tx.id_transaksi).then((res) => {
          if (!res.success) showToast(`Gagal update ke Google Sheets: ${res.message}`, 'error');
        });
      } else {
        GasService.createRecord(gasUrl, 'TRANSAKSI', tx).then((res) => {
          if (!res.success) showToast(`Gagal kirim ke Google Sheets: ${res.message}`, 'error');
        });
      }
    }
  };

  const handleDeleteTransaction = (tx: Transaction) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Transaksi?',
      message: `Apakah Anda yakin ingin menghapus transaksi "${tx.deskripsi}" (${tx.id_transaksi})?`,
      onConfirm: () => {
        const updated = appData.transaksi.filter((t) => t.id_transaksi !== tx.id_transaksi);
        const newData: AppData = { ...appData, transaksi: updated };
        setAppData(newData);
        StorageService.saveData(newData);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast('Transaksi berhasil dihapus.', 'info');

        if (gasUrl) {
          GasService.deleteRecord(gasUrl, 'TRANSAKSI', tx.id_transaksi).then((res) => {
            if (!res.success) showToast(`Gagal hapus dari Google Sheets: ${res.message}`, 'error');
          });
        }
      },
    });
  };

  // ================= CRUD: REKENING =================
  const handleSaveRekening = (rek: Rekening) => {
    const exists = appData.rekening.some((r) => r.id_rekening === rek.id_rekening);
    let updatedList: Rekening[];

    if (exists) {
      updatedList = appData.rekening.map((r) => (r.id_rekening === rek.id_rekening ? rek : r));
      showToast('Rekening berhasil diperbarui!', 'success');
    } else {
      updatedList = [...appData.rekening, rek];
      showToast('Rekening baru berhasil ditambahkan!', 'success');
    }

    const newData: AppData = { ...appData, rekening: updatedList };
    setAppData(newData);
    StorageService.saveData(newData);

    if (gasUrl) {
      if (exists) {
        GasService.updateRecord(gasUrl, 'REKENING', rek, rek.id_rekening);
      } else {
        GasService.createRecord(gasUrl, 'REKENING', rek);
      }
    }
  };

  const handleDeleteRekening = (rek: Rekening) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Rekening?',
      message: `Hapus rekening "${rek.nama_rekening}"? Riwayat transaksi yang terkait dengan rekening ini akan tetap ada.`,
      onConfirm: () => {
        const updated = appData.rekening.filter((r) => r.id_rekening !== rek.id_rekening);
        const newData: AppData = { ...appData, rekening: updated };
        setAppData(newData);
        StorageService.saveData(newData);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast('Rekening berhasil dihapus.', 'info');

        if (gasUrl) {
          GasService.deleteRecord(gasUrl, 'REKENING', rek.id_rekening);
        }
      },
    });
  };

  // ================= CRUD: KATEGORI =================
  const handleSaveKategori = (kat: Kategori) => {
    const exists = appData.kategori.some((k) => k.id_kategori === kat.id_kategori);
    let updatedList: Kategori[];

    if (exists) {
      updatedList = appData.kategori.map((k) => (k.id_kategori === kat.id_kategori ? kat : k));
      showToast('Kategori berhasil diperbarui!', 'success');
    } else {
      updatedList = [...appData.kategori, kat];
      showToast('Kategori baru berhasil ditambahkan!', 'success');
    }

    const newData: AppData = { ...appData, kategori: updatedList };
    setAppData(newData);
    StorageService.saveData(newData);

    if (gasUrl) {
      if (exists) {
        GasService.updateRecord(gasUrl, 'KATEGORI', kat, kat.id_kategori);
      } else {
        GasService.createRecord(gasUrl, 'KATEGORI', kat);
      }
    }
  };

  const handleDeleteKategori = (kat: Kategori) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Kategori?',
      message: `Hapus kategori "${kat.nama_kategori}"?`,
      onConfirm: () => {
        const updated = appData.kategori.filter((k) => k.id_kategori !== kat.id_kategori);
        const newData: AppData = { ...appData, kategori: updated };
        setAppData(newData);
        StorageService.saveData(newData);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast('Kategori berhasil dihapus.', 'info');

        if (gasUrl) {
          GasService.deleteRecord(gasUrl, 'KATEGORI', kat.id_kategori);
        }
      },
    });
  };

  // ================= CRUD: BUDGET =================
  const handleSaveBudget = (bug: Budget) => {
    const exists = appData.budget.some((b) => b.id_budget === bug.id_budget);
    let updatedList: Budget[];

    if (exists) {
      updatedList = appData.budget.map((b) => (b.id_budget === bug.id_budget ? bug : b));
      showToast('Budget berhasil diperbarui!', 'success');
    } else {
      updatedList = [...appData.budget, bug];
      showToast('Budget baru berhasil ditambahkan!', 'success');
    }

    const newData: AppData = { ...appData, budget: updatedList };
    setAppData(newData);
    StorageService.saveData(newData);

    if (gasUrl) {
      if (exists) {
        GasService.updateRecord(gasUrl, 'BUDGET', bug, bug.id_budget);
      } else {
        GasService.createRecord(gasUrl, 'BUDGET', bug);
      }
    }
  };

  const handleDeleteBudget = (bug: Budget) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Budget?',
      message: `Hapus budget kategori "${bug.kategori}"?`,
      onConfirm: () => {
        const updated = appData.budget.filter((b) => b.id_budget !== bug.id_budget);
        const newData: AppData = { ...appData, budget: updated };
        setAppData(newData);
        StorageService.saveData(newData);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast('Budget berhasil dihapus.', 'info');

        if (gasUrl) {
          GasService.deleteRecord(gasUrl, 'BUDGET', bug.id_budget);
        }
      },
    });
  };

  // ================= CRUD: TABUNGAN =================
  const handleSaveTabungan = (sav: Tabungan) => {
    const exists = appData.tabungan.some((t) => t.id_tabungan === sav.id_tabungan);
    let updatedList: Tabungan[];

    if (exists) {
      updatedList = appData.tabungan.map((t) => (t.id_tabungan === sav.id_tabungan ? sav : t));
      showToast('Target tabungan diperbarui!', 'success');
    } else {
      updatedList = [...appData.tabungan, sav];
      showToast('Target tabungan baru ditambahkan!', 'success');
    }

    const newData: AppData = { ...appData, tabungan: updatedList };
    setAppData(newData);
    StorageService.saveData(newData);

    if (gasUrl) {
      if (exists) {
        GasService.updateRecord(gasUrl, 'TABUNGAN', sav, sav.id_tabungan);
      } else {
        GasService.createRecord(gasUrl, 'TABUNGAN', sav);
      }
    }
  };

  const handleUpdateTabunganBalance = (tabunganId: string, addAmount: number) => {
    const target = appData.tabungan.find((t) => t.id_tabungan === tabunganId);
    if (!target) return;

    const newSaldo = target.saldo_awal + addAmount;
    const isDone = newSaldo >= target.target_nominal;
    const updated: Tabungan = {
      ...target,
      saldo_awal: newSaldo,
      status: isDone ? 'Tercapai' : target.status,
    };

    handleSaveTabungan(updated);
    showToast(`Berhasil setor ${addAmount.toLocaleString('id-ID')} ke ${target.nama_target}`, 'success');
  };

  const handleDeleteTabungan = (sav: Tabungan) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Target Tabungan?',
      message: `Hapus target impian "${sav.nama_target}"?`,
      onConfirm: () => {
        const updated = appData.tabungan.filter((t) => t.id_tabungan !== sav.id_tabungan);
        const newData: AppData = { ...appData, tabungan: updated };
        setAppData(newData);
        StorageService.saveData(newData);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast('Target tabungan dihapus.', 'info');

        if (gasUrl) {
          GasService.deleteRecord(gasUrl, 'TABUNGAN', sav.id_tabungan);
        }
      },
    });
  };

  // ================= CRUD: UTANG & PIUTANG =================
  const handleSaveUtang = (debt: Utang) => {
    const exists = appData.utang.some((u) => u.id_utang === debt.id_utang);
    let updatedList: Utang[];

    if (exists) {
      updatedList = appData.utang.map((u) => (u.id_utang === debt.id_utang ? debt : u));
      showToast('Data utang diperbarui!', 'success');
    } else {
      updatedList = [...appData.utang, debt];
      showToast('Catatan utang baru ditambahkan!', 'success');
    }

    const newData: AppData = { ...appData, utang: updatedList };
    setAppData(newData);
    StorageService.saveData(newData);

    if (gasUrl) {
      if (exists) {
        GasService.updateRecord(gasUrl, 'UTANG', debt, debt.id_utang);
      } else {
        GasService.createRecord(gasUrl, 'UTANG', debt);
      }
    }
  };

  const handleUpdateUtangStatus = (id: string, status: any) => {
    const target = appData.utang.find((u) => u.id_utang === id);
    if (!target) return;
    const updated = { ...target, status };
    handleSaveUtang(updated);
  };

  const handleDeleteUtang = (debt: Utang) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Catatan Utang?',
      message: `Hapus catatan utang "${debt.nama}"?`,
      onConfirm: () => {
        const updated = appData.utang.filter((u) => u.id_utang !== debt.id_utang);
        const newData: AppData = { ...appData, utang: updated };
        setAppData(newData);
        StorageService.saveData(newData);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast('Catatan utang dihapus.', 'info');

        if (gasUrl) {
          GasService.deleteRecord(gasUrl, 'UTANG', debt.id_utang);
        }
      },
    });
  };

  const handleSavePiutang = (ar: Piutang) => {
    const exists = appData.piutang.some((p) => p.id_piutang === ar.id_piutang);
    let updatedList: Piutang[];

    if (exists) {
      updatedList = appData.piutang.map((p) => (p.id_piutang === ar.id_piutang ? ar : p));
      showToast('Data piutang diperbarui!', 'success');
    } else {
      updatedList = [...appData.piutang, ar];
      showToast('Catatan piutang baru ditambahkan!', 'success');
    }

    const newData: AppData = { ...appData, piutang: updatedList };
    setAppData(newData);
    StorageService.saveData(newData);

    if (gasUrl) {
      if (exists) {
        GasService.updateRecord(gasUrl, 'PIUTANG', ar, ar.id_piutang);
      } else {
        GasService.createRecord(gasUrl, 'PIUTANG', ar);
      }
    }
  };

  const handleUpdatePiutangStatus = (id: string, status: any) => {
    const target = appData.piutang.find((p) => p.id_piutang === id);
    if (!target) return;
    const updated = { ...target, status };
    handleSavePiutang(updated);
  };

  const handleDeletePiutang = (ar: Piutang) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Catatan Piutang?',
      message: `Hapus catatan piutang "${ar.nama}"?`,
      onConfirm: () => {
        const updated = appData.piutang.filter((p) => p.id_piutang !== ar.id_piutang);
        const newData: AppData = { ...appData, piutang: updated };
        setAppData(newData);
        StorageService.saveData(newData);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast('Catatan piutang dihapus.', 'info');

        if (gasUrl) {
          GasService.deleteRecord(gasUrl, 'PIUTANG', ar.id_piutang);
        }
      },
    });
  };

  // Helper open transaction modal with optional preselected type
  const openTransactionModal = (type: TransactionType = 'Pengeluaran') => {
    setTransactionToEdit(null);
    setInitialTxType(type);
    setTransactionModalOpen(true);
  };

  // If locked or unauthenticated, show privacy LoginView
  if (!isAuthenticated) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <LoginView onLoginSuccess={handleLoginSuccess} />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fintech-canvas text-slate-800 dark:text-slate-100 flex flex-col antialiased font-sans">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Main Layout Container */}
      <div className="flex flex-1 min-h-screen">
        {/* Sidebar */}
        <Sidebar
          currentMenu={currentMenu}
          onSelectMenu={setCurrentMenu}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
          isGasConnected={Boolean(gasUrl)}
          onLockApp={handleLockApp}
          currentUser={currentUser}
        />

        {/* Content Column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <Header
            currentMenu={currentMenu}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            isGasConnected={Boolean(gasUrl)}
            onGoToSettings={() => setCurrentMenu('pengaturan')}
            onRefreshData={handleRefreshData}
            isRefreshing={isRefreshing}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
            onOpenTransactionModal={openTransactionModal}
            onOpenBudgetModal={() => {
              setBudgetToEdit(null);
              setBudgetModalOpen(true);
            }}
            onLockApp={handleLockApp}
            currentUser={currentUser}
            allAccounts={allAccounts}
            onSwitchAccount={handleRequestSwitchAccount}
            onManageAccounts={() => setCurrentMenu('pengaturan')}
          />

          {/* Main Body View */}
          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
            {currentMenu === 'dashboard' && (
              <DashboardView
                appData={appData}
                onOpenTransactionModal={openTransactionModal}
                onOpenBudgetModal={() => {
                  setBudgetToEdit(null);
                  setBudgetModalOpen(true);
                }}
                onNavigate={setCurrentMenu}
                isDarkMode={isDarkMode}
              />
            )}

            {currentMenu === 'transaksi' && (
              <TransaksiView
                appData={appData}
                onOpenAddModal={openTransactionModal}
                onEditTransaction={(tx) => {
                  setTransactionToEdit(tx);
                  setTransactionModalOpen(true);
                }}
                onDeleteTransaction={handleDeleteTransaction}
              />
            )}

            {currentMenu === 'pemasukan' && (
              <PemasukanView
                appData={appData}
                onOpenAddModal={() => openTransactionModal('Pemasukan')}
                onEditTransaction={(tx) => {
                  setTransactionToEdit(tx);
                  setTransactionModalOpen(true);
                }}
                onDeleteTransaction={handleDeleteTransaction}
              />
            )}

            {currentMenu === 'pengeluaran' && (
              <PengeluaranView
                appData={appData}
                onOpenAddModal={() => openTransactionModal('Pengeluaran')}
                onEditTransaction={(tx) => {
                  setTransactionToEdit(tx);
                  setTransactionModalOpen(true);
                }}
                onDeleteTransaction={handleDeleteTransaction}
              />
            )}

            {currentMenu === 'budget' && (
              <BudgetView
                appData={appData}
                onOpenAddModal={() => {
                  setBudgetToEdit(null);
                  setBudgetModalOpen(true);
                }}
                onEditBudget={(b) => {
                  setBudgetToEdit(b);
                  setBudgetModalOpen(true);
                }}
                onDeleteBudget={handleDeleteBudget}
              />
            )}

            {currentMenu === 'tabungan' && (
              <TabunganView
                appData={appData}
                onOpenAddModal={() => {
                  setTabunganToEdit(null);
                  setTabunganModalOpen(true);
                }}
                onEditTabungan={(sav) => {
                  setTabunganToEdit(sav);
                  setTabunganModalOpen(true);
                }}
                onDeleteTabungan={handleDeleteTabungan}
                onUpdateTabunganBalance={handleUpdateTabunganBalance}
              />
            )}

            {currentMenu === 'rekening' && (
              <RekeningView
                appData={appData}
                onOpenAddModal={() => {
                  setRekeningToEdit(null);
                  setRekeningModalOpen(true);
                }}
                onEditRekening={(rek) => {
                  setRekeningToEdit(rek);
                  setRekeningModalOpen(true);
                }}
                onDeleteRekening={handleDeleteRekening}
              />
            )}

            {currentMenu === 'utang_piutang' && (
              <UtangPiutangView
                appData={appData}
                onOpenAddModal={(type) => {
                  setUtangPiutangType(type);
                  setUtangPiutangToEdit(null);
                  setUtangPiutangModalOpen(true);
                }}
                onEditUtang={(u) => {
                  setUtangPiutangType('utang');
                  setUtangPiutangToEdit(u);
                  setUtangPiutangModalOpen(true);
                }}
                onDeleteUtang={handleDeleteUtang}
                onUpdateUtangStatus={handleUpdateUtangStatus}
                onEditPiutang={(p) => {
                  setUtangPiutangType('piutang');
                  setUtangPiutangToEdit(p);
                  setUtangPiutangModalOpen(true);
                }}
                onDeletePiutang={handleDeletePiutang}
                onUpdatePiutangStatus={handleUpdatePiutangStatus}
              />
            )}

            {currentMenu === 'laporan' && <LaporanView appData={appData} />}

            {currentMenu === 'kategori' && (
              <KategoriView
                appData={appData}
                onOpenAddModal={(jenis = 'Pengeluaran') => {
                  setDefaultKategoriJenis(jenis);
                  setKategoriToEdit(null);
                  setKategoriModalOpen(true);
                }}
                onEditKategori={(kat) => {
                  setKategoriToEdit(kat);
                  setKategoriModalOpen(true);
                }}
                onDeleteKategori={handleDeleteKategori}
              />
            )}

            {currentMenu === 'pengaturan' && (
              <PengaturanView
                appData={appData}
                gasUrl={gasUrl}
                onSaveGasUrl={handleSaveGasUrl}
                onSyncSpreadsheet={handleRefreshData}
                onSeedSpreadsheet={handleSeedSpreadsheet}
                onResetDemo={handleResetDemo}
                onImportBackup={handleImportBackup}
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
                onLockApp={handleLockApp}
                currentUser={currentUser}
                onSwitchAccount={handleRequestSwitchAccount}
              />
            )}
          </main>
        </div>
      </div>

      {/* Global Modals */}
      <TransactionModal
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        onSave={handleSaveTransaction}
        transactionToEdit={transactionToEdit}
        initialType={initialTxType}
        rekenings={appData.rekening}
        kategoris={appData.kategori}
      />

      <RekeningModal
        isOpen={rekeningModalOpen}
        onClose={() => setRekeningModalOpen(false)}
        onSave={handleSaveRekening}
        rekeningToEdit={rekeningToEdit}
      />

      <KategoriModal
        isOpen={kategoriModalOpen}
        onClose={() => setKategoriModalOpen(false)}
        onSave={handleSaveKategori}
        kategoriToEdit={kategoriToEdit}
        defaultJenis={defaultKategoriJenis}
      />

      <BudgetModal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        onSave={handleSaveBudget}
        budgetToEdit={budgetToEdit}
        kategoris={appData.kategori}
      />

      <TabunganModal
        isOpen={tabunganModalOpen}
        onClose={() => setTabunganModalOpen(false)}
        onSave={handleSaveTabungan}
        tabunganToEdit={tabunganToEdit}
      />

      <UtangPiutangModal
        isOpen={utangPiutangModalOpen}
        type={utangPiutangType}
        onClose={() => setUtangPiutangModalOpen(false)}
        onSaveUtang={handleSaveUtang}
        onSavePiutang={handleSavePiutang}
        itemToEdit={utangPiutangToEdit}
      />

      {/* Switch Account PIN Verification Modal */}
      <SwitchAccountModal
        isOpen={switchModalOpen}
        targetAccount={switchTargetUser}
        onClose={() => {
          setSwitchModalOpen(false);
          setSwitchTargetUser(null);
        }}
        onSuccess={handleConfirmSwitchAccount}
      />
    </div>
  );
}
