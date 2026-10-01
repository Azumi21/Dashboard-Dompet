import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  HandCoins,
  Receipt,
  Plus,
  ArrowLeftRight,
  PieChart,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import {
  AppData,
  PeriodFilter,
  Transaction,
  TransactionType,
  NavigationMenu
} from '../types/finance';
import {
  formatRupiah,
  formatDateIndo,
  calculateAccountBalances
} from '../utils/formatters';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardViewProps {
  appData: AppData;
  onOpenTransactionModal: (type?: TransactionType) => void;
  onOpenBudgetModal: () => void;
  onNavigate: (menu: NavigationMenu) => void;
  isDarkMode: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  appData,
  onOpenTransactionModal,
  onOpenBudgetModal,
  onNavigate,
  isDarkMode,
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('bulan_ini');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // 1. Calculate dynamic account balances
  const accountsWithBalances = useMemo(() => {
    return calculateAccountBalances(appData.rekening, appData.transaksi);
  }, [appData.rekening, appData.transaksi]);

  const totalSaldoSemua = useMemo(() => {
    return accountsWithBalances
      .filter((r) => r.status === 'Aktif')
      .reduce((sum, r) => sum + (r.saldo_sekarang || 0), 0);
  }, [accountsWithBalances]);

  // 2. Filter transactions based on selected period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return appData.transaksi.filter((t) => {
      if (!t.tanggal) return false;
      const tDate = new Date(t.tanggal);

      if (period === 'hari_ini') {
        return t.tanggal === todayStr;
      }
      if (period === 'minggu_ini') {
        const firstDayOfWeek = new Date(now);
        const day = now.getDay() || 7;
        firstDayOfWeek.setDate(now.getDate() - day + 1);
        firstDayOfWeek.setHours(0, 0, 0, 0);
        return tDate >= firstDayOfWeek && tDate <= now;
      }
      if (period === 'bulan_ini') {
        return (
          tDate.getMonth() === now.getMonth() &&
          tDate.getFullYear() === now.getFullYear()
        );
      }
      if (period === 'tahun_ini') {
        return tDate.getFullYear() === now.getFullYear();
      }
      if (period === 'custom') {
        if (customStart && t.tanggal < customStart) return false;
        if (customEnd && t.tanggal > customEnd) return false;
        return true;
      }
      return true;
    });
  }, [appData.transaksi, period, customStart, customEnd]);

  // 3. Totals for selected period
  const periodPemasukan = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.jenis === 'Pemasukan')
      .reduce((sum, t) => sum + Number(t.nominal || 0), 0);
  }, [filteredTransactions]);

  const periodPengeluaran = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.jenis === 'Pengeluaran')
      .reduce((sum, t) => sum + Number(t.nominal || 0), 0);
  }, [filteredTransactions]);

  const netCashFlow = periodPemasukan - periodPengeluaran;

  const totalTabungan = useMemo(() => {
    return appData.tabungan
      .filter((t) => t.status !== 'Dibatalkan')
      .reduce((sum, t) => sum + Number(t.saldo_awal || 0), 0);
  }, [appData.tabungan]);

  const totalUtangAktif = useMemo(() => {
    return appData.utang
      .filter((u) => u.status !== 'Lunas')
      .reduce((sum, u) => sum + Number(u.nominal || 0), 0);
  }, [appData.utang]);

  const totalPiutangAktif = useMemo(() => {
    return appData.piutang
      .filter((p) => p.status !== 'Lunas')
      .reduce((sum, p) => sum + Number(p.nominal || 0), 0);
  }, [appData.piutang]);

  // 4. Budget calculations
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const budgetsWithProgress = useMemo(() => {
    const currentMonthExpenses = appData.transaksi.filter((t) => {
      if (t.jenis !== 'Pengeluaran' || !t.tanggal) return false;
      const d = new Date(t.tanggal);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    });

    return appData.budget
      .filter((b) => b.status === 'Aktif')
      .map((b) => {
        const spent = currentMonthExpenses
          .filter((t) => t.kategori && t.kategori.toLowerCase() === b.kategori.toLowerCase())
          .reduce((sum, t) => sum + Number(t.nominal || 0), 0);

        const sisa = b.nominal_budget - spent;
        const persentase = b.nominal_budget > 0 ? Math.round((spent / b.nominal_budget) * 100) : 0;

        return {
          ...b,
          terpakai: spent,
          sisa,
          persentase,
        };
      });
  }, [appData.budget, appData.transaksi, currentMonth, currentYear]);

  // 5. Chart 1: Cash Flow timeline with Template Colors (Teal #15856c & Rose)
  const cashFlowChartData = useMemo(() => {
    const sorted = [...filteredTransactions].sort((a, b) => (a.tanggal > b.tanggal ? 1 : -1));
    const datesMap: { [date: string]: { inc: number; exp: number } } = {};

    sorted.forEach((t) => {
      if (!t.tanggal) return;
      if (!datesMap[t.tanggal]) {
        datesMap[t.tanggal] = { inc: 0, exp: 0 };
      }
      if (t.jenis === 'Pemasukan') datesMap[t.tanggal].inc += t.nominal;
      if (t.jenis === 'Pengeluaran') datesMap[t.tanggal].exp += t.nominal;
    });

    const labels = Object.keys(datesMap).map((d) => formatDateIndo(d));
    const incomes = Object.values(datesMap).map((v) => v.inc);
    const expenses = Object.values(datesMap).map((v) => v.exp);

    return {
      labels: labels.length > 0 ? labels : ['Belum ada transaksi'],
      datasets: [
        {
          label: 'Pemasukan',
          data: incomes.length > 0 ? incomes : [0],
          backgroundColor: '#15856c',
          borderColor: '#15856c',
          borderRadius: 6,
        },
        {
          label: 'Pengeluaran',
          data: expenses.length > 0 ? expenses : [0],
          backgroundColor: 'rgba(244, 63, 94, 0.8)',
          borderColor: '#f43f5e',
          borderRadius: 6,
        },
      ],
    };
  }, [filteredTransactions]);

  // 6. Chart 2: Category Expense Doughnut
  const categoryChartData = useMemo(() => {
    const expenseMap: { [cat: string]: number } = {};
    filteredTransactions
      .filter((t) => t.jenis === 'Pengeluaran')
      .forEach((t) => {
        const cat = t.kategori || 'Lainnya';
        expenseMap[cat] = (expenseMap[cat] || 0) + Number(t.nominal || 0);
      });

    const labels = Object.keys(expenseMap);
    const data = Object.values(expenseMap);
    const backgroundColors = [
      '#15856c', '#1ba385', '#2ec4a0', '#f43f5e', '#f97316',
      '#eab308', '#06b6d4', '#3b82f6', '#8b5cf6', '#64748b'
    ];

    if (labels.length === 0) {
      return {
        labels: ['Belum ada pengeluaran'],
        datasets: [{ data: [1], backgroundColor: ['#e2ede8'] }]
      };
    }

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: isDarkMode ? '#0f172a' : '#ffffff',
        },
      ],
    };
  }, [filteredTransactions, isDarkMode]);

  // 7. Chart 3: Saldo Trend line
  const saldoTrendChartData = useMemo(() => {
    const sorted = [...appData.transaksi].sort((a, b) => (a.tanggal > b.tanggal ? 1 : -1));
    const dates: string[] = [];
    const balancePoints: number[] = [];

    let running = appData.rekening.reduce((sum, r) => sum + Number(r.saldo_awal || 0), 0);

    dates.push('Awal');
    balancePoints.push(running);

    sorted.slice(-15).forEach((t) => {
      if (t.jenis === 'Pemasukan') running += Number(t.nominal || 0);
      else if (t.jenis === 'Pengeluaran') running -= Number(t.nominal || 0);
      dates.push(formatDateIndo(t.tanggal));
      balancePoints.push(running);
    });

    return {
      labels: dates,
      datasets: [
        {
          label: 'Total Saldo',
          data: balancePoints,
          borderColor: '#15856c',
          backgroundColor: 'rgba(21, 133, 108, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [appData.transaksi, appData.rekening]);

  const recentTransactions = useMemo(() => {
    return [...appData.transaksi]
      .sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1))
      .slice(0, 6);
  }, [appData.transaksi]);

  // Aggregated budget totals for the floating budget widget
  const totalBudgetedAmount = budgetsWithProgress.reduce((sum, b) => sum + b.nominal_budget, 0) || 6250000;
  const totalSpentAmount = budgetsWithProgress.reduce((sum, b) => sum + (b.terpakai || 0), 0) || 4250000;
  const overallBudgetPct = Math.round((totalSpentAmount / totalBudgetedAmount) * 100);

  return (
    <div className="space-y-8">
      {/* ============================================================== */}
      {/* HERO SECTION MATCHING EXACT TEMPLATE IN image.png */}
      {/* ============================================================== */}
      <section className="relative overflow-hidden rounded-3xl p-6 lg:p-10 border border-[#d8e8e1] dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-fintech">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Headline, Description & Features */}
          <div className="lg:col-span-6 space-y-5">
            {/* Kicker Tag matching image.png */}
            <div className="inline-flex items-center gap-2 text-xs font-extrabold tracking-wider text-[#15856c] dark:text-emerald-400 uppercase font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SOLUSI KEUANGAN PRIBADI TERBAIK</span>
            </div>

            {/* Headline matching image.png */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
              Kelola Keuangan Pribadi Jadi{' '}
              <span className="text-[#15856c] dark:text-emerald-400">Mudah & Cerdas</span>
            </h1>

            {/* Subtitle matching image.png */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              Pantau, kelola, dan tingkatkan keuangan pribadi Anda dalam satu aplikasi terbaik. Terhubung langsung dengan Google Spreadsheet tanpa biaya server tambahan.
            </p>

            {/* Bullet Points with Mint Checkmark Badges matching image.png */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                <div className="w-5 h-5 rounded-full bg-[#eaf5f1] dark:bg-emerald-950/70 text-[#15856c] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>Data terenkripsi dan tersimpan di Google Spreadsheet pribadi Anda</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                <div className="w-5 h-5 rounded-full bg-[#eaf5f1] dark:bg-emerald-950/70 text-[#15856c] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>Sinkronisasi otomatis di semua perangkat secara real-time</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                <div className="w-5 h-5 rounded-full bg-[#eaf5f1] dark:bg-emerald-950/70 text-[#15856c] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>Penggunaan mudah, modern, dan visualisasi grafik berwarna</span>
              </div>
            </div>

            {/* Primary Action Buttons matching image.png */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={() => onOpenTransactionModal('Pengeluaran')}
                className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#15856c] hover:bg-[#116c58] rounded-xl shadow-md shadow-[#15856c]/25 transition-all transform active:scale-95"
              >
                <span>Mulai Catat Transaksi</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('pengaturan')}
                className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-[#eaf5f1] dark:hover:bg-slate-700 rounded-xl border border-[#d8e8e1] dark:border-slate-700 transition-colors"
              >
                <span>Setup Spreadsheet</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Trust Metrics matching bottom-left of image.png */}
            <div className="pt-4 grid grid-cols-3 gap-3 max-w-lg">
              <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-[#e2ede8] dark:border-slate-700 text-center shadow-xs">
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  28.5K+
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Pengguna aktif</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-[#e2ede8] dark:border-slate-700 text-center shadow-xs">
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  4.8/5
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Rating kepuasan</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-[#e2ede8] dark:border-slate-700 text-center shadow-xs">
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  99.9%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Uptime sistem</div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive App Card Mockup matching image.png */}
          <div className="lg:col-span-6 relative">
            {/* The Main Application Card Window */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5">
              {/* Window Header Dots & Address bar matching image.png */}
              <div className="flex items-center gap-3 pb-3 border-b border-[#eef5f2] dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#f87171]" />
                  <span className="w-3 h-3 rounded-full bg-[#fbbf24]" />
                  <span className="w-3 h-3 rounded-full bg-[#34d399]" />
                </div>
                <div className="flex-1 text-center">
                  <div className="inline-block px-4 py-1 text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    app.keuanganpribadi.web.id
                  </div>
                </div>
              </div>

              {/* Total Saldo Display matching image.png */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    TOTAL SALDO
                  </span>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#15856c] bg-[#eaf5f1] dark:bg-emerald-950/60 border border-[#c3e6d8] dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#15856c] animate-pulse" />
                    <span>LIVE</span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
                    {formatRupiah(totalSaldoSemua)}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {formatDateIndo(new Date().toISOString().split('T')[0])}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="font-bold text-[#15856c] dark:text-emerald-400">
                    +8,2% ↗
                  </span>
                  <span className="text-slate-400">30 hari terakhir</span>
                </div>
              </div>

              {/* Cash Flow Mini Chart Container matching image.png */}
              <div className="p-4 rounded-2xl bg-[#f6faf8] dark:bg-slate-800/50 border border-[#e2ede8] dark:border-slate-700/60">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3 font-mono font-semibold">
                  <span>ALIRAN KAS — 7 HARI</span>
                  <span>IDR</span>
                </div>

                {/* 7-day Bar Visuals in Signature Teal #15856c */}
                <div className="flex items-end justify-between gap-2 h-24 pt-2">
                  {[
                    { day: 'S', height: '55%', amount: '1.2M' },
                    { day: 'M', height: '80%', amount: '2.5M' },
                    { day: 'T', height: '40%', amount: '800K' },
                    { day: 'W', height: '90%', amount: '3.1M' },
                    { day: 'T', height: '100%', amount: '3.8M' },
                    { day: 'F', height: '70%', amount: '2.2M' },
                    { day: 'S', height: '85%', amount: '2.8M' },
                  ].map((bar, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div
                        className="w-full bg-[#15856c] rounded-md transition-all group-hover:bg-[#116c58] cursor-pointer"
                        style={{ height: bar.height }}
                        title={`${bar.day}: ${bar.amount}`}
                      />
                      <span className="text-[10px] font-bold text-slate-400">{bar.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini Transaction List matching image.png */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1">
                  <span>TRANSAKSI</span>
                  <div className="flex gap-4">
                    <span>TIPE</span>
                    <span>JUMLAH</span>
                  </div>
                </div>

                {/* Rows */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#eaf5f1]/60 transition-colors">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Gaji Bulanan</span>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-slate-400 font-mono">PEMASUKAN</span>
                      <span className="font-bold text-[#15856c] font-mono">↗ +8.500.000</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#eaf5f1]/60 transition-colors">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Belanja Bulanan</span>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-slate-400 font-mono">IDR</span>
                      <span className="font-bold text-rose-500 font-mono">↘ -1.245.000</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#eaf5f1]/60 transition-colors">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Tabungan Dana Darurat</span>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-slate-400 font-mono">TRANSFER</span>
                      <span className="font-bold text-blue-500 font-mono">↗ +1.500.000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Widget: Anggaran Bulan Ini matching bottom-right of image.png */}
            <div className="absolute -bottom-6 -right-2 sm:-right-4 w-64 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-[#d8e8e1] dark:border-slate-700 shadow-xl space-y-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  ANGGARAN BULAN INI
                </span>
                <span className="text-xs font-bold text-[#15856c] dark:text-emerald-400">
                  {overallBudgetPct}%
                </span>
              </div>

              {/* Progress bar in signature teal */}
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#15856c] rounded-full transition-all"
                  style={{ width: `${Math.min(100, overallBudgetPct)}%` }}
                />
              </div>

              <div className="pt-0.5">
                <div className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                  {formatRupiah(totalSpentAmount)}
                </div>
                <div className="text-[10px] text-slate-400">
                  dari {formatRupiah(totalBudgetedAmount)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* FILTER CONTROLS & SUMMARY CARDS GRID */}
      {/* ============================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-xs">
        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenTransactionModal('Pemasukan')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#15856c] hover:bg-[#116c58] rounded-xl shadow-xs transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>+ Pemasukan</span>
          </button>
          <button
            onClick={() => onOpenTransactionModal('Pengeluaran')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+ Pengeluaran</span>
          </button>
          <button
            onClick={() => onOpenTransactionModal('Transfer')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Transfer</span>
          </button>
          <button
            onClick={onOpenBudgetModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-[#eaf5f1] dark:bg-slate-800 hover:bg-[#d8ece4] rounded-xl transition-colors border border-[#c3e6d8] dark:border-slate-700"
          >
            <PieChart className="w-4 h-4 text-[#15856c]" />
            <span>+ Atur Budget</span>
          </button>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#f3f8f6] dark:bg-slate-800/80 rounded-xl border border-[#d8e8e1] dark:border-slate-700">
          {(
            [
              { id: 'hari_ini', label: 'Hari Ini' },
              { id: 'minggu_ini', label: 'Minggu Ini' },
              { id: 'bulan_ini', label: 'Bulan Ini' },
              { id: 'tahun_ini', label: 'Tahun Ini' },
              { id: 'custom', label: 'Kustom' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                period === tab.id
                  ? 'bg-white dark:bg-slate-700 text-[#15856c] dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {period === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-[#d8e8e1] dark:border-slate-800 text-xs">
          <span className="font-semibold text-slate-600 dark:text-slate-400">Rentang Tanggal:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
          />
          <span className="text-slate-400">s/d</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
          />
        </div>
      )}

      {/* SUMMARY CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saldo */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Saldo Semua
            </span>
            <div className="p-2.5 rounded-xl bg-[#eaf5f1] dark:bg-emerald-950/60 text-[#15856c]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatRupiah(totalSaldoSemua)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Dari {accountsWithBalances.filter((a) => a.status === 'Aktif').length} rekening aktif
            </p>
          </div>
        </div>

        {/* Total Pemasukan Periode */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Pemasukan
            </span>
            <div className="p-2.5 rounded-xl bg-[#eaf5f1] dark:bg-emerald-950/60 text-[#15856c]">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#15856c] dark:text-emerald-400 tracking-tight">
              {formatRupiah(periodPemasukan)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {filteredTransactions.filter((t) => t.jenis === 'Pemasukan').length} transaksi periode ini
            </p>
          </div>
        </div>

        {/* Total Pengeluaran Periode */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Pengeluaran
            </span>
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {formatRupiah(periodPengeluaran)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {filteredTransactions.filter((t) => t.jenis === 'Pengeluaran').length} transaksi periode ini
            </p>
          </div>
        </div>

        {/* Sisa Cash Flow */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sisa Cash Flow
            </span>
            <div
              className={`p-2.5 rounded-xl ${
                netCashFlow >= 0
                  ? 'bg-[#eaf5f1] dark:bg-emerald-950/60 text-[#15856c]'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600'
              }`}
            >
              {netCashFlow >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-black tracking-tight ${
                netCashFlow >= 0
                  ? 'text-[#15856c] dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatRupiah(netCashFlow)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {netCashFlow >= 0 ? 'Surplus finansial' : 'Defisit finansial'}
            </p>
          </div>
        </div>
      </div>

      {/* SECOND ROW CARDS: Tabungan, Utang, Piutang */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Tabungan */}
        <div
          onClick={() => onNavigate('tabungan')}
          className="cursor-pointer p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-xs hover:border-[#15856c]/50 transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Tabungan Terkumpul
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {formatRupiah(totalTabungan)}
            </div>
            <p className="text-[11px] text-slate-400">
              {appData.tabungan.filter((t) => t.status === 'Berjalan').length} target aktif
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#eaf5f1] dark:bg-teal-950/60 text-[#15856c]">
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>

        {/* Total Utang */}
        <div
          onClick={() => onNavigate('utang_piutang')}
          className="cursor-pointer p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-xs hover:border-rose-500/50 transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Utang Belum Lunas
            </span>
            <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {formatRupiah(totalUtangAktif)}
            </div>
            <p className="text-[11px] text-slate-400">
              {appData.utang.filter((u) => u.status !== 'Lunas').length} kewajiban aktif
            </p>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
            <HandCoins className="w-5 h-5" />
          </div>
        </div>

        {/* Total Piutang */}
        <div
          onClick={() => onNavigate('utang_piutang')}
          className="cursor-pointer p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-xs hover:border-blue-500/50 transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Piutang Belum Diterima
            </span>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {formatRupiah(totalPiutangAktif)}
            </div>
            <p className="text-[11px] text-slate-400">
              {appData.piutang.filter((p) => p.status !== 'Lunas').length} tagihan aktif
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
            <HandCoins className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* CHARTS GRID 1: Cashflow Timeline & Category Expense */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Timeline Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#eef5f2] dark:border-slate-800 mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Grafik Arus Kas (Pemasukan vs Pengeluaran)
              </h3>
              <p className="text-xs text-slate-500">Berdasarkan tanggal pada periode terpilih</p>
            </div>
          </div>
          <div className="h-64">
            <Bar
              data={cashFlowChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: { color: isDarkMode ? '#cbd5e1' : '#475569', font: { size: 11, weight: 'bold' } },
                  },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => ` ${ctx.dataset.label}: ${formatRupiah(Number(ctx.raw))}`,
                    },
                  },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: isDarkMode ? '#94a3b8' : '#64748b', font: { size: 10 } },
                  },
                  y: {
                    grid: { color: isDarkMode ? '#1e293b' : '#f1f5f9' },
                    ticks: {
                      color: isDarkMode ? '#94a3b8' : '#64748b',
                      font: { size: 10 },
                      callback: (v) => formatRupiah(Number(v)).replace(',00', ''),
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Category Expense Doughnut Chart */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#eef5f2] dark:border-slate-800 mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Pengeluaran per Kategori
              </h3>
            </div>
            <div className="h-52 relative flex items-center justify-center">
              <Doughnut
                data={categoryChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        boxWidth: 10,
                        color: isDarkMode ? '#cbd5e1' : '#475569',
                        font: { size: 10 },
                      },
                    },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => ` ${ctx.label}: ${formatRupiah(Number(ctx.raw))}`,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
          <div className="pt-3 border-t border-[#eef5f2] dark:border-slate-800 text-center">
            <span className="text-xs text-slate-500">
              Total Pengeluaran: <strong className="text-slate-800 dark:text-slate-200">{formatRupiah(periodPengeluaran)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* CHARTS GRID 2: Saldo Trend & Budget Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Perkembangan Saldo */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#eef5f2] dark:border-slate-800 mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Perkembangan Saldo Kumulatif
              </h3>
              <p className="text-xs text-slate-500">Estimasi posisi saldo dari waktu ke waktu</p>
            </div>
          </div>
          <div className="h-60">
            <Line
              data={saldoTrendChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => ` Saldo: ${formatRupiah(Number(ctx.raw))}`,
                    },
                  },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: isDarkMode ? '#94a3b8' : '#64748b', font: { size: 10 } },
                  },
                  y: {
                    grid: { color: isDarkMode ? '#1e293b' : '#f1f5f9' },
                    ticks: {
                      color: isDarkMode ? '#94a3b8' : '#64748b',
                      font: { size: 10 },
                      callback: (v) => formatRupiah(Number(v)).replace(',00', ''),
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Budget Progress Status */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#eef5f2] dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  Pengawasan Budget Bulan Ini ({currentMonth}/{currentYear})
                </h3>
                <p className="text-xs text-slate-500">Batas pengeluaran per pos kategori</p>
              </div>
              <button
                onClick={() => onNavigate('budget')}
                className="text-xs text-[#15856c] dark:text-emerald-400 hover:underline font-bold flex items-center gap-1"
              >
                <span>Kelola</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {budgetsWithProgress.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada budget aktif untuk bulan ini. Klik &quot;+ Atur Budget&quot; untuk menambahkan.
              </div>
            ) : (
              <div className="space-y-4">
                {budgetsWithProgress.map((b) => {
                  const pct = b.persentase || 0;
                  let barColor = 'bg-[#15856c]';
                  let statusText = 'Normal';
                  let statusBadgeColor = 'text-[#15856c] bg-[#eaf5f1] dark:bg-emerald-950/50';

                  if (pct > 100) {
                    barColor = 'bg-red-600';
                    statusText = 'OVER BUDGET!';
                    statusBadgeColor = 'text-red-600 bg-red-50 dark:bg-red-950/50 font-bold';
                  } else if (pct >= 90) {
                    barColor = 'bg-rose-500';
                    statusText = 'Hampir Habis';
                    statusBadgeColor = 'text-rose-600 bg-rose-50 dark:bg-rose-950/50';
                  } else if (pct >= 70) {
                    barColor = 'bg-amber-500';
                    statusText = 'Waspada';
                    statusBadgeColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/50';
                  }

                  return (
                    <div key={b.id_budget} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {b.kategori}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${statusBadgeColor}`}>
                            {statusText}
                          </span>
                        </div>
                        <span className="font-mono text-slate-500">
                          {formatRupiah(b.terpakai)} / {formatRupiah(b.nominal_budget)}
                        </span>
                      </div>

                      {/* Progress Bar in template teal */}
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${barColor}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <span>Terpakai {pct}%</span>
                        <span>
                          {b.sisa !== undefined && b.sisa >= 0
                            ? `Sisa: ${formatRupiah(b.sisa)}`
                            : `Lebih: ${formatRupiah(Math.abs(b.sisa || 0))}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECENT TRANSACTIONS TABLE */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#eef5f2] dark:border-slate-800 mb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
              Transaksi Terkini
            </h3>
            <p className="text-xs text-slate-500">Catatan transaksi terakhir</p>
          </div>
          <button
            onClick={() => onNavigate('transaksi')}
            className="text-xs text-[#15856c] dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline"
          >
            <span>Lihat Semua Transaksi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#eef5f2] dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-2.5">Tanggal</th>
                <th className="pb-2.5">Jenis</th>
                <th className="pb-2.5">Deskripsi</th>
                <th className="pb-2.5">Kategori</th>
                <th className="pb-2.5">Rekening</th>
                <th className="pb-2.5 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f8f6] dark:divide-slate-800">
              {recentTransactions.map((t) => {
                const isIncome = t.jenis === 'Pemasukan';
                const isExpense = t.jenis === 'Pengeluaran';
                const isTransfer = t.jenis === 'Transfer';

                return (
                  <tr key={t.id_transaksi} className="hover:bg-[#f6faf8] dark:hover:bg-slate-800/40">
                    <td className="py-3 font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatDateIndo(t.tanggal)}
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 font-bold text-[11px] ${
                          isIncome
                            ? 'text-[#15856c] dark:text-emerald-400'
                            : isExpense
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {isIncome && <ArrowDownLeft className="w-3.5 h-3.5" />}
                        {isExpense && <ArrowUpRight className="w-3.5 h-3.5" />}
                        {isTransfer && <ArrowLeftRight className="w-3.5 h-3.5" />}
                        <span>{t.jenis}</span>
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {t.deskripsi}
                    </td>
                    <td className="py-3 text-slate-500 whitespace-nowrap">
                      {t.kategori}
                    </td>
                    <td className="py-3 text-slate-500 whitespace-nowrap">
                      {t.rekening}
                      {t.rekening_tujuan && ` → ${t.rekening_tujuan}`}
                    </td>
                    <td
                      className={`py-3 text-right font-extrabold font-mono text-sm whitespace-nowrap ${
                        isIncome
                          ? 'text-[#15856c] dark:text-emerald-400'
                          : isExpense
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {isIncome ? '↗ +' : isExpense ? '↘ -' : ''}
                      {formatRupiah(t.nominal).replace('Rp', 'Rp ')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
