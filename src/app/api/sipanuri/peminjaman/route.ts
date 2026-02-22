import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all peminjaman
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const id = searchParams.get('id');

    // Get single peminjaman by ID
    if (id) {
      const peminjaman = await db.peminjaman.findUnique({
        where: { id },
      });
      return NextResponse.json(peminjaman);
    }

    // Get all with optional status filter
    const where = status ? { status } : {};

    const peminjaman = await db.peminjaman.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(peminjaman);
  } catch (error) {
    console.error('Error fetching peminjaman:', error);
    return NextResponse.json({ error: 'Gagal mengambil data peminjaman' }, { status: 500 });
  }
}

// POST - Add new peminjaman
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asetId, namaAset, jumlah, peminjam, unit, tujuan, catatan } = body;

    if (!asetId || !namaAset || !peminjam) {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap. Aset dan peminjam wajib diisi.' }, { status: 400 });
    }

    // Verify aset exists
    const aset = await db.aset.findUnique({
      where: { id: asetId },
    });

    if (!aset) {
      return NextResponse.json({ success: false, message: 'Aset tidak ditemukan' }, { status: 404 });
    }

    const peminjaman = await db.peminjaman.create({
      data: {
        asetId,
        namaAset,
        jumlah: jumlah || 1,
        peminjam,
        unit: unit || null,
        tujuan: tujuan || null,
        catatan: catatan || null,
        status: 'Dipinjam',
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Peminjaman berhasil dicatat', 
      data: peminjaman 
    });
  } catch (error) {
    console.error('Error creating peminjaman:', error);
    return NextResponse.json({ success: false, message: 'Gagal mencatat peminjaman' }, { status: 500 });
  }
}

// PUT - Update peminjaman (edit or pengembalian)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, asetId, namaAset, jumlah, peminjam, unit, tujuan, status, catatan } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID wajib diisi' }, { status: 400 });
    }

    // Check if peminjaman exists
    const existingPeminjaman = await db.peminjaman.findUnique({
      where: { id },
    });

    if (!existingPeminjaman) {
      return NextResponse.json({ success: false, message: 'Data peminjaman tidak ditemukan' }, { status: 404 });
    }

    // Build update data
    const updateData: {
      asetId?: string;
      namaAset?: string;
      jumlah?: number;
      peminjam?: string;
      unit?: string | null;
      tujuan?: string | null;
      status?: string;
      tanggalKembali?: Date;
      catatan?: string | null;
    } = {};

    // Update fields if provided
    if (asetId) updateData.asetId = asetId;
    if (namaAset) updateData.namaAset = namaAset;
    if (jumlah !== undefined) updateData.jumlah = jumlah;
    if (peminjam) updateData.peminjam = peminjam;
    if (unit !== undefined) updateData.unit = unit || null;
    if (tujuan !== undefined) updateData.tujuan = tujuan || null;
    if (catatan !== undefined) updateData.catatan = catatan || null;

    // Handle status change
    if (status) {
      updateData.status = status;
      // If status changed to Dikembalikan, set tanggalKembali
      if (status === 'Dikembalikan' && existingPeminjaman.status !== 'Dikembalikan') {
        updateData.tanggalKembali = new Date();
      }
      // If status changed back to Dipinjam, clear tanggalKembali
      if (status === 'Dipinjam' && existingPeminjaman.status === 'Dikembalikan') {
        updateData.tanggalKembali = undefined;
      }
    }

    const peminjaman = await db.peminjaman.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Data peminjaman berhasil diperbarui', 
      data: peminjaman 
    });
  } catch (error) {
    console.error('Error updating peminjaman:', error);
    return NextResponse.json({ success: false, message: 'Gagal memperbarui data' }, { status: 500 });
  }
}

// DELETE - Delete peminjaman
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID wajib diisi' }, { status: 400 });
    }

    // Check if peminjaman exists
    const existingPeminjaman = await db.peminjaman.findUnique({
      where: { id },
    });

    if (!existingPeminjaman) {
      return NextResponse.json({ success: false, message: 'Data peminjaman tidak ditemukan' }, { status: 404 });
    }

    await db.peminjaman.delete({ where: { id } });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Data peminjaman berhasil dihapus' 
    });
  } catch (error) {
    console.error('Error deleting peminjaman:', error);
    return NextResponse.json({ success: false, message: 'Gagal menghapus data' }, { status: 500 });
  }
}
