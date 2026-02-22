import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// API Endpoint untuk export semua data ke Google Sheet
// GET /api/sipanuri/export

export async function GET() {
  try {
    // Fetch all data from database
    const [kamar, history, dokter, bhpAtk, stokHistory, aset, peminjaman] = await Promise.all([
      db.kamar.findMany({ orderBy: { noKamar: 'asc' } }),
      db.history.findMany({ orderBy: { timestamp: 'desc' } }),
      db.dokter.findMany({ orderBy: { nama: 'asc' } }),
      db.bhpAtk.findMany({ orderBy: { nama: 'asc' } }),
      db.stokHistory.findMany({ orderBy: { tanggal: 'desc' } }),
      db.aset.findMany({ orderBy: { nama: 'asc' } }),
      db.peminjaman.findMany({ orderBy: { tanggalPinjam: 'desc' } }),
    ])

    // Format dates for Google Sheets
    const formatDate = (date: Date | null | string) => {
      if (!date) return ''
      const d = new Date(date)
      return d.toLocaleDateString('id-ID') + ' ' + d.toLocaleTimeString('id-ID')
    }

    // Format data for each sheet
    const formattedKamar = kamar.map(k => ({
      'No Kamar': k.noKamar,
      'Tipe': k.tipe,
      'Status': k.status,
      'Pasien': k.pasien || '',
      'Dokter': k.dokter || '',
      'Diagnosa': k.diagnosa || '',
      'Tanggal Masuk': formatDate(k.tanggalMasuk),
      'Created At': formatDate(k.createdAt),
      'Updated At': formatDate(k.updatedAt),
    }))

    const formattedHistory = history.map(h => ({
      'Timestamp': formatDate(h.timestamp),
      'Aksi': h.aksi,
      'No Kamar': h.noKamar,
      'Pasien': h.pasien || '',
      'Dokter': h.dokter || '',
      'Diagnosa': h.diagnosa || '',
      'Tanggal Masuk': formatDate(h.tglMasuk),
      'Tanggal Keluar': formatDate(h.tglKeluar),
      'Lama Inap': h.lamaInap || '',
    }))

    const formattedDokter = dokter.map(d => ({
      'Nama': d.nama,
      'Spesialis': d.spesialis || '',
      'Created At': formatDate(d.createdAt),
      'Updated At': formatDate(d.updatedAt),
    }))

    const formattedBhpAtk = bhpAtk.map(b => ({
      'Nama': b.nama,
      'Kategori': b.kategori || '',
      'Stok Awal': b.stokAwal,
      'Stok Masuk': b.stokMasuk,
      'Stok Keluar': b.stokKeluar,
      'Sisa Stok': b.sisaStok,
      'Satuan': b.satuan || '',
      'Kondisi': b.kondisi || '',
      'Created At': formatDate(b.createdAt),
      'Updated At': formatDate(b.updatedAt),
    }))

    const formattedStokHistory = stokHistory.map(s => ({
      'BHP ID': s.bhpId,
      'Jenis': s.jenis,
      'Jumlah': s.jumlah,
      'Keterangan': s.keterangan || '',
      'Tanggal': formatDate(s.tanggal),
      'Petugas': s.petugas || '',
    }))

    const formattedAset = aset.map(a => ({
      'Nama': a.nama,
      'Kategori': a.kategori || '',
      'Jumlah': a.jumlah,
      'Lokasi': a.lokasi || '',
      'Kondisi': a.kondisi || '',
      'Created At': formatDate(a.createdAt),
      'Updated At': formatDate(a.updatedAt),
    }))

    const formattedPeminjaman = peminjaman.map(p => ({
      'Nama Aset': p.namaAset,
      'Jumlah': p.jumlah,
      'Peminjam': p.peminjam,
      'Unit': p.unit || '',
      'Tujuan': p.tujuan || '',
      'Tanggal Pinjam': formatDate(p.tanggalPinjam),
      'Tanggal Kembali': formatDate(p.tanggalKembali),
      'Status': p.status,
      'Catatan': p.catatan || '',
    }))

    // Calculate statistics
    const stats = {
      totalKamar: kamar.length,
      kamarTerisi: kamar.filter(k => k.status === 'Terisi').length,
      kamarKosong: kamar.filter(k => k.status === 'Kosong').length,
      totalPasienMasuk: history.filter(h => h.aksi === 'MASUK').length,
      totalPasienKeluar: history.filter(h => h.aksi === 'KELUAR').length,
      totalDokter: dokter.length,
      totalBhpAtk: bhpAtk.length,
      totalAset: aset.length,
      peminjamanAktif: peminjaman.filter(p => p.status === 'Dipinjam').length,
      lastUpdated: new Date().toLocaleString('id-ID'),
    }

    return NextResponse.json({
      success: true,
      data: {
        kamar: formattedKamar,
        history: formattedHistory,
        dokter: formattedDokter,
        bhpAtk: formattedBhpAtk,
        stokHistory: formattedStokHistory,
        aset: formattedAset,
        peminjaman: formattedPeminjaman,
        stats,
      },
      exportedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal export data' },
      { status: 500 }
    )
  }
}
