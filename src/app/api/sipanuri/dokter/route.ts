import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all dokter
export async function GET() {
  try {
    const dokter = await db.dokter.findMany({
      orderBy: { nama: 'asc' },
    });
    return NextResponse.json(dokter);
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil data dokter' }, { status: 500 });
  }
}

// POST - Add new dokter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama, spesialis } = body;

    if (!nama) {
      return NextResponse.json({ success: false, message: 'Nama dokter wajib diisi' }, { status: 400 });
    }

    const dokter = await db.dokter.create({
      data: { nama, spesialis: spesialis || null },
    });

    return NextResponse.json({ success: true, message: 'Dokter berhasil ditambahkan', data: dokter });
  } catch {
    return NextResponse.json({ success: false, message: 'Gagal menambahkan dokter' }, { status: 500 });
  }
}

// PUT - Update dokter
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nama, spesialis } = body;

    if (!id || !nama) {
      return NextResponse.json({ success: false, message: 'ID dan nama wajib diisi' }, { status: 400 });
    }

    const dokter = await db.dokter.update({
      where: { id },
      data: { nama, spesialis: spesialis || null },
    });

    return NextResponse.json({ success: true, message: 'Dokter berhasil diperbarui', data: dokter });
  } catch {
    return NextResponse.json({ success: false, message: 'Gagal memperbarui dokter' }, { status: 500 });
  }
}

// DELETE - Delete dokter
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID wajib diisi' }, { status: 400 });
    }

    await db.dokter.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Dokter berhasil dihapus' });
  } catch {
    return NextResponse.json({ success: false, message: 'Gagal menghapus dokter' }, { status: 500 });
  }
}
