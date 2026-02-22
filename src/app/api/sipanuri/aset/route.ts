import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all aset or single aset
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const kategori = searchParams.get('kategori');
    const kondisi = searchParams.get('kondisi');
    const search = searchParams.get('search');

    // Get single aset by ID
    if (id) {
      const aset = await db.aset.findUnique({
        where: { id },
      });
      return NextResponse.json(aset);
    }

    // Build filter
    const where: {
      kategori?: string;
      kondisi?: string;
      OR?: Array<{
        nama?: { contains: string; mode: 'insensitive' };
        lokasi?: { contains: string; mode: 'insensitive' };
      }>;
    } = {};

    if (kategori) where.kategori = kategori;
    if (kondisi) where.kondisi = kondisi;
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { lokasi: { contains: search, mode: 'insensitive' } },
      ];
    }

    const aset = await db.aset.findMany({
      where,
      orderBy: { nama: 'asc' },
    });

    // Get statistics
    const totalAset = await db.aset.count();
    const totalUnit = await db.aset.aggregate({
      _sum: { jumlah: true },
    });
    const byKondisi = await db.aset.groupBy({
      by: ['kondisi'],
      _count: { id: true },
      _sum: { jumlah: true },
    });
    const byKategori = await db.aset.groupBy({
      by: ['kategori'],
      _count: { id: true },
      _sum: { jumlah: true },
    });

    return NextResponse.json({
      data: aset,
      stats: {
        totalAset,
        totalUnit: totalUnit._sum.jumlah || 0,
        byKondisi: byKondisi.map(k => ({
          kondisi: k.kondisi || 'Tidak Diketahui',
          count: k._count.id,
          jumlah: k._sum.jumlah || 0,
        })),
        byKategori: byKategori.map(k => ({
          kategori: k.kategori || 'Tidak Diketahui',
          count: k._count.id,
          jumlah: k._sum.jumlah || 0,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching aset:', error);
    return NextResponse.json({ error: 'Gagal mengambil data aset' }, { status: 500 });
  }
}

// POST - Add new aset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama, kategori, jumlah, lokasi, kondisi } = body;

    if (!nama) {
      return NextResponse.json({ success: false, message: 'Nama aset wajib diisi' }, { status: 400 });
    }

    const aset = await db.aset.create({
      data: {
        nama,
        kategori: kategori || null,
        jumlah: jumlah || 0,
        lokasi: lokasi || null,
        kondisi: kondisi || 'Baik',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Aset berhasil ditambahkan',
      data: aset,
    });
  } catch (error) {
    console.error('Error creating aset:', error);
    return NextResponse.json({ success: false, message: 'Gagal menambahkan aset' }, { status: 500 });
  }
}

// PUT - Update aset
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nama, kategori, jumlah, lokasi, kondisi } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID wajib diisi' }, { status: 400 });
    }

    const existingAset = await db.aset.findUnique({ where: { id } });
    if (!existingAset) {
      return NextResponse.json({ success: false, message: 'Aset tidak ditemukan' }, { status: 404 });
    }

    const aset = await db.aset.update({
      where: { id },
      data: {
        nama: nama || existingAset.nama,
        kategori: kategori !== undefined ? kategori : existingAset.kategori,
        jumlah: jumlah !== undefined ? jumlah : existingAset.jumlah,
        lokasi: lokasi !== undefined ? lokasi : existingAset.lokasi,
        kondisi: kondisi || existingAset.kondisi,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Aset berhasil diperbarui',
      data: aset,
    });
  } catch (error) {
    console.error('Error updating aset:', error);
    return NextResponse.json({ success: false, message: 'Gagal memperbarui aset' }, { status: 500 });
  }
}

// DELETE - Delete aset
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID wajib diisi' }, { status: 400 });
    }

    const existingAset = await db.aset.findUnique({ where: { id } });
    if (!existingAset) {
      return NextResponse.json({ success: false, message: 'Aset tidak ditemukan' }, { status: 404 });
    }

    // Check if aset is being used in peminjaman
    const peminjamanCount = await db.peminjaman.count({
      where: { asetId: id, status: 'Dipinjam' },
    });

    if (peminjamanCount > 0) {
      return NextResponse.json({
        success: false,
        message: `Aset tidak dapat dihapus karena sedang dipinjam (${peminjamanCount} peminjaman aktif)`,
      }, { status: 400 });
    }

    await db.aset.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Aset berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting aset:', error);
    return NextResponse.json({ success: false, message: 'Gagal menghapus aset' }, { status: 500 });
  }
}
