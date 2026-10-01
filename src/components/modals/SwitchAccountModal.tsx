import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Eye,
  EyeOff,
  Delete,
  AlertCircle,
  X,
  RotateCcw,
  Check
} from 'lucide-react';
import { UserAccount } from '../../types/finance';
import { AuthService } from '../../services/authService';
import { getAvatarColorClass } from '../../utils/userColors';

interface SwitchAccountModalProps {
  isOpen: boolean;
  targetAccount: UserAccount | null;
  onClose: () => void;
  onSuccess: (account: UserAccount) => void;
}

export const SwitchAccountModal: React.FC<SwitchAccountModalProps> = ({
  isOpen,
  targetAccount,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isTextInput, setIsTextInput] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg('');
      setIsShaking(false);
      setShowResetModal(false);
    }
  }, [isOpen, targetAccount]);

  const verifyPin = useCallback(
    (enteredPin: string) => {
      if (!targetAccount) return;
      if (enteredPin.trim() === targetAccount.pin.trim()) {
        onSuccess(targetAccount);
        onClose();
      } else {
        setIsShaking(true);
        setErrorMsg(`PIN untuk akun ${targetAccount.name} salah. Coba lagi.`);
        setTimeout(() => {
          setIsShaking(false);
          setPin('');
        }, 600);
      }
    },
    [targetAccount, onSuccess, onClose]
  );

  const handleDigit = useCallback(
    (digit: string) => {
      setErrorMsg('');
      if (pin.length < 12) {
        const nextPin = pin + digit;
        setPin(nextPin);

        if (nextPin.length === 6 && !isTextInput) {
          verifyPin(nextPin);
        }
      }
    },
    [pin, isTextInput, verifyPin]
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
    if (!pin) {
      setErrorMsg('Silakan masukkan PIN keamanan.');
      return;
    }
    verifyPin(pin);
  };

  // Keyboard listener
  useEffect(() => {
    if (!isOpen || showResetModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTextInput) {
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          handleDigit(e.key);
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          handleBackspace();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isTextInput, showResetModal, handleDigit, handleBackspace, onClose, pin]);

  if (!isOpen || !targetAccount) return null;

  const colorCls = getAvatarColorClass(targetAccount.avatarColor);

  const handleResetPin = () => {
    AuthService.resetAccountPin(targetAccount.id, '123456');
    setResetSuccess(true);
    setPin('123456');
    setTimeout(() => {
      setShowResetModal(false);
      setResetSuccess(false);
      setErrorMsg('');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 w-full max-w-sm transition-transform duration-200 ${
          isShaking ? 'translate-x-[-8px] animate-bounce' : 'animate-scaleUp'
        }`}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#15856c] dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Verifikasi Privasi Akun</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Profile Banner */}
        <div className="text-center mb-5">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-2.5 border shadow-sm ${colorCls}`}
          >
            {targetAccount.name.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Beralih ke {targetAccount.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Masukkan PIN akun <strong>{targetAccount.name}</strong> untuk melihat data finansialnya
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PIN Input Keypad or Text Input */}
        {!isTextInput ? (
          <div>
            {/* 6 Dots Indicator */}
            <div className="flex justify-center items-center gap-3 sm:gap-3.5 mb-5 py-1">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const isFilled = idx < pin.length;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                      isFilled
                        ? 'bg-[#15856c] scale-110 shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                );
              })}
            </div>

            {/* Keypad Buttons */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigit(num)}
                  className="h-11 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-[#eaf5f1] dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xl flex items-center justify-center transition-all active:scale-95 border border-slate-200/80 dark:border-slate-700/60 shadow-xs"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs flex items-center justify-center transition-all active:scale-95 hover:bg-slate-200"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="h-11 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-[#eaf5f1] dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xl flex items-center justify-center transition-all active:scale-95 border border-slate-200/80 dark:border-slate-700/60 shadow-xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-all active:scale-95 hover:bg-slate-200"
                aria-label="Hapus satu angka"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            {pin.length >= 4 && (
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="mt-4 w-full py-2.5 bg-[#15856c] hover:bg-[#116c58] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Buka Profil {targetAccount.name}</span>
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={pin}
                onChange={(e) => {
                  setErrorMsg('');
                  setPin(e.target.value);
                }}
                placeholder="Masukkan PIN..."
                autoFocus
                className="w-full pl-4 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#15856c]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-[#15856c] hover:bg-[#116c58] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Verifikasi & Masuk</span>
            </button>
          </form>
        )}

        {/* Footer controls */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={() => {
              setIsTextInput(!isTextInput);
              setPin('');
              setErrorMsg('');
            }}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            {isTextInput ? 'Gunakan Keypad' : 'Ketik Manual'}
          </button>
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="text-[#15856c] dark:text-emerald-400 hover:underline font-semibold"
          >
            Lupa PIN?
          </button>
        </div>
      </div>

      {/* Reset PIN Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 rounded-2xl shadow-2xl p-5 w-full max-w-xs animate-scaleUp">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center mx-auto mb-2.5">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-center text-slate-900 dark:text-white">
              Reset PIN {targetAccount.name}?
            </h4>
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-1">
              PIN akan dikembalikan ke kode bawaan:{' '}
              <strong className="font-mono text-slate-900 dark:text-white">123456</strong>.
            </p>

            {resetSuccess ? (
              <div className="mt-3 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>PIN direset ke 123456</span>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleResetPin}
                  className="py-2 rounded-xl bg-[#15856c] hover:bg-[#116c58] text-white text-xs font-bold shadow-xs"
                >
                  Reset PIN
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
