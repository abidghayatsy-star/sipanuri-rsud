/**
 * ============================================
 * SIPANURI - Sistem Pemantauan Paviliun Nuri
 * Version: 2.0 (Improved)
 * ============================================
 */

/**
 * PENGATURAN DASAR
 * Ganti SPREADSHEET_ID dengan ID spreadsheet Anda
 */
const SPREADSHEET_ID = '1xA-Ibsx5MnZXw9qvy_2vmfIkdZAL5yql3DPs-hNbxNg';
const SHEET_NAME_KAMAR = 'DataKamar';
const SHEET_NAME_BHP = 'BHP_ATK';
const SHEET_NAME_ASET = 'Aset_Perlengkapan';
const SHEET_NAME_REKAP = 'RekapPasien';

// Cache duration in seconds (60 seconds)
const CACHE_DURATION = 60;

/**
 * RENDER HALAMAN UTAMA
 */
function doGet() {
  return HtmlService.createTemplateFromFile('SIPANURI')
    .evaluate()
    .setTitle('SIPANURI - Sistem Pemantauan Paviliun Nuri')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * INCLUDE FILE (untuk modular HTML)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================
// FUNGSI KAMAR
// ============================================

/**
 * MENGAMBIL DATA KAMAR DENGAN CACHING
 */
function getKamarData() {
  // Check cache first
  const cache = CacheService.getScriptCache();
  const cachedData = cache.get('kamarData');
  
  if (cachedData) {
    return JSON.parse(cachedData);
  }
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME_KAMAR);
    
    if (!sheet) {
      console.warn('Sheet DataKamar tidak ditemukan, menggunakan data default');
      return getDefaultKamarData();
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return getDefaultKamarData();
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    const result = rows.map((row, index) => ({
      No_Kamar: row[0] || '',
      Tipe: row[1] || 'VIP',
      Status: row[2] || 'Kosong',
      Pasien: row[3] || null,
      Dokter: row[4] || null,
      Diagnosa: row[5] || null,
      _index: index + 2 // Row number in spreadsheet (for updates)
    })).filter(k => k.No_Kamar);
    
    // Cache the result
    cache.put('kamarData', JSON.stringify(result), CACHE_DURATION);
    
    return result;
    
  } catch (e) {
    console.error('Error getting kamar data:', e);
    return getDefaultKamarData();
  }
}

/**
 * SIMPAN DATA PASIEN & CATAT KE REKAP
 * @param {string} noKamar - Nomor kamar
 * @param {string} status - Status kamar (Kosong/Terisi)
 * @param {string} pasien - Nama pasien
 * @param {string} dokter - Nama dokter DPJP
 * @param {string} diagnosa - Diagnosa pasien
 * @returns {object} - { success: boolean, message: string }
 */
function savePatientData(noKamar, status, pasien, dokter, diagnosa) {
  try {
    // Validasi input
    if (!noKamar) {
      return { success: false, message: 'Nomor kamar tidak boleh kosong' };
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetKamar = ss.getSheetByName(SHEET_NAME_KAMAR);
    
    if (!sheetKamar) {
      return { success: false, message: 'Sheet DataKamar tidak ditemukan' };
    }
    
    const data = sheetKamar.getDataRange().getValues();
    let found = false;
    let rowData = null;
    
    // Cari dan update data kamar
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === noKamar.toString()) {
        // Update Kolom 3 (Status), 4 (Pasien), 5 (Dokter), 6 (Diagnosa)
        // Kolom 2 (Tipe) tetap aman, tidak diubah
        sheetKamar.getRange(i + 1, 3, 1, 4).setValues([[status, pasien || '', dokter || '', diagnosa || '']]);
        found = true;
        rowData = data[i];
        break;
      }
    }
    
    if (!found) {
      return { success: false, message: 'Kamar dengan nomor ' + noKamar + ' tidak ditemukan' };
    }
    
    // Catat ke RekapPasien jika status Terisi
    if (status === 'Terisi') {
      const sheetRekap = ss.getSheetByName(SHEET_NAME_REKAP);
      if (sheetRekap) {
        const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
        sheetRekap.appendRow([
          new Date(),           // Timestamp
          noKamar,              // Nomor kamar
          pasien || '-',        // Nama pasien
          dokter || '-',        // Dokter DPJP
          diagnosa || '-',      // Diagnosa
          rowData ? rowData[1] : 'VIP'  // Tipe kamar
        ]);
      }
    }
    
    // Clear cache agar data baru terbaca
    CacheService.getScriptCache().remove('kamarData');
    CacheService.getScriptCache().remove('dashboardStats');
    
    // Log aktivitas
    logActivity('UPDATE_KAMAR', noKamar, status, pasien);
    
    return { 
      success: true, 
      message: 'Data kamar ' + noKamar + ' berhasil diperbarui' 
    };
    
  } catch (e) {
    console.error('Error saving patient data:', e);
    return { success: false, message: 'Error: ' + e.toString() };
  }
}

/**
 * MENGAMBIL DETAIL KAMAR TERTENTU
 */
function getKamarDetail(noKamar) {
  try {
    const kamarData = getKamarData();
    return kamarData.find(k => k.No_Kamar.toString() === noKamar.toString()) || null;
  } catch (e) {
    console.error('Error getting kamar detail:', e);
    return null;
  }
}

/**
 * DATA DEFAULT KAMAR (FALLBACK)
 */
function getDefaultKamarData() {
  return [
    { No_Kamar: "201", Tipe: "VVIP", Status: "Kosong", Pasien: null, Dokter: null, Diagnosa: null },
    { No_Kamar: "202", Tipe: "VVIP", Status: "Kosong", Pasien: null, Dokter: null, Diagnosa: null },
    { No_Kamar: "203", Tipe: "VIP", Status: "Kosong", Pasien: null, Dokter: null, Diagnosa: null },
    { No_Kamar: "204", Tipe: "VIP", Status: "Kosong", Pasien: null, Dokter: null, Diagnosa: null },
    { No_Kamar: "301", Tipe: "VIP", Status: "Kosong", Pasien: null, Dokter: null, Diagnosa: null },
    { No_Kamar: "302", Tipe: "VIP", Status: "Kosong", Pasien: null, Dokter: null, Diagnosa: null },
    { No_Kamar: "303", Tipe: "VIP", Status: "Kosong", Pasien: null, Dokter: null, Diagnosa: null },
    { No_Kamar: "304", Tipe: "VIP", Status: "Kosong", Pasien: null, Dokter: null, Diagnosa: null }
  ];
}

// ============================================
// FUNGSI DASHBOARD & STATISTIK
// ============================================

/**
 * MENGAMBIL STATISTIK UNTUK DASHBOARD
 */
function getDashboardStats() {
  // Check cache
  const cache = CacheService.getScriptCache();
  const cachedStats = cache.get('dashboardStats');
  
  if (cachedStats) {
    return JSON.parse(cachedStats);
  }
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Get kamar statistics
    const kamarData = getKamarData();
    const totalKamar = kamarData.length;
    const kamarTerisi = kamarData.filter(k => k.Status.toLowerCase() === 'terisi').length;
    const kamarKosong = totalKamar - kamarTerisi;
    const okupansi = totalKamar > 0 ? Math.round((kamarTerisi / totalKamar) * 100) : 0;
    
    // VVIP stats
    const vvipRooms = kamarData.filter(k => k.Tipe.toUpperCase() === 'VVIP');
    const vvipTerisi = vvipRooms.filter(k => k.Status.toLowerCase() === 'terisi').length;
    
    // VIP stats
    const vipRooms = kamarData.filter(k => k.Tipe.toUpperCase() === 'VIP');
    const vipTerisi = vipRooms.filter(k => k.Status.toLowerCase() === 'terisi').length;
    
    // Get rekap statistics
    const sheetRekap = ss.getSheetByName(SHEET_NAME_REKAP);
    let totalBulanIni = 0;
    let topDiagnosa = [];
    
    if (sheetRekap) {
      const rekapData = sheetRekap.getDataRange().getValues();
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      let diagnosaCounts = {};
      
      for (let i = 1; i < rekapData.length; i++) {
        if (rekapData[i][0]) {
          const tgl = new Date(rekapData[i][0]);
          if (tgl.getMonth() === currentMonth && tgl.getFullYear() === currentYear) {
            totalBulanIni++;
            const diag = rekapData[i][4] || "Tanpa Diagnosa";
            diagnosaCounts[diag] = (diagnosaCounts[diag] || 0) + 1;
          }
        }
      }
      
      topDiagnosa = Object.entries(diagnosaCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
    }
    
    const result = {
      kamar: {
        total: totalKamar,
        terisi: kamarTerisi,
        kosong: kamarKosong,
        okupansi: okupansi,
        vvip: { total: vvipRooms.length, terisi: vvipTerisi },
        vip: { total: vipRooms.length, terisi: vipTerisi }
      },
      rekap: {
        totalBulanIni: totalBulanIni,
        topDiagnosa: topDiagnosa
      }
    };
    
    // Cache for 60 seconds
    cache.put('dashboardStats', JSON.stringify(result), CACHE_DURATION);
    
    return result;
    
  } catch (e) {
    console.error('Error getting dashboard stats:', e);
    return {
      kamar: { total: 0, terisi: 0, kosong: 0, okupansi: 0, vvip: { total: 0, terisi: 0 }, vip: { total: 0, terisi: 0 } },
      rekap: { totalBulanIni: 0, topDiagnosa: [] }
    };
  }
}

/**
 * MENGAMBIL DATA REKAP PASIEN (UNTUK GRAFIK)
 * @param {number} month - Bulan (1-12)
 * @param {number} year - Tahun
 */
function getRekapData(month, year) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetRekap = ss.getSheetByName(SHEET_NAME_REKAP);
    
    if (!sheetRekap) return [];
    
    const data = sheetRekap.getDataRange().getValues();
    const result = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        const tgl = new Date(data[i][0]);
        const matchMonth = !month || tgl.getMonth() + 1 === month;
        const matchYear = !year || tgl.getFullYear() === year;
        
        if (matchMonth && matchYear) {
          result.push({
            tanggal: Utilities.formatDate(tgl, 'Asia/Jakarta', 'dd/MM/yyyy'),
            noKamar: data[i][1],
            pasien: data[i][2],
            dokter: data[i][3],
            diagnosa: data[i][4],
            tipe: data[i][5] || 'VIP'
          });
        }
      }
    }
    
    return result;
    
  } catch (e) {
    console.error('Error getting rekap data:', e);
    return [];
  }
}

// ============================================
// FUNGSI INVENTARIS (BHP & ASET)
// ============================================

/**
 * MENGAMBIL DATA BHP/ATK
 */
function getBHPData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME_BHP);
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    return data.slice(1).map((row, index) => ({
      id: row[0] || index + 1,
      nama: row[1] || '',
      kategori: row[2] || '',
      jumlah: row[3] || 0,
      satuan: row[4] || '',
      kondisi: row[5] || 'Baik',
      keterangan: row[6] || '',
      _row: index + 2
    })).filter(item => item.nama);
    
  } catch (e) {
    console.error('Error getting BHP data:', e);
    return [];
  }
}

/**
 * MENGAMBIL DATA ASET & PERLENGKAPAN
 */
function getAsetData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME_ASET);
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    return data.slice(1).map((row, index) => ({
      id: row[0] || index + 1,
      nama: row[1] || '',
      kategori: row[2] || '',
      jumlah: row[3] || 0,
      lokasi: row[4] || '',
      kondisi: row[5] || 'Baik',
      keterangan: row[6] || '',
      _row: index + 2
    })).filter(item => item.nama);
    
  } catch (e) {
    console.error('Error getting aset data:', e);
    return [];
  }
}

/**
 * SIMPAN DATA INVENTARIS (BHP atau ASET)
 */
function saveInventarisData(type, data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetName = type === 'BHP' ? SHEET_NAME_BHP : SHEET_NAME_ASET;
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return { success: false, message: 'Sheet tidak ditemukan' };
    }
    
    if (data._row) {
      // Update existing
      const rowData = [data.id, data.nama, data.kategori, data.jumlah, data.satuan || data.lokasi, data.kondisi, data.keterangan];
      sheet.getRange(data._row, 1, 1, rowData.length).setValues([rowData]);
    } else {
      // Add new
      const lastRow = sheet.getLastRow();
      const newId = lastRow;
      const rowData = [newId, data.nama, data.kategori, data.jumlah, data.satuan || data.lokasi, data.kondisi, data.keterangan];
      sheet.appendRow(rowData);
    }
    
    return { success: true, message: 'Data berhasil disimpan' };
    
  } catch (e) {
    console.error('Error saving inventaris data:', e);
    return { success: false, message: 'Error: ' + e.toString() };
  }
}

// ============================================
// FUNGSI HELPER
// ============================================

/**
 * LOG AKTIVITAS (untuk debugging)
 */
function logActivity(action, target, status, detail) {
  const log = {
    timestamp: new Date().toISOString(),
    action: action,
    target: target,
    status: status,
    detail: detail,
    user: Session.getActiveUser().getEmail()
  };
  console.log(JSON.stringify(log));
}

/**
 * TEST KONEKSI
 */
function testConnection() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheets = ss.getSheets().map(s => s.getName());
    return {
      success: true,
      message: 'Koneksi berhasil',
      sheets: sheets
    };
  } catch (e) {
    return {
      success: false,
      message: 'Koneksi gagal: ' + e.toString(),
      sheets: []
    };
  }
}

/**
 * SETUP SHEET AWAL (jalankan sekali untuk membuat sheet)
 */
function setupSheets() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Create DataKamar sheet if not exists
    let sheetKamar = ss.getSheetByName(SHEET_NAME_KAMAR);
    if (!sheetKamar) {
      sheetKamar = ss.insertSheet(SHEET_NAME_KAMAR);
      sheetKamar.appendRow(['No_Kamar', 'Tipe', 'Status', 'Pasien', 'Dokter', 'Diagnosa']);
      // Add sample data
      const sampleKamar = [
        ['201', 'VVIP', 'Kosong', '', '', ''],
        ['202', 'VVIP', 'Kosong', '', '', ''],
        ['203', 'VIP', 'Kosong', '', '', ''],
        ['204', 'VIP', 'Kosong', '', '', ''],
        ['301', 'VIP', 'Kosong', '', '', ''],
        ['302', 'VIP', 'Kosong', '', '', ''],
        ['303', 'VIP', 'Kosong', '', '', ''],
        ['304', 'VIP', 'Kosong', '', '', '']
      ];
      sheetKamar.getRange(2, 1, sampleKamar.length, sampleKamar[0].length).setValues(sampleKamar);
    }
    
    // Create RekapPasien sheet if not exists
    let sheetRekap = ss.getSheetByName(SHEET_NAME_REKAP);
    if (!sheetRekap) {
      sheetRekap = ss.insertSheet(SHEET_NAME_REKAP);
      sheetRekap.appendRow(['Tanggal', 'No_Kamar', 'Pasien', 'Dokter', 'Diagnosa', 'Tipe']);
    }
    
    // Create BHP_ATK sheet if not exists
    let sheetBHP = ss.getSheetByName(SHEET_NAME_BHP);
    if (!sheetBHP) {
      sheetBHP = ss.insertSheet(SHEET_NAME_BHP);
      sheetBHP.appendRow(['ID', 'Nama', 'Kategori', 'Jumlah', 'Satuan', 'Kondisi', 'Keterangan']);
    }
    
    // Create Aset_Perlengkapan sheet if not exists
    let sheetAset = ss.getSheetByName(SHEET_NAME_ASET);
    if (!sheetAset) {
      sheetAset = ss.insertSheet(SHEET_NAME_ASET);
      sheetAset.appendRow(['ID', 'Nama', 'Kategori', 'Jumlah', 'Lokasi', 'Kondisi', 'Keterangan']);
    }
    
    return 'Setup selesai! Sheet yang tersedia: ' + ss.getSheets().map(s => s.getName()).join(', ');
    
  } catch (e) {
    return 'Error setup: ' + e.toString();
  }
}
