# SIPANURI - Dokumentasi Lengkap
## Sistem Pemantauan Paviliun Nuri

---

## 📁 Struktur File

```
Google Apps Script Project
├── Code.gs          (Backend - sudah diperbaiki)
├── SIPANURI.html    (Frontend - sudah diperbaiki)
└── Spreadsheet      (Database)
    ├── DataKamar
    ├── BHP_ATK
    ├── Aset_Perlengkapan
    ├── RekapPasien
    ├── HistoryPasien
    └── DokterDPJP
```

---

## 📊 Struktur Spreadsheet

### 1. Sheet: DataKamar
Struktur data kamar utama.

| Kolom | Nama | Tipe | Keterangan |
|-------|------|------|------------|
| A | No_Kamar | Text | Nomor kamar (201, 202, 301, dll) |
| B | Tipe | Text | VVIP atau VIP |
| C | Status | Text | Terisi atau Kosong |
| D | Pasien | Text | Nama pasien (null jika kosong) |
| E | Dokter | Text | Nama dokter DPJP |
| F | Diagnosa | Text | Diagnosa pasien |
| G | Tanggal_Masuk | Date | Tanggal masuk pasien |

**Contoh Data:**
```
| No_Kamar | Tipe | Status | Pasien     | Dokter             | Diagnosa      | Tanggal_Masuk |
|----------|------|--------|------------|--------------------|---------------|---------------|
| 201      | VVIP | Terisi | John Doe   | dr. Ahmad, Sp.PD   | Demam Thypoid | 15/01/2024    |
| 202      | VVIP | Kosong |            |                    |               |               |
| 203      | VIP  | Terisi | Jane Doe   | dr. Budi, Sp.JP    | Hipertensi    | 14/01/2024    |
| 204      | VIP  | Kosong |            |                    |               |               |
| 301      | VIP  | Terisi | Ahmad      | dr. Citra, Sp.A    | Diare         | 16/01/2024    |
| 302      | VIP  | Kosong |            |                    |               |               |
| 303      | VIP  | Kosong |            |                    |               |               |
```

---

### 2. Sheet: BHP_ATK
Data inventaris Bahan Habis Pakai dan Alat Tulis Kantor.

| Kolom | Nama | Tipe | Keterangan |
|-------|------|------|------------|
| A | id | Text | ID unik item |
| B | nama | Text | Nama barang |
| C | kategori | Text | Kategori (ATK, Medis, dll) |
| D | jumlah | Number | Jumlah stok |
| E | satuan | Text | Satuan (pcs, box, dll) |
| F | kondisi | Text | Baik, Rusak, Perlu Perbaikan |
| G | keterangan | Text | Catatan tambahan |

**Contoh Data:**
```
| id       | nama           | kategori | jumlah | satuan | kondisi | keterangan |
|----------|----------------|----------|--------|--------|---------|------------|
| BHP-001  | Kertas A4      | ATK      | 50     | rim    | Baik    |            |
| BHP-002  | Sarung Tangan  | Medis    | 100    | pasang | Baik    |            |
| BHP-003  | Masker Medis   | Medis    | 200    | pcs    | Baik    |            |
```

---

### 3. Sheet: Aset_Perlengkapan
Data aset dan perlengkapan ruangan.

| Kolom | Nama | Tipe | Keterangan |
|-------|------|------|------------|
| A | id | Text | ID unik aset |
| B | nama | Text | Nama aset |
| C | kategori | Text | Kategori (Elektronik, Furniture, dll) |
| D | jumlah | Number | Jumlah unit |
| E | lokasi | Text | Lokasi penyimpanan |
| F | kondisi | Text | Baik, Rusak, Perlu Perbaikan |
| G | keterangan | Text | Catatan tambahan |

**Contoh Data:**
```
| id       | nama          | kategori   | jumlah | lokasi  | kondisi | keterangan |
|----------|---------------|------------|--------|---------|---------|------------|
| AST-001  | Tempat Tidur  | Furniture  | 1      | Kamar 201 | Baik  |            |
| AST-002  | AC            | Elektronik | 1      | Kamar 201 | Baik  |            |
| AST-003  | TV LED 32"    | Elektronik | 1      | Kamar 202 | Rusak | Perlu servis |
```

---

### 4. Sheet: RekapPasien
Rekap pasien masuk bulanan (auto-generated).

| Kolom | Nama | Tipe | Keterangan |
|-------|------|------|------------|
| A | tanggal | DateTime | Tanggal input |
| B | no_kamar | Text | Nomor kamar |
| C | pasien | Text | Nama pasien |
| D | dokter | Text | Nama dokter |
| E | diagnosa | Text | Diagnosa |
| F | status | Text | MASUK/KELUAR |

---

### 5. Sheet: HistoryPasien
History lengkap pasien masuk/keluar (auto-generated).

| Kolom | Nama | Tipe | Keterangan |
|-------|------|------|------------|
| A | Timestamp | DateTime | Waktu aksi |
| B | Aksi | Text | MASUK atau KELUAR |
| C | No_Kamar | Text | Nomor kamar |
| D | Pasien | Text | Nama pasien |
| E | Dokter | Text | Nama dokter |
| F | Diagnosa | Text | Diagnosa |
| G | Tgl_Masuk | Date | Tanggal masuk |
| H | Tgl_Keluar | Date | Tanggal keluar |
| I | Lama_Inap | Text | Durasi inap (hari) |

---

### 6. Sheet: DokterDPJP
Daftar dokter DPJP untuk autocomplete.

| Kolom | Nama | Tipe | Keterangan |
|-------|------|------|------------|
| A | id | Text | ID dokter |
| B | nama | Text | Nama lengkap dokter |
| C | spesialis | Text | Spesialisasi |

**Contoh Data:**
```
| id    | nama                      | spesialis       |
|-------|---------------------------|-----------------|
| DR001 | dr. Ahmad Subari, Sp.PD   | Penyakit Dalam  |
| DR002 | dr. Budi Santoso, Sp.JP   | Jantung         |
| DR003 | dr. Citra Dewi, Sp.A      | Anak            |
| DR004 | dr. Dedi Prasetyo, Sp.B   | Bedah           |
| DR005 | dr. Eva Marina, Sp.OG     | Kandungan       |
```

---

## 🚀 Cara Deploy

### Langkah 1: Buat Spreadsheet
1. Buka Google Drive
2. Buat Spreadsheet baru dengan nama "SIPANURI Database"
3. Buat sheet-sheet sesuai struktur di atas
4. Salin Spreadsheet ID dari URL

### Langkah 2: Buat Project Apps Script
1. Buka script.google.com
2. Buat project baru
3. Copy-paste kode `Code.gs`
4. Buat file HTML baru dengan nama `SIPANURI`
5. Copy-paste kode `SIPANURI.html`

### Langkah 3: Update Spreadsheet ID
Di `Code.gs`, ganti SPREADSHEET_ID:
```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
```

### Langkah 4: Deploy
1. Klik "Deploy" > "New deployment"
2. Pilih type: "Web app"
3. Execute as: "Me"
4. Who has access: "Anyone" atau sesuai kebutuhan
5. Klik "Deploy"
6. Salin URL web app

---

## ✨ Fitur Baru yang Ditambahkan

### 1. Dashboard Lengkap
- Statistik pasien bulan ini
- Statistik VVIP/VIP
- Tingkat okupansi
- Top 5 diagnosa

### 2. Form Edit Data Pasien
- Modal dengan 2 mode: View & Edit
- Validasi input
- Dropdown status
- Autocomplete dokter

### 3. History Pasien
- Tabel riwayat masuk/keluar
- Perhitungan lama inap otomatis
- Filter berdasarkan aksi

### 4. Toast Notification
- Feedback sukses/error
- Auto-hide setelah 3 detik

### 5. Loading States
- Spinner saat memuat data
- Disabled button saat menyimpan

### 6. Responsive Design
- Mobile-friendly
- Toggle sidebar

### 7. Security
- Sanitasi input backend
- Error handling lengkap

---

## 🔧 API Functions (Backend)

| Function | Parameter | Return | Deskripsi |
|----------|-----------|--------|-----------|
| `getKamarData()` | - | Array | Ambil semua data kamar |
| `savePatientData()` | noKamar, status, pasien, dokter, diagnosa | Object | Simpan data pasien |
| `getDashboardStats()` | - | Object | Ambil statistik dashboard |
| `getHistoryPasien()` | limit, filter | Array | Ambil history pasien |
| `getBHPData()` | - | Array | Ambil data BHP ATK |
| `getAsetData()` | - | Array | Ambil data aset |
| `getDokterList()` | - | Array | Ambil daftar dokter |

---

## 📝 Changelog

### Versi 2.0
- ✅ Fix statistik VVIP/VIP tidak tampil
- ✅ Tambah form edit data pasien
- ✅ Tambah dashboard stats lengkap
- ✅ Tambah halaman history
- ✅ Tambah halaman inventaris
- ✅ Tambah error handling frontend
- ✅ Tambah loading states
- ✅ Tambah toast notification
- ✅ Tambah sanitasi input
- ✅ Tambah caching backend
- ✅ Tambah auto-create sheet HistoryPasien
- ✅ Tambah perhitungan lama inap
- ✅ Tambah autocomplete dokter

---

## 🆘 Troubleshooting

### Error: "Sheet tidak ditemukan"
- Pastikan nama sheet di spreadsheet sama persis dengan konstanta di Code.gs
- Perhatikan huruf besar/kecil

### Error: "Script function not found"
- Pastikan semua fungsi di Code.gs sudah di-save
- Refresh halaman web app

### Data tidak muncul
- Periksa Spreadsheet ID
- Periksa struktur kolom di spreadsheet
- Buka Console (F12) untuk lihat error

### Tombol tidak berfungsi
- Pastikan tidak ada error JavaScript di Console
- Periksa koneksi internet

---

## 📞 Kontak

Jika ada pertanyaan atau butuh bantuan, silakan hubungi developer.

---

*Dokumentasi ini dibuat otomatis oleh AI Assistant*
*Tanggal: Januari 2024*
