-- CreateTable
CREATE TABLE "Kamar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noKamar" TEXT NOT NULL,
    "tipe" TEXT NOT NULL DEFAULT 'VIP',
    "status" TEXT NOT NULL DEFAULT 'Kosong',
    "pasien" TEXT,
    "dokter" TEXT,
    "diagnosa" TEXT,
    "tanggalMasuk" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "History" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aksi" TEXT NOT NULL,
    "noKamar" TEXT NOT NULL,
    "pasien" TEXT,
    "dokter" TEXT,
    "diagnosa" TEXT,
    "tglMasuk" DATETIME,
    "tglKeluar" DATETIME,
    "lamaInap" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "History_noKamar_fkey" FOREIGN KEY ("noKamar") REFERENCES "Kamar" ("noKamar") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dokter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "spesialis" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BhpAtk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "kategori" TEXT,
    "stokAwal" INTEGER NOT NULL DEFAULT 0,
    "stokMasuk" INTEGER NOT NULL DEFAULT 0,
    "stokKeluar" INTEGER NOT NULL DEFAULT 0,
    "sisaStok" INTEGER NOT NULL DEFAULT 0,
    "satuan" TEXT,
    "kondisi" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StokHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bhpId" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "keterangan" TEXT,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "petugas" TEXT,
    CONSTRAINT "StokHistory_bhpId_fkey" FOREIGN KEY ("bhpId") REFERENCES "BhpAtk" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Aset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "kategori" TEXT,
    "jumlah" INTEGER NOT NULL DEFAULT 0,
    "lokasi" TEXT,
    "kondisi" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Peminjaman" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "asetId" TEXT NOT NULL,
    "namaAset" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL DEFAULT 1,
    "peminjam" TEXT NOT NULL,
    "unit" TEXT,
    "tujuan" TEXT,
    "tanggalPinjam" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggalKembali" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'Dipinjam',
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Peminjaman_asetId_fkey" FOREIGN KEY ("asetId") REFERENCES "Aset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Kamar_noKamar_key" ON "Kamar"("noKamar");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

