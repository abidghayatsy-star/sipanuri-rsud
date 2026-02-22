import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// BHP ATK API with stock management - v2
// GET - List all bhp or single bhp
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const kategori = searchParams.get('kategori');
    const kondisi = searchParams.get('kondisi');
    const search = searchParams.get('search');
    const withHistory = searchParams.get('history');

    // Get single bhp by ID with stock history
    if (id) {
      const bhp = await db.bhpAtk.findUnique({
        where: { id },
        include: withHistory === 'true' ? {
          stokHistory: {
            orderBy: { tanggal: 'desc' },
            take: 50
          }
        } : undefined
      });
      return NextResponse.json(bhp);
    }

    // Build filter
    const where: {
      kategori?: string;
      kondisi?: string;
      OR?: Array<{
        nama?: { contains: string; mode: 'insensitive' };
      }>;
    } = {};

    if (kategori) where.kategori = kategori;
    if (kondisi) where.kondisi = kondisi;
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
      ];
    }

    const bhp = await db.bhpAtk.findMany({
      where,
      orderBy: { nama: 'asc' },
    });

    // Get statistics
    const totalBhp = await db.bhpAtk.count();
    const totalStok = await db.bhpAtk.aggregate({
      _sum: { stokAwal: true, sisaStok: true, stokMasuk: true, stokKeluar: true },
    });
    const byKondisi = await db.bhpAtk.groupBy({
      by: ['kondisi'],
      _count: { id: true },
      _sum: { sisaStok: true },
    });
    const byKategori = await db.bhpAtk.groupBy({
      by: ['kategori'],
      _count: { id: true },
      _sum: { sisaStok: true },
    });

    // Low stock items (sisaStok < 10)
    const stokRendah = await db.bhpAtk.count({
      where: { sisaStok: { lt: 10 } }
    });

    return NextResponse.json({
      data: bhp,
      stats: {
        totalBhp,
        totalStokAwal: totalStok._sum.stokAwal || 0,
        totalSisaStok: totalStok._sum.sisaStok || 0,
        totalStokMasuk: totalStok._sum.stokMasuk || 0,
        totalStokKeluar: totalStok._sum.stokKeluar || 0,
        stokRendah,
        byKondisi: byKondisi.map(k => ({
          kondisi: k.kondisi || 'Tidak Diketahui',
          count: k._count.id,
          jumlah: k._sum.sisaStok || 0,
        })),
        byKategori: byKategori.map(k => ({
          kategori: k.kategori || 'Tidak Diketahui',
          count: k._count.id,
          jumlah: k._sum.sisaStok || 0,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching bhp:', error);
    return NextResponse.json({ error: 'Gagal mengambil data BHP ATK' }, { status: 500 });
  }
}

// POST - Add new bhp or stock transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is a stock transaction
    if (body.stockTransaction) {
      const { bhpId, jenis, jumlah, keterangan, petugas } = body;
      
      if (!bhpId || !jenis || !jumlah) {
        return NextResponse.json({ success: false, message: 'Data transaksi tidak lengkap' }, { status: 400 });
      }

      const bhp = await db.bhpAtk.findUnique({ where: { id: bhpId } });
      if (!bhp) {
        return NextResponse.json({ success: false, message: 'BHP ATK tidak ditemukan' }, { status: 404 });
      }

      // Create stock history and update stock
      const result = await db.$transaction(async (tx) => {
        // Create history
        await tx.stokHistory.create({
          data: {
            bhpId,
            jenis,
            jumlah,
            keterangan,
            petugas,
          }
        });

        // Update stock
        const updateData = jenis === 'MASUK' 
          ? { 
              stokMasuk: bhp.stokMasuk + jumlah,
              sisaStok: bhp.sisaStok + jumlah 
            }
          : { 
              stokKeluar: bhp.stokKeluar + jumlah,
              sisaStok: Math.max(0, bhp.sisaStok - jumlah) 
            };

        return tx.bhpAtk.update({
          where: { id: bhpId },
          data: updateData,
        });
      });

      return NextResponse.json({
        success: true,
        message: `Stok berhasil ${jenis === 'MASUK' ? 'ditambahkan' : 'dikurangi'}`,
        data: result,
      });
    }

    // Regular create new bhp
    const { nama, kategori, stokAwal, satuan, kondisi } = body;

    if (!nama) {
      return NextResponse.json({ success: false, message: 'Nama BHP ATK wajib diisi' }, { status: 400 });
    }

    const bhp = await db.bhpAtk.create({
      data: {
        nama,
        kategori: kategori || null,
        stokAwal: stokAwal || 0,
        stokMasuk: 0,
        stokKeluar: 0,
        sisaStok: stokAwal || 0,
        satuan: satuan || null,
        kondisi: kondisi || 'Baik',
      },
    });

    // Create initial stock history if stokAwal > 0
    if (stokAwal && stokAwal > 0) {
      await db.stokHistory.create({
        data: {
          bhpId: bhp.id,
          jenis: 'MASUK',
          jumlah: stokAwal,
          keterangan: 'Stok awal',
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'BHP ATK berhasil ditambahkan',
      data: bhp,
    });
  } catch (error) {
    console.error('Error creating bhp:', error);
    return NextResponse.json({ success: false, message: 'Gagal menambahkan BHP ATK' }, { status: 500 });
  }
}

// PUT - Update bhp
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nama, kategori, satuan, kondisi } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID wajib diisi' }, { status: 400 });
    }

    const existingBhp = await db.bhpAtk.findUnique({ where: { id } });
    if (!existingBhp) {
      return NextResponse.json({ success: false, message: 'BHP ATK tidak ditemukan' }, { status: 404 });
    }

    const bhp = await db.bhpAtk.update({
      where: { id },
      data: {
        nama: nama || existingBhp.nama,
        kategori: kategori !== undefined ? kategori : existingBhp.kategori,
        satuan: satuan !== undefined ? satuan : existingBhp.satuan,
        kondisi: kondisi || existingBhp.kondisi,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'BHP ATK berhasil diperbarui',
      data: bhp,
    });
  } catch (error) {
    console.error('Error updating bhp:', error);
    return NextResponse.json({ success: false, message: 'Gagal memperbarui BHP ATK' }, { status: 500 });
  }
}

// DELETE - Delete bhp
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID wajib diisi' }, { status: 400 });
    }

    const existingBhp = await db.bhpAtk.findUnique({ where: { id } });
    if (!existingBhp) {
      return NextResponse.json({ success: false, message: 'BHP ATK tidak ditemukan' }, { status: 404 });
    }

    // Delete stock history first
    await db.stokHistory.deleteMany({ where: { bhpId: id } });
    
    // Delete bhp
    await db.bhpAtk.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'BHP ATK berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting bhp:', error);
    return NextResponse.json({ success: false, message: 'Gagal menghapus BHP ATK' }, { status: 500 });
  }
}
