/**
 * =====================================================
 * SIPANURI - Sistem Pemantauan Paviliun Nuri
 * Code.gs (Backend - Google Apps Script)
 * Versi: 2.0
 * =====================================================
 */

/**
 * PENGATURAN DASAR
 * Untuk keamanan, sebaiknya simpan SPREADSHEET_ID di Script Properties
 * File > Project properties > Script properties > Add > SPREADSHEET_ID
 */
const SPREADSHEET_ID = '1xA-Ibsx5MnZXw9qvy_2vmfIkdZAL5yql3DPs-hNbxNg';
const SHEET_NAME_KAMAR = 'DataKamar';
const SHEET_NAME_BHP = 'BHP_ATK';
const SHEET_NAME_ASET = 'Aset_Perlengkapan';
const SHEET_NAME_REKAP = 'RekapPasien';
const SHEET_NAME_DOKTER = 'DokterDPJP';

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
 * INCLUDE FILE (untuk modular code)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// =====================================================
// MODUL: DATA KAMAR
// =====================================================

/**
 * MENGAMBIL DATA KAMAR
 * Dengan caching untuk performa lebih baik
 */
function getKamarData() {
  // Cek cache terlebih dahulu
  const cache = CacheService.getScriptCache();
  const cached = cache.get('kamarData');
  
  if (cached) {
    return JSON.parse(cached);
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
    const result = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Skip baris kosong
      if (!row[0]) continue;
      
      result.push({
        No_Kamar: String(row[0] || '').trim(),
        Tipe: String(row[1] || 'VIP').trim(),
        Status: String(row[2] || 'Kosong').trim(),
        Pasien: row[3] ? String(row[3]).trim() : null,
        Dokter: row[4] ? String(row[4]).trim() : null,
        Diagnosa: row[5] ? String(row[5]).trim() : null,
        Tanggal_Masuk: row[6] || null
      });
    }
    
    // Simpan ke cache selama 30 detik
    cache.put('kamarData', JSON.stringify(result), 30);
    
    return result;
    
  } catch (e) {
    console.error('Error getting kamar data:', e);
    return getDefaultKamarData();
  }
}

/**
 * SIMPAN DATA PASIEN
 * @param {string} noKamar - Nomor kamar
 * @param {string} status - Status kamar (Terisi/Kosong)
 * @param {string} pasien - Nama pasien
 * @param {string} dokter - Nama dokter DPJP
 * @param {string} diagnosa - Diagnosa pasien
 * @returns {object} Hasil operasi
 */
function savePatientData(noKamar, status, pasien, dokter, diagnosa) {
  try {
    // Validasi input
    if (!noKamar) {
      return { success: false, message: 'Nomor kamar wajib diisi' };
    }
    
    // Sanitasi input untuk mencegah injection
    noKamar = sanitizeInput(String(noKamar));
    status = sanitizeInput(String(status));
    pasien = pasien ? sanitizeInput(String(pasien)) : '';
    dokter = dokter ? sanitizeInput(String(dokter)) : '';
    diagnosa = diagnosa ? sanitizeInput(String(diagnosa)) : '';
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetKamar = ss.getSheetByName(SHEET_NAME_KAMAR);
    
    if (!sheetKamar) {
      return { success: false, message: 'Sheet DataKamar tidak ditemukan' };
    }
    
    const data = sheetKamar.getDataRange().getValues();
    let found = false;
    let rowData = null;
    let rowIndex = -1;
    
    // Cari kamar
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === noKamar) {
        rowIndex = i;
        rowData = data[i];
        found = true;
        break;
      }
    }
    
    if (!found) {
      return { success: false, message: 'Kamar nomor ' + noKamar + ' tidak ditemukan' };
    }
    
    // Update data kamar
    // Kolom: No_Kamar(1), Tipe(2), Status(3), Pasien(4), Dokter(5), Diagnosa(6), Tanggal_Masuk(7)
    const now = new Date();
    const tipe = rowData[1]; // Tipe kamar tetap sama
    
    // Jika status berubah dari Kosong ke Terisi, catat tanggal masuk
    // Jika status berubah dari Terisi ke Kosong, catat ke history dan reset
    const oldStatus = String(rowData[2] || '').trim();
    let tanggalMasuk = rowData[6];
    
    if (status === 'Terisi' && oldStatus !== 'Terisi') {
      tanggalMasuk = now;
    } else if (status === 'Kosong' && oldStatus === 'Terisi') {
      // Catat ke history keluar
      addToHistory('KELUAR', noKamar, rowData[3], rowData[4], rowData[5], rowData[6], now);
      tanggalMasuk = null;
      pasien = '';
      dokter = '';
      diagnosa = '';
    }
    
    // Update sheet
    sheetKamar.getRange(rowIndex + 1, 3, 1, 5).setValues([[
      status, 
      pasien, 
      dokter, 
      diagnosa,
      tanggalMasuk
    ]]);
    
    // Jika status Terisi dan data pasien baru, catat ke RekapPasien
    if (status === 'Terisi' && pasien) {
      const sheetRekap = ss.getSheetByName(SHEET_NAME_REKAP);
      if (sheetRekap) {
        sheetRekap.appendRow([
          now,           // Tanggal input
          noKamar, 
          pasien, 
          dokter, 
          diagnosa,
          'MASUK'        // Status: MASUK
        ]);
      }
      addToHistory('MASUK', noKamar, pasien, dokter, diagnosa, now, now);
    }
    
    // Hapus cache agar data terbaru diambil
    CacheService.getScriptCache().remove('kamarData');
    
    return { 
      success: true, 
      message: 'Data kamar ' + noKamar + ' berhasil diperbarui',
      data: {
        noKamar: noKamar,
        status: status
      }
    };
    
  } catch (e) {
    console.error('Error saving patient data:', e);
    return { success: false, message: 'Terjadi kesalahan: ' + e.toString() };
  }
}

/**
 * TAMBAH KE HISTORY
 */
function addToHistory(aksi, noKamar, pasien, dokter, diagnosa, tanggalMasuk, tanggalKeluar) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Cek apakah sheet History ada
    let sheetHistory = ss.getSheetByName('HistoryPasien');
    if (!sheetHistory) {
      // Buat sheet baru jika tidak ada
      sheetHistory = ss.insertSheet('HistoryPasien');
      sheetHistory.appendRow(['Timestamp', 'Aksi', 'No_Kamar', 'Pasien', 'Dokter', 'Diagnosa', 'Tgl_Masuk', 'Tgl_Keluar', 'Lama_Inap']);
    }
    
    // Hitung lama inap
    let lamaInap = '-';
    if (tanggalMasuk && tanggalKeluar && aksi === 'KELUAR') {
      const diff = new Date(tanggalKeluar) - new Date(tanggalMasuk);
      lamaInap = Math.ceil(diff / (1000 * 60 * 60 * 24)) + ' hari';
    }
    
    sheetHistory.appendRow([
      new Date(),
      aksi,
      noKamar,
      pasien || '-',
      dokter || '-',
      diagnosa || '-',
      tanggalMasuk || '-',
      tanggalKeluar || '-',
      lamaInap
    ]);
    
  } catch (e) {
    console.error('Error adding to history:', e);
  }
}

/**
 * HAPUS DATA PASIEN (Kosongkan Kamar)
 */
function clearKamarData(noKamar) {
  return savePatientData(noKamar, 'Kosong', '', '', '');
}

// =====================================================
// MODUL: STATISTIK & DASHBOARD
// =====================================================

/**
 * MENGAMBIL STATISTIK UNTUK DASHBOARD
 */
function getDashboardStats() {
  try {
    const kamarData = getKamarData();
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Statistik kamar
    const totalKamar = kamarData.length;
    const terisi = kamarData.filter(k => k.Status.toLowerCase() === 'terisi').length;
    const kosong = totalKamar - terisi;
    const okupansi = totalKamar > 0 ? Math.round((terisi / totalKamar) * 100) : 0;
    
    // Statistik per tipe
    const vvipRooms = kamarData.filter(k => k.Tipe.toUpperCase() === 'VVIP');
    const vipRooms = kamarData.filter(k => k.Tipe.toUpperCase() === 'VIP');
    const vvipTerisi = vvipRooms.filter(k => k.Status.toLowerCase() === 'terisi').length;
    const vipTerisi = vipRooms.filter(k => k.Status.toLowerCase() === 'terisi').length;
    
    // Statistik bulanan dari RekapPasien
    let totalBulanIni = 0;
    let topDiagnosa = [];
    
    const sheetRekap = ss.getSheetByName(SHEET_NAME_REKAP);
    if (sheetRekap) {
      const rekapData = sheetRekap.getDataRange().getValues();
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      let diagnosaCounts = {};
      
      for (let i = 1; i < rekapData.length; i++) {
        const tgl = rekapData[i][0];
        if (!tgl) continue;
        
        const tglDate = new Date(tgl);
        if (tglDate.getMonth() === currentMonth && tglDate.getFullYear() === currentYear) {
          totalBulanIni++;
          
          const diag = rekapData[i][4] || 'Tanpa Diagnosa';
          diagnosaCounts[diag] = (diagnosaCounts[diag] || 0) + 1;
        }
      }
      
      topDiagnosa = Object.entries(diagnosaCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(d => ({ diagnosa: d[0], jumlah: d[1] }));
    }
    
    return {
      kamar: {
        total: totalKamar,
        terisi: terisi,
        kosong: kosong,
        okupansi: okupansi,
        vvip: { total: vvipRooms.length, terisi: vvipTerisi },
        vip: { total: vipRooms.length, terisi: vipTerisi }
      },
      bulanan: {
        totalPasien: totalBulanIni,
        topDiagnosa: topDiagnosa
      }
    };
    
  } catch (e) {
    console.error('Error getting dashboard stats:', e);
    return {
      kamar: { total: 0, terisi: 0, kosong: 0, okupansi: 0, vvip: { total: 0, terisi: 0 }, vip: { total: 0, terisi: 0 } },
      bulanan: { totalPasien: 0, topDiagnosa: [] }
    };
  }
}

/**
 * MENGAMBIL HISTORY PASIEN
 * @param {number} limit - Jumlah data yang diambil
 * @param {string} filter - Filter (all, masuk, keluar)
 */
function getHistoryPasien(limit = 50, filter = 'all') {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('HistoryPasien');
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const result = [];
    
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      if (!row[0]) continue;
      
      const aksi = row[1];
      if (filter !== 'all' && aksi !== filter) continue;
      
      result.push({
        timestamp: row[0],
        aksi: aksi,
        noKamar: row[2],
        pasien: row[3],
        dokter: row[4],
        diagnosa: row[5],
        tglMasuk: row[6],
        tglKeluar: row[7],
        lamaInap: row[8]
      });
      
      if (result.length >= limit) break;
    }
    
    return result;
    
  } catch (e) {
    console.error('Error getting history:', e);
    return [];
  }
}

// =====================================================
// MODUL: INVENTARIS
// =====================================================

/**
 * MENGAMBIL DATA Bhp ATK
 */
function getBHPData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME_BHP);
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const result = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue;
      
      result.push({
        id: String(row[0]),
        nama: String(row[1] || ''),
        kategori: String(row[2] || ''),
        jumlah: Number(row[3]) || 0,
        satuan: String(row[4] || ''),
        kondisi: String(row[5] || ''),
        keterangan: row[6] || ''
      });
    }
    
    return result;
    
  } catch (e) {
    console.error('Error getting BHP data:', e);
    return [];
  }
}

/**
 * MENGAMBIL DATA ASET PERLENGKAPAN
 */
function getAsetData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME_ASET);
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const result = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue;
      
      result.push({
        id: String(row[0]),
        nama: String(row[1] || ''),
        kategori: String(row[2] || ''),
        jumlah: Number(row[3]) || 0,
        lokasi: String(row[4] || ''),
        kondisi: String(row[5] || ''),
        keterangan: row[6] || ''
      });
    }
    
    return result;
    
  } catch (e) {
    console.error('Error getting aset data:', e);
    return [];
  }
}

/**
 * SIMPAN DATA INVENTARIS
 */
function saveInventaris(tipe, data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetName = tipe === 'bhp' ? SHEET_NAME_BHP : SHEET_NAME_ASET;
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return { success: false, message: 'Sheet tidak ditemukan' };
    }
    
    if (data.id) {
      // Update existing
      const allData = sheet.getDataRange().getValues();
      let found = false;
      
      for (let i = 1; i < allData.length; i++) {
        if (String(allData[i][0]) === String(data.id)) {
          sheet.getRange(i + 1, 2, 1, 5).setValues([[
            data.nama, data.kategori, data.jumlah, data.satuan || data.lokasi, data.kondisi
          ]]);
          found = true;
          break;
        }
      }
      
      if (!found) {
        return { success: false, message: 'Item tidak ditemukan' };
      }
    } else {
      // Add new
      const newId = 'INV-' + new Date().getTime();
      sheet.appendRow([newId, data.nama, data.kategori, data.jumlah, data.satuan || data.lokasi, data.kondisi, '']);
    }
    
    return { success: true, message: 'Data berhasil disimpan' };
    
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// =====================================================
// MODUL: DOKTER DPJP
// =====================================================

/**
 * MENGAMBIL LIST DOKTER DPJP
 */
function getDokterList() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME_DOKTER);
    
    if (!sheet) return getDefaultDokter();
    
    const data = sheet.getDataRange().getValues();
    const result = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        result.push({
          id: data[i][0],
          nama: data[i][1],
          spesialis: data[i][2] || ''
        });
      }
    }
    
    return result.length > 0 ? result : getDefaultDokter();
    
  } catch (e) {
    return getDefaultDokter();
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * DATA DEFAULT KAMAR (FALLBACK)
 */
function getDefaultKamarData() {
  return [
    { No_Kamar: "201", Tipe: "VVIP", Status: "Kosong", Pasien: null, Dokter: null, Diagnosa: null },
    { No_Kamar: "202", Tipe: "VVIP", Status: "Kosong", Pasien: null, Dokter: null, Diagnosa: null },
    { No_Kamar: "203", Tipe: "VIP", Status: "Kosong", Pasien: null, Dokter: null, Diagnosa: null },
    { No_Kamar: "204", Tipe: "VIP", Status: "Kosong", Pasien: null, Dokter: null, Diagnosa: null },
    { No_Kamar: "205", Tipe: "VIP", Status: "Kosong", Pasien: null, Dokter: null, Diagnosa: null },
    { No_Kamar: "301", Tipe: "VIP", Status: "Kosong", Pasien: null, Dokter: null, Diagnosa: null },
    { No_Kamar: "302", Tipe: "VIP", Status: "Kosong", Pasien: null, Dokter: null, Diagnosa: null },
    { No_Kamar: "303", Tipe: "VIP", Status: "Kosong", Pasien: null, Dokter: null, Diagnosa: null }
  ];
}

/**
 * DATA DEFAULT DOKTER
 */
function getDefaultDokter() {
  return [
    { id: 'DR001', nama: 'dr. Ahmad Subari, Sp.PD', spesialis: 'Penyakit Dalam' },
    { id: 'DR002', nama: 'dr. Budi Santoso, Sp.JP', spesialis: 'Jantung' },
    { id: 'DR003', nama: 'dr. Citra Dewi, Sp.A', spesialis: 'Anak' }
  ];
}

/**
 * SANITASI INPUT UNTUK KEAMANAN
 */
function sanitizeInput(str) {
  if (!str) return '';
  return String(str)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim();
}

/**
 * FORMAT TANGGAL INDONESIA
 */
function formatTanggal(date) {
  if (!date) return '-';
  
  const d = new Date(date);
  const options = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  };
  
  return d.toLocaleDateString('id-ID', options);
}

/**
 * TEST FUNCTION (untuk debugging)
 */
function testFunction() {
  console.log('=== TEST GET KAMAR DATA ===');
  console.log(JSON.stringify(getKamarData(), null, 2));
  
  console.log('\n=== TEST DASHBOARD STATS ===');
  console.log(JSON.stringify(getDashboardStats(), null, 2));
}
