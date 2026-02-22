import { db } from '@/lib/db';

async function main() {
  console.log('🌱 Starting seed...');

  // Seed Dokter
  const dokterData = [
    { nama: 'dr. Ahmad Subari, Sp.PD', spesialis: 'Penyakit Dalam' },
    { nama: 'dr. Budi Santoso, Sp.JP', spesialis: 'Jantung' },
    { nama: 'dr. Citra Dewi, Sp.A', spesialis: 'Anak' },
    { nama: 'dr. Dedi Prasetyo, Sp.B', spesialis: 'Bedah' },
    { nama: 'dr. Eva Marina, Sp.OG', spesialis: 'Kandungan' },
  ];

  const existingDokter = await db.dokter.count();
  if (existingDokter === 0) {
    await db.dokter.createMany({ data: dokterData });
    console.log('✅ Dokter seeded');
  }

  // Clear existing rooms first
  await db.kamar.deleteMany({});
  console.log('🗑️ Existing rooms cleared');

  // Seed Kamar - Total 20 Kamar
  // Lantai 2: 201-210 (10 kamar VIP)
  // Lantai 3: VVIP = 301, 306 | VIP = 302, 303, 304, 305, 307, 308, 309, 310
  const kamarData = [
    // Lantai 2 - 10 kamar VIP (201-210)
    { noKamar: '201', tipe: 'VIP', status: 'Kosong' },
    { noKamar: '202', tipe: 'VIP', status: 'Kosong' },
    { noKamar: '203', tipe: 'VIP', status: 'Kosong' },
    { noKamar: '204', tipe: 'VIP', status: 'Kosong' },
    { noKamar: '205', tipe: 'VIP', status: 'Kosong' },
    { noKamar: '206', tipe: 'VIP', status: 'Kosong' },
    { noKamar: '207', tipe: 'VIP', status: 'Kosong' },
    { noKamar: '208', tipe: 'VIP', status: 'Kosong' },
    { noKamar: '209', tipe: 'VIP', status: 'Kosong' },
    { noKamar: '210', tipe: 'VIP', status: 'Kosong' },
    
    // Lantai 3 - VVIP: 301, 306 | VIP: 302-305, 307-310
    { noKamar: '301', tipe: 'VVIP', status: 'Kosong' },
    { noKamar: '302', tipe: 'VIP', status: 'Kosong' },
    { noKamar: '303', tipe: 'VIP', status: 'Kosong' },
    { noKamar: '304', tipe: 'VIP', status: 'Kosong' },
    { noKamar: '305', tipe: 'VIP', status: 'Kosong' },
    { noKamar: '306', tipe: 'VVIP', status: 'Kosong' },
    { noKamar: '307', tipe: 'VIP', status: 'Kosong' },
    { noKamar: '308', tipe: 'VIP', status: 'Kosong' },
    { noKamar: '309', tipe: 'VIP', status: 'Kosong' },
    { noKamar: '310', tipe: 'VIP', status: 'Kosong' },
  ];

  await db.kamar.createMany({ data: kamarData });
  console.log('✅ Kamar seeded:');
  console.log('   Lantai 2: 201-210 (10 VIP)');
  console.log('   Lantai 3: 301, 306 (2 VVIP) + 302-305, 307-310 (8 VIP)');
  console.log('   Total: 2 VVIP + 18 VIP = 20 kamar');

  // Seed BHP ATK with stock management
  const existingBhp = await db.bhpAtk.count();
  if (existingBhp === 0) {
    const bhpData = [
      { nama: 'Kertas A4 80gsm', kategori: 'ATK', stokAwal: 50, stokMasuk: 0, stokKeluar: 0, sisaStok: 50, satuan: 'rim', kondisi: 'Baik' },
      { nama: 'Pulpen Pilot', kategori: 'ATK', stokAwal: 100, stokMasuk: 0, stokKeluar: 0, sisaStok: 100, satuan: 'pcs', kondisi: 'Baik' },
      { nama: 'Sarung Tangan Medis', kategori: 'BHP', stokAwal: 200, stokMasuk: 0, stokKeluar: 0, sisaStok: 200, satuan: 'pasang', kondisi: 'Baik' },
      { nama: 'Masker Medis 3 Ply', kategori: 'BHP', stokAwal: 500, stokMasuk: 0, stokKeluar: 0, sisaStok: 500, satuan: 'pcs', kondisi: 'Baik' },
      { nama: 'Alkohol Swab', kategori: 'BHP', stokAwal: 300, stokMasuk: 0, stokKeluar: 0, sisaStok: 300, satuan: 'pcs', kondisi: 'Baik' },
    ];
    await db.bhpAtk.createMany({ data: bhpData });
    console.log('✅ BHP ATK seeded');
  }

  // Seed Aset
  const existingAset = await db.aset.count();
  if (existingAset === 0) {
    const asetData = [
      { nama: 'Tempat Tidur Elektrik', kategori: 'Furniture', jumlah: 20, lokasi: 'Semua Kamar', kondisi: 'Baik' },
      { nama: 'AC Split 1 PK', kategori: 'Elektronik', jumlah: 20, lokasi: 'Semua Kamar', kondisi: 'Baik' },
      { nama: 'TV LED 32"', kategori: 'Elektronik', jumlah: 10, lokasi: 'VVIP & VIP', kondisi: 'Baik' },
      { nama: 'Kulkas Mini', kategori: 'Elektronik', jumlah: 2, lokasi: 'VVIP', kondisi: 'Baik' },
      { nama: 'Nebulizer', kategori: 'Medis', jumlah: 10, lokasi: 'Ruang Perawatan', kondisi: 'Baik' },
      { nama: 'Infusion Pump', kategori: 'Medis', jumlah: 10, lokasi: 'Ruang Perawatan', kondisi: 'Baik' },
    ];
    await db.aset.createMany({ data: asetData });
    console.log('✅ Aset seeded');
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
