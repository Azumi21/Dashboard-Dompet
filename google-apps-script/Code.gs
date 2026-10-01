/**
 * DOMPETKU - BACKEND GOOGLE APPS SCRIPT
 * Database: Google Spreadsheet
 * 
 * Petunjuk Instalasi:
 * 1. Buka Google Spreadsheet baru (atau gunakan yang sudah ada)
 * 2. Klik menu 'Ekstensi' > 'Apps Script'
 * 3. Hapus semua kode default dan tempelkan seluruh kode ini
 * 4. Klik 'Terapkan' (Deploy) > 'Penerapan baru' (New deployment)
 * 5. Pilih jenis 'Aplikasi Web' (Web app)
 * 6. Setelan:
 *    - Deskripsi: API DompetKu Keuangan
 *    - Jalankan sebagai: Saya (Email Anda)
 *    - Siapa yang memiliki akses: Siapa saja (Anyone) -> WAJIB agar aplikasi web dapat mengakses tanpa login browser
 * 7. Klik 'Terapkan', lalu izinkan hak akses (Authorize access)
 * 8. Salin URL Aplikasi Web (contoh: https://script.google.com/macros/s/.../exec)
 * 9. Tempelkan URL tersebut di menu Pengaturan aplikasi DompetKu
 */

// Konfigurasi Nama Sheet yang Dikelola
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

// Header Kolom untuk Setiap Sheet
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

// Tangani HTTP GET Request
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
      // Mengambil semua data dari seluruh sheet sekaligus dalam satu request (sangat efisien)
      var allData = {};
      for (var key in SHEETS) {
        allData[SHEETS[key]] = getSheetData(SHEETS[key]);
      }
      return jsonResponse({ success: true, message: "Semua data berhasil diambil", data: allData });
    }

    if (action === "get") {
      if (!sheetName || !SHEETS[sheetName.toUpperCase()]) {
        return jsonResponse({ success: false, message: "Nama sheet tidak valid atau tidak diberikan" });
      }
      var data = getSheetData(SHEETS[sheetName.toUpperCase()]);
      return jsonResponse({ success: true, message: "Data berhasil diambil", data: data });
    }

    return jsonResponse({ success: false, message: "Aksi GET tidak dikenali: " + action });
  } catch (err) {
    return jsonResponse({ success: false, message: "Error GET: " + err.toString() });
  }
}

// Tangani HTTP POST Request
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
      return jsonResponse({ success: false, message: "Parameter action wajib diisi (create/update/delete/seed)" });
    }

    // Aksi: Inisialisasi atau Seed Banyak Data Sekaligus
    if (action === "seed" || action === "bulkSync") {
      if (!payload.allData) {
        return jsonResponse({ success: false, message: "Data batch/bulk tidak ditemukan" });
      }
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
      if (!idValue) {
        return jsonResponse({ success: false, message: "ID data tidak ditemukan untuk update" });
      }
      var updatedRecord = updateRecord(targetSheet, primaryKeyField, idValue, rowData);
      return jsonResponse({ success: true, message: "Data berhasil diperbarui", data: updatedRecord });
    }

    if (action === "delete") {
      var primaryKeyFieldDel = SHEET_HEADERS[targetSheet][0];
      var idToDelete = payload.id || (rowData ? rowData[primaryKeyFieldDel] : null);
      if (!idToDelete) {
        return jsonResponse({ success: false, message: "ID data tidak ditemukan untuk dihapus" });
      }
      var deleted = deleteRecord(targetSheet, primaryKeyFieldDel, idToDelete);
      return jsonResponse({ success: deleted, message: deleted ? "Data berhasil dihapus" : "Data dengan ID tersebut tidak ditemukan" });
    }

    return jsonResponse({ success: false, message: "Aksi POST tidak dikenali: " + action });
  } catch (err) {
    return jsonResponse({ success: false, message: "Error POST: " + err.toString() });
  }
}

// Helper: Response JSON dengan CORS Header
function jsonResponse(obj) {
  var output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// Helper: Pastikan Semua Sheet dan Header Tersedia
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

// Helper: Ambil Data dari Suatu Sheet dalam Bentuk Array of Objects
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
      // Format tanggal jika objek Date
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

// Helper: Tambah Record Baru
function insertRecord(sheetName, recordData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  var headers = SHEET_HEADERS[sheetName];

  // Auto-generate timestamp jika ada kolom timestamp
  if (headers.indexOf("timestamp") !== -1 && !recordData["timestamp"]) {
    recordData["timestamp"] = new Date().toISOString();
  }

  var row = headers.map(function(header) {
    return recordData[header] !== undefined ? recordData[header] : "";
  });

  sheet.appendRow(row);
  return recordData;
}

// Helper: Update Record Berdasarkan Primary Key
function updateRecord(sheetName, primaryKeyField, idValue, updateData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idColIdx = headers.indexOf(primaryKeyField);

  if (idColIdx === -1) throw new Error("Kolom primary key tidak ditemukan");

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
  throw new Error("Record dengan ID " + idValue + " tidak ditemukan");
}

// Helper: Hapus Record Berdasarkan Primary Key
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

// Helper: Ganti Seluruh Isi Sheet (untuk Sinkronisasi Awal / Restore)
function replaceSheetData(sheetName, items) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clear();
  }

  var headers = SHEET_HEADERS[sheetName];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
  sheet.setFrozenRows(1);

  if (items && items.length > 0) {
    var rows = items.map(function(item) {
      return headers.map(function(header) {
        return item[header] !== undefined ? item[header] : "";
      });
    });
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}
