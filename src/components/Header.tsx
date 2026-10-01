import React from 'react';
import {
  Menu,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  RefreshCw,
  Sun,
  Moon,
  Database,
  PieChart,
  Lock,
  Users,
  ChevronDown,
  UserCheck,
  UserPlus,
  Settings
} from 'lucide-react';
import { NavigationMenu, TransactionType, UserAccount } from '../types/finance';
import { getAvatarColorClass } from '../utils/userColors';

interface HeaderProps {
  currentMenu: NavigationMenu;
  onOpenMobileNav: () => void;
  isGasConnected: boolean;
  onGoToSettings: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenTransactionModal: (type?: TransactionType) => void;
  onOpenBudgetModal: () => void;
  onLockApp?: () => void;
  currentUser?: UserAccount;
  allAccounts?: UserAccount[];
  onSwitchAccount?: (user: UserAccount) => void;
  onManageAccounts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMenu,
  onOpenMobileNav,
  isGasConnected,
  onGoToSettings,
  onRefreshData,
  isRefreshing,
  isDarkMode,
  onToggleDarkMode,
  onOpenTransactionModal,
  onOpenBudgetModal,
  onLockApp,
  currentUser,
  allAccounts = [],
  onSwitchAccount,
  onManageAccounts,
}) => {
  const [profileOpen, setProfileOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const titles: Record<NavigationMenu, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard Keuangan', subtitle: 'Pantau, kelola, dan tingkatkan kondisi finansial Anda' },
    transaksi: { title: 'Daftar Transaksi', subtitle: 'Catatan seluruh transaksi pemasukan, pengeluaran & transfer' },
    pemasukan: { title: 'Kelola Pemasukan', subtitle: 'Daftar arus kas masuk & sumber pendapatan' },
    pengeluaran: { title: 'Kelola Pengeluaran', subtitle: 'Pantau belanja & pos-pos pengeluaran' },
    budget: { title: 'Anggaran & Budget', subtitle: 'Batasi pengeluaran per kategori agar tidak over-budget' },
    tabungan: { title: 'Target Tabungan', subtitle: 'Pantau impian dan dana darurat masa depan' },
    rekening: { title: 'Rekening & Dompet', subtitle: 'Daftar rekening bank, e-wallet, dan saldo otomatis' },
    utang_piutang: { title: 'Utang & Piutang', subtitle: 'Pencatatan kewajiban dan tagihan aktif' },
    laporan: { title: 'Laporan Finansial', subtitle: 'Analisis mendalam, tren bulanan & ekspor data' },
    kategori: { title: 'Master Kategori', subtitle: 'Sesuaikan kategori pemasukan dan pengeluaran' },
    pengaturan: { title: 'Pengaturan & Integrasi', subtitle: 'Koneksi Google Spreadsheet & Apps Script Web App' },
  };

  const currentInfo = titles[currentMenu] || { title: 'Keuangan Pribadi', subtitle: 'Dashboard Finansial' };

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-[#e2ede8] dark:border-slate-800 transition-colors">
      <div className="px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & Titles */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileNav}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-[#eaf5f1] dark:hover:bg-slate-800"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white truncate">
              {currentInfo.title}
            </h2>
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 truncate">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right Side: Header Tools */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          {/* Quick Transaction Action Buttons */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => onOpenTransactionModal('Pemasukan')}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#15856c] dark:text-emerald-300 bg-[#eaf5f1] dark:bg-emerald-950/60 hover:bg-[#d6ede4] rounded-lg border border-[#c3e6d8] dark:border-emerald-800 transition-colors"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>+ Pemasukan</span>
            </button>
            <button
              onClick={() => onOpenTransactionModal('Pengeluaran')}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 rounded-lg border border-rose-200 dark:border-rose-800 transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+ Pengeluaran</span>
            </button>
            <button
              onClick={() => onOpenTransactionModal('Transfer')}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </button>
          </div>

          {/* Primary Action Button in Signature Teal */}
          <button
            onClick={() => onOpenTransactionModal()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#15856c] hover:bg-[#116c58] rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Transaksi</span>
          </button>

          {/* User Profile & Account Switcher Dropdown */}
          {currentUser && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-[#eaf5f1] dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 transition-all text-xs font-semibold"
                aria-expanded={profileOpen}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs border ${getAvatarColorClass(
                    currentUser.avatarColor
                  )}`}
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col text-left leading-tight">
                  <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-[90px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[90px]">
                    {currentUser.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 animate-scaleUp">
                  {/* Current Active Account Header */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 mb-2 flex items-center gap-2.5 border border-slate-100 dark:border-slate-700/50">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 ${getAvatarColorClass(
                        currentUser.avatarColor
                      )}`}
                    >
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        @{currentUser.username} • {currentUser.role}
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Aktif" />
                  </div>

                  {/* Switch to Other Accounts */}
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                    Ganti Profil Akun
                  </div>
                  <div className="space-y-1 mb-2">
                    {allAccounts
                      .filter((acc) => acc.id !== currentUser.id)
                      .map((acc) => (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            if (onSwitchAccount) onSwitchAccount(acc);
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs border ${getAvatarColorClass(
                                acc.avatarColor
                              )}`}
                            >
                              {acc.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#15856c] transition-colors truncate">
                                {acc.name}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {acc.role}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-[#15856c] dark:text-emerald-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                            Pilih
                          </span>
                        </button>
                      ))}
                  </div>

                  {/* Manage Accounts & Lock */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    {onManageAccounts && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          onManageAccounts();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>Kelola Semua Akun</span>
                      </button>
                    )}

                    {onLockApp && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          onLockApp();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Kunci / Ganti Pengguna</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Language Indicator Badge matching image.png (ID) */}
          <div className="hidden sm:flex items-center justify-center px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            ID
          </div>

          {/* Lock Privacy Button */}
          {onLockApp && (
            <button
              onClick={onLockApp}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-colors border border-slate-200/80 dark:border-slate-700"
              title="Kunci Aplikasi (Privasi)"
              aria-label="Kunci Aplikasi"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          {/* Dark Mode Toggle matching image.png */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-[#eaf5f1] dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700"
            title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
            aria-label="Ubah Tema"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Sync / Refresh Button */}
          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            className={`p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-[#eaf5f1] dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700 ${
              isRefreshing ? 'animate-spin text-[#15856c]' : ''
            }`}
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Connection Status Button */}
          <button
            onClick={onGoToSettings}
            className={`hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              isGasConnected
                ? 'bg-[#eaf5f1] dark:bg-emerald-950/40 text-[#15856c] dark:text-emerald-300 border-[#c3e6d8] dark:border-emerald-800 hover:bg-[#d6ede4]'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
            }`}
            title={isGasConnected ? 'Terhubung Google Spreadsheet' : 'Klik untuk hubungkan Google Spreadsheet'}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isGasConnected ? 'Spreadsheet Terhubung' : 'Mode Demo (Atur GAS)'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
