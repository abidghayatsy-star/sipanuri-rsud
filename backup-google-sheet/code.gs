/**
 * =====================================================
 * SIPANURI - Backup Data ke Google Sheet
 * Sistem Pemantauan Paviliun Nuri
 * RSUD Aji Muhammad Parikesit
 * =====================================================
 * 
 * CARA PENGGUNAAN:
 * 1. Buka Google Sheets baru → Extensions → Apps Script
 * 2. Hapus semua kode yang ada
 * 3. Copy-paste seluruh file ini
 * 4. Simpan (Ctrl+S)
 * 5. Jalankan fungsi "setupSpreadsheet"
 * 6. Jalankan fungsi "syncAllData"
 */

// =====================================================
// KONFIGURASI - GANTI DENGAN URL ANDA SETELAH DEPLOY
// =====================================================
// Untuk testing, biarkan localhost (akan gunakan sample data)
// Setelah deploy ke Vercel/server, ganti dengan URL production

const API_URL = 'http://localhost:3000/api/sipanuri/export'

// Nama spreadsheet
const SPREADSHEET_NAME = 'SIPANURI Backup Data'

// =====================================================
// NAMA SHEET
// =====================================================
const SHEETS = {
  DASHBOARD: 'Dashboard',
  KAMAR: 'Data Kamar',
  HISTORY: 'Riwayat Pasien',
  DOKTER: 'Data Dokter',
  BHP_ATK: 'BHP ATK',
  STOK_HISTORY: 'Riwayat Stok',
  ASET: 'Data Aset',
  PEMINJAMAN: 'Peminjaman Aset'
}

// =====================================================
// WARNA
// =====================================================
const COLORS = {
  HEADER_BG: '#1e3a5f',
  HEADER_TEXT: '#ffffff',
  TEAL: '#0d9488',
  AMBER: '#d97706',
  LIGHT_GRAY: '#f1f5f9',
  SUCCESS: '#10b981',
  DANGER: '#ef4444',
}

// =====================================================
// MENU CUSTOM - Muncul saat spreadsheet dibuka
// =====================================================
function onOpen() {
  const ui = SpreadsheetApp.getUi()
  ui.createMenu('🔄 SIPANURI')
    .addItem('📊 Setup Spreadsheet', 'setupSpreadsheet')
    .addItem('🔄 Sync Data', 'syncAllData')
    .addSeparator()
    .addItem('🧪 Test Koneksi API', 'testApiConnection')
    .addSeparator()
    .addItem('📄 Export ke PDF', 'exportToPdf')
    .addItem('📁 Backup ke JSON', 'backupToJson')
    .addToUi()
}

// =====================================================
// SETUP SPREADSHEET - Jalankan pertama kali
// =====================================================
function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  
  // Rename default sheet to Dashboard
  const defaultSheet = ss.getActiveSheet()
  if (defaultSheet.getName() === 'Sheet1') {
    defaultSheet.setName(SHEETS.DASHBOARD)
  }
  
  // Create all sheets
  Object.values(SHEETS).forEach(name => {
    let sheet = ss.getSheetByName(name)
    if (!sheet) {
      ss.insertSheet(name)
    }
  })
  
  // Delete Sheet1 if exists
  const sheet1 = ss.getSheetByName('Sheet1')
  if (sheet1) {
    ss.deleteSheet(sheet1)
  }
  
  // Setup Dashboard
  setupDashboard()
  
  // Setup headers for each sheet
  setupSheetHeaders()
  
  SpreadsheetApp.getActiveSpreadsheet().toast('✅ Setup selesai! Jalankan "Sync Data" untuk mengisi data.')
}

// =====================================================
// SETUP DASHBOARD
// =====================================================
function setupDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName(SHEETS.DASHBOARD)
  
  sheet.clear()
  
  // Title
  sheet.mergeCells('A1:F1')
  sheet.getRange('A1')
    .setValue('🏥 SIPANURI - Sistem Pemantauan Paviliun Nuri')
    .setFontSize(18)
    .setFontWeight('bold')
    .setForegroundColor(COLORS.HEADER_BG)
    .setHorizontalAlignment('center')
  
  // Subtitle
  sheet.mergeCells('A2:F2')
  sheet.getRange('A2')
    .setValue('RSUD Aji Muhammad Parikesit - Backup Data')
    .setFontSize(11)
    .setForegroundColor(COLORS.TEAL)
    .setHorizontalAlignment('center')
  
  // Last sync
  sheet.mergeCells('A3:F3')
  sheet.getRange('A3')
    .setValue('Last Sync: -')
    .setFontSize(10)
    .setForegroundColor('#64748b')
    .setHorizontalAlignment('center')
  
  // Stats section title
  sheet.mergeCells('A5:F5')
  sheet.getRange('A5')
    .setValue('📊 RINGKASAN DATA')
    .setFontSize(14)
    .setFontWeight('bold')
    .setForegroundColor(COLORS.HEADER_BG)
  
  // Stats labels and values
  const statsLabels = [
    { label: 'Total Kamar', cell: 'A7', valueCell: 'B7', color: COLORS.TEAL },
    { label: 'Kamar Terisi', cell: 'A8', valueCell: 'B8', color: COLORS.SUCCESS },
    { label: 'Kamar Kosong', cell: 'A9', valueCell: 'B9', color: COLORS.DANGER },
    { label: 'Pasien Masuk', cell: 'A10', valueCell: 'B10', color: null },
    { label: 'Pasien Keluar', cell: 'A11', valueCell: 'B11', color: null },
    { label: 'Total Dokter', cell: 'A12', valueCell: 'B12', color: COLORS.TEAL },
    { label: 'Total BHP ATK', cell: 'A13', valueCell: 'B13', color: null },
    { label: 'Total Aset', cell: 'A14', valueCell: 'B14', color: null },
    { label: 'Peminjaman Aktif', cell: 'A15', valueCell: 'B15', color: COLORS.AMBER },
  ]
  
  statsLabels.forEach(item => {
    sheet.getRange(item.cell).setValue(item.label).setFontWeight('bold').setFontSize(11)
    sheet.getRange(item.valueCell).setValue('0').setFontSize(16).setFontWeight('bold')
    if (item.color) {
      sheet.getRange(item.valueCell).setForegroundColor(item.color)
    }
  })
  
  // Column widths
  sheet.setColumnWidth(1, 180)
  sheet.setColumnWidth(2, 120)
  sheet.setColumnWidth(3, 180)
  sheet.setColumnWidth(4, 120)
  sheet.setColumnWidth(5, 180)
  sheet.setColumnWidth(6, 120)
  
  // Set row heights
  sheet.setRowHeight(1, 30)
  sheet.setRowHeight(2, 20)
}

// =====================================================
// SETUP SHEET HEADERS
// =====================================================
function setupSheetHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  
  const headersConfig = {
    [SHEETS.KAMAR]: ['No Kamar', 'Tipe', 'Status', 'Pasien', 'Dokter', 'Diagnosa', 'Tanggal Masuk', 'Created At', 'Updated At'],
    [SHEETS.HISTORY]: ['Timestamp', 'Aksi', 'No Kamar', 'Pasien', 'Dokter', 'Diagnosa', 'Tanggal Masuk', 'Tanggal Keluar', 'Lama Inap'],
    [SHEETS.DOKTER]: ['Nama', 'Spesialis', 'Created At', 'Updated At'],
    [SHEETS.BHP_ATK]: ['Nama', 'Kategori', 'Stok Awal', 'Stok Masuk', 'Stok Keluar', 'Sisa Stok', 'Satuan', 'Kondisi', 'Created At', 'Updated At'],
    [SHEETS.STOK_HISTORY]: ['BHP ID', 'Jenis', 'Jumlah', 'Keterangan', 'Tanggal', 'Petugas'],
    [SHEETS.ASET]: ['Nama', 'Kategori', 'Jumlah', 'Lokasi', 'Kondisi', 'Created At', 'Updated At'],
    [SHEETS.PEMINJAMAN]: ['Nama Aset', 'Jumlah', 'Peminjam', 'Unit', 'Tujuan', 'Tanggal Pinjam', 'Tanggal Kembali', 'Status', 'Catatan'],
  }
  
  Object.keys(headersConfig).forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName)
    if (sheet) {
      sheet.clear()
      
      const headers = headersConfig[sheetName]
      sheet.getRange(1, 1, 1, headers.length).setValues([headers])
      
      const headerRange = sheet.getRange(1, 1, 1, headers.length)
      headerRange
        .setBackground(COLORS.HEADER_BG)
        .setForegroundColor(COLORS.HEADER_TEXT)
        .setFontWeight('bold')
        .setHorizontalAlignment('center')
        .setFontSize(11)
      
      sheet.setFrozenRows(1)
      sheet.autoResizeColumns(1, headers.length)
    }
  })
}

// =====================================================
// SYNC ALL DATA - Fungsi utama untuk sync
// =====================================================
function syncAllData() {
  SpreadsheetApp.getActiveSpreadsheet().toast('🔄 Memulai sinkronisasi data...')
  
  try {
    const response = fetchApiData()
    
    if (response && response.success) {
      const data = response.data
      
      syncSheetData(SHEETS.KAMAR, data.kamar)
      syncSheetData(SHEETS.HISTORY, data.history)
      syncSheetData(SHEETS.DOKTER, data.dokter)
      syncSheetData(SHEETS.BHP_ATK, data.bhpAtk)
      syncSheetData(SHEETS.STOK_HISTORY, data.stokHistory)
      syncSheetData(SHEETS.ASET, data.aset)
      syncSheetData(SHEETS.PEMINJAMAN, data.peminjaman)
      
      updateDashboard(data.stats)
      
      const ss = SpreadsheetApp.getActiveSpreadsheet()
      const dashboardSheet = ss.getSheetByName(SHEETS.DASHBOARD)
      dashboardSheet.getRange('A3').setValue('Last Sync: ' + new Date().toLocaleString('id-ID'))
      
      SpreadsheetApp.getActiveSpreadsheet().toast('✅ Sinkronisasi selesai!')
    } else {
      throw new Error('API tidak merespons dengan benar')
    }
    
  } catch (error) {
    Logger.log('Error: ' + error.toString())
    SpreadsheetApp.getActiveSpreadsheet().toast('⚠️ API tidak tersedia, memuat sample data...')
    loadSampleData()
  }
}

// =====================================================
// FETCH API DATA
// =====================================================
function fetchApiData() {
  const options = {
    'method': 'get',
    'contentType': 'application/json',
    'muteHttpExceptions': true
  }
  
  try {
    const response = UrlFetchApp.fetch(API_URL, options)
    const responseCode = response.getResponseCode()
    
    Logger.log('API Response Code: ' + responseCode)
    
    if (responseCode === 200) {
      return JSON.parse(response.getContentText())
    } else {
      Logger.log('API Error: ' + response.getContentText())
      return null
    }
  } catch (error) {
    Logger.log('Fetch Error: ' + error.toString())
    return null
  }
}

// =====================================================
// SYNC SHEET DATA
// =====================================================
function syncSheetData(sheetName, data) {
  if (!data || data.length === 0) {
    Logger.log('No data for sheet: ' + sheetName)
    return
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName(sheetName)
  
  if (!sheet) {
    Logger.log('Sheet not found: ' + sheetName)
    return
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  
  // Clear existing data (keep headers)
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1)
  }
  
  // Prepare data rows
  const rows = data.map(item => {
    return headers.map(header => item[header] || '')
  })
  
  // Add data to sheet
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows)
    
    // Alternating row colors
    for (let i = 2; i <= rows.length + 1; i++) {
      const range = sheet.getRange(i, 1, 1, headers.length)
      if (i % 2 === 0) {
        range.setBackgroundColor(COLORS.LIGHT_GRAY)
      }
    }
  }
  
  sheet.autoResizeColumns(1, headers.length)
  Logger.log('Synced ' + rows.length + ' rows to ' + sheetName)
}

// =====================================================
// UPDATE DASHBOARD
// =====================================================
function updateDashboard(stats) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName(SHEETS.DASHBOARD)
  
  sheet.getRange('B7').setValue(stats.totalKamar)
  sheet.getRange('B8').setValue(stats.kamarTerisi)
  sheet.getRange('B9').setValue(stats.kamarKosong)
  sheet.getRange('B10').setValue(stats.totalPasienMasuk)
  sheet.getRange('B11').setValue(stats.totalPasienKeluar)
  sheet.getRange('B12').setValue(stats.totalDokter)
  sheet.getRange('B13').setValue(stats.totalBhpAtk)
  sheet.getRange('B14').setValue(stats.totalAset)
  sheet.getRange('B15').setValue(stats.peminjamanAktif)
}

// =====================================================
// SAMPLE DATA - Untuk testing tanpa API
// =====================================================
function loadSampleData() {
  Logger.log('Loading sample data...')
  
  const sampleData = {
    kamar: [
      { 'No Kamar': '201', 'Tipe': 'VIP', 'Status': 'Kosong', 'Pasien': '', 'Dokter': '', 'Diagnosa': '', 'Tanggal Masuk': '', 'Created At': '', 'Updated At': '' },
      { 'No Kamar': '202', 'Tipe': 'VIP', 'Status': 'Terisi', 'Pasien': 'Ahmad Sudirman', 'Dokter': 'Dr. Andi Pratama', 'Diagnosa': 'Demam Typhoid', 'Tanggal Masuk': '01/02/2026 08:00:00', 'Created At': '01/02/2026', 'Updated At': '01/02/2026' },
      { 'No Kamar': '203', 'Tipe': 'VIP', 'Status': 'Kosong', 'Pasien': '', 'Dokter': '', 'Diagnosa': '', 'Tanggal Masuk': '', 'Created At': '', 'Updated At': '' },
      { 'No Kamar': '204', 'Tipe': 'VIP', 'Status': 'Terisi', 'Pasien': 'Siti Aminah', 'Dokter': 'Dr. Budi Santoso', 'Diagnosa': 'Diabetes Mellitus', 'Tanggal Masuk': '02/02/2026 10:00:00', 'Created At': '02/02/2026', 'Updated At': '02/02/2026' },
      { 'No Kamar': '205', 'Tipe': 'VIP', 'Status': 'Kosong', 'Pasien': '', 'Dokter': '', 'Diagnosa': '', 'Tanggal Masuk': '', 'Created At': '', 'Updated At': '' },
      { 'No Kamar': '206', 'Tipe': 'VIP', 'Status': 'Kosong', 'Pasien': '', 'Dokter': '', 'Diagnosa': '', 'Tanggal Masuk': '', 'Created At': '', 'Updated At': '' },
      { 'No Kamar': '207', 'Tipe': 'VIP', 'Status': 'Kosong', 'Pasien': '', 'Dokter': '', 'Diagnosa': '', 'Tanggal Masuk': '', 'Created At': '', 'Updated At': '' },
      { 'No Kamar': '208', 'Tipe': 'VIP', 'Status': 'Kosong', 'Pasien': '', 'Dokter': '', 'Diagnosa': '', 'Tanggal Masuk': '', 'Created At': '', 'Updated At': '' },
      { 'No Kamar': '209', 'Tipe': 'VIP', 'Status': 'Kosong', 'Pasien': '', 'Dokter': '', 'Diagnosa': '', 'Tanggal Masuk': '', 'Created At': '', 'Updated At': '' },
      { 'No Kamar': '210', 'Tipe': 'VIP', 'Status': 'Kosong', 'Pasien': '', 'Dokter': '', 'Diagnosa': '', 'Tanggal Masuk': '', 'Created At': '', 'Updated At': '' },
      { 'No Kamar': '301', 'Tipe': 'VVIP', 'Status': 'Terisi', 'Pasien': 'H. Muhammad Rizki', 'Dokter': 'Dr. Andi Pratama', 'Diagnosa': 'Stroke', 'Tanggal Masuk': '03/02/2026 14:00:00', 'Created At': '03/02/2026', 'Updated At': '03/02/2026' },
      { 'No Kamar': '302', 'Tipe': 'VIP', 'Status': 'Kosong', 'Pasien': '', 'Dokter': '', 'Diagnosa': '', 'Tanggal Masuk': '', 'Created At': '', 'Updated At': '' },
      { 'No Kamar': '303', 'Tipe': 'VIP', 'Status': 'Kosong', 'Pasien': '', 'Dokter': '', 'Diagnosa': '', 'Tanggal Masuk': '', 'Created At': '', 'Updated At': '' },
      { 'No Kamar': '304', 'Tipe': 'VIP', 'Status': 'Kosong', 'Pasien': '', 'Dokter': '', 'Diagnosa': '', 'Tanggal Masuk': '', 'Created At': '', 'Updated At': '' },
      { 'No Kamar': '305', 'Tipe': 'VIP', 'Status': 'Kosong', 'Pasien': '', 'Dokter': '', 'Diagnosa': '', 'Tanggal Masuk': '', 'Created At': '', 'Updated At': '' },
      { 'No Kamar': '306', 'Tipe': 'VVIP', 'Status': 'Kosong', 'Pasien': '', 'Dokter': '', 'Diagnosa': '', 'Tanggal Masuk': '', 'Created At': '', 'Updated At': '' },
      { 'No Kamar': '307', 'Tipe': 'VIP', 'Status': 'Kosong', 'Pasien': '', 'Dokter': '', 'Diagnosa': '', 'Tanggal Masuk': '', 'Created At': '', 'Updated At': '' },
      { 'No Kamar': '308', 'Tipe': 'VIP', 'Status': 'Kosong', 'Pasien': '', 'Dokter': '', 'Diagnosa': '', 'Tanggal Masuk': '', 'Created At': '', 'Updated At': '' },
      { 'No Kamar': '309', 'Tipe': 'VIP', 'Status': 'Kosong', 'Pasien': '', 'Dokter': '', 'Diagnosa': '', 'Tanggal Masuk': '', 'Created At': '', 'Updated At': '' },
      { 'No Kamar': '310', 'Tipe': 'VIP', 'Status': 'Kosong', 'Pasien': '', 'Dokter': '', 'Diagnosa': '', 'Tanggal Masuk': '', 'Created At': '', 'Updated At': '' },
    ],
    history: [
      { 'Timestamp': '03/02/2026 14:00:00', 'Aksi': 'MASUK', 'No Kamar': '301', 'Pasien': 'H. Muhammad Rizki', 'Dokter': 'Dr. Andi Pratama', 'Diagnosa': 'Stroke', 'Tanggal Masuk': '03/02/2026', 'Tanggal Keluar': '', 'Lama Inap': '' },
      { 'Timestamp': '02/02/2026 10:00:00', 'Aksi': 'MASUK', 'No Kamar': '204', 'Pasien': 'Siti Aminah', 'Dokter': 'Dr. Budi Santoso', 'Diagnosa': 'Diabetes Mellitus', 'Tanggal Masuk': '02/02/2026', 'Tanggal Keluar': '', 'Lama Inap': '' },
      { 'Timestamp': '01/02/2026 08:00:00', 'Aksi': 'MASUK', 'No Kamar': '202', 'Pasien': 'Ahmad Sudirman', 'Dokter': 'Dr. Andi Pratama', 'Diagnosa': 'Demam Typhoid', 'Tanggal Masuk': '01/02/2026', 'Tanggal Keluar': '', 'Lama Inap': '' },
    ],
    dokter: [
      { 'Nama': 'Dr. Andi Pratama', 'Spesialis': 'Spesialis Penyakit Dalam', 'Created At': '01/01/2026', 'Updated At': '01/01/2026' },
      { 'Nama': 'Dr. Budi Santoso', 'Spesialis': 'Spesialis Jantung', 'Created At': '01/01/2026', 'Updated At': '01/01/2026' },
      { 'Nama': 'Dr. Citra Dewi', 'Spesialis': 'Spesialis Anak', 'Created At': '01/01/2026', 'Updated At': '01/01/2026' },
    ],
    bhpAtk: [
      { 'Nama': 'Sarung Tangan Medis', 'Kategori': 'BHP', 'Stok Awal': 500, 'Stok Masuk': 200, 'Stok Keluar': 150, 'Sisa Stok': 550, 'Satuan': 'Pasang', 'Kondisi': 'Baik', 'Created At': '01/01/2026', 'Updated At': '03/02/2026' },
      { 'Nama': 'Masker 3 Ply', 'Kategori': 'BHP', 'Stok Awal': 1000, 'Stok Masuk': 500, 'Stok Keluar': 300, 'Sisa Stok': 1200, 'Satuan': 'Pcs', 'Kondisi': 'Baik', 'Created At': '01/01/2026', 'Updated At': '03/02/2026' },
      { 'Nama': 'Kapas Steril', 'Kategori': 'BHP', 'Stok Awal': 100, 'Stok Masuk': 50, 'Stok Keluar': 30, 'Sisa Stok': 120, 'Satuan': 'Roll', 'Kondisi': 'Baik', 'Created At': '01/01/2026', 'Updated At': '03/02/2026' },
      { 'Nama': 'Kertas HVS A4', 'Kategori': 'ATK', 'Stok Awal': 20, 'Stok Masuk': 10, 'Stok Keluar': 5, 'Sisa Stok': 25, 'Satuan': 'Rim', 'Kondisi': 'Baik', 'Created At': '01/01/2026', 'Updated At': '03/02/2026' },
      { 'Nama': 'Pulpen', 'Kategori': 'ATK', 'Stok Awal': 50, 'Stok Masuk': 24, 'Stok Keluar': 10, 'Sisa Stok': 64, 'Satuan': 'Pcs', 'Kondisi': 'Baik', 'Created At': '01/01/2026', 'Updated At': '03/02/2026' },
    ],
    stokHistory: [
      { 'BHP ID': 'BHP001', 'Jenis': 'MASUK', 'Jumlah': 200, 'Keterangan': 'Pengadaan bulanan', 'Tanggal': '01/02/2026', 'Petugas': 'Admin Apotek' },
      { 'BHP ID': 'BHP001', 'Jenis': 'KELUAR', 'Jumlah': 150, 'Keterangan': 'Pemakaian rutin', 'Tanggal': '02/02/2026', 'Petugas': 'Perawat' },
      { 'BHP ID': 'BHP002', 'Jenis': 'MASUK', 'Jumlah': 500, 'Keterangan': 'Pengadaan bulanan', 'Tanggal': '01/02/2026', 'Petugas': 'Admin Apotek' },
    ],
    aset: [
      { 'Nama': 'Tempat Tidur Pasien', 'Kategori': 'Furniture', 'Jumlah': 20, 'Lokasi': 'Paviliun Nuri', 'Kondisi': 'Baik', 'Created At': '01/01/2026', 'Updated At': '01/01/2026' },
      { 'Nama': 'Monitor Pasien', 'Kategori': 'Elektronik', 'Jumlah': 10, 'Lokasi': 'Paviliun Nuri', 'Kondisi': 'Baik', 'Created At': '01/01/2026', 'Updated At': '01/01/2026' },
      { 'Nama': 'Infus Pump', 'Kategori': 'Medis', 'Jumlah': 8, 'Lokasi': 'Paviliun Nuri', 'Kondisi': 'Baik', 'Created At': '01/01/2026', 'Updated At': '01/01/2026' },
      { 'Nama': 'Wheelchair', 'Kategori': 'Furniture', 'Jumlah': 5, 'Lokasi': 'Paviliun Nuri', 'Kondisi': 'Baik', 'Created At': '01/01/2026', 'Updated At': '01/01/2026' },
      { 'Nama': 'AC Split', 'Kategori': 'Elektronik', 'Jumlah': 20, 'Lokasi': 'Paviliun Nuri', 'Kondisi': 'Baik', 'Created At': '01/01/2026', 'Updated At': '01/01/2026' },
    ],
    peminjaman: [
      { 'Nama Aset': 'Monitor Pasien', 'Jumlah': 1, 'Peminjam': 'Dr. Andi Pratama', 'Unit': 'IGD', 'Tujuan': 'Monitoring pasien darurat', 'Tanggal Pinjam': '01/02/2026', 'Tanggal Kembali': '', 'Status': 'Dipinjam', 'Catatan': 'Dipinjam sementara' },
      { 'Nama Aset': 'Wheelchair', 'Jumlah': 1, 'Peminjam': 'Perawat Siti', 'Unit': 'Rawat Jalan', 'Tujuan': 'Antar pasien', 'Tanggal Pinjam': '02/02/2026', 'Tanggal Kembali': '02/02/2026', 'Status': 'Dikembalikan', 'Catatan': '' },
    ],
    stats: {
      totalKamar: 20,
      kamarTerisi: 3,
      kamarKosong: 17,
      totalPasienMasuk: 3,
      totalPasienKeluar: 0,
      totalDokter: 3,
      totalBhpAtk: 5,
      totalAset: 5,
      peminjamanAktif: 1,
      lastUpdated: new Date().toLocaleString('id-ID'),
    }
  }
  
  // Sync each sheet with sample data
  syncSheetData(SHEETS.KAMAR, sampleData.kamar)
  syncSheetData(SHEETS.HISTORY, sampleData.history)
  syncSheetData(SHEETS.DOKTER, sampleData.dokter)
  syncSheetData(SHEETS.BHP_ATK, sampleData.bhpAtk)
  syncSheetData(SHEETS.STOK_HISTORY, sampleData.stokHistory)
  syncSheetData(SHEETS.ASET, sampleData.aset)
  syncSheetData(SHEETS.PEMINJAMAN, sampleData.peminjaman)
  
  updateDashboard(sampleData.stats)
  
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const dashboardSheet = ss.getSheetByName(SHEETS.DASHBOARD)
  dashboardSheet.getRange('A3').setValue('Last Sync: ' + new Date().toLocaleString('id-ID') + ' (Sample Data)')
  
  SpreadsheetApp.getActiveSpreadsheet().toast('✅ Sample data dimuat! Ganti API_URL untuk data real.')
}

// =====================================================
// TEST KONEKSI API
// =====================================================
function testApiConnection() {
  Logger.log('Testing API: ' + API_URL)
  SpreadsheetApp.getActiveSpreadsheet().toast('🔄 Testing koneksi ke ' + API_URL + '...')
  
  try {
    const response = UrlFetchApp.fetch(API_URL, { muteHttpExceptions: true })
    const code = response.getResponseCode()
    
    Logger.log('Response Code: ' + code)
    Logger.log('Response: ' + response.getContentText().substring(0, 500))
    
    if (code === 200) {
      SpreadsheetApp.getActiveSpreadsheet().toast('✅ API terhubung! Response: 200 OK')
    } else {
      SpreadsheetApp.getActiveSpreadsheet().toast('❌ API Error: HTTP ' + code)
    }
  } catch (error) {
    Logger.log('Error: ' + error.toString())
    SpreadsheetApp.getActiveSpreadsheet().toast('❌ Gagal konek: ' + error.toString().substring(0, 50))
  }
}

// =====================================================
// EXPORT KE PDF
// =====================================================
function exportToPdf() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?exportFormat=pdf&format=pdf'
  
  const options = {
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
    }
  }
  
  const response = UrlFetchApp.fetch(url, options)
  const blob = response.getBlob().setName('SIPANURI_Backup_' + new Date().toISOString().split('T')[0] + '.pdf')
  
  DriveApp.createFile(blob)
  SpreadsheetApp.getActiveSpreadsheet().toast('✅ PDF dibuat di Google Drive!')
}

// =====================================================
// BACKUP KE JSON
// =====================================================
function backupToJson() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const data = {}
  
  Object.values(SHEETS).forEach(sheetName => {
    if (sheetName === SHEETS.DASHBOARD) return
    
    const sheet = ss.getSheetByName(sheetName)
    if (sheet && sheet.getLastRow() > 1) {
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues()
      
      data[sheetName] = rows.map(row => {
        const obj = {}
        headers.forEach((header, i) => {
          obj[header] = row[i]
        })
        return obj
      })
    }
  })
  
  const json = JSON.stringify(data, null, 2)
  const blob = Utilities.newBlob(json, 'application/json', 'SIPANURI_Backup_' + new Date().toISOString().split('T')[0] + '.json')
  
  DriveApp.createFile(blob)
  SpreadsheetApp.getActiveSpreadsheet().toast('✅ JSON backup dibuat di Google Drive!')
}

// =====================================================
// SETUP TRIGGER OTOMATIS (opsional)
// =====================================================
function createDailyTrigger() {
  // Hapus trigger lama
  const triggers = ScriptApp.getProjectTriggers()
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'syncAllData') {
      ScriptApp.deleteTrigger(trigger)
    }
  })
  
  // Buat trigger baru - setiap hari jam 23:00
  ScriptApp.newTrigger('syncAllData')
    .timeBased()
    .atHour(23)
    .everyDays(1)
    .create()
  
  SpreadsheetApp.getActiveSpreadsheet().toast('✅ Trigger harian dibuat (jam 23:00)')
}

function removeTriggers() {
  const triggers = ScriptApp.getProjectTriggers()
  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger)
  })
  SpreadsheetApp.getActiveSpreadsheet().toast('✅ Semua trigger dihapus')
}
