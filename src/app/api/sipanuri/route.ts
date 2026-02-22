import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/sipanuri - Get all data or specific type
// Force recompile
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    switch (type) {
      case 'kamar':
        const kamar = await db.kamar.findMany({
          orderBy: { noKamar: 'asc' },
        });
        return NextResponse.json(kamar.map(k => ({
          No_Kamar: k.noKamar,
          Tipe: k.tipe,
          Status: k.status,
          Pasien: k.pasien,
          Dokter: k.dokter,
          Diagnosa: k.diagnosa,
          Tanggal_Masuk: k.tanggalMasuk,
        })));

      case 'stats':
        const kamarData = await db.kamar.findMany();
        const historyData = await db.history.findMany({
          where: {
            timestamp: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        });

        const total = kamarData.length;
        const terisi = kamarData.filter(k => k.status === 'Terisi').length;
        const vvipRooms = kamarData.filter(k => k.tipe === 'VVIP');
        const vipRooms = kamarData.filter(k => k.tipe === 'VIP');

        // Count diagnoses
        const diagnosaCounts: Record<string, number> = {};
        historyData.forEach(h => {
          if (h.diagnosa) {
            diagnosaCounts[h.diagnosa] = (diagnosaCounts[h.diagnosa] || 0) + 1;
          }
        });

        const topDiagnosa = Object.entries(diagnosaCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([diagnosa, jumlah]) => ({ diagnosa, jumlah }));

        return NextResponse.json({
          kamar: {
            total,
            terisi,
            kosong: total - terisi,
            okupansi: total > 0 ? Math.round((terisi / total) * 100) : 0,
            vvip: {
              total: vvipRooms.length,
              terisi: vvipRooms.filter(k => k.status === 'Terisi').length,
            },
            vip: {
              total: vipRooms.length,
              terisi: vipRooms.filter(k => k.status === 'Terisi').length,
            },
          },
          bulanan: {
            totalPasien: historyData.filter(h => h.aksi === 'MASUK').length,
            topDiagnosa,
          },
        });

      case 'history':
        const history = await db.history.findMany({
          orderBy: { timestamp: 'desc' },
          take: 50,
        });
        return NextResponse.json(history.map(h => ({
          timestamp: h.timestamp,
          aksi: h.aksi,
          noKamar: h.noKamar,
          pasien: h.pasien,
          dokter: h.dokter,
          diagnosa: h.diagnosa,
          tglMasuk: h.tglMasuk,
          tglKeluar: h.tglKeluar,
          lamaInap: h.lamaInap,
        })));

      case 'dokter':
        const dokter = await db.dokter.findMany({
          orderBy: { nama: 'asc' },
        });
        return NextResponse.json(dokter.map(d => ({
          id: d.id,
          nama: d.nama,
          spesialis: d.spesialis,
        })));

      case 'bhp':
        const bhp = await db.bhpAtk.findMany({
          orderBy: { nama: 'asc' },
        });
        return NextResponse.json(bhp.map(b => ({
          id: b.id,
          nama: b.nama,
          kategori: b.kategori,
          jumlah: b.jumlah,
          satuan: b.satuan,
          kondisi: b.kondisi,
        })));

      case 'aset':
        const aset = await db.aset.findMany({
          orderBy: { nama: 'asc' },
        });
        return NextResponse.json(aset.map(a => ({
          id: a.id,
          nama: a.nama,
          kategori: a.kategori,
          jumlah: a.jumlah,
          lokasi: a.lokasi,
          kondisi: a.kondisi,
        })));

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/sipanuri - Save patient data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { noKamar, status, pasien, dokter, diagnosa } = body;

    if (!noKamar) {
      return NextResponse.json({ success: false, message: 'Nomor kamar wajib diisi' }, { status: 400 });
    }

    // Find the room
    const existingKamar = await db.kamar.findUnique({
      where: { noKamar },
    });

    if (!existingKamar) {
      return NextResponse.json({ success: false, message: 'Kamar tidak ditemukan' }, { status: 404 });
    }

    const now = new Date();
    let tanggalMasuk = existingKamar.tanggalMasuk;

    // If status changes from Terisi to Kosong, record history
    if (status === 'Kosong' && existingKamar.status === 'Terisi') {
      const lamaInap = existingKamar.tanggalMasuk
        ? Math.ceil((now.getTime() - existingKamar.tanggalMasuk.getTime()) / (1000 * 60 * 60 * 24)) + ' hari'
        : '-';

      await db.history.create({
        data: {
          aksi: 'KELUAR',
          noKamar,
          pasien: existingKamar.pasien,
          dokter: existingKamar.dokter,
          diagnosa: existingKamar.diagnosa,
          tglMasuk: existingKamar.tanggalMasuk,
          tglKeluar: now,
          lamaInap,
        },
      });

      // Clear room data
      await db.kamar.update({
        where: { noKamar },
        data: {
          status: 'Kosong',
          pasien: null,
          dokter: null,
          diagnosa: null,
          tanggalMasuk: null,
        },
      });
    } else if (status === 'Terisi') {
      // If new patient
      if (existingKamar.status !== 'Terisi') {
        tanggalMasuk = now;
      }

      // Update room
      await db.kamar.update({
        where: { noKamar },
        data: {
          status: 'Terisi',
          pasien: pasien || null,
          dokter: dokter || null,
          diagnosa: diagnosa || null,
          tanggalMasuk,
        },
      });

      // Record history if this is a new admission
      if (existingKamar.status !== 'Terisi' && pasien) {
        await db.history.create({
          data: {
            aksi: 'MASUK',
            noKamar,
            pasien,
            dokter: dokter || null,
            diagnosa: diagnosa || null,
            tglMasuk: now,
          },
        });
      }
    } else {
      // Just update without history
      await db.kamar.update({
        where: { noKamar },
        data: {
          status,
          pasien: pasien || null,
          dokter: dokter || null,
          diagnosa: diagnosa || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Data kamar ${noKamar} berhasil diperbarui`,
      data: { noKamar, status },
    });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
