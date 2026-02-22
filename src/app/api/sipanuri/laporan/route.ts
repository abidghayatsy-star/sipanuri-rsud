import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Laporan bulanan
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    // Get history for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const history = await db.history.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Calculate statistics
    const masuk = history.filter(h => h.aksi === 'MASUK');
    const keluar = history.filter(h => h.aksi === 'KELUAR');

    // Diagnosa breakdown
    const diagnosaCounts: Record<string, number> = {};
    masuk.forEach(h => {
      if (h.diagnosa) {
        diagnosaCounts[h.diagnosa] = (diagnosaCounts[h.diagnosa] || 0) + 1;
      }
    });

    // Dokter breakdown
    const dokterCounts: Record<string, number> = {};
    masuk.forEach(h => {
      if (h.dokter) {
        dokterCounts[h.dokter] = (dokterCounts[h.dokter] || 0) + 1;
      }
    });

    // Tipe kamar breakdown
    const kamarData = await db.kamar.findMany();
    const tipeCounts: Record<string, number> = { VVIP: 0, VIP: 0 };
    
    masuk.forEach(h => {
      const kamar = kamarData.find(k => k.noKamar === h.noKamar);
      if (kamar) {
        tipeCounts[kamar.tipe] = (tipeCounts[kamar.tipe] || 0) + 1;
      }
    });

    // Daily occupancy rate
    const dailyStats: Record<string, { masuk: number; keluar: number }> = {};
    history.forEach(h => {
      const date = new Date(h.timestamp).toISOString().split('T')[0];
      if (!dailyStats[date]) dailyStats[date] = { masuk: 0, keluar: 0 };
      if (h.aksi === 'MASUK') dailyStats[date].masuk++;
      else dailyStats[date].keluar++;
    });

    // Available months with data
    const allHistory = await db.history.findMany();
    const availableMonths: { year: number; month: number; label: string }[] = [];
    const monthSet = new Set<string>();
    
    allHistory.forEach(h => {
      const d = new Date(h.timestamp);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthSet.has(key)) {
        monthSet.add(key);
        availableMonths.push({
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          label: new Date(d.getFullYear(), d.getMonth()).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        });
      }
    });

    return NextResponse.json({
      period: {
        year,
        month,
        label: new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      },
      summary: {
        totalMasuk: masuk.length,
        totalKeluar: keluar.length,
        totalKamar: kamarData.length,
        okupansi: kamarData.length > 0 
          ? Math.round((kamarData.filter(k => k.status === 'Terisi').length / kamarData.length) * 100)
          : 0,
      },
      diagnosaBreakdown: Object.entries(diagnosaCounts)
        .map(([diagnosa, jumlah]) => ({ diagnosa, jumlah }))
        .sort((a, b) => b.jumlah - a.jumlah),
      dokterBreakdown: Object.entries(dokterCounts)
        .map(([dokter, jumlah]) => ({ dokter, jumlah }))
        .sort((a, b) => b.jumlah - a.jumlah),
      tipeBreakdown: Object.entries(tipeCounts)
        .map(([tipe, jumlah]) => ({ tipe, jumlah })),
      dailyStats: Object.entries(dailyStats)
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      history: history.map(h => ({
        timestamp: h.timestamp,
        aksi: h.aksi,
        noKamar: h.noKamar,
        pasien: h.pasien,
        dokter: h.dokter,
        diagnosa: h.diagnosa,
        lamaInap: h.lamaInap,
      })),
      availableMonths: availableMonths.sort((a, b) => b.year * 12 + b.month - (a.year * 12 + a.month)),
    });
  } catch (error) {
    console.error('Laporan error:', error);
    return NextResponse.json({ error: 'Gagal mengambil laporan' }, { status: 500 });
  }
}
