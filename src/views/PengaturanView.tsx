import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Upload,
  Download,
  RotateCcw,
  ExternalLink,
  Code,
  ShieldCheck,
  BookOpen,
  FileSpreadsheet,
  Lock,
  KeyRound,
  Clock,
  Users,
  UserPlus,
  Trash2,
  Edit3,
  UserCheck,
  Smartphone,
  QrCode,
  Share2,
  Cloud,
  Zap,
  Server,
  Radio
} from 'lucide-react';
import { AppData, UserAccount, UserAvatarColor } from '../types/finance';
import { GasService } from '../services/gasService';
import { StorageService } from '../services/storageService';
import { AuthService } from '../services/authService';
import { D1Service, D1StatusResponse } from '../services/d1Service';
import { getAvatarColorClass } from '../utils/userColors';

interface PengaturanViewProps {
  appData: AppData;
  gasUrl: string;
  onSaveGasUrl: (url: string) => void;
  onSyncSpreadsheet: () => void;
  onSeedSpreadsheet: () => void;
  onResetDemo: () => void;
  onImportBackup: (jsonStr: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLockApp?: () => void;
  currentUser?: UserAccount;
  onSwitchAccount?: (user: UserAccount) => void;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  appData,
  gasUrl,
  onSaveGasUrl,
  onSyncSpreadsheet,
  onSeedSpreadsheet,
  onResetDemo,
  onImportBackup,
  isDarkMode,
  onToggleDarkMode,
  onLockApp,
  currentUser,
  onSwitchAccount,
}) => {
  const [inputUrl, setInputUrl] = useState(gasUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'koneksi' | 'd1' | 'panduan' | 'code_gs' | 'backup' | 'keamanan' | 'akun'>('koneksi');
  const [importFileContent, setImportFileContent] = useState('');

  // Cloudflare D1 State
  const [d1Status, setD1Status] = useState<D1StatusResponse | null>(null);
  const [d1Testing, setD1Testing] = useState(false);
  const [d1Syncing, setD1Syncing] = useState(false);
  const [d1Message, setD1Message] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    D1Service.checkStatus().then(setD1Status).catch(() => {});
  }, []);

  const handleTestD1 = async () => {
    setD1Testing(true);
    setD1Message(null);
    const res = await D1Service.checkStatus();
    setD1Status(res);
    setD1Testing(false);
  };

  const handleSyncToD1 = async () => {
    setD1Syncing(true);
    setD1Message(null);
    const res = await D1Service.syncData(currentUser?.id || 'acc_azmin', appData, accounts);
    setD1Syncing(false);
    if (res.success) {
      setD1Message({ success: true, text: 'Seluruh data transaksi dan akun berhasil disimpan ke Cloudflare D1 Database!' });
    } else {
      setD1Message({ success: false, text: res.message });
    }
  };

  const handleLoadFromD1 = async () => {
    setD1Syncing(true);
    setD1Message(null);
    const res = await D1Service.loadData(currentUser?.id || 'acc_azmin');
    setD1Syncing(false);
    if (res.success) {
      if (res.accounts && res.accounts.length > 0) {
        AuthService.saveAccounts(res.accounts);
        setAccounts(res.accounts);
      }
      if (res.appData) {
        StorageService.saveData(res.appData, currentUser?.id || 'acc_azmin');
        onImportBackup(JSON.stringify({ version: '3.0', appData: res.appData, accounts: res.accounts }));
      }
      setD1Message({ success: true, text: 'Berhasil memuat seluruh data dari Cloudflare D1 Database!' });
    } else {
      setD1Message({ success: false, text: res.message || 'Gagal memuat dari Cloudflare D1' });
    }
  };

  // Multi-User Accounts state
  const [accounts, setAccounts] = useState<UserAccount[]>(() => AuthService.getAccounts());
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<UserAccount | null>(null);
  const [showAddAccountModal, setShowAddAccountModal] = useState<boolean>(false);
  const [accFormName, setAccFormName] = useState('');
  const [accFormUsername, setAccFormUsername] = useState('');
  const [accFormRole, setAccFormRole] = useState('Pribadi');
  const [accFormColor, setAccFormColor] = useState<UserAvatarColor>('emerald');
  const [accFormPin, setAccFormPin] = useState('123456');

  useEffect(() => {
    setAccounts(AuthService.getAccounts());
  }, [currentUser, appData]);

  const handleConfirmDeleteAccount = () => {
    if (!accountToDelete) return;
    const deletedId = accountToDelete.id;
    const isCurrent = currentUser?.id === deletedId;

    // Hapus akun dari AuthService
    AuthService.deleteAccount(deletedId);

    // Bersihkan data lokal akun tersebut
    try {
      localStorage.removeItem(`dompetku_app_data_${deletedId}`);
      localStorage.removeItem(`dompetku_gas_url_${deletedId}`);
    } catch (e) {
      console.error(e);
    }

    const updatedAccounts = AuthService.getAccounts();
    setAccounts(updatedAccounts);
    setAccountToDelete(null);

    // Jika akun yang dihapus adalah akun aktif saat ini, alihkan ke akun lain yang tersisa
    if (isCurrent && onSwitchAccount && updatedAccounts.length > 0) {
      onSwitchAccount(updatedAccounts[0]);
    }
  };

  // Security state
  const [securityEnabled, setSecurityEnabled] = useState<boolean>(() => AuthService.isSecurityEnabled());
  const [autoLockMinutes, setAutoLockMinutesState] = useState<number>(() => AuthService.getAutoLockMinutes());
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinChangeError, setPinChangeError] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState('');

  // The complete Code.gs script text
  const codeGsContent = `/**
 * DOMPETKU - BACKEND GOOGLE APPS SCRIPT
 * Database: Google Spreadsheet
 * 
 * Pengaturan Deploy:
 * - Execute as: Me (Saya)
 * - Who has access: Anyone (Siapa saja)
 */

var SHEETS = {
  TRANSAKSI: "TRANSAKSI",
  REKENING: "REKENING",
  KATEGORI: "KATEGORI",
  BUDGET: "BUDGET",
  TABUNGAN: "TABUNGAN",
  UTANG: "UTANG",
  PIUTANG: "PIUTANG",
  SETTING: "SETTING"
};

var SHEET_HEADERS = {
  TRANSAKSI: ["id_transaksi", "tanggal", "jenis", "kategori", "nominal", "rekening", "metode", "deskripsi", "catatan", "timestamp"],
  REKENING: ["id_rekening", "nama_rekening", "jenis", "saldo_awal", "status", "catatan"],
  KATEGORI: ["id_kategori", "nama_kategori", "jenis", "status"],
  BUDGET: ["id_budget", "bulan", "tahun", "kategori", "nominal_budget", "status"],
  TABUNGAN: ["id_tabungan", "nama_target", "target_nominal", "saldo_awal", "target_tanggal", "status", "catatan"],
  UTANG: ["id_utang", "nama", "tanggal", "nominal", "jatuh_tempo", "status", "catatan"],
  PIUTANG: ["id_piutang", "nama", "tanggal", "nominal", "jatuh_tempo", "status", "catatan"],
  SETTING: ["key", "value"]
};

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || "get";
    var sheetName = params.sheet;

    ensureAllSheetsExist();

    if (action === "ping") {
      return jsonResponse({ success: true, message: "Koneksi Google Apps Script berhasil!", timestamp: new Date().toISOString() });
    }

    if (action === "getAll") {
      var allData = {};
      for (var key in SHEETS) {
        allData[SHEETS[key]] = getSheetData(SHEETS[key]);
      }
      return jsonResponse({ success: true, message: "Semua data berhasil diambil", data: allData });
    }

    if (action === "get") {
      if (!sheetName || !SHEETS[sheetName.toUpperCase()]) {
        return jsonResponse({ success: false, message: "Nama sheet tidak valid" });
      }
      var data = getSheetData(SHEETS[sheetName.toUpperCase()]);
      return jsonResponse({ success: true, message: "Data berhasil diambil", data: data });
    }

    return jsonResponse({ success: false, message: "Aksi GET tidak dikenali: " + action });
  } catch (err) {
    return jsonResponse({ success: false, message: "Error GET: " + err.toString() });
  }
}

function doPost(e) {
  try {
    ensureAllSheetsExist();

    var payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    var action = payload.action;
    var sheetName = payload.sheet;
    var rowData = payload.data;

    if (!action) {
      return jsonResponse({ success: false, message: "Parameter action wajib diisi" });
    }

    if (action === "seed" || action === "bulkSync") {
      if (!payload.allData) return jsonResponse({ success: false, message: "Data bulk tidak ditemukan" });
      for (var sName in payload.allData) {
        var upper = sName.toUpperCase();
        if (SHEETS[upper]) {
          replaceSheetData(SHEETS[upper], payload.allData[sName]);
        }
      }
      return jsonResponse({ success: true, message: "Seluruh data berhasil disinkronkan ke Google Spreadsheet" });
    }

    if (!sheetName || !SHEETS[sheetName.toUpperCase()]) {
      return jsonResponse({ success: false, message: "Nama sheet tidak valid: " + sheetName });
    }

    var targetSheet = SHEETS[sheetName.toUpperCase()];

    if (action === "create") {
      var newRecord = insertRecord(targetSheet, rowData);
      return jsonResponse({ success: true, message: "Data berhasil ditambahkan", data: newRecord });
    }

    if (action === "update") {
      var primaryKeyField = SHEET_HEADERS[targetSheet][0];
      var idValue = rowData[primaryKeyField] || payload.id;
      var updatedRecord = updateRecord(targetSheet, primaryKeyField, idValue, rowData);
      return jsonResponse({ success: true, message: "Data berhasil diperbarui", data: updatedRecord });
    }

    if (action === "delete") {
      var primaryKeyFieldDel = SHEET_HEADERS[targetSheet][0];
      var idToDelete = payload.id || (rowData ? rowData[primaryKeyFieldDel] : null);
      var deleted = deleteRecord(targetSheet, primaryKeyFieldDel, idToDelete);
      return jsonResponse({ success: deleted, message: deleted ? "Data berhasil dihapus" : "ID tidak ditemukan" });
    }

    return jsonResponse({ success: false, message: "Aksi POST tidak dikenali: " + action });
  } catch (err) {
    return jsonResponse({ success: false, message: "Error POST: " + err.toString() });
  }
}

function jsonResponse(obj) {
  var output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function ensureAllSheetsExist() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  for (var key in SHEETS) {
    var name = SHEETS[key];
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      var headers = SHEET_HEADERS[name];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
      sheet.setFrozenRows(1);
    }
  }
}

function getSheetData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  if (lastRow <= 1 || lastColumn < 1) return [];

  var values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  var headers = values[0];
  var rows = values.slice(1);

  return rows.map(function(row) {
    var item = {};
    headers.forEach(function(header, idx) {
      var val = row[idx];
      if (val instanceof Date) {
        var year = val.getFullYear();
        var month = ("0" + (val.getMonth() + 1)).slice(-2);
        var day = ("0" + val.getDate()).slice(-2);
        item[header] = year + "-" + month + "-" + day;
      } else {
        item[header] = val;
      }
    });
    return item;
  });
}

function insertRecord(sheetName, recordData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  var headers = SHEET_HEADERS[sheetName];
  if (headers.indexOf("timestamp") !== -1 && !recordData["timestamp"]) {
    recordData["timestamp"] = new Date().toISOString();
  }
  var row = headers.map(function(h) { return recordData[h] !== undefined ? recordData[h] : ""; });
  sheet.appendRow(row);
  return recordData;
}

function updateRecord(sheetName, primaryKeyField, idValue, updateData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idColIdx = headers.indexOf(primaryKeyField);
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idColIdx]) === String(idValue)) {
      var rowNumber = i + 1;
      headers.forEach(function(header, colIdx) {
        if (updateData[header] !== undefined) {
          sheet.getRange(rowNumber, colIdx + 1).setValue(updateData[header]);
        }
      });
      return updateData;
    }
  }
  throw new Error("Record tidak ditemukan");
}

function deleteRecord(sheetName, primaryKeyField, idValue) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idColIdx = headers.indexOf(primaryKeyField);
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idColIdx]) === String(idValue)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function replaceSheetData(sheetName, items) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  else sheet.clear();

  var headers = SHEET_HEADERS[sheetName];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
  sheet.setFrozenRows(1);

  if (items && items.length > 0) {
    var rows = items.map(function(item) {
      return headers.map(function(h) { return item[h] !== undefined ? item[h] : ""; });
    });
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}`;

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGasUrl(inputUrl);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await GasService.testConnection(inputUrl);
    setTestResult(res);
    setTesting(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeGsContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const [copiedSyncUrl, setCopiedSyncUrl] = useState(false);
  const [copiedTokenOnly, setCopiedTokenOnly] = useState(false);
  const [customDomain, setCustomDomain] = useState(() => {
    return localStorage.getItem('dompetku_custom_domain') || '';
  });

  const handleSaveCustomDomain = (val: string) => {
    setCustomDomain(val);
    localStorage.setItem('dompetku_custom_domain', val.trim());
  };

  const isAiStudio = typeof window !== 'undefined' && window.location.origin.includes('run.app');
  const baseOrigin = customDomain.trim()
    ? customDomain.trim().replace(/\/$/, '')
    : window.location.origin;

  // Generate full sync token containing both gasUrl and accounts
  const rawSyncToken = gasUrl
    ? btoa(unescape(encodeURIComponent(JSON.stringify({ gas: gasUrl, accs: AuthService.getAccounts() }))))
    : '';

  const quickConnectLink = gasUrl 
    ? `${baseOrigin}${window.location.pathname}?sync=${encodeURIComponent(rawSyncToken)}`
    : '';

  const handleCopySyncLink = () => {
    if (!quickConnectLink) return;
    navigator.clipboard.writeText(quickConnectLink);
    setCopiedSyncUrl(true);
    setTimeout(() => setCopiedSyncUrl(false), 3000);
  };

  const handleCopyRawToken = () => {
    if (!rawSyncToken) return;
    navigator.clipboard.writeText(rawSyncToken);
    setCopiedTokenOnly(true);
    setTimeout(() => setCopiedTokenOnly(false), 3000);
  };

  const [syncingAccountsToGas, setSyncingAccountsToGas] = useState(false);
  const [syncAccStatus, setSyncAccStatus] = useState<string | null>(null);

  const handlePushAccountsToSpreadsheet = async () => {
    if (!gasUrl) {
      alert('Silakan hubungkan URL Google Apps Script terlebih dahulu di tab Koneksi.');
      return;
    }
    setSyncingAccountsToGas(true);
    setSyncAccStatus(null);
    const res = await GasService.syncAccountsToSpreadsheet(gasUrl, accounts);
    setSyncingAccountsToGas(false);
    if (res.success) {
      setSyncAccStatus('Profil akun & PIN berhasil disimpan ke Google Spreadsheet!');
    } else {
      setSyncAccStatus('Gagal menyimpan ke Google Spreadsheet: ' + res.message);
    }
    setTimeout(() => setSyncAccStatus(null), 4000);
  };

  const handleDownloadBackup = () => {
    const jsonStr = StorageService.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_DompetKu_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportBackup(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <button
          onClick={() => setActiveGuideTab('koneksi')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeGuideTab === 'koneksi'
              ? 'bg-[#15856c] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Koneksi Google Spreadsheet</span>
        </button>

        <button
          onClick={() => setActiveGuideTab('d1')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeGuideTab === 'd1'
              ? 'bg-[#f48120] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Cloud className="w-4 h-4 text-orange-400" />
          <span>Cloudflare D1 Database</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-white/20 text-white">
            Online
          </span>
        </button>

        <button
          onClick={() => setActiveGuideTab('panduan')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeGuideTab === 'panduan'
              ? 'bg-[#15856c] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Panduan Setup Bertahap</span>
        </button>

        <button
          onClick={() => setActiveGuideTab('code_gs')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeGuideTab === 'code_gs'
              ? 'bg-[#15856c] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Salin Kode Code.gs</span>
        </button>

        <button
          onClick={() => setActiveGuideTab('backup')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeGuideTab === 'backup'
              ? 'bg-[#15856c] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Backup & Reset</span>
        </button>

        <button
          onClick={() => setActiveGuideTab('keamanan')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeGuideTab === 'keamanan'
              ? 'bg-[#15856c] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Keamanan & PIN Privasi</span>
        </button>

        <button
          onClick={() => setActiveGuideTab('akun')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeGuideTab === 'akun'
              ? 'bg-[#15856c] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Kelola Akun (Multi-User)</span>
        </button>
      </div>

      {/* TAB CLOUDFLARE D1 DATABASE */}
      {activeGuideTab === 'd1' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#f48120] flex items-center justify-center border border-orange-200 dark:border-orange-800 shrink-0">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Cloudflare D1 SQLite Database
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-950 text-[#f48120] border border-orange-200 dark:border-orange-800">
                      100% Gratis Selamanya
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Database cloud native bawaan Cloudflare. Data otomatis sinkron di semua perangkat tanpa Google Spreadsheet!
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleTestD1}
                  disabled={d1Testing}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${d1Testing ? 'animate-spin' : ''}`} />
                  <span>{d1Testing ? 'Menguji...' : 'Uji Koneksi (Ping)'}</span>
                </button>
              </div>
            </div>

            {/* Database Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block">Database ID Cloudflare D1 Anda</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 block break-all select-all">
                  e70a98f0-8274-47e8-992a-f85974ce1206
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block">Status Koneksi Saat Ini</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${d1Status?.success ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className={`text-xs font-bold ${d1Status?.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {d1Status?.success ? 'Terhubung & Aktif (Online)' : (d1Status?.message || 'Menunggu Deploy ke Cloudflare')}
                  </span>
                </div>
              </div>
            </div>

            {/* Message alert */}
            {d1Message && (
              <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
                d1Message.success 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
              }`}>
                {d1Message.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{d1Message.text}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSyncToD1}
                disabled={d1Syncing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f48120] hover:bg-[#d66f17] text-white text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{d1Syncing ? 'Menyimpan...' : 'Simpan Seluruh Data ke Cloudflare D1'}</span>
              </button>

              <button
                type="button"
                onClick={handleLoadFromD1}
                disabled={d1Syncing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{d1Syncing ? 'Mengunduh...' : 'Tarik Data dari Cloudflare D1'}</span>
              </button>
            </div>
          </div>

          {/* Setup Verification Step Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#f48120]" />
              <span>Cara Menghubungkan D1 di Cloudflare Pages Dashboard (1 Menit):</span>
            </h4>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-950 text-[#f48120] font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  File konfigurasi <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-[#f48120]">wrangler.json</code> dan backend API <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-[#f48120]">functions/api/d1.ts</code> <strong>sudah selesai dibuat dan dikonfigurasi</strong> dengan ID database Anda.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-950 text-[#f48120] font-bold flex items-center justify-center shrink-0">2</span>
                <div>
                  Di Dashboard Cloudflare Anda: Buka <strong>Workers & Pages</strong> &gt; Klik nama project Pages Anda &gt; Pilih tab <strong>Settings</strong> &gt; Menu <strong>Functions</strong>.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-950 text-[#f48120] font-bold flex items-center justify-center shrink-0">3</span>
                <div>
                  Gulir ke bagian <strong>D1 database bindings</strong> &gt; Klik <strong>Add binding</strong>:
                  <ul className="mt-1.5 ml-4 list-disc space-y-1">
                    <li>Variable name: ketik <code className="font-mono font-bold text-slate-900 dark:text-white">DB</code> (huruf besar semua)</li>
                    <li>D1 database: pilih database Anda yang berakhiran <code className="font-mono font-bold text-slate-900 dark:text-white">1206</code></li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-950 text-[#f48120] font-bold flex items-center justify-center shrink-0">4</span>
                <div>
                  Lakukan deploy ulang (<code className="font-mono">git push</code>). Seketika seluruh HP dan komputer Anda akan terhubung otomatis ke Cloudflare D1 tanpa perlu pengaturan apa pun lagi!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: KONEKSI GOOGLE SPREADSHEET */}
      {activeGuideTab === 'koneksi' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <span>URL Google Apps Script Web App API</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Hubungkan dashboard keuangan ini ke Google Spreadsheet pribadi Anda. Seluruh perubahan transaksi, rekening, anggaran, dan kategori akan tersimpan secara langsung di Google Spreadsheet.
              </p>
            </div>

            <form onSubmit={handleSaveUrl} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
                  Web App URL (Penerapan Baru)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-bold text-white bg-[#15856c] hover:bg-[#116c58] rounded-xl shadow-xs transition-colors shrink-0"
                  >
                    Simpan URL
                  </button>
                </div>
              </div>
            </form>

            {/* Test Connection Button & Status */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !inputUrl}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Menguji Koneksi...' : 'Uji Koneksi (Test Ping)'}</span>
              </button>

              <button
                type="button"
                onClick={onSyncSpreadsheet}
                disabled={!gasUrl}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800 disabled:opacity-40"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tarik Data dari Spreadsheet</span>
              </button>

              <button
                type="button"
                onClick={onSeedSpreadsheet}
                disabled={!gasUrl}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 dark:border-blue-800 disabled:opacity-40"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Isi Spreadsheet dengan Data Awal (Bulk Seed)</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-lg text-xs flex items-start gap-2.5 border ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                )}
                <div>
                  <div className="font-bold">{testResult.success ? 'Koneksi Berhasil!' : 'Koneksi Gagal'}</div>
                  <div className="mt-0.5">{testResult.message}</div>
                </div>
              </div>
            )}

            {/* Sambungkan ke HP Instan (QR Code & Link Cepat) */}
            {gasUrl && (
              <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
                  <div className="flex flex-col md:flex-row gap-5 items-center">
                    {/* QR Code */}
                    <div className="shrink-0 text-center">
                      <div className="bg-white p-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-sm inline-block">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(quickConnectLink)}`}
                          alt="QR Code Sambung HP"
                          className="w-36 h-36 rounded-lg block"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mt-2">
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Scan dengan Kamera HP</span>
                      </div>
                    </div>

                      {/* Info & Tombol */}
                    <div className="space-y-2.5 flex-1 text-center md:text-left">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-[#15856c] dark:text-emerald-300 text-xs font-bold">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Sinkronisasi Otomatis Antar Perangkat</span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        Buka di HP Tanpa Backup & Restore Manual
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Cukup <strong>scan QR Code</strong> di samping menggunakan kamera HP Anda, atau klik tombol <strong>Salin Link Cepat HP</strong> dan buka di browser HP. Saat web terbuka di HP, seluruh profil akun, PIN, dan catatan transaksi otomatis disinkronkan secara instan!
                      </p>

                      {/* Domain Cloudflare Target */}
                      <div className="pt-1 text-left">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Domain Website Cloudflare Anda (Diisi jika buka di HP):
                        </label>
                        <input
                          type="url"
                          placeholder="https://contoh-aplikasi.pages.dev"
                          value={customDomain}
                          onChange={(e) => handleSaveCustomDomain(e.target.value)}
                          className="w-full max-w-md px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#15856c]"
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {isAiStudio ? 'Masukkan link website Cloudflare Anda agar link QR Code dan WhatsApp otomatis mengarahkan ke HP Anda.' : 'Otomatis menggunakan domain saat ini.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleCopySyncLink}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#15856c] hover:bg-[#116c58] text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                        >
                          {copiedSyncUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedSyncUrl ? 'Link HP Tersalin!' : 'Salin Tautan Cepat HP'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleCopyRawToken}
                          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-2xs active:scale-95"
                          title="Salin token untuk ditempelkan di tombol 'Sambungkan Google Spreadsheet' pada layar Login HP"
                        >
                          {copiedTokenOnly ? <Check className="w-4 h-4 text-emerald-600" /> : <Code className="w-4 h-4" />}
                          <span>{copiedTokenOnly ? 'Token Tersalin!' : 'Salin Token Saja'}</span>
                        </button>

                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(`Buka DompetKu di HP dengan akun dan transaksi otomatis tersinkron:\n${quickConnectLink}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Kirim ke WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Database Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Struktur 8 Sheet Database Otomatis</span>
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Skrip <code className="font-mono text-emerald-600">Code.gs</code> akan otomatis membuat dan memberi format header untuk ke-8 lembar kerja berikut saat pertama kali dijalankan:
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                <li className="p-1.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">1. TRANSAKSI</li>
                <li className="p-1.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">2. REKENING</li>
                <li className="p-1.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">3. KATEGORI</li>
                <li className="p-1.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">4. BUDGET</li>
                <li className="p-1.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">5. TABUNGAN</li>
                <li className="p-1.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">6. UTANG</li>
                <li className="p-1.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">7. PIUTANG</li>
                <li className="p-1.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">8. SETTING</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Aman & Bebas Biaya Server</span>
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Data keuangan Anda 100% berada di bawah kendali akun Google pribadi Anda tanpa menggunakan database pihak ketiga (MySQL/Firebase). Google Apps Script menangani pembacaan dan penyimpanan data dengan kuota gratis Google Spreadsheet.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600">
                <Check className="w-4 h-4" />
                <span>Privasi terjamin di Google Drive Anda sendiri</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PANDUAN SETUP BERTAHAP */}
      {activeGuideTab === 'panduan' && (
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Panduan Lengkap Setup Google Spreadsheet & Apps Script
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Ikuti 8 langkah mudah berikut untuk menghubungkan website dengan Google Spreadsheet Anda:
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex gap-3.5">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <div className="text-xs space-y-1">
                <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                  Buat Dokumen Google Spreadsheet Baru
                </h5>
                <p className="text-slate-600 dark:text-slate-300">
                  Buka Google Drive Anda, lalu buat Spreadsheet baru dan beri nama, misalnya: <strong>&quot;Database DompetKu Keuangan&quot;</strong>. (Anda tidak perlu membuat sheet manual karena skrip akan membuatnya otomatis).
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex gap-3.5">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <div className="text-xs space-y-1">
                <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                  Buka Editor Google Apps Script
                </h5>
                <p className="text-slate-600 dark:text-slate-300">
                  Pada menu bar Google Spreadsheet, klik <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>. Tab baru editor skrip akan terbuka.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex gap-3.5">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <div className="text-xs space-y-1">
                <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                  Tempelkan Kode Code.gs
                </h5>
                <p className="text-slate-600 dark:text-slate-300">
                  Buka tab <strong>&quot;Salin Kode Code.gs&quot;</strong> di atas, klik tombol <strong>Salin Kode</strong>, lalu hapus seluruh kode bawaan di editor Apps Script dan tempelkan (Paste). Jangan lupa tekan tombol <strong>Simpan (Save icon)</strong> atau Ctrl+S.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex gap-3.5">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                4
              </span>
              <div className="text-xs space-y-1">
                <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                  Deploy sebagai Aplikasi Web (Web App)
                </h5>
                <p className="text-slate-600 dark:text-slate-300">
                  Di pojok kanan atas Apps Script, klik tombol biru <strong>Terapkan (Deploy)</strong> &gt; pilih <strong>Penerapan baru (New deployment)</strong>.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex gap-3.5">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                5
              </span>
              <div className="text-xs space-y-1">
                <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                  Atur Konfigurasi Akses (PENTING!)
                </h5>
                <p className="text-slate-600 dark:text-slate-300">
                  Pastikan pengaturan diisi persis sebagai berikut:
                </p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-700 dark:text-slate-300">
                  <li>Pilih jenis penerapan: <strong>Aplikasi Web (Web App)</strong> (ikon roda gigi)</li>
                  <li>Jalankan sebagai (Execute as): <strong>Saya (Email Google Anda)</strong></li>
                  <li>Siapa yang memiliki akses (Who has access): <strong>Siapa saja (Anyone)</strong> <em>&larr; Wajib agar website bisa mengakses API tanpa login popup Google</em></li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex gap-3.5">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                6
              </span>
              <div className="text-xs space-y-1">
                <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                  Berikan Izin Akses (Authorize Access)
                </h5>
                <p className="text-slate-600 dark:text-slate-300">
                  Klik <strong>Deploy</strong>. Google akan meminta izin akses dokumen. Klik <em>&quot;Authorize access&quot;</em> &gt; pilih akun Google Anda &gt; klik <em>&quot;Advanced&quot;</em> &gt; klik <em>&quot;Go to (nama project) (unsafe)&quot;</em> &gt; klik <em>&quot;Allow&quot;</em>.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex gap-3.5">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                7
              </span>
              <div className="text-xs space-y-1">
                <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                  Salin URL Aplikasi Web & Masukkan ke Website
                </h5>
                <p className="text-slate-600 dark:text-slate-300">
                  Salin <strong>Web app URL</strong> yang berakhiran <code className="font-mono text-emerald-600">/exec</code>. Kembali ke tab <strong>&quot;Koneksi Google Spreadsheet&quot;</strong> di website ini, tempelkan URL tersebut dan klik <strong>Simpan URL</strong>.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex gap-3.5">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                8
              </span>
              <div className="text-xs space-y-1">
                <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                  Klik &quot;Isi Spreadsheet dengan Data Awal (Bulk Seed)&quot;
                </h5>
                <p className="text-slate-600 dark:text-slate-300">
                  Selesai! Klik tombol &quot;Isi Spreadsheet dengan Data Awal&quot; agar seluruh 20+ transaksi dan rekening langsung terisi rapi ke Google Spreadsheet Anda.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SALIN KODE CODE.GS */}
      {activeGuideTab === 'code_gs' && (
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Code className="w-5 h-5 text-emerald-600" />
                <span>Kode Sumber Google Apps Script (Code.gs)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Salin seluruh kode ini dan tempelkan ke Apps Script Google Spreadsheet Anda.
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#15856c] hover:bg-[#116c58] rounded-xl shadow-xs transition-colors shrink-0"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Tersalin!' : 'Salin Seluruh Kode'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto max-h-[500px] border border-slate-800">
            {codeGsContent}
          </pre>
        </div>
      )}

      {/* TAB 4: BACKUP, RESTORE & RESET */}
      {activeGuideTab === 'backup' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cadangkan & Pulihkan Data (Backup & Restore JSON)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Unduh file cadangan offline atau pulihkan data dari file JSON cadangan Anda sebelumnya.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleDownloadBackup}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Unduh File Cadangan JSON</span>
              </button>

              <label className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Impor File Cadangan</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                <span>Zona Bahaya: Reset ke Data Demo Awal</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tindakan ini akan mengembalikan data lokal aplikasi ke 20+ data demo awal (BCA, Mandiri, transaksi belanja, gaji, dll).
              </p>
            </div>

            <button
              onClick={onResetDemo}
              className="px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 rounded-lg transition-colors"
            >
              Reset ke 20+ Data Demo
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: KEAMANAN & PIN PRIVASI */}
      {activeGuideTab === 'keamanan' && (
        <div className="space-y-6">
          {/* Card 1: Status Proteksi Kunci Privasi */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#15856c] dark:text-emerald-400" />
                  <span>Proteksi Kunci Privasi (Layar Login PIN)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                  Saat diaktifkan, siapapun yang membuka website DompetKu ini wajib memasukkan PIN keamanan terlebih dahulu sebelum dapat melihat saldo, riwayat transaksi, rekening, dan catatan utang Anda.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !securityEnabled;
                    setSecurityEnabled(nextVal);
                    AuthService.setSecurityEnabled(nextVal);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    securityEnabled ? 'bg-[#15856c]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={securityEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      securityEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {securityEnabled ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>

            {/* Quick Lock Action Button */}
            {onLockApp && securityEnabled && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Ingin segera menguji atau mengunci layar sekarang?
                </span>
                <button
                  type="button"
                  onClick={onLockApp}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Kunci Aplikasi Sekarang</span>
                </button>
              </div>
            )}
          </div>

          {/* Card 2: Ubah PIN Keamanan */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#15856c] dark:text-emerald-400" />
                <span>Ubah PIN Keamanan</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                PIN default awal adalah <strong className="font-mono text-slate-900 dark:text-white">123456</strong>. Anda dapat menggantinya dengan angka atau kata sandi pribadi Anda (minimal 4 karakter).
              </p>
            </div>

            {pinChangeError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinChangeError}</span>
              </div>
            )}

            {pinChangeSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{pinChangeSuccess}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPinChangeError('');
                setPinChangeSuccess('');

                const currentStored = AuthService.getStoredPin();
                if (oldPin.trim() !== currentStored.trim()) {
                  setPinChangeError('PIN Lama yang Anda masukkan salah.');
                  return;
                }
                if (newPin.trim().length < 4) {
                  setPinChangeError('PIN Baru minimal 4 karakter / angka.');
                  return;
                }
                if (newPin !== confirmPin) {
                  setPinChangeError('Konfirmasi PIN Baru tidak cocok.');
                  return;
                }

                AuthService.setPin(newPin.trim());
                setPinChangeSuccess('PIN Keamanan berhasil diperbarui!');
                setOldPin('');
                setNewPin('');
                setConfirmPin('');
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  PIN Saat Ini
                </label>
                <input
                  type="password"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="Contoh: 123456"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#15856c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  PIN Baru
                </label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="PIN baru Anda..."
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#15856c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Konfirmasi PIN Baru
                </label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Ulangi PIN baru..."
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#15856c]"
                />
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#15856c] hover:bg-[#116c58] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan PIN Baru</span>
                </button>
              </div>
            </form>
          </div>

          {/* Card 3: Durasi Kunci Otomatis (Auto-Lock) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#15856c] dark:text-emerald-400" />
                <span>Kunci Otomatis Saat Tidak Ada Aktivitas</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Kunci dashboard secara otomatis jika Anda meninggalkan perangkat dalam jangka waktu tertentu.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Segera (Saat Tab Ditutup)', val: 0 },
                { label: '5 Menit', val: 5 },
                { label: '15 Menit', val: 15 },
                { label: '30 Menit', val: 30 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => {
                    setAutoLockMinutesState(opt.val);
                    AuthService.setAutoLockMinutes(opt.val);
                  }}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                    autoLockMinutes === opt.val
                      ? 'border-[#15856c] bg-[#eaf5f1] dark:bg-emerald-950/40 text-[#15856c] dark:text-emerald-300 font-bold ring-2 ring-[#15856c]/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: KELOLA AKUN MULTI-USER */}
      {activeGuideTab === 'akun' && (
        <div className="space-y-6">
          {/* Card 1: Overview & Add Button */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#15856c] dark:text-emerald-400" />
                <span>Multi-User & Akun Berbeda (2 - 3 Orang / Profil)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                Setiap orang dapat login dengan akun dan PIN yang berbeda. Data saldo dompet, transaksi harian, rekening bank, target tabungan, dan anggaran belanja tersimpan terpisah secara aman untuk masing-masing profil.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePushAccountsToSpreadsheet}
                disabled={syncingAccountsToGas || !gasUrl}
                className="px-4 py-2.5 rounded-xl border border-[#15856c] text-[#15856c] dark:text-emerald-300 hover:bg-[#eaf5f1] dark:hover:bg-emerald-950/40 text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 shadow-2xs"
                title="Unggah akun dan PIN saat ini ke Google Spreadsheet agar bisa dibuka di HP otomatis"
              >
                <Database className="w-4 h-4" />
                <span>{syncingAccountsToGas ? 'Menyimpan...' : 'Simpan Akun ke Spreadsheet'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAccFormName('');
                  setAccFormUsername('');
                  setAccFormRole('Pribadi');
                  setAccFormColor('emerald');
                  setAccFormPin('123456');
                  setShowAddAccountModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#15856c] hover:bg-[#116c58] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Tambah Akun Baru</span>
              </button>
            </div>
          </div>

          {syncAccStatus && (
            <div className="p-3 rounded-xl text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncAccStatus}</span>
            </div>
          )}

          {/* Card 2: Accounts List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => {
              const isCurrent = currentUser?.id === acc.id;
              const colorCls = getAvatarColorClass(acc.avatarColor);

              return (
                <div
                  key={acc.id}
                  className={`p-5 rounded-2xl border transition-all bg-white dark:bg-slate-900 flex flex-col justify-between ${
                    isCurrent
                      ? 'border-[#15856c] ring-2 ring-[#15856c]/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Header: Avatar & Status */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border shadow-xs ${colorCls}`}
                      >
                        {acc.name.charAt(0).toUpperCase()}
                      </div>
                      {isCurrent ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#eaf5f1] dark:bg-emerald-950/70 text-[#15856c] dark:text-emerald-300 text-[10px] font-bold border border-[#c3e6d8] dark:border-emerald-800">
                          <UserCheck className="w-3 h-3" />
                          <span>Akun Aktif</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                          Profil Tersedia
                        </span>
                      )}
                    </div>

                    {/* Name & Role */}
                    <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {acc.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      @{acc.username}
                    </p>
                    <div className="mt-2 inline-block px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                      {acc.role}
                    </div>

                    <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3 h-3" />
                      <span>PIN Keamanan: ••••••</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAccount(acc);
                          setAccFormName(acc.name);
                          setAccFormUsername(acc.username);
                          setAccFormRole(acc.role);
                          setAccFormColor(acc.avatarColor);
                          setAccFormPin(acc.pin);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Profil Akun"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {accounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setAccountToDelete(acc)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {!isCurrent && onSwitchAccount ? (
                      <button
                        type="button"
                        onClick={() => onSwitchAccount(acc)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#eaf5f1] dark:bg-slate-800 dark:hover:bg-emerald-950/40 text-slate-700 hover:text-[#15856c] dark:text-slate-200 dark:hover:text-emerald-300 text-xs font-bold transition-colors"
                      >
                        Beralih ke Akun Ini
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-[#15856c] dark:text-emerald-400">
                        Sedang Digunakan
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Akun */}
      {(showAddAccountModal || editingAccount) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-md animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#15856c]/10 text-[#15856c] flex items-center justify-center">
                  {editingAccount ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingAccount ? `Edit Akun: ${editingAccount.name}` : 'Tambah Akun Pengguna Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddAccountModal(false);
                  setEditingAccount(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!accFormName.trim()) return;

                if (editingAccount) {
                  AuthService.updateAccount(editingAccount.id, {
                    name: accFormName,
                    username: accFormUsername || accFormName.toLowerCase().replace(/\s+/g, '_'),
                    role: accFormRole,
                    avatarColor: accFormColor,
                    pin: accFormPin || '123456'
                  });
                  setEditingAccount(null);
                } else {
                  AuthService.createAccount(
                    accFormName,
                    accFormUsername || accFormName.toLowerCase().replace(/\s+/g, '_'),
                    accFormRole,
                    accFormColor,
                    accFormPin || '123456'
                  );
                  setShowAddAccountModal(false);
                }

                setAccounts(AuthService.getAccounts());
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Akun / Panggilan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Azmin, Istri, Pasangan, Usaha"
                  value={accFormName}
                  onChange={(e) => setAccFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#15856c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="azmin_finance"
                  value={accFormUsername}
                  onChange={(e) => setAccFormUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-[#15856c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Peran / Keterangan Akun
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Akun Pribadi, Tabungan Bersama, Belanja Dapur"
                  value={accFormRole}
                  onChange={(e) => setAccFormRole(e.target.value)}
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
                        onClick={() => setAccFormColor(c)}
                        className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${
                          accFormColor === c ? 'scale-110 shadow-sm border-slate-900 dark:border-white' : 'border-transparent'
                        } ${getAvatarColorClass(c)}`}
                      >
                        {accFormColor === c && <Check className="w-3.5 h-3.5" />}
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
                  value={accFormPin}
                  onChange={(e) => setAccFormPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-[#15856c]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAccountModal(false);
                    setEditingAccount(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#15856c] hover:bg-[#116c58] text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingAccount ? 'Simpan Perubahan' : 'Buat Akun'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Akun */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-[#d8e8e1] dark:border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-sm animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-center text-slate-900 dark:text-white">
              Hapus Akun {accountToDelete.name}?
            </h3>
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Profil akun <strong>{accountToDelete.name}</strong> (@{accountToDelete.username}) beserta seluruh data transaksi dan saldo lokalnya akan dihapus permanen dari perangkat ini.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
