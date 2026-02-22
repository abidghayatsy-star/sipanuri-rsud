# PANDUAN DEPLOY SIPANURI KE RAILWAY

## LANGKAH 1: Buat Database Turso (GRATIS)

1. Buka https://turso.tech
2. Klik "Sign Up" dan daftar dengan GitHub
3. Setelah login, klik "Create Database"
4. Nama database: `sipanuri`
5. Pilih lokasi terdekat (Singapore)
6. Klik "Create"

7. Setelah database dibuat, klik database tersebut
8. Klik tab "Settings" 
9. Salin **Database URL** (contoh: `libsql://sipanuri-xxx.turso.io`)
10. Klik "Create Token" untuk membuat auth token
11. Salin **Auth Token**

## LANGKAH 2: Setup Railway

1. Buka https://railway.app
2. Login dengan GitHub
3. Buka project yang sudah dibuat (sipanuri-rsud)
4. Klik "Settings"
5. Scroll ke "Variables"
6. Tambahkan variables berikut:

```
TURSO_DATABASE_URL = [Database URL dari Turso]
TURSO_AUTH_TOKEN = [Auth Token dari Turso]
DATABASE_URL = [Database URL dari Turso - sama seperti atas]
```

7. Klik "Save"

## LANGKAH 3: Redeploy

1. Di Railway, klik "Deployments"
2. Klik "Redeploy" pada deployment terakhir
3. Tunggu hingga selesai

## LANGKAH 4: Inisialisasi Database

Setelah deploy berhasil, database masih kosong. Anda perlu:

1. Buka Turso dashboard
2. Klik database `sipanuri`
3. Klik tab "Tables" atau "Query"
4. Jalankan SQL untuk membuat tabel (copy dari file schema.sql)

## LINK APLIKASI SETELAH DEPLOY:

https://sipanuri-rsud-production.up.railway.app

## CATATAN:

- Turso FREE: 9 GB storage, 1 miliar row reads/bulan
- Railway FREE: $5 credit/bulan (cukup untuk app kecil)
- Data akan tersimpan permanen di Turso
