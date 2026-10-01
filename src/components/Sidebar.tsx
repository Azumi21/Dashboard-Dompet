import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  PieChart,
  PiggyBank,
  Wallet,
  HandCoins,
  FileBarChart,
  Tags,
  Settings,
  X,
  Database,
  Lock
} from 'lucide-react';
import { NavigationMenu, UserAccount } from '../types/finance';
import { getAvatarColorClass } from '../utils/userColors';

interface SidebarProps {
  currentMenu: NavigationMenu;
  onSelectMenu: (menu: NavigationMenu) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isGasConnected: boolean;
  onLockApp?: () => void;
  currentUser?: UserAccount;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMenu,
  onSelectMenu,
  mobileOpen,
  onCloseMobile,
  isGasConnected,
  onLockApp,
  currentUser
}) => {
  const menuItems: { id: NavigationMenu; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'transaksi', label: 'Semua Transaksi', icon: <Receipt className="w-4 h-4" /> },
    { id: 'pemasukan', label: 'Pemasukan', icon: <ArrowDownLeft className="w-4 h-4 text-[#15856c]" /> },
    { id: 'pengeluaran', label: 'Pengeluaran', icon: <ArrowUpRight className="w-4 h-4 text-rose-500" /> },
    { id: 'budget', label: 'Budget & Anggaran', icon: <PieChart className="w-4 h-4" /> },
    { id: 'tabungan', label: 'Target Tabungan', icon: <PiggyBank className="w-4 h-4" /> },
    { id: 'rekening', label: 'Rekening & Dompet', icon: <Wallet className="w-4 h-4" /> },
    { id: 'utang_piutang', label: 'Utang & Piutang', icon: <HandCoins className="w-4 h-4" /> },
    { id: 'laporan', label: 'Laporan Keuangan', icon: <FileBarChart className="w-4 h-4" /> },
    { id: 'kategori', label: 'Kelola Kategori', icon: <Tags className="w-4 h-4" /> },
    { id: 'pengaturan', label: 'Pengaturan & GAS', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleNavClick = (menu: NavigationMenu) => {
    onSelectMenu(menu);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-700 dark:text-slate-200 border-r border-[#d8e8e1] dark:border-slate-800 transition-colors">
      {/* Brand Header matching image.png */}
      <div className="p-5 flex items-center justify-between border-b border-[#e2ede8] dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          {/* Custom Wallet Logo icon matching template */}
          <div className="w-9 h-9 rounded-xl bg-[#112a3b] p-1.5 flex items-center justify-center text-white shadow-xs">
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="3" stroke="#2563eb" strokeWidth="2.2" />
              <path d="M16 10h6v6h-6a3 3 0 0 1-3-3v0a3 3 0 0 1 3-3z" fill="#15856c" stroke="#15856c" />
              <circle cx="18" cy="13" r="1" fill="#ffffff" />
            </svg>
          </div>
          <div>
            <div className="font-extrabold text-[15px] leading-tight text-slate-900 dark:text-white tracking-tight">
              Keuangan
            </div>
            <div className="font-bold text-[14px] leading-tight text-slate-900 dark:text-white tracking-tight">
              Pribadi
            </div>
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Tutup Menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Profile Summary */}
      {currentUser && (
        <div className="mx-3 mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border shrink-0 ${getAvatarColorClass(
              currentUser.avatarColor
            )}`}
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
              {currentUser.role}
            </div>
          </div>
        </div>
      )}

      {/* Database Status Ribbon */}
      <div className="px-3.5 py-2 mx-3 mt-3 bg-[#eaf5f1] dark:bg-emerald-950/40 rounded-xl border border-[#c3e6d8] dark:border-emerald-800/60 flex items-center gap-2.5 text-xs">
        <div className={`w-2 h-2 rounded-full ${isGasConnected ? 'bg-[#15856c] animate-pulse' : 'bg-amber-400'}`} />
        <div className="truncate flex-1">
          <div className="font-bold text-[#15856c] dark:text-emerald-300 text-[11px]">
            {isGasConnected ? 'Google Sheets Terhubung' : 'Mode Demo / Lokal'}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {isGasConnected ? 'Auto-sync aktif' : 'Database browser'}
          </div>
        </div>
        <Database className="w-3.5 h-3.5 text-[#15856c] dark:text-emerald-400 shrink-0" />
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-1 pb-1">
          Menu Utama
        </div>
        {menuItems.slice(0, 4).map((item) => {
          const isActive = currentMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#15856c] text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-[#eaf5f1] dark:hover:bg-slate-800 hover:text-[#15856c] dark:hover:text-emerald-300'
              }`}
            >
              <span className={isActive ? 'text-white' : ''}>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-3 pb-1">
          Perencanaan & Akun
        </div>
        {menuItems.slice(4, 8).map((item) => {
          const isActive = currentMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#15856c] text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-[#eaf5f1] dark:hover:bg-slate-800 hover:text-[#15856c] dark:hover:text-emerald-300'
              }`}
            >
              <span className={isActive ? 'text-white' : ''}>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-3 pb-1">
          Laporan & Konfigurasi
        </div>
        {menuItems.slice(8).map((item) => {
          const isActive = currentMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#15856c] text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-[#eaf5f1] dark:hover:bg-slate-800 hover:text-[#15856c] dark:hover:text-emerald-300'
              }`}
            >
              <span className={isActive ? 'text-white' : ''}>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer Branding & Lock */}
      <div className="p-3 border-t border-[#e2ede8] dark:border-slate-800 space-y-2">
        {onLockApp && (
          <button
            onClick={onLockApp}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 text-xs font-semibold transition-colors border border-slate-200/70 dark:border-slate-700/60"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Kunci Aplikasi</span>
          </button>
        )}
        <div className="text-center text-xs text-slate-400">
          <p className="font-mono text-[10px] font-semibold text-[#15856c] dark:text-emerald-400">
            app.keuanganpribadi.web.id
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
