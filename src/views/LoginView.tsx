import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Eye,
  EyeOff,
  Delete,
  Sparkles,
  Wallet,
  AlertCircle,
  Check,
  RotateCcw,
  Users,
  UserPlus,
  ArrowLeft,
  ChevronRight,
  User
} from 'lucide-react';
import { AuthService } from '../services/authService';
import { UserAccount, UserAvatarColor } from '../types/finance';

interface LoginViewProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const getAvatarColorClass = (color: string) => {
  switch (color) {
    case 'rose':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800';
    case 'indigo':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
    case 'amber':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    case 'sky':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-800';
    case 'purple':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-800';
    case 'teal':
      return 'bg-teal-100 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300 border-teal-300 dark:border-teal-800';
    case 'orange':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-800';
    case 'emerald':
    default:
      return 'bg-emerald-100 text-[#15856c] dark:bg-emerald-950/80 dark:text-emerald-300 border-[#a8dec9] dark:border-emerald-800';
  }
};

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [accounts, setAccounts] = useState<UserAccount[]>(() => AuthService.getAccounts());
  const [selectedAccount, setSelectedAccount] = useState<UserAccount | null>(() => {
    const list = AuthService.getAccounts();
    const active = AuthService.getActiveAccount();
    return list.find((a) => a.id === active.id) || list[0] || null;
  });

  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [isTextInputMode, setIsTextInputMode] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  // Modal Tambah Akun Baru
  const [showNewAccountModal, setShowNewAccountModal] = useState<boolean>(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccUsername, setNewAccUsername] = useState('');
  const [newAccRole, setNewAccRole] = useState('Pribadi');
  const [newAccColor, setNewAccColor] = useState<UserAvatarColor>('emerald');
  const [newAccPin, setNewAccPin] = useState('123456');

  // Handle digit input for keypad
  const handleDigit = useCallback(
    (digit: string) => {
      setErrorMsg('');
      if (!selectedAccount) return;

      if (pin.length < 12) {
        const nextPin = pin + digit;
        setPin(nextPin);

        // Jika panjang mencapai 6 digit dan bukan text input, auto submit
        if (nextPin.length === 6 && !isTextInputMode) {
          const success = AuthService.loginWithAccount(selectedAccount.id, nextPin, rememberMe);
          if (success) {
            onLoginSuccess(selectedAccount);
          } else {
            setIsShaking(true);
            setErrorMsg('PIN untuk akun ini salah. Silakan coba lagi.');
            setTimeout(() => {
              setIsShaking(false);
              setPin('');
            }, 600);
          }
        }
      }
    },
    [pin, rememberMe, isTextInputMode, selectedAccount, onLoginSuccess]
  );

  const handleBackspace = useCallback(() => {
    setErrorMsg('');
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setErrorMsg('');
    setPin('');
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedAccount) {
      setErrorMsg('Pilih akun terlebih dahulu.');
      return;
    }
    if (!pin) {
      setErrorMsg('Silakan masukkan PIN keamanan.');
      return;
    }

    const success = AuthService.loginWithAccount(selectedAccount.id, pin, rememberMe);
    if (success) {
      onLoginSuccess(selectedAccount);
    } else {
      setIsShaking(true);
      setErrorMsg('PIN yang Anda masukkan tidak cocok dengan akun ini.');
      setTimeout(() => {
        setIsShaking(false);
      }, 600);
    }
  };

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showResetModal || showNewAccountModal) return;

      if (selectedAccount && !isTextInputMode) {
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          handleDigit(e.key);
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          handleBackspace();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleClear();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleBackspace, handleClear, isTextInputMode, showResetModal, showNewAccountModal, selectedAccount]);

  const handleResetToDefault = () => {
    if (!selectedAccount) return;
    AuthService.resetAccountPin(selectedAccount.id, '123456');
    setResetSuccess(true);
    setPin('123456');
    setTimeout(() => {
      setShowResetModal(false);
      setResetSuccess(false);
      setErrorMsg('');
    }, 1200);
  };

  const handleCreateNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;

    const created = AuthService.createAccount(
      newAccName,
      newAccUsername || newAccName.toLowerCase().replace(/\s+/g, '_'),
      newAccRole,
      newAccColor,
      newAccPin || '123456'
    );

    const updatedList = AuthService.getAccounts();
    setAccounts(updatedList);
    setSelectedAccount(created);
    setShowNewAccountModal(false);
    setNewAccName('');
    setNewAccUsername('');
    setPin('');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-fintech-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div
          className={`bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 rounded-3xl shadow-xl p-6 sm:p-8 transition-transform duration-200 ${
            isShaking ? 'translate-x-[-8px] animate-bounce' : ''
          }`}
        >
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#15856c]/10 text-[#15856c] dark:bg-emerald-950/60 dark:text-emerald-400 mb-3 shadow-inner">
              <Wallet className="w-7 h-7" />
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#15856c] dark:text-emerald-400 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Proteksi Multi-Akun DompetKu</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              DompetKu
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {selectedAccount
                ? 'Masukkan PIN untuk membuka dompet Anda'
                : 'Pilih profil akun untuk masuk ke dashboard'}
            </p>
          </div>

          {/* Account Picker Strip */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#15856c]" />
                <span>Pilih Profil Pengguna:</span>
              </span>
              <button
                type="button"
                onClick={() => setShowNewAccountModal(true)}
                className="text-xs font-semibold text-[#15856c] dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Akun Baru</span>
              </button>
            </div>

            {/* Account List Grid */}
            <div className="grid grid-cols-3 gap-2">
              {accounts.map((acc) => {
                const isSelected = selectedAccount?.id === acc.id;
                const colorCls = getAvatarColorClass(acc.avatarColor);

                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setSelectedAccount(acc);
                      setPin('');
                      setErrorMsg('');
                    }}
                    className={`flex flex-col items-center p-2.5 rounded-2xl border transition-all text-center group ${
                      isSelected
                        ? 'border-[#15856c] bg-[#eaf5f1] dark:bg-emerald-950/40 ring-2 ring-[#15856c]/30 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm mb-1.5 border shadow-xs transition-transform group-hover:scale-105 ${colorCls}`}
                    >
                      {acc.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate w-full">
                      {acc.name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate w-full mt-0.5">
                      {acc.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Account Banner */}
          {selectedAccount && (
            <div className="mb-5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border ${getAvatarColorClass(
                    selectedAccount.avatarColor
                  )}`}
                >
                  {selectedAccount.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{selectedAccount.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-500 border border-slate-200 dark:border-slate-600 font-normal">
                      @{selectedAccount.username}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedAccount.role}
                  </div>
                </div>
              </div>
              <div className="text-[10px] font-semibold text-[#15856c] dark:text-emerald-400 bg-[#eaf5f1] dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                Siap Masuk
              </div>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center justify-center gap-2 mb-5 text-xs">
            <button
              type="button"
              onClick={() => {
                setIsTextInputMode(false);
                setPin('');
                setErrorMsg('');
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                !isTextInputMode
                  ? 'bg-[#15856c] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Keypad PIN
            </button>
            <button
              type="button"
              onClick={() => {
                setIsTextInputMode(true);
                setPin('');
                setErrorMsg('');
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                isTextInputMode
                  ? 'bg-[#15856c] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Input Keyboard
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-medium animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* PIN Input & Keypad */}
          {!isTextInputMode ? (
            <div>
              {/* 6 Dots Indicator */}
              <div className="flex justify-center items-center gap-3 sm:gap-4 mb-5 py-1">
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const isFilled = index < pin.length;
                  return (
                    <div
                      key={index}
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-200 ${
                        isFilled
                          ? 'bg-[#15856c] scale-110 shadow-sm'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Number Keypad */}
              <div className="grid grid-cols-3 gap-2.5 max-w-[270px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleDigit(num)}
                    className="h-12 sm:h-13 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-[#eaf5f1] dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xl sm:text-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200/80 dark:border-slate-700/60 shadow-xs"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className="h-12 sm:h-13 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-xs flex items-center justify-center transition-all active:scale-95 border border-transparent hover:bg-slate-200"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleDigit('0')}
                  className="h-12 sm:h-13 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-[#eaf5f1] dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xl sm:text-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200/80 dark:border-slate-700/60 shadow-xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-12 sm:h-13 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-all active:scale-95 border border-transparent hover:bg-slate-200"
                  aria-label="Hapus satu angka"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              {/* Enter Button if PIN length >= 4 */}
              {pin.length >= 4 && (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="mt-4 w-full py-3 bg-[#15856c] hover:bg-[#116c58] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Buka Dashboard {selectedAccount?.name}</span>
                </button>
              )}
            </div>
          ) : (
            /* Mode Input Keyboard */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  PIN Akun {selectedAccount?.name}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => {
                      setErrorMsg('');
                      setPin(e.target.value);
                    }}
                    placeholder="Masukkan PIN (default 123456)..."
                    autoFocus
                    className="w-full pl-4 pr-11 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-base tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-[#15856c] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#15856c] hover:bg-[#116c58] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
              >
                <Unlock className="w-4 h-4" />
                <span>Buka Dashboard {selectedAccount?.name}</span>
              </button>
            </form>
          )}

          {/* Remember me & Options */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#15856c] focus:ring-[#15856c] accent-[#15856c]"
              />
              <span>Ingat di perangkat ini</span>
            </label>

            {selectedAccount && (
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="text-[#15856c] dark:text-emerald-400 hover:underline font-semibold"
              >
                Lupa PIN {selectedAccount.name}?
              </button>
            )}
          </div>

          {/* Default PIN Helper Tip */}
          <div className="mt-4 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-[#15856c] mt-0.5" />
            <div>
              <span className="font-bold">Info Multi-Akun:</span> PIN default setiap akun adalah{' '}
              <span className="font-mono font-bold bg-white dark:bg-emerald-900 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-[#15856c] dark:text-emerald-200">
                123456
              </span>
              . Setiap akun memiliki catatan transaksi, saldo rekening, dan budget yang terpisah secara aman.
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-4 flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3" />
          <span>Setiap akun memiliki penyimpanan lokal terenkripsi di browser</span>
        </p>
      </div>

      {/* Modal Tambah Akun Baru */}
      {showNewAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-md animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#15856c]/10 text-[#15856c] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tambah Akun Pengguna Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewAccountModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateNewAccount} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Akun / Panggilan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi, Istri, Toko Online"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#15856c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="budi_finance"
                  value={newAccUsername}
                  onChange={(e) => setNewAccUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-[#15856c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Peran / Keterangan Akun
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Tabungan Bersama, Usaha Sampingan, Anak"
                  value={newAccRole}
                  onChange={(e) => setNewAccRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#15856c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Warna Avatar
                </label>
                <div className="flex items-center gap-2">
                  {(['emerald', 'rose', 'indigo', 'amber', 'sky', 'purple', 'teal', 'orange'] as UserAvatarColor[]).map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewAccColor(c)}
                        className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${
                          newAccColor === c ? 'scale-110 shadow-sm border-slate-900 dark:border-white' : 'border-transparent'
                        } ${getAvatarColorClass(c)}`}
                      >
                        {newAccColor === c && <Check className="w-3.5 h-3.5" />}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  PIN Keamanan Akun
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 4 digit (default 123456)"
                  value={newAccPin}
                  onChange={(e) => setNewAccPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-[#15856c]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewAccountModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#15856c] hover:bg-[#116c58] text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan & Pilih Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {showResetModal && selectedAccount && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-center text-slate-900 dark:text-white">
              Reset PIN Akun {selectedAccount.name}?
            </h3>
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-1">
              PIN akun <strong>{selectedAccount.name}</strong> akan dikembalikan ke kode bawaan:{' '}
              <strong className="text-slate-900 dark:text-white font-mono">123456</strong>.
            </p>

            {resetSuccess ? (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                <span>PIN berhasil direset ke 123456!</span>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="py-2.5 px-4 rounded-xl bg-[#15856c] hover:bg-[#116c58] text-white text-xs font-bold shadow-xs"
                >
                  Ya, Reset PIN
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
