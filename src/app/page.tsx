'use client'

// SIPANURI - Sistem Pemantauan Paviliun Nuri
// Version 2.0 - With Stock Management for BHP ATK

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Bed, Crown, Calendar, TrendingUp, Users, RefreshCw, 
  ChevronDown, Menu, X, Save, Edit, Clock, 
  FileText, Package, History, BarChart3, Wrench, UserPlus, Trash2, ArrowRightLeft,
  Eye, Printer, AlertCircle, Search, Plus, Grid, List, QrCode, Download,
  Stethoscope, Monitor, Sofa, HeartPulse, Thermometer, Zap, Activity, ArrowUp, ArrowDown, AlertTriangle,
  PieChart as PieChartIcon
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts'

// Types
type Kamar = { No_Kamar: string; Tipe: string; Status: string; Pasien: string | null; Dokter: string | null; Diagnosa: string | null; Tanggal_Masuk: string | null }
type Stats = { kamar: { total: number; terisi: number; kosong: number; okupansi: number; vvip: { total: number; terisi: number }; vip: { total: number; terisi: number } }; bulanan: { totalPasien: number; topDiagnosa: { diagnosa: string; jumlah: number }[] } }
type Dokter = { id: string; nama: string; spesialis: string | null }
type HistoryItem = { timestamp: string; aksi: string; noKamar: string; pasien: string | null; dokter: string | null; diagnosa: string | null; lamaInap: string | null }
type BhpItem = { id: string; nama: string; kategori: string | null; stokAwal: number; stokMasuk: number; stokKeluar: number; sisaStok: number; satuan: string | null; kondisi: string | null }
type StokHistoryItem = { id: string; bhpId: string; jenis: string; jumlah: number; keterangan: string | null; tanggal: string; petugas: string | null }
type BhpStats = {
  totalBhp: number
  totalStokAwal: number
  totalSisaStok: number
  totalStokMasuk: number
  totalStokKeluar: number
  stokRendah: number
  byKondisi: { kondisi: string; count: number; jumlah: number }[]
  byKategori: { kategori: string; count: number; jumlah: number }[]
}
type AsetItem = { id: string; nama: string; kategori: string | null; jumlah: number; lokasi: string | null; kondisi: string | null }
type AsetStats = {
  totalAset: number
  totalUnit: number
  byKondisi: { kondisi: string; count: number; jumlah: number }[]
  byKategori: { kategori: string; count: number; jumlah: number }[]
}
type PeminjamanItem = { id: string; asetId: string; namaAset: string; jumlah: number; peminjam: string; unit: string | null; tujuan: string | null; tanggalPinjam: string; tanggalKembali: string | null; status: string; catatan: string | null }
type Laporan = {
  period: { year: number; month: number; label: string }
  summary: { totalMasuk: number; totalKeluar: number; totalKamar: number; okupansi: number }
  diagnosaBreakdown: { diagnosa: string; jumlah: number }[]
  dokterBreakdown: { dokter: string; jumlah: number }[]
  tipeBreakdown: { tipe: string; jumlah: number }[]
  history: HistoryItem[]
  availableMonths: { year: number; month: number; label: string }[]
}

// Kategori Icon mapping for Aset
const kategoriIcons: Record<string, React.ReactNode> = {
  'Medis': <HeartPulse size={16} />,
  'Elektronik': <Monitor size={16} />,
  'Furniture': <Sofa size={16} />,
  'Alat Ukur': <Thermometer size={16} />,
  'Elektrikal': <Zap size={16} />,
  'Peralatan': <Activity size={16} />,
}

// Kategori Icon mapping for BHP ATK
const bhpKategoriIcons: Record<string, React.ReactNode> = {
  'BHP': <HeartPulse size={16} />,
  'ATK': <FileText size={16} />,
  'Habis Pakai': <Package size={16} />,
  'Peralatan': <Activity size={16} />,
}

const kategoriColors: Record<string, string> = {
  'Medis': 'bg-red-100 text-red-700 border-red-200',
  'Elektronik': 'bg-blue-100 text-blue-700 border-blue-200',
  'Furniture': 'bg-amber-100 text-amber-700 border-amber-200',
  'Alat Ukur': 'bg-purple-100 text-purple-700 border-purple-200',
  'Elektrikal': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Peralatan': 'bg-green-100 text-green-700 border-green-200',
  'BHP': 'bg-red-100 text-red-700 border-red-200',
  'ATK': 'bg-blue-100 text-blue-700 border-blue-200',
  'Habis Pakai': 'bg-amber-100 text-amber-700 border-amber-200',
}

const kondisiColors: Record<string, string> = {
  'Baik': 'bg-green-100 text-green-700',
  'Perlu Perbaikan': 'bg-amber-100 text-amber-700',
  'Rusak': 'bg-red-100 text-red-700',
}

export default function SIPANURI() {
  // State
  const [menu, setMenu] = useState('dashboard')
  const [floor, setFloor] = useState(2)
  const [kamarData, setKamarData] = useState<Kamar[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [bhpData, setBhpData] = useState<BhpItem[]>([])
  const [bhpStats, setBhpStats] = useState<BhpStats | null>(null)
  const [asetData, setAsetData] = useState<AsetItem[]>([])
  const [asetStats, setAsetStats] = useState<AsetStats | null>(null)
  const [dokterList, setDokterList] = useState<Dokter[]>([])
  const [laporan, setLaporan] = useState<Laporan | null>(null)
  const [peminjamanData, setPeminjamanData] = useState<PeminjamanItem[]>([])
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedKamar, setSelectedKamar] = useState<Kamar | null>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: string }>({ show: false, message: '', type: 'success' })
  const [invMenuOpen, setInvMenuOpen] = useState(false)
  const [laporanTab, setLaporanTab] = useState<'harian' | 'bulanan'>('harian')

  // Aset state
  const [asetSearch, setAsetSearch] = useState('')
  const [asetKategoriFilter, setAsetKategoriFilter] = useState('')
  const [asetKondisiFilter, setAsetKondisiFilter] = useState('')
  const [asetViewMode, setAsetViewMode] = useState<'table' | 'grid'>('grid')
  const [asetModalOpen, setAsetModalOpen] = useState(false)
  const [asetDetailOpen, setAsetDetailOpen] = useState(false)
  const [editAset, setEditAset] = useState<AsetItem | null>(null)
  const [selectedAsetDetail, setSelectedAsetDetail] = useState<AsetItem | null>(null)
  const [formAsetNama, setFormAsetNama] = useState('')
  const [formAsetKategori, setFormAsetKategori] = useState('')
  const [formAsetJumlah, setFormAsetJumlah] = useState(1)
  const [formAsetLokasi, setFormAsetLokasi] = useState('')
  const [formAsetKondisi, setFormAsetKondisi] = useState('Baik')

  // BHP ATK state
  const [bhpSearch, setBhpSearch] = useState('')
  const [bhpKategoriFilter, setBhpKategoriFilter] = useState('')
  const [bhpKondisiFilter, setBhpKondisiFilter] = useState('')
  const [bhpViewMode, setBhpViewMode] = useState<'table' | 'grid'>('grid')
  const [bhpModalOpen, setBhpModalOpen] = useState(false)
  const [bhpDetailOpen, setBhpDetailOpen] = useState(false)
  const [editBhp, setEditBhp] = useState<BhpItem | null>(null)
  const [selectedBhpDetail, setSelectedBhpDetail] = useState<BhpItem | null>(null)
  const [formBhpNama, setFormBhpNama] = useState('')
  const [formBhpKategori, setFormBhpKategori] = useState('')
  const [formBhpStokAwal, setFormBhpStokAwal] = useState(0)
  const [formBhpSatuan, setFormBhpSatuan] = useState('')
  const [formBhpKondisi, setFormBhpKondisi] = useState('Baik')
  
  // Stock transaction state
  const [stokModalOpen, setStokModalOpen] = useState(false)
  const [stokBhpItem, setStokBhpItem] = useState<BhpItem | null>(null)
  const [stokJenis, setStokJenis] = useState<'MASUK' | 'KELUAR'>('MASUK')
  const [stokJumlah, setStokJumlah] = useState(1)
  const [stokKeterangan, setStokKeterangan] = useState('')
  const [stokPetugas, setStokPetugas] = useState('')
  const [stokHistory, setStokHistory] = useState<StokHistoryItem[]>([])

  // Dokter modal state
  const [dokterModalOpen, setDokterModalOpen] = useState(false)
  const [editDokter, setEditDokter] = useState<Dokter | null>(null)
  const [formDokterNama, setFormDokterNama] = useState('')
  const [formDokterSpesialis, setFormDokterSpesialis] = useState('')

  // Laporan state
  const [laporanMonth, setLaporanMonth] = useState<{ year: number; month: number }>({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 })

  // Peminjaman modal state
  const [peminjamanModalOpen, setPeminjamanModalOpen] = useState(false)
  const [peminjamanDetailOpen, setPeminjamanDetailOpen] = useState(false)
  const [peminjamanEditOpen, setPeminjamanEditOpen] = useState(false)
  const [selectedPeminjaman, setSelectedPeminjaman] = useState<PeminjamanItem | null>(null)
  const [formPinjamAset, setFormPinjamAset] = useState('')
  const [formPinjamJumlah, setFormPinjamJumlah] = useState(1)
  const [formPinjamPeminjam, setFormPinjamPeminjam] = useState('')
  const [formPinjamUnit, setFormPinjamUnit] = useState('')
  const [formPinjamTujuan, setFormPinjamTujuan] = useState('')
  const [formPinjamCatatan, setFormPinjamCatatan] = useState('')
  const [formPinjamStatus, setFormPinjamStatus] = useState('Dipinjam')

  // Kamar form state
  const [formStatus, setFormStatus] = useState('Kosong')
  const [formPasien, setFormPasien] = useState('')
  const [formDokter, setFormDokter] = useState('')
  const [formDiagnosa, setFormDiagnosa] = useState('')
  const [saving, setSaving] = useState(false)

  // Print ref
  const printRef = useRef<HTMLDivElement>(null)

  // Fetch functions
  const fetchData = useCallback(async (type: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sipanuri?type=${type}`)
      return await res.json()
    } catch { return null }
    finally { setLoading(false) }
  }, [])

  const loadDashboard = useCallback(async () => {
    const [statsRes, kamarRes, dokterRes] = await Promise.all([fetchData('stats'), fetchData('kamar'), fetchData('dokter')])
    if (statsRes) setStats(statsRes)
    if (kamarRes) setKamarData(kamarRes)
    if (dokterRes) setDokterList(dokterRes)
  }, [fetchData])

  const loadHistory = useCallback(async () => {
    const data = await fetchData('history')
    if (data) setHistory(data)
  }, [fetchData])

  const loadBhp = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (bhpSearch) params.append('search', bhpSearch)
      if (bhpKategoriFilter) params.append('kategori', bhpKategoriFilter)
      if (bhpKondisiFilter) params.append('kondisi', bhpKondisiFilter)
      
      const res = await fetch(`/api/sipanuri/bhp?${params.toString()}`)
      const data = await res.json()
      setBhpData(data.data || [])
      setBhpStats(data.stats || null)
    } catch {
      setBhpData([])
      setBhpStats(null)
    }
  }, [bhpSearch, bhpKategoriFilter, bhpKondisiFilter])

  const loadAset = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (asetSearch) params.append('search', asetSearch)
      if (asetKategoriFilter) params.append('kategori', asetKategoriFilter)
      if (asetKondisiFilter) params.append('kondisi', asetKondisiFilter)
      
      const res = await fetch(`/api/sipanuri/aset?${params.toString()}`)
      const data = await res.json()
      setAsetData(data.data || [])
      setAsetStats(data.stats || null)
    } catch {
      setAsetData([])
      setAsetStats(null)
    }
  }, [asetSearch, asetKategoriFilter, asetKondisiFilter])

  const loadDokter = useCallback(async () => {
    const res = await fetch('/api/sipanuri/dokter')
    const data = await res.json()
    setDokterList(data)
  }, [])

  const loadLaporan = useCallback(async () => {
    const res = await fetch(`/api/sipanuri/laporan?year=${laporanMonth.year}&month=${laporanMonth.month}`)
    const data = await res.json()
    setLaporan(data)
  }, [laporanMonth])

  const loadPeminjaman = useCallback(async () => {
    const [pinjamRes, asetRes] = await Promise.all([
      fetch('/api/sipanuri/peminjaman').then(r => r.json()),
      fetch('/api/sipanuri/aset').then(r => r.json())
    ])
    setPeminjamanData(pinjamRes || [])
    if (asetRes?.data) setAsetData(asetRes.data)
  }, [])

  useEffect(() => {
    switch (menu) {
      case 'dashboard': case 'kamar': loadDashboard(); break
      case 'bhp': loadBhp(); break
      case 'aset': loadAset(); break
      case 'dokter': loadDokter(); break
      case 'laporan': 
        if (laporanTab === 'harian') loadHistory()
        else loadLaporan()
        break
      case 'peminjaman': loadPeminjaman(); break
    }
  }, [menu, laporanTab, loadDashboard, loadHistory, loadBhp, loadAset, loadDokter, loadLaporan, loadPeminjaman])

  // Handlers
  const showToast = (message: string, type: string = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  const handleCardClick = (kamar: Kamar) => {
    setSelectedKamar(kamar)
    setFormStatus(kamar.Status)
    setFormPasien(kamar.Pasien || '')
    setFormDokter(kamar.Dokter || '')
    setFormDiagnosa(kamar.Diagnosa || '')
    setEditMode(false)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!selectedKamar) return
    if (formStatus === 'Terisi' && !formPasien.trim()) { showToast('Nama pasien wajib diisi', 'error'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/sipanuri', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ noKamar: selectedKamar.No_Kamar, status: formStatus, pasien: formPasien, dokter: formDokter, diagnosa: formDiagnosa }) })
      const data = await res.json()
      if (data.success) { showToast(data.message, 'success'); setModalOpen(false); loadDashboard() }
      else showToast(data.message, 'error')
    } catch { showToast('Terjadi kesalahan', 'error') }
    finally { setSaving(false) }
  }

  // Aset handlers
  const openAsetModal = (aset?: AsetItem) => {
    if (aset) {
      setEditAset(aset)
      setFormAsetNama(aset.nama)
      setFormAsetKategori(aset.kategori || '')
      setFormAsetJumlah(aset.jumlah)
      setFormAsetLokasi(aset.lokasi || '')
      setFormAsetKondisi(aset.kondisi || 'Baik')
    } else {
      setEditAset(null)
      setFormAsetNama('')
      setFormAsetKategori('')
      setFormAsetJumlah(1)
      setFormAsetLokasi('')
      setFormAsetKondisi('Baik')
    }
    setAsetModalOpen(true)
  }

  const openAsetDetail = (aset: AsetItem) => {
    setSelectedAsetDetail(aset)
    setAsetDetailOpen(true)
  }

  const saveAset = async () => {
    if (!formAsetNama.trim()) {
      showToast('Nama aset wajib diisi', 'error')
      return
    }
    try {
      const url = '/api/sipanuri/aset'
      const method = editAset ? 'PUT' : 'POST'
      const body = editAset 
        ? { id: editAset.id, nama: formAsetNama, kategori: formAsetKategori, jumlah: formAsetJumlah, lokasi: formAsetLokasi, kondisi: formAsetKondisi }
        : { nama: formAsetNama, kategori: formAsetKategori, jumlah: formAsetJumlah, lokasi: formAsetLokasi, kondisi: formAsetKondisi }
      
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (data.success) {
        showToast(data.message, 'success')
        setAsetModalOpen(false)
        loadAset()
      } else {
        showToast(data.message, 'error')
      }
    } catch {
      showToast('Terjadi kesalahan', 'error')
    }
  }

  const deleteAset = async (id: string) => {
    if (!confirm('Yakin ingin menghapus aset ini?')) return
    try {
      const res = await fetch(`/api/sipanuri/aset?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        showToast(data.message, 'success')
        loadAset()
      } else {
        showToast(data.message, 'error')
      }
    } catch {
      showToast('Terjadi kesalahan', 'error')
    }
  }

  const generateQRCode = (aset: AsetItem) => {
    const qrData = `ASET-${aset.id.substring(0, 8).toUpperCase()}-${aset.nama}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code - ${aset.nama}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
          .qr-card { text-align: center; border: 2px solid #333; padding: 30px; border-radius: 10px; }
          .qr-image { width: 200px; height: 200px; margin: 20px auto; }
          .asset-name { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          .asset-id { font-family: monospace; font-size: 12px; color: #666; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="qr-card">
          <div class="asset-name">${aset.nama}</div>
          <img src="${qrUrl}" alt="QR Code" class="qr-image">
          <div class="asset-id">ID: ${aset.id.substring(0, 8).toUpperCase()}</div>
          <div class="asset-id">Kategori: ${aset.kategori || '-'}</div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
    }
  }

  const printAsetReport = () => {
    // Common hospital letterhead - logo on right side only, larger (130px)
    const hospitalLetterhead = `
      <div style="text-align: center; border-bottom: 3px double #1e3a5f; padding-bottom: 15px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="text-align: center; vertical-align: middle; padding-right: 20px;">
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1e3a5f;">PEMERINTAH KABUPATEN KUTAI KARTANEGARA</p>
              <p style="margin: 0; font-size: 13px; font-weight: bold; color: #1e3a5f;">DINAS KESEHATAN</p>
              <p style="margin: 0; font-size: 12px; font-weight: bold; color: #1e3a5f;">UNIT ORGANISASI BERSIFAT KHUSUS</p>
              <p style="margin: 2px 0; font-size: 16px; font-weight: bold; color: #0d9488;">RUMAH SAKIT UMUM DAERAH AJI MUHAMMAD PARIKESIT</p>
              <p style="margin: 0; font-size: 11px; font-style: italic; color: #555;">Jalan Ratu Agung No.1 Tenggarong Seberang Telepon (0541) 661015 Kode Pos 75572</p>
              <p style="margin: 0; font-size: 11px; font-style: italic; color: #555;">Laman : www.rsamp.kukarkab.go.id Pos-el : rsudamparikesit@yahoo.com</p>
            </td>
            <td style="width: 150px; text-align: center; vertical-align: middle;">
              <img src="https://rsamp.kukarkab.go.id/template/demos/construction/images/logo-s.png" alt="Logo RSUD" style="width: 130px; height: auto;" onerror="this.style.display='none'">
            </td>
          </tr>
        </table>
      </div>
    `
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Inventaris Aset</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; padding: 20px; max-width: 210mm; margin: 0 auto; font-size: 12pt; }
          .title { font-size: 14pt; font-weight: bold; text-align: center; margin: 20px 0; text-decoration: underline; }
          .subtitle { font-size: 11pt; text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
          th { background: #f0f0f0; font-weight: bold; text-align: center; }
          .stats { display: flex; gap: 15px; margin: 20px 0; }
          .stat-box { padding: 10px; border: 1px solid #ddd; flex: 1; text-align: center; }
          .stat-number { font-size: 16pt; font-weight: bold; }
          .stat-label { font-size: 10pt; color: #666; }
          .sign-section { margin-top: 40px; display: flex; justify-content: flex-end; }
          .sign-box { width: 200px; text-align: center; }
          .sign-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        ${hospitalLetterhead}
        <h2 class="title">LAPORAN INVENTARIS ASET</h2>
        <p class="subtitle">Unit: Paviliun Nuri | Tanggal: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <table>
          <thead>
            <tr>
              <th style="width: 40px;">No</th>
              <th>Nama Aset</th>
              <th>Kategori</th>
              <th>Jumlah</th>
              <th>Lokasi</th>
              <th>Kondisi</th>
            </tr>
          </thead>
          <tbody>
            ${asetData.map((item, i) => `
              <tr>
                <td style="text-align: center;">${i + 1}</td>
                <td>${item.nama}</td>
                <td style="text-align: center;">${item.kategori || '-'}</td>
                <td style="text-align: center;">${item.jumlah}</td>
                <td>${item.lokasi || '-'}</td>
                <td style="text-align: center;">${item.kondisi || 'Baik'}</td>
              </tr>
            `).join('')}
            <tr style="font-weight: bold; background: #f9f9f9;">
              <td colspan="3" style="text-align: center;">TOTAL</td>
              <td style="text-align: center;">${asetStats?.totalUnit || 0}</td>
              <td colspan="2"></td>
            </tr>
          </tbody>
        </table>
        
        <div class="sign-section">
          <div class="sign-box">
            <p>Tenggarong, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>Kepala Instalasi</p>
            <div class="sign-line">_______________________</div>
            <p style="font-size: 10pt;">NIP.</p>
          </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
    }
  }

  // BHP ATK handlers
  const openBhpModal = (bhp?: BhpItem) => {
    if (bhp) {
      setEditBhp(bhp)
      setFormBhpNama(bhp.nama)
      setFormBhpKategori(bhp.kategori || '')
      setFormBhpStokAwal(bhp.stokAwal)
      setFormBhpSatuan(bhp.satuan || '')
      setFormBhpKondisi(bhp.kondisi || 'Baik')
    } else {
      setEditBhp(null)
      setFormBhpNama('')
      setFormBhpKategori('')
      setFormBhpStokAwal(0)
      setFormBhpSatuan('')
      setFormBhpKondisi('Baik')
    }
    setBhpModalOpen(true)
  }

  const openBhpDetail = async (bhp: BhpItem) => {
    setSelectedBhpDetail(bhp)
    setBhpDetailOpen(true)
    // Fetch stock history
    try {
      const res = await fetch(`/api/sipanuri/bhp?id=${bhp.id}&history=true`)
      const data = await res.json()
      if (data.stokHistory) setStokHistory(data.stokHistory)
    } catch {
      setStokHistory([])
    }
  }

  const saveBhp = async () => {
    if (!formBhpNama.trim()) {
      showToast('Nama BHP ATK wajib diisi', 'error')
      return
    }
    try {
      const url = '/api/sipanuri/bhp'
      const method = editBhp ? 'PUT' : 'POST'
      const body = editBhp 
        ? { id: editBhp.id, nama: formBhpNama, kategori: formBhpKategori, satuan: formBhpSatuan, kondisi: formBhpKondisi }
        : { nama: formBhpNama, kategori: formBhpKategori, stokAwal: formBhpStokAwal, satuan: formBhpSatuan, kondisi: formBhpKondisi }
      
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (data.success) {
        showToast(data.message, 'success')
        setBhpModalOpen(false)
        loadBhp()
      } else {
        showToast(data.message, 'error')
      }
    } catch {
      showToast('Terjadi kesalahan', 'error')
    }
  }

  const deleteBhp = async (id: string) => {
    if (!confirm('Yakin ingin menghapus BHP ATK ini?')) return
    try {
      const res = await fetch(`/api/sipanuri/bhp?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        showToast(data.message, 'success')
        loadBhp()
      } else {
        showToast(data.message, 'error')
      }
    } catch {
      showToast('Terjadi kesalahan', 'error')
    }
  }

  // Stock transaction handlers
  const openStokModal = (bhp: BhpItem, jenis: 'MASUK' | 'KELUAR') => {
    setStokBhpItem(bhp)
    setStokJenis(jenis)
    setStokJumlah(1)
    setStokKeterangan('')
    setStokPetugas('')
    setStokModalOpen(true)
  }

  const processStokTransaction = async () => {
    if (!stokBhpItem || stokJumlah <= 0) {
      showToast('Jumlah tidak valid', 'error')
      return
    }
    if (stokJenis === 'KELUAR' && stokJumlah > stokBhpItem.sisaStok) {
      showToast('Stok tidak mencukupi', 'error')
      return
    }
    try {
      const res = await fetch('/api/sipanuri/bhp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockTransaction: true,
          bhpId: stokBhpItem.id,
          jenis: stokJenis,
          jumlah: stokJumlah,
          keterangan: stokKeterangan,
          petugas: stokPetugas
        })
      })
      const data = await res.json()
      if (data.success) {
        showToast(data.message, 'success')
        setStokModalOpen(false)
        loadBhp()
      } else {
        showToast(data.message, 'error')
      }
    } catch {
      showToast('Terjadi kesalahan', 'error')
    }
  }

  const generateBhpQRCode = (bhp: BhpItem) => {
    const qrData = `BHP-${bhp.id.substring(0, 8).toUpperCase()}-${bhp.nama}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code - ${bhp.nama}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
          .qr-card { text-align: center; border: 2px solid #333; padding: 30px; border-radius: 10px; }
          .qr-image { width: 200px; height: 200px; margin: 20px auto; }
          .bhp-name { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          .bhp-id { font-family: monospace; font-size: 12px; color: #666; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="qr-card">
          <div class="bhp-name">${bhp.nama}</div>
          <img src="${qrUrl}" alt="QR Code" class="qr-image">
          <div class="bhp-id">ID: ${bhp.id.substring(0, 8).toUpperCase()}</div>
          <div class="bhp-id">Kategori: ${bhp.kategori || '-'}</div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
    }
  }

  const printBhpReport = () => {
    // Common hospital letterhead - logo on right side only, larger (130px)
    const hospitalLetterhead = `
      <div style="text-align: center; border-bottom: 3px double #1e3a5f; padding-bottom: 15px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="text-align: center; vertical-align: middle; padding-right: 20px;">
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1e3a5f;">PEMERINTAH KABUPATEN KUTAI KARTANEGARA</p>
              <p style="margin: 0; font-size: 13px; font-weight: bold; color: #1e3a5f;">DINAS KESEHATAN</p>
              <p style="margin: 0; font-size: 12px; font-weight: bold; color: #1e3a5f;">UNIT ORGANISASI BERSIFAT KHUSUS</p>
              <p style="margin: 2px 0; font-size: 16px; font-weight: bold; color: #0d9488;">RUMAH SAKIT UMUM DAERAH AJI MUHAMMAD PARIKESIT</p>
              <p style="margin: 0; font-size: 11px; font-style: italic; color: #555;">Jalan Ratu Agung No.1 Tenggarong Seberang Telepon (0541) 661015 Kode Pos 75572</p>
              <p style="margin: 0; font-size: 11px; font-style: italic; color: #555;">Laman : www.rsamp.kukarkab.go.id Pos-el : rsudamparikesit@yahoo.com</p>
            </td>
            <td style="width: 150px; text-align: center; vertical-align: middle;">
              <img src="https://rsamp.kukarkab.go.id/template/demos/construction/images/logo-s.png" alt="Logo RSUD" style="width: 130px; height: auto;" onerror="this.style.display='none'">
            </td>
          </tr>
        </table>
      </div>
    `
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan BHP ATK</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; padding: 20px; max-width: 210mm; margin: 0 auto; font-size: 12pt; }
          .letterhead { text-align: center; border-bottom: 3px double #333; padding-bottom: 15px; margin-bottom: 25px; }
          .title { font-size: 14pt; font-weight: bold; text-align: center; margin: 20px 0; text-decoration: underline; }
          .subtitle { font-size: 11pt; text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
          th { background: #f0f0f0; font-weight: bold; text-align: center; }
          .stats { display: flex; gap: 15px; margin: 20px 0; }
          .stat-box { padding: 10px; border: 1px solid #ddd; flex: 1; text-align: center; }
          .stat-number { font-size: 16pt; font-weight: bold; }
          .stat-label { font-size: 10pt; color: #666; }
          .sign-section { margin-top: 40px; display: flex; justify-content: flex-end; }
          .sign-box { width: 200px; text-align: center; }
          .sign-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        ${hospitalLetterhead}
        <h2 class="title">LAPORAN INVENTARIS BHP ATK</h2>
        <p class="subtitle">Unit: Paviliun Nuri | Tanggal: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        
        <table>
          <thead>
            <tr>
              <th style="width: 40px;">No</th>
              <th>Nama BHP ATK</th>
              <th>Kategori</th>
              <th>Stok Awal</th>
              <th>Stok Masuk</th>
              <th>Stok Keluar</th>
              <th>Sisa Stok</th>
              <th>Satuan</th>
            </tr>
          </thead>
          <tbody>
            ${bhpData.map((item, i) => `
              <tr>
                <td style="text-align: center;">${i + 1}</td>
                <td>${item.nama}</td>
                <td style="text-align: center;">${item.kategori || '-'}</td>
                <td style="text-align: center;">${item.stokAwal}</td>
                <td style="text-align: center;">${item.stokMasuk}</td>
                <td style="text-align: center;">${item.stokKeluar}</td>
                <td style="text-align: center;">${item.sisaStok}</td>
                <td style="text-align: center;">${item.satuan || '-'}</td>
              </tr>
            `).join('')}
            <tr style="font-weight: bold; background: #f9f9f9;">
              <td colspan="3" style="text-align: center;">TOTAL</td>
              <td style="text-align: center;">${bhpStats?.totalStokAwal || 0}</td>
              <td style="text-align: center;">${bhpStats?.totalStokMasuk || 0}</td>
              <td style="text-align: center;">${bhpStats?.totalStokKeluar || 0}</td>
              <td style="text-align: center;">${bhpStats?.totalSisaStok || 0}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
        
        <div class="sign-section">
          <div class="sign-box">
            <p>Tenggarong, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>Kepala Instalasi</p>
            <div class="sign-line">_______________________</div>
            <p style="font-size: 10pt;">NIP.</p>
          </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
    }
  }

  // Laporan Bulanan Print
  const printLaporanBulanan = () => {
    if (!laporan) return
    const hospitalLetterhead = `
      <div style="text-align: center; border-bottom: 3px double #1e3a5f; padding-bottom: 15px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="text-align: center; vertical-align: middle; padding-right: 20px;">
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1e3a5f;">PEMERINTAH KABUPATEN KUTAI KARTANEGARA</p>
              <p style="margin: 0; font-size: 13px; font-weight: bold; color: #1e3a5f;">DINAS KESEHATAN</p>
              <p style="margin: 0; font-size: 12px; font-weight: bold; color: #1e3a5f;">UNIT ORGANISASI BERSIFAT KHUSUS</p>
              <p style="margin: 2px 0; font-size: 16px; font-weight: bold; color: #0d9488;">RUMAH SAKIT UMUM DAERAH AJI MUHAMMAD PARIKESIT</p>
              <p style="margin: 0; font-size: 11px; font-style: italic; color: #555;">Jalan Ratu Agung No.1 Tenggarong Seberang Telepon (0541) 661015 Kode Pos 75572</p>
              <p style="margin: 0; font-size: 11px; font-style: italic; color: #555;">Laman : www.rsamp.kukarkab.go.id Pos-el : rsudamparikesit@yahoo.com</p>
            </td>
            <td style="width: 150px; text-align: center; vertical-align: middle;">
              <img src="https://rsamp.kukarkab.go.id/template/demos/construction/images/logo-s.png" alt="Logo RSUD" style="width: 130px; height: auto;" onerror="this.style.display='none'">
            </td>
          </tr>
        </table>
      </div>
    `
    
    // Generate chart images as SVG for print
    const diagnosaChartData = laporan.diagnosaBreakdown.slice(0, 5)
    const dokterChartData = laporan.dokterBreakdown.slice(0, 5)
    const tipeChartData = laporan.tipeBreakdown
    
    // Create simple bar chart representation using HTML/CSS
    const createBarChart = (data: { name: string; value: number }[], title: string, color: string) => {
      if (data.length === 0) return `<p style="text-align: center; color: #999; padding: 20px;">Tidak ada data</p>`
      const maxValue = Math.max(...data.map(d => d.value), 1)
      return `
        <div style="margin: 15px 0;">
          <h4 style="margin-bottom: 10px; font-weight: bold; color: #333;">${title}</h4>
          ${data.map(d => `
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <div style="width: 120px; font-size: 11px; color: #555; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${d.name}</div>
              <div style="flex: 1; background: #f0f0f0; height: 20px; border-radius: 4px; overflow: hidden;">
                <div style="width: ${(d.value / maxValue) * 100}%; height: 100%; background: ${color}; display: flex; align-items: center; justify-content: flex-end; padding-right: 5px;">
                  <span style="font-size: 10px; color: white; font-weight: bold;">${d.value}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `
    }
    
    // Create pie chart representation using simple visual
    const createPieChart = (data: { name: string; value: number }[], title: string, colors: string[]) => {
      if (data.length === 0) return `<p style="text-align: center; color: #999; padding: 20px;">Tidak ada data</p>`
      const total = data.reduce((sum, d) => sum + d.value, 0)
      return `
        <div style="margin: 15px 0;">
          <h4 style="margin-bottom: 10px; font-weight: bold; color: #333;">${title}</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            ${data.map((d, i) => `
              <div style="display: flex; align-items: center; gap: 5px;">
                <div style="width: 12px; height: 12px; background: ${colors[i % colors.length]}; border-radius: 2px;"></div>
                <span style="font-size: 11px; color: #555;">${d.name}: ${d.value} (${total > 0 ? Math.round((d.value / total) * 100) : 0}%)</span>
              </div>
            `).join('')}
          </div>
        </div>
      `
    }
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Bulanan - ${laporan.period.label}</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; padding: 20px; max-width: 210mm; margin: 0 auto; font-size: 12pt; }
          .title { font-size: 14pt; font-weight: bold; text-align: center; margin: 20px 0; text-decoration: underline; }
          .subtitle { font-size: 11pt; text-align: center; margin-bottom: 20px; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .stat-box { padding: 15px; border: 1px solid #ddd; text-align: center; border-radius: 8px; }
          .stat-number { font-size: 20pt; font-weight: bold; color: #0d9488; }
          .stat-label { font-size: 10pt; color: #666; margin-top: 5px; }
          .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .chart-box { padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
          th { background: #f0f0f0; font-weight: bold; text-align: center; }
          .sign-section { margin-top: 40px; display: flex; justify-content: flex-end; }
          .sign-box { width: 200px; text-align: center; }
          .sign-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; }
          @media print { 
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .stat-box { break-inside: avoid; }
            .chart-box { break-inside: avoid; }
          }
          @page { size: A4; margin: 15mm; }
        </style>
      </head>
      <body>
        ${hospitalLetterhead}
        <h2 class="title">LAPORAN BULANAN PAVILIUN NURI</h2>
        <p class="subtitle">Periode: ${laporan.period.label}</p>
        
        <!-- Summary Statistics -->
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-number">${laporan.summary.totalMasuk}</div>
            <div class="stat-label">Pasien Masuk</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${laporan.summary.totalKeluar}</div>
            <div class="stat-label">Pasien Keluar</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${laporan.summary.totalKamar}</div>
            <div class="stat-label">Total Kamar</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${laporan.summary.okupansi}%</div>
            <div class="stat-label">Tingkat Okupansi</div>
          </div>
        </div>
        
        <!-- Charts Section -->
        <div class="charts-row">
          <div class="chart-box">
            ${createBarChart(
              diagnosaChartData.map(d => ({ name: d.diagnosa, value: d.jumlah })),
              'Top 5 Diagnosa',
              '#0d9488'
            )}
          </div>
          <div class="chart-box">
            ${createBarChart(
              dokterChartData.map(d => ({ name: d.dokter, value: d.jumlah })),
              'Top 5 Dokter Penangan',
              '#1e3a5f'
            )}
          </div>
        </div>
        
        <div class="charts-row">
          <div class="chart-box">
            ${createPieChart(
              tipeChartData.map(t => ({ name: t.tipe, value: t.jumlah })),
              'Berdasarkan Tipe Kamar',
              ['#0d9488', '#1e3a5f', '#d97706', '#059669']
            )}
          </div>
          <div class="chart-box">
            <h4 style="margin-bottom: 10px; font-weight: bold; color: #333;">Ringkasan</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 11pt;">
              <li>Total pasien masuk bulan ini: <strong>${laporan.summary.totalMasuk}</strong> pasien</li>
              <li>Total pasien keluar bulan ini: <strong>${laporan.summary.totalKeluar}</strong> pasien</li>
              <li>Tingkat okupansi kamar: <strong>${laporan.summary.okupansi}%</strong></li>
              <li>Diagnosa terbanyak: <strong>${laporan.diagnosaBreakdown[0]?.diagnosa || '-'}</strong></li>
            </ul>
          </div>
        </div>
        
        <!-- Detail Table -->
        <h3 style="margin-top: 25px; font-size: 12pt;">Detail Riwayat Pasien</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 40px;">No</th>
              <th>Tanggal</th>
              <th>Aksi</th>
              <th>Kamar</th>
              <th>Tipe</th>
              <th>Pasien</th>
              <th>Dokter</th>
              <th>Diagnosa</th>
            </tr>
          </thead>
          <tbody>
            ${laporan.history.length === 0 ? '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #999;">Tidak ada data</td></tr>' : 
              laporan.history.map((h, i) => {
                const kamar = kamarData.find(k => k.No_Kamar === h.noKamar)
                return `
                  <tr>
                    <td style="text-align: center;">${i + 1}</td>
                    <td>${new Date(h.timestamp).toLocaleDateString('id-ID')}</td>
                    <td style="text-align: center;"><span style="padding: 2px 8px; border-radius: 10px; font-size: 10pt; ${h.aksi === 'MASUK' ? 'background: #d1fae5; color: #065f46;' : 'background: #fee2e2; color: #991b1b;'}">${h.aksi}</span></td>
                    <td style="text-align: center; font-weight: bold;">${h.noKamar}</td>
                    <td style="text-align: center;">${kamar?.Tipe || '-'}</td>
                    <td>${h.pasien || '-'}</td>
                    <td>${h.dokter || '-'}</td>
                    <td>${h.diagnosa || '-'}</td>
                  </tr>
                `
              }).join('')
            }
          </tbody>
        </table>
        
        <div class="sign-section">
          <div class="sign-box">
            <p>Tenggarong, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>Kepala Instalasi</p>
            <div class="sign-line">_______________________</div>
            <p style="font-size: 10pt;">NIP.</p>
          </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
    }
  }

  // Dokter handlers
  const openDokterModal = (dokter?: Dokter) => {
    if (dokter) { setEditDokter(dokter); setFormDokterNama(dokter.nama); setFormDokterSpesialis(dokter.spesialis || '') }
    else { setEditDokter(null); setFormDokterNama(''); setFormDokterSpesialis('') }
    setDokterModalOpen(true)
  }

  const saveDokter = async () => {
    if (!formDokterNama.trim()) { showToast('Nama dokter wajib diisi', 'error'); return }
    try {
      const url = '/api/sipanuri/dokter'
      const method = editDokter ? 'PUT' : 'POST'
      const body = editDokter ? { id: editDokter.id, nama: formDokterNama, spesialis: formDokterSpesialis } : { nama: formDokterNama, spesialis: formDokterSpesialis }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (data.success) { showToast(data.message, 'success'); setDokterModalOpen(false); loadDokter() }
      else showToast(data.message, 'error')
    } catch { showToast('Terjadi kesalahan', 'error') }
  }

  const deleteDokter = async (id: string) => {
    if (!confirm('Yakin ingin menghapus dokter ini?')) return
    try {
      const res = await fetch(`/api/sipanuri/dokter?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { showToast(data.message, 'success'); loadDokter() }
      else showToast(data.message, 'error')
    } catch { showToast('Terjadi kesalahan', 'error') }
  }

  // Peminjaman handlers
  const openPeminjamanModal = () => {
    setFormPinjamAset('')
    setFormPinjamJumlah(1)
    setFormPinjamPeminjam('')
    setFormPinjamUnit('')
    setFormPinjamTujuan('')
    setFormPinjamCatatan('')
    setSelectedPeminjaman(null)
    setPeminjamanModalOpen(true)
  }

  const openPeminjamanDetail = (item: PeminjamanItem) => {
    setSelectedPeminjaman(item)
    setPeminjamanDetailOpen(true)
  }

  const openPeminjamanEdit = (item: PeminjamanItem) => {
    setSelectedPeminjaman(item)
    setFormPinjamAset(item.asetId)
    setFormPinjamJumlah(item.jumlah)
    setFormPinjamPeminjam(item.peminjam)
    setFormPinjamUnit(item.unit || '')
    setFormPinjamTujuan(item.tujuan || '')
    setFormPinjamCatatan(item.catatan || '')
    setFormPinjamStatus(item.status)
    setPeminjamanEditOpen(true)
  }

  const savePeminjaman = async () => {
    if (!formPinjamAset || !formPinjamPeminjam) {
      showToast('Aset dan peminjam wajib diisi', 'error')
      return
    }
    const aset = asetData.find(a => a.id === formPinjamAset)
    try {
      const res = await fetch('/api/sipanuri/peminjaman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asetId: formPinjamAset,
          namaAset: aset?.nama,
          jumlah: formPinjamJumlah,
          peminjam: formPinjamPeminjam,
          unit: formPinjamUnit,
          tujuan: formPinjamTujuan,
          catatan: formPinjamCatatan
        })
      })
      const data = await res.json()
      if (data.success) { showToast(data.message, 'success'); setPeminjamanModalOpen(false); loadPeminjaman() }
      else showToast(data.message, 'error')
    } catch { showToast('Terjadi kesalahan', 'error') }
  }

  const updatePeminjaman = async () => {
    if (!selectedPeminjaman || !formPinjamAset || !formPinjamPeminjam) {
      showToast('Data tidak lengkap', 'error')
      return
    }
    const aset = asetData.find(a => a.id === formPinjamAset)
    try {
      const res = await fetch('/api/sipanuri/peminjaman', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPeminjaman.id,
          asetId: formPinjamAset,
          namaAset: aset?.nama,
          jumlah: formPinjamJumlah,
          peminjam: formPinjamPeminjam,
          unit: formPinjamUnit,
          tujuan: formPinjamTujuan,
          catatan: formPinjamCatatan,
          status: formPinjamStatus
        })
      })
      const data = await res.json()
      if (data.success) { showToast('Data peminjaman berhasil diperbarui', 'success'); setPeminjamanEditOpen(false); loadPeminjaman() }
      else showToast(data.message, 'error')
    } catch { showToast('Terjadi kesalahan', 'error') }
  }

  const kembalikanAset = async (id: string) => {
    if (!confirm('Konfirmasi pengembalian aset?')) return
    try {
      const res = await fetch('/api/sipanuri/peminjaman', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'Dikembalikan' })
      })
      const data = await res.json()
      if (data.success) { showToast('Aset berhasil dikembalikan', 'success'); loadPeminjaman() }
      else showToast(data.message, 'error')
    } catch { showToast('Terjadi kesalahan', 'error') }
  }

  const deletePeminjaman = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data peminjaman ini?')) return
    try {
      const res = await fetch(`/api/sipanuri/peminjaman?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { showToast(data.message, 'success'); loadPeminjaman() }
      else showToast(data.message, 'error')
    } catch { showToast('Terjadi kesalahan', 'error') }
  }

  const printBuktiPeminjaman = (item: PeminjamanItem) => {
    // Common hospital letterhead - logo on right side only, larger (130px)
    const hospitalLetterhead = `
      <div style="text-align: center; border-bottom: 3px double #1e3a5f; padding-bottom: 15px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="text-align: center; vertical-align: middle; padding-right: 20px;">
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1e3a5f;">PEMERINTAH KABUPATEN KUTAI KARTANEGARA</p>
              <p style="margin: 0; font-size: 13px; font-weight: bold; color: #1e3a5f;">DINAS KESEHATAN</p>
              <p style="margin: 0; font-size: 12px; font-weight: bold; color: #1e3a5f;">UNIT ORGANISASI BERSIFAT KHUSUS</p>
              <p style="margin: 2px 0; font-size: 16px; font-weight: bold; color: #0d9488;">RUMAH SAKIT UMUM DAERAH AJI MUHAMMAD PARIKESIT</p>
              <p style="margin: 0; font-size: 11px; font-style: italic; color: #555;">Jalan Ratu Agung No.1 Tenggarong Seberang Telepon (0541) 661015 Kode Pos 75572</p>
              <p style="margin: 0; font-size: 11px; font-style: italic; color: #555;">Laman : www.rsamp.kukarkab.go.id Pos-el : rsudamparikesit@yahoo.com</p>
            </td>
            <td style="width: 150px; text-align: center; vertical-align: middle;">
              <img src="https://rsamp.kukarkab.go.id/template/demos/construction/images/logo-s.png" alt="Logo RSUD" style="width: 130px; height: auto;" onerror="this.style.display='none'">
            </td>
          </tr>
        </table>
      </div>
    `
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bukti Peminjaman Aset</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; padding: 20px; max-width: 210mm; margin: 0 auto; font-size: 12pt; }
          .title { font-size: 14pt; font-weight: bold; text-align: center; margin: 20px 0; text-decoration: underline; }
          .content { margin-bottom: 20px; }
          .row { display: flex; margin-bottom: 8px; }
          .label { width: 180px; font-weight: bold; }
          .value { flex: 1; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11pt; font-weight: bold; }
          .status-dipinjam { background: #fef3c7; color: #92400e; }
          .status-dikembalikan { background: #d1fae5; color: #065f46; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; }
          .sign-box { width: 200px; text-align: center; }
          .sign-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        ${hospitalLetterhead}
        <h2 class="title">BUKTI PEMINJAMAN ASET</h2>
        <div class="content">
          <div class="row"><span class="label">No. Referensi</span><span class="value">: ${item.id.substring(0, 8).toUpperCase()}</span></div>
          <div class="row"><span class="label">Nama Aset</span><span class="value">: ${item.namaAset}</span></div>
          <div class="row"><span class="label">Jumlah</span><span class="value">: ${item.jumlah} unit</span></div>
          <div class="row"><span class="label">Peminjam</span><span class="value">: ${item.peminjam}</span></div>
          <div class="row"><span class="label">Unit/Ruangan</span><span class="value">: ${item.unit || '-'}</span></div>
          <div class="row"><span class="label">Tujuan</span><span class="value">: ${item.tujuan || '-'}</span></div>
          <div class="row"><span class="label">Tanggal Pinjam</span><span class="value">: ${new Date(item.tanggalPinjam).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
          <div class="row"><span class="label">Tanggal Kembali</span><span class="value">: ${item.tanggalKembali ? new Date(item.tanggalKembali).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</span></div>
          <div class="row"><span class="label">Status</span><span class="value">: <span class="status ${item.status === 'Dipinjam' ? 'status-dipinjam' : 'status-dikembalikan'}">${item.status}</span></span></div>
          <div class="row"><span class="label">Catatan</span><span class="value">: ${item.catatan || '-'}</span></div>
        </div>
        <div class="footer">
          <div class="sign-box">
            <p>Peminjam,</p>
            <div class="sign-line">${item.peminjam}</div>
          </div>
          <div class="sign-box">
            <p>Tenggarong, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>Kepala Instalasi</p>
            <div class="sign-line">_______________________</div>
            <p style="font-size: 10pt;">NIP.</p>
          </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
    }
  }

  // Filtered data
  const filteredKamar = kamarData.filter(k => k.No_Kamar.startsWith(floor.toString()))
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const vvipRooms = kamarData.filter(k => k.Tipe === 'VVIP')
  const vipRooms = kamarData.filter(k => k.Tipe === 'VIP')
  const total = kamarData.length
  const terisi = kamarData.filter(k => k.Status === 'Terisi').length

  const menuTitle: Record<string, string> = { dashboard: 'Dashboard', kamar: 'Monitoring Kamar', bhp: 'BHP ATK', aset: 'Aset & Perlengkapan', dokter: 'Manajemen Dokter', laporan: 'Laporan', peminjaman: 'Peminjaman Aset' }

  // Get unique kategori list
  const kategoriList = [...new Set(asetData.map(a => a.kategori).filter(Boolean))]
  const bhpKategoriList = [...new Set(bhpData.map(b => b.kategori).filter(Boolean))]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Sidebar - Elegant Navy Blue */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transform transition-transform lg:translate-x-0 shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/10 text-center">
          <img src="https://rsamp.kukarkab.go.id/template/demos/construction/images/logo-s.png" alt="Logo RSUD" className="w-56 h-auto mx-auto mb-4 drop-shadow-lg" />
          <h1 className="text-xl font-bold tracking-wide bg-gradient-to-r from-teal-300 to-amber-300 bg-clip-text text-transparent">SIPANURI</h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">Sistem Pemantauan<br/>Paviliun Nuri</p>
        </div>
        <nav className="p-4 space-y-1">
          <button onClick={() => { setMenu('dashboard'); setSidebarOpen(false) }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${menu === 'dashboard' ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}><BarChart3 size={20} /> Dashboard</button>
          <button onClick={() => { setMenu('kamar'); setSidebarOpen(false) }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${menu === 'kamar' ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}><Bed size={20} /> Kamar Nuri</button>
          <button onClick={() => { setMenu('dokter'); setSidebarOpen(false) }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${menu === 'dokter' ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}><UserPlus size={20} /> Dokter</button>
          <button onClick={() => { setMenu('laporan'); setSidebarOpen(false) }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${menu === 'laporan' ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}><FileText size={20} /> Laporan</button>
          <button onClick={() => setInvMenuOpen(!invMenuOpen)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-slate-300 hover:bg-white/5 hover:text-white transition-all"><span className="flex items-center gap-3"><Package size={20} /> Inventaris</span><ChevronDown size={16} className={`transition ${invMenuOpen ? 'rotate-180' : ''}`} /></button>
          {invMenuOpen && (
            <div className="ml-4 space-y-1 border-l-2 border-slate-700 pl-4">
              <button onClick={() => { setMenu('bhp'); setSidebarOpen(false) }} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left text-sm transition-all ${menu === 'bhp' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'}`}><FileText size={18} /> BHP ATK</button>
              <button onClick={() => { setMenu('aset'); setSidebarOpen(false) }} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left text-sm transition-all ${menu === 'aset' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'}`}><Wrench size={18} /> Aset</button>
              <button onClick={() => { setMenu('peminjaman'); setSidebarOpen(false) }} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left text-sm transition-all ${menu === 'peminjaman' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'}`}><ArrowRightLeft size={18} /> Peminjaman</button>
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-8 py-5 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-600">{sidebarOpen ? <X size={24} /> : <Menu size={24} />}</button>
            <div><h2 className="text-xl font-bold text-slate-800">{menuTitle[menu]}</h2><p className="text-sm text-slate-500">{today}</p></div>
          </div>
          <button onClick={() => { if (menu === 'aset') loadAset(); else if (menu === 'bhp') loadBhp(); else loadDashboard() }} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Perbarui</button>
        </header>

        <div className="p-6">
          {/* Dashboard */}
          {menu === 'dashboard' && stats && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 border border-slate-200/50 flex items-center gap-5 shadow-lg hover:shadow-xl transition-all"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg"><Calendar className="text-white" size={24} /></div><div><p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Pasien Bulan Ini</p><p className="text-3xl font-bold text-slate-800">{stats.bulanan.totalPasien}</p></div></div>
                <div className="bg-white rounded-2xl p-6 border border-slate-200/50 flex items-center gap-5 shadow-lg hover:shadow-xl transition-all"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg"><Crown className="text-white" size={24} /></div><div><p className="text-xs text-slate-500 font-medium uppercase tracking-wide">VVIP Terisi</p><p className="text-3xl font-bold text-slate-800">{stats.kamar.vvip.terisi}/{stats.kamar.vvip.total}</p></div></div>
                <div className="bg-white rounded-2xl p-6 border border-slate-200/50 flex items-center gap-5 shadow-lg hover:shadow-xl transition-all"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg"><Bed className="text-white" size={24} /></div><div><p className="text-xs text-slate-500 font-medium uppercase tracking-wide">VIP Terisi</p><p className="text-3xl font-bold text-slate-800">{stats.kamar.vip.terisi}/{stats.kamar.vip.total}</p></div></div>
                <div className="bg-white rounded-2xl p-6 border border-slate-200/50 flex items-center gap-5 shadow-lg hover:shadow-xl transition-all"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-lg"><TrendingUp className="text-white" size={24} /></div><div><p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Okupansi</p><p className="text-3xl font-bold text-slate-800">{stats.kamar.okupansi}%</p></div></div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/50 p-8 shadow-lg">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-3 text-slate-800"><BarChart3 size={22} className="text-teal-600" /> Top 5 Diagnosa Bulan Ini</h3>
                {stats.bulanan.topDiagnosa.length === 0 ? <p className="text-slate-400 text-center py-12">Belum ada data diagnosa bulan ini.</p> : (
                  <div className="space-y-3">{stats.bulanan.topDiagnosa.map((d, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all"><span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-sm font-bold shadow-md">{i + 1}</span><span className="flex-1 font-medium text-slate-700">{d.diagnosa}</span><span className="font-bold text-teal-600">{d.jumlah} pasien</span></div>
                  ))}</div>
                )}
              </div>
            </>
          )}

          {/* Kamar */}
          {menu === 'kamar' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 border border-slate-200/50 flex items-center gap-5 shadow-lg hover:shadow-xl transition-all"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg"><Crown className="text-white" size={24} /></div><div><p className="text-xs text-slate-500 font-medium uppercase tracking-wide">VVIP</p><p className="text-3xl font-bold text-slate-800">{vvipRooms.filter(k => k.Status === 'Terisi').length}/{vvipRooms.length}</p></div></div>
                <div className="bg-white rounded-2xl p-6 border border-slate-200/50 flex items-center gap-5 shadow-lg hover:shadow-xl transition-all"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg"><Bed className="text-white" size={24} /></div><div><p className="text-xs text-slate-500 font-medium uppercase tracking-wide">VIP</p><p className="text-3xl font-bold text-slate-800">{vipRooms.filter(k => k.Status === 'Terisi').length}/{vipRooms.length}</p></div></div>
                <div className="bg-white rounded-2xl p-6 border border-slate-200/50 flex items-center gap-5 shadow-lg hover:shadow-xl transition-all"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-lg"><TrendingUp className="text-white" size={24} /></div><div><p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Okupansi</p><p className="text-3xl font-bold text-slate-800">{total > 0 ? Math.round((terisi / total) * 100) : 0}%</p></div></div>
                <div className="bg-white rounded-2xl p-6 border border-slate-200/50 flex items-center gap-5 shadow-lg hover:shadow-xl transition-all"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg"><Users className="text-white" size={24} /></div><div><p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Terisi</p><p className="text-3xl font-bold text-slate-800">{terisi}/{total}</p></div></div>
              </div>
              <div className="flex gap-4 mb-8">
                <button onClick={() => setFloor(2)} className={`px-6 py-3 rounded-xl font-medium transition-all shadow-lg ${floor === 2 ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Lantai 2</button>
                <button onClick={() => setFloor(3)} className={`px-6 py-3 rounded-xl font-medium transition-all shadow-lg ${floor === 3 ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Lantai 3</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredKamar.map(kamar => (
                  <div key={kamar.No_Kamar} onClick={() => handleCardClick(kamar)} className={`rounded-2xl p-6 border-2 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 ${kamar.Status === 'Terisi' ? 'bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200' : 'bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200'}`}>
                    <p className="text-2xl font-extrabold text-center mb-2 text-slate-800">{kamar.No_Kamar}</p>
                    <span className={`block text-center text-xs font-bold py-1.5 rounded-full mb-2 ${kamar.Tipe === 'VVIP' ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white' : 'bg-gradient-to-r from-slate-600 to-slate-700 text-white'}`}>{kamar.Tipe}</span>
                    <p className="text-center font-medium text-sm text-slate-600">{kamar.Status}</p>
                    {kamar.Pasien && <p className="text-center text-xs text-slate-500 mt-1 truncate">{kamar.Pasien}</p>}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Dokter */}
          {menu === 'dokter' && (
            <div className="bg-white rounded-2xl border border-slate-200/50 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-slate-200/50 font-bold flex items-center justify-between bg-slate-50"><span className="flex items-center gap-3 text-slate-800"><UserPlus size={22} className="text-teal-600" /> Daftar Dokter DPJP</span><button onClick={() => openDokterModal()} className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl text-sm font-medium hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg flex items-center gap-2"><UserPlus size={18} /> Tambah Dokter</button></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left"><tr><th className="px-4 py-3 font-medium">Nama</th><th className="px-4 py-3 font-medium">Spesialis</th><th className="px-4 py-3 font-medium text-center">Aksi</th></tr></thead>
                  <tbody>
                    {dokterList.length === 0 ? <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Belum ada data dokter</td></tr> : dokterList.map(d => (
                      <tr key={d.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{d.nama}</td>
                        <td className="px-4 py-3">{d.spesialis || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => openDokterModal(d)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                          <button onClick={() => deleteDokter(d.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Laporan - Gabungan History & Laporan Bulanan */}
          {menu === 'laporan' && (
            <>
              {/* Tab Switcher */}
              <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => setLaporanTab('harian')} 
                  className={`px-6 py-3 rounded-xl font-medium transition-all shadow-lg ${laporanTab === 'harian' ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="flex items-center gap-2"><Clock size={18} /> Riwayat Harian</span>
                </button>
                <button 
                  onClick={() => setLaporanTab('bulanan')} 
                  className={`px-6 py-3 rounded-xl font-medium transition-all shadow-lg ${laporanTab === 'bulanan' ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="flex items-center gap-2"><BarChart3 size={18} /> Rekap Bulanan</span>
                </button>
              </div>

              {/* Tab Content: Riwayat Harian */}
              {laporanTab === 'harian' && (
                <div className="bg-white rounded-2xl border border-slate-200/50 shadow-lg overflow-hidden">
                  <div className="p-6 border-b border-slate-200/50 font-bold flex items-center gap-3 text-slate-800 bg-slate-50"><Clock size={22} className="text-teal-600" /> Riwayat Pasien Harian</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-left"><tr><th className="px-4 py-3 font-medium">Waktu</th><th className="px-4 py-3 font-medium">Aksi</th><th className="px-4 py-3 font-medium">Kamar</th><th className="px-4 py-3 font-medium">Pasien</th><th className="px-4 py-3 font-medium">Dokter</th><th className="px-4 py-3 font-medium">Diagnosa</th><th className="px-4 py-3 font-medium">Lama Inap</th></tr></thead>
                      <tbody>
                        {history.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Belum ada riwayat</td></tr> : history.map((h, i) => (
                          <tr key={i} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-3">{new Date(h.timestamp).toLocaleString('id-ID')}</td>
                            <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${h.aksi === 'MASUK' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{h.aksi}</span></td>
                            <td className="px-4 py-3 font-medium">{h.noKamar}</td>
                            <td className="px-4 py-3">{h.pasien || '-'}</td>
                            <td className="px-4 py-3">{h.dokter || '-'}</td>
                            <td className="px-4 py-3">{h.diagnosa || '-'}</td>
                            <td className="px-4 py-3">{h.lamaInap || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab Content: Rekap Bulanan */}
              {laporanTab === 'bulanan' && laporan && (
                <>
                  {/* Header with Period Selector and Print Button */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                      <select value={`${laporanMonth.year}-${laporanMonth.month}`} onChange={e => { const [y, m] = e.target.value.split('-'); setLaporanMonth({ year: parseInt(y), month: parseInt(m) }) }} className="px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium">
                        {laporan.availableMonths.length > 0 ? laporan.availableMonths.map(m => <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>{m.label}</option>) : <option value={`${new Date().getFullYear()}-${new Date().getMonth() + 1}`}>{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</option>}
                      </select>
                    </div>
                    <button onClick={printLaporanBulanan} className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all hover:from-teal-700 hover:to-teal-800">
                      <Printer size={18} /> Cetak Laporan
                    </button>
                  </div>
                  
                  {/* Summary Statistics Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/50 flex items-center gap-5 shadow-lg hover:shadow-xl transition-all"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg"><Users className="text-white" size={24} /></div><div><p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Pasien Masuk</p><p className="text-3xl font-bold text-slate-800">{laporan.summary.totalMasuk}</p></div></div>
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/50 flex items-center gap-5 shadow-lg hover:shadow-xl transition-all"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-lg"><TrendingUp className="text-white" size={24} /></div><div><p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Pasien Keluar</p><p className="text-3xl font-bold text-slate-800">{laporan.summary.totalKeluar}</p></div></div>
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/50 flex items-center gap-5 shadow-lg hover:shadow-xl transition-all"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg"><Bed className="text-white" size={24} /></div><div><p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Kamar</p><p className="text-3xl font-bold text-slate-800">{laporan.summary.totalKamar}</p></div></div>
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/50 flex items-center gap-5 shadow-lg hover:shadow-xl transition-all"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg"><BarChart3 className="text-white" size={24} /></div><div><p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Okupansi</p><p className="text-3xl font-bold text-slate-800">{laporan.summary.okupansi}%</p></div></div>
                  </div>
                  
                  {/* Charts Section */}
                  <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    {/* Bar Chart - Pasien Masuk/Keluar */}
                    <div className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-lg">
                      <h3 className="font-bold mb-4 text-slate-800 flex items-center gap-2"><BarChart3 size={18} className="text-teal-600" /> Grafik Pasien</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: 'Pasien Masuk', jumlah: laporan.summary.totalMasuk, fill: '#0d9488' },
                            { name: 'Pasien Keluar', jumlah: laporan.summary.totalKeluar, fill: '#f43f5e' }
                          ]} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 12 }} width={80} />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                            <Bar dataKey="jumlah" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Pie Chart - Tipe Kamar */}
                    <div className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-lg">
                      <h3 className="font-bold mb-4 text-slate-800 flex items-center gap-2"><PieChartIcon size={18} className="text-teal-600" /> Distribusi Tipe Kamar</h3>
                      <div className="h-64">
                        {laporan.tipeBreakdown.length === 0 ? (
                          <p className="text-slate-400 text-center py-16">Tidak ada data</p>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={laporan.tipeBreakdown.map(t => ({ name: t.tipe, value: t.jumlah }))}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {laporan.tipeBreakdown.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={['#0d9488', '#1e3a5f', '#d97706', '#059669'][index % 4]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Diagnosa & Dokter Charts */}
                  <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    {/* Diagnosa Bar Chart */}
                    <div className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-lg">
                      <h3 className="font-bold mb-4 text-slate-800 flex items-center gap-2"><Activity size={18} className="text-teal-600" /> Top 5 Diagnosa</h3>
                      <div className="h-64">
                        {laporan.diagnosaBreakdown.length === 0 ? (
                          <p className="text-slate-400 text-center py-16">Tidak ada data</p>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={laporan.diagnosaBreakdown.slice(0, 5).map(d => ({ name: d.diagnosa.length > 15 ? d.diagnosa.substring(0, 15) + '...' : d.diagnosa, jumlah: d.jumlah }))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                              <Bar dataKey="jumlah" fill="#0d9488" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                    
                    {/* Dokter Bar Chart */}
                    <div className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-lg">
                      <h3 className="font-bold mb-4 text-slate-800 flex items-center gap-2"><UserPlus size={18} className="text-teal-600" /> Top 5 Dokter Penangan</h3>
                      <div className="h-64">
                        {laporan.dokterBreakdown.length === 0 ? (
                          <p className="text-slate-400 text-center py-16">Tidak ada data</p>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={laporan.dokterBreakdown.slice(0, 5).map(d => ({ name: d.dokter.split(' ').slice(-1)[0], jumlah: d.jumlah }))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                              <Bar dataKey="jumlah" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Detail Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/50 shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-slate-200/50 font-bold flex items-center gap-3 text-slate-800 bg-slate-50"><FileText size={20} className="text-teal-600" /> Detail Riwayat - {laporan.period.label}</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left"><tr><th className="px-4 py-3 font-medium">Tanggal</th><th className="px-4 py-3 font-medium">Aksi</th><th className="px-4 py-3 font-medium">Kamar</th><th className="px-4 py-3 font-medium">Pasien</th><th className="px-4 py-3 font-medium">Dokter</th><th className="px-4 py-3 font-medium">Diagnosa</th><th className="px-4 py-3 font-medium">Lama Inap</th></tr></thead>
                        <tbody>
                          {laporan.history.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr> : laporan.history.map((h, i) => (
                            <tr key={i} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-3">{new Date(h.timestamp).toLocaleDateString('id-ID')}</td>
                              <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${h.aksi === 'MASUK' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{h.aksi}</span></td>
                              <td className="px-4 py-3 font-medium">{h.noKamar}</td>
                              <td className="px-4 py-3">{h.pasien || '-'}</td>
                              <td className="px-4 py-3">{h.dokter || '-'}</td>
                              <td className="px-4 py-3">{h.diagnosa || '-'}</td>
                              <td className="px-4 py-3">{h.lamaInap || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* BHP ATK - Modern Design with Stock Management */}
          {menu === 'bhp' && (
            <div className="space-y-8">
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
                <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium opacity-80 uppercase tracking-wide">Total Jenis</p>
                      <p className="text-3xl font-bold mt-2">{bhpStats?.totalBhp || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Package size={24} />
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium opacity-80 uppercase tracking-wide">Stok Awal</p>
                      <p className="text-3xl font-bold mt-2">{bhpStats?.totalStokAwal || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Package size={24} />
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium opacity-80 uppercase tracking-wide">Stok Masuk</p>
                      <p className="text-3xl font-bold mt-2">{bhpStats?.totalStokMasuk || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <ArrowUp size={24} />
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium opacity-80 uppercase tracking-wide">Stok Keluar</p>
                      <p className="text-3xl font-bold mt-2">{bhpStats?.totalStokKeluar || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <ArrowDown size={24} />
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium opacity-80 uppercase tracking-wide">Sisa Stok</p>
                      <p className="text-3xl font-bold mt-2">{bhpStats?.totalSisaStok || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Package size={24} />
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium opacity-80 uppercase tracking-wide">Stok Rendah</p>
                      <p className="text-3xl font-bold mt-2">{bhpStats?.stokRendah || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <AlertTriangle size={24} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Distribution Chart */}
              {bhpStats && bhpStats.byKategori.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/50 shadow-lg p-8">
                  <h3 className="font-bold mb-6 flex items-center gap-3 text-slate-800"><BarChart3 size={22} className="text-teal-600" /> Distribusi Kategori (Sisa Stok)</h3>
                  <div className="flex flex-wrap gap-3">
                    {bhpStats.byKategori.map((k, i) => {
                      const colors = ['bg-red-500', 'bg-blue-500', 'bg-amber-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500']
                      const percentage = bhpStats.totalSisaStok > 0 ? Math.round((k.jumlah / bhpStats.totalSisaStok) * 100) : 0
                      return (
                        <div key={i} className="flex-1 min-w-[120px] bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`}></div>
                            <span className="text-xs font-medium text-gray-600">{k.kategori}</span>
                          </div>
                          <p className="text-xl font-bold">{k.jumlah}</p>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                            <div className={`h-1.5 rounded-full ${colors[i % colors.length]}`} style={{ width: `${percentage}%` }}></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{percentage}%</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Toolbar */}
              <div className="bg-white rounded-2xl border border-slate-200/50 shadow-lg p-6">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Search */}
                  <div className="flex-1 min-w-[220px] relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari BHP ATK..."
                      value={bhpSearch}
                      onChange={(e) => setBhpSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50/50"
                    />
                  </div>
                  
                  {/* Filters */}
                  <select
                    value={bhpKategoriFilter}
                    onChange={(e) => setBhpKategoriFilter(e.target.value)}
                    className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
                  >
                    <option value="">Semua Kategori</option>
                    {bhpKategoriList.map(k => (
                      <option key={k} value={k || ''}>{k}</option>
                    ))}
                  </select>
                  
                  <select
                    value={bhpKondisiFilter}
                    onChange={(e) => setBhpKondisiFilter(e.target.value)}
                    className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
                  >
                    <option value="">Semua Kondisi</option>
                    <option value="Baik">Baik</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                    <option value="Rusak">Rusak</option>
                  </select>

                  {/* View Toggle */}
                  <div className="flex border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setBhpViewMode('grid')}
                      className={`p-3 ${bhpViewMode === 'grid' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                      <Grid size={18} />
                    </button>
                    <button
                      onClick={() => setBhpViewMode('table')}
                      className={`p-3 ${bhpViewMode === 'table' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                      <List size={18} />
                    </button>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => openBhpModal()}
                    className="px-5 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg flex items-center gap-2"
                  >
                    <Plus size={18} /> Tambah BHP
                  </button>
                  <button
                    onClick={printBhpReport}
                    className="px-5 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 text-slate-700"
                  >
                    <Printer size={18} /> Cetak
                  </button>
                </div>
              </div>

              {/* Grid View */}
              {bhpViewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bhpData.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-400">
                      <Package size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Tidak ada data BHP ATK</p>
                    </div>
                  ) : bhpData.map((item) => (
                    <div
                      key={item.id}
                      className={`bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-lg transition group ${item.sisaStok < 10 ? 'ring-2 ring-red-300' : ''}`}
                    >
                      <div className={`h-2 ${item.sisaStok < 10 ? 'bg-red-500' : item.kondisi === 'Baik' ? 'bg-green-500' : item.kondisi === 'Perlu Perbaikan' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kategoriColors[item.kategori || ''] || 'bg-gray-100 text-gray-700'}`}>
                              {bhpKategoriIcons[item.kategori || ''] || <Package size={18} />}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm">{item.nama}</h4>
                              <p className="text-xs text-gray-500">{item.kategori || 'Tidak ada kategori'}</p>
                            </div>
                          </div>
                          {item.sisaStok < 10 && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                              <AlertTriangle size={12} /> Stok Rendah
                            </span>
                          )}
                        </div>
                        
                        {/* Stock Info */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <div className="bg-cyan-50 rounded-lg p-2 text-center border border-cyan-200">
                            <p className="text-xs text-cyan-600">Awal</p>
                            <p className="font-bold text-cyan-700">{item.stokAwal}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2 text-center border border-green-200">
                            <p className="text-xs text-green-600 flex items-center justify-center gap-1"><ArrowUp size={12} /> Masuk</p>
                            <p className="font-bold text-green-700">{item.stokMasuk}</p>
                          </div>
                          <div className="bg-red-50 rounded-lg p-2 text-center border border-red-200">
                            <p className="text-xs text-red-600 flex items-center justify-center gap-1"><ArrowDown size={12} /> Keluar</p>
                            <p className="font-bold text-red-700">{item.stokKeluar}</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-200">
                            <p className="text-xs text-blue-600">Sisa</p>
                            <p className="font-bold text-blue-700">{item.sisaStok} {item.satuan || ''}</p>
                          </div>
                        </div>

                        {/* Stock Action Buttons */}
                        <div className="flex gap-2 mb-3">
                          <button
                            onClick={() => openStokModal(item, 'MASUK')}
                            className="flex-1 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition flex items-center justify-center gap-1"
                          >
                            <ArrowUp size={14} /> Stok Masuk
                          </button>
                          <button
                            onClick={() => openStokModal(item, 'KELUAR')}
                            className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition flex items-center justify-center gap-1"
                          >
                            <ArrowDown size={14} /> Stok Keluar
                          </button>
                        </div>

                        <div className="flex items-center justify-between border-t pt-3">
                          <span className="text-xs text-gray-500">{item.kondisi || 'Baik'}</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openBhpDetail(item)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Detail"><Eye size={16} /></button>
                            <button onClick={() => openBhpModal(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit"><Edit size={16} /></button>
                            <button onClick={() => deleteBhp(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Table View */}
              {bhpViewMode === 'table' && (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-left">
                        <tr>
                          <th className="px-4 py-3 font-medium">Nama BHP ATK</th>
                          <th className="px-4 py-3 font-medium">Kategori</th>
                          <th className="px-4 py-3 font-medium text-center">Stok Awal</th>
                          <th className="px-4 py-3 font-medium text-center">Stok Masuk</th>
                          <th className="px-4 py-3 font-medium text-center">Stok Keluar</th>
                          <th className="px-4 py-3 font-medium text-center">Sisa Stok</th>
                          <th className="px-4 py-3 font-medium">Satuan</th>
                          <th className="px-4 py-3 font-medium text-center">Aksi Stok</th>
                          <th className="px-4 py-3 font-medium text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bhpData.length === 0 ? (
                          <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Tidak ada data BHP ATK</td></tr>
                        ) : bhpData.map((item) => (
                          <tr key={item.id} className={`border-t hover:bg-gray-50 ${item.sisaStok < 10 ? 'bg-red-50' : ''}`}>
                            <td className="px-4 py-3 font-medium">
                              <div className="flex items-center gap-2">
                                {item.sisaStok < 10 && <AlertTriangle size={14} className="text-red-500" />}
                                {item.nama}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${kategoriColors[item.kategori || ''] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                {bhpKategoriIcons[item.kategori || '']}
                                {item.kategori || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-cyan-600 font-bold">{item.stokAwal}</td>
                            <td className="px-4 py-3 text-center text-green-600 font-bold">{item.stokMasuk}</td>
                            <td className="px-4 py-3 text-center text-red-600 font-bold">{item.stokKeluar}</td>
                            <td className="px-4 py-3 text-center font-bold">
                              <span className={item.sisaStok < 10 ? 'text-red-600' : 'text-blue-600'}>
                                {item.sisaStok}
                              </span>
                            </td>
                            <td className="px-4 py-3">{item.satuan || '-'}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => openStokModal(item, 'MASUK')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition" title="Stok Masuk"><ArrowUp size={16} /></button>
                                <button onClick={() => openStokModal(item, 'KELUAR')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Stok Keluar"><ArrowDown size={16} /></button>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => openBhpDetail(item)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Detail"><Eye size={16} /></button>
                                <button onClick={() => openBhpModal(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit"><Edit size={16} /></button>
                                <button onClick={() => deleteBhp(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Aset - Modern Design */}
          {menu === 'aset' && (
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium opacity-80">Total Jenis Aset</p>
                      <p className="text-3xl font-bold mt-1">{asetStats?.totalAset || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Package size={24} />
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium opacity-80">Total Unit</p>
                      <p className="text-3xl font-bold mt-1">{asetStats?.totalUnit || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Wrench size={24} />
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium opacity-80">Kondisi Baik</p>
                      <p className="text-3xl font-bold mt-1">{asetStats?.byKondisi?.find(k => k.kondisi === 'Baik')?.jumlah || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Activity size={24} />
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium opacity-80">Perlu Perhatian</p>
                      <p className="text-3xl font-bold mt-1">{asetStats?.byKondisi?.filter(k => k.kondisi !== 'Baik').reduce((a, b) => a + b.jumlah, 0) || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <AlertCircle size={24} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Distribution Chart */}
              {asetStats && asetStats.byKategori.length > 0 && (
                <div className="bg-white rounded-xl border shadow-sm p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 size={20} className="text-amber-700" /> Distribusi Kategori</h3>
                  <div className="flex flex-wrap gap-3">
                    {asetStats.byKategori.map((k, i) => {
                      const colors = ['bg-red-500', 'bg-blue-500', 'bg-amber-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500']
                      const percentage = asetStats.totalUnit > 0 ? Math.round((k.jumlah / asetStats.totalUnit) * 100) : 0
                      return (
                        <div key={i} className="flex-1 min-w-[120px] bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`}></div>
                            <span className="text-xs font-medium text-gray-600">{k.kategori}</span>
                          </div>
                          <p className="text-xl font-bold">{k.jumlah}</p>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                            <div className={`h-1.5 rounded-full ${colors[i % colors.length]}`} style={{ width: `${percentage}%` }}></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{percentage}%</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Toolbar */}
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search */}
                  <div className="flex-1 min-w-[200px] relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari aset..."
                      value={asetSearch}
                      onChange={(e) => setAsetSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  
                  {/* Filters */}
                  <select
                    value={asetKategoriFilter}
                    onChange={(e) => setAsetKategoriFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Semua Kategori</option>
                    {kategoriList.map(k => (
                      <option key={k} value={k || ''}>{k}</option>
                    ))}
                  </select>
                  
                  <select
                    value={asetKondisiFilter}
                    onChange={(e) => setAsetKondisiFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Semua Kondisi</option>
                    <option value="Baik">Baik</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                    <option value="Rusak">Rusak</option>
                  </select>

                  {/* View Toggle */}
                  <div className="flex border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setAsetViewMode('grid')}
                      className={`p-2 ${asetViewMode === 'grid' ? 'bg-amber-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      <Grid size={18} />
                    </button>
                    <button
                      onClick={() => setAsetViewMode('table')}
                      className={`p-2 ${asetViewMode === 'table' ? 'bg-amber-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      <List size={18} />
                    </button>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => openAsetModal()}
                    className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition flex items-center gap-2"
                  >
                    <Plus size={18} /> Tambah Aset
                  </button>
                  <button
                    onClick={printAsetReport}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    <Printer size={18} /> Cetak
                  </button>
                </div>
              </div>

              {/* Grid View */}
              {asetViewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {asetData.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-400">
                      <Package size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Tidak ada data aset</p>
                    </div>
                  ) : asetData.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-lg transition group"
                    >
                      <div className={`h-2 ${item.kondisi === 'Baik' ? 'bg-green-500' : item.kondisi === 'Perlu Perbaikan' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kategoriColors[item.kategori || ''] || 'bg-gray-100 text-gray-700'}`}>
                              {kategoriIcons[item.kategori || ''] || <Package size={18} />}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm">{item.nama}</h4>
                              <p className="text-xs text-gray-500">{item.kategori || 'Tidak ada kategori'}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${kondisiColors[item.kondisi || 'Baik']}`}>
                            {item.kondisi || 'Baik'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-500">Jumlah</p>
                            <p className="font-bold">{item.jumlah}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-500">Lokasi</p>
                            <p className="font-bold text-sm truncate">{item.lokasi || '-'}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t pt-3">
                          <span className="text-xs font-mono text-gray-400">ID: {item.id.substring(0, 8).toUpperCase()}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => openAsetDetail(item)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Detail"><Eye size={16} /></button>
                            <button onClick={() => openAsetModal(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit"><Edit size={16} /></button>
                            <button onClick={() => generateQRCode(item)} className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg" title="QR Code"><QrCode size={16} /></button>
                            <button onClick={() => deleteAset(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Table View */}
              {asetViewMode === 'table' && (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-left">
                        <tr>
                          <th className="px-4 py-3 font-medium">ID</th>
                          <th className="px-4 py-3 font-medium">Nama Aset</th>
                          <th className="px-4 py-3 font-medium">Kategori</th>
                          <th className="px-4 py-3 font-medium">Jumlah</th>
                          <th className="px-4 py-3 font-medium">Lokasi</th>
                          <th className="px-4 py-3 font-medium">Kondisi</th>
                          <th className="px-4 py-3 font-medium text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {asetData.length === 0 ? (
                          <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Tidak ada data aset</td></tr>
                        ) : asetData.map((item) => (
                          <tr key={item.id} className="border-t hover:bg-gray-50 group">
                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.id.substring(0, 8).toUpperCase()}</td>
                            <td className="px-4 py-3 font-medium">{item.nama}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${kategoriColors[item.kategori || ''] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                {kategoriIcons[item.kategori || '']}
                                {item.kategori || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold">{item.jumlah}</td>
                            <td className="px-4 py-3">{item.lokasi || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${kondisiColors[item.kondisi || 'Baik']}`}>
                                {item.kondisi || 'Baik'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => openAsetDetail(item)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Detail"><Eye size={16} /></button>
                                <button onClick={() => openAsetModal(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit"><Edit size={16} /></button>
                                <button onClick={() => generateQRCode(item)} className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg" title="QR Code"><QrCode size={16} /></button>
                                <button onClick={() => deleteAset(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Peminjaman */}
          {menu === 'peminjaman' && (
            <div className="bg-white rounded-2xl border border-slate-200/50 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-slate-200/50 font-bold flex items-center justify-between bg-slate-50">
                <span className="flex items-center gap-3 text-slate-800"><ArrowRightLeft size={22} className="text-teal-600" /> Peminjaman Aset</span>
                <button onClick={openPeminjamanModal} className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl text-sm font-medium hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg flex items-center gap-2"><ArrowRightLeft size={18} /> Pinjam Aset</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">No. Ref</th>
                      <th className="px-4 py-3 font-medium">Aset</th>
                      <th className="px-4 py-3 font-medium">Jumlah</th>
                      <th className="px-4 py-3 font-medium">Peminjam</th>
                      <th className="px-4 py-3 font-medium">Unit</th>
                      <th className="px-4 py-3 font-medium">Tanggal Pinjam</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {peminjamanData.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Belum ada data peminjaman</td></tr>
                    ) : peminjamanData.map(item => (
                      <tr key={item.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.id.substring(0, 8).toUpperCase()}</td>
                        <td className="px-4 py-3 font-medium">{item.namaAset}</td>
                        <td className="px-4 py-3">{item.jumlah}</td>
                        <td className="px-4 py-3">{item.peminjam}</td>
                        <td className="px-4 py-3">{item.unit || '-'}</td>
                        <td className="px-4 py-3">{new Date(item.tanggalPinjam).toLocaleDateString('id-ID')}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'Dipinjam' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openPeminjamanDetail(item)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Lihat Detail"><Eye size={16} /></button>
                            <button onClick={() => openPeminjamanEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit"><Edit size={16} /></button>
                            <button onClick={() => printBuktiPeminjaman(item)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition" title="Cetak Bukti"><Printer size={16} /></button>
                            {item.status === 'Dipinjam' && (
                              <button onClick={() => kembalikanAset(item.id)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Kembalikan"><ArrowRightLeft size={16} /></button>
                            )}
                            <button onClick={() => deletePeminjaman(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Hapus"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Toast */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <Save size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Kamar Modal */}
      {modalOpen && selectedKamar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 flex justify-between items-center"><h3 className="font-bold text-xl">Kamar {selectedKamar.No_Kamar}</h3><button onClick={() => setModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-all"><X size={22} /></button></div>
            <div className="p-6">
              {!editMode ? (
                <>
                  <div className="space-y-3 mb-6">
                    <div><p className="text-xs text-gray-400 font-medium uppercase">Tipe</p><p className="font-semibold">{selectedKamar.Tipe}</p></div>
                    <div><p className="text-xs text-gray-400 font-medium uppercase">Status</p><p className={`font-semibold ${selectedKamar.Status === 'Terisi' ? 'text-red-600' : 'text-green-600'}`}>{selectedKamar.Status}</p></div>
                    <div><p className="text-xs text-gray-400 font-medium uppercase">Pasien</p><p className="font-semibold">{selectedKamar.Pasien || '-'}</p></div>
                    <div><p className="text-xs text-gray-400 font-medium uppercase">Dokter</p><p className="font-semibold">{selectedKamar.Dokter || '-'}</p></div>
                    <div><p className="text-xs text-gray-400 font-medium uppercase">Diagnosa</p><p className="font-semibold">{selectedKamar.Diagnosa || '-'}</p></div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setEditMode(true)} className="flex-1 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl font-medium hover:from-slate-800 hover:to-slate-900 transition-all shadow-lg flex items-center justify-center gap-2"><Edit size={18} /> Edit</button>
                    <button onClick={() => setModalOpen(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-medium hover:bg-slate-200 transition-all text-slate-700">Tutup</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    <div><label className="text-xs font-medium text-gray-600">Status</label><select value={formStatus} onChange={e => setFormStatus(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg"><option value="Kosong">Kosong</option><option value="Terisi">Terisi</option></select></div>
                    {formStatus === 'Terisi' && (
                      <>
                        <div><label className="text-xs font-medium text-gray-600">Nama Pasien</label><input type="text" value={formPasien} onChange={e => setFormPasien(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg" placeholder="Nama pasien..." /></div>
                        <div><label className="text-xs font-medium text-gray-600">Dokter DPJP</label><input type="text" value={formDokter} onChange={e => setFormDokter(e.target.value)} list="dokter-list" className="w-full mt-1 px-4 py-2 border rounded-lg" placeholder="Nama dokter..." /><datalist id="dokter-list">{dokterList.map(d => <option key={d.id} value={d.nama} />)}</datalist></div>
                        <div><label className="text-xs font-medium text-gray-600">Diagnosa</label><input type="text" value={formDiagnosa} onChange={e => setFormDiagnosa(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg" placeholder="Diagnosa..." /></div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-medium hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"><Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan'}</button>
                    <button onClick={() => setEditMode(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-medium hover:bg-slate-200 transition-all text-slate-700">Batal</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Aset Modal */}
      {asetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setAsetModalOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className={`p-6 flex justify-between items-center text-white ${editAset ? 'bg-gradient-to-r from-slate-700 to-slate-800' : 'bg-gradient-to-r from-teal-500 to-teal-600'}`}>
              <h3 className="font-bold text-xl">{editAset ? 'Edit Aset' : 'Tambah Aset'}</h3>
              <button onClick={() => setAsetModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-all"><X size={22} /></button>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-medium text-gray-600">Nama Aset *</label>
                  <input type="text" value={formAsetNama} onChange={e => setFormAsetNama(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Nama aset..." />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Kategori</label>
                  <select value={formAsetKategori} onChange={e => setFormAsetKategori(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                    <option value="">Pilih Kategori</option>
                    <option value="Medis">Medis</option>
                    <option value="Elektronik">Elektronik</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Alat Ukur">Alat Ukur</option>
                    <option value="Elektrikal">Elektrikal</option>
                    <option value="Peralatan">Peralatan</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Jumlah</label>
                    <input type="number" min="0" value={formAsetJumlah} onChange={e => setFormAsetJumlah(parseInt(e.target.value) || 0)} className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Kondisi</label>
                    <select value={formAsetKondisi} onChange={e => setFormAsetKondisi(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                      <option value="Baik">Baik</option>
                      <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                      <option value="Rusak">Rusak</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Lokasi</label>
                  <input type="text" value={formAsetLokasi} onChange={e => setFormAsetLokasi(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Lokasi aset..." />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={saveAset} className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-medium hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg flex items-center justify-center gap-2"><Save size={18} /> Simpan</button>
                <button onClick={() => setAsetModalOpen(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-medium hover:bg-slate-200 transition-all text-slate-700">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aset Detail Modal */}
      {asetDetailOpen && selectedAsetDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setAsetDetailOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-6 flex justify-between items-center">
              <h3 className="font-bold text-xl">Detail Aset</h3>
              <button onClick={() => setAsetDetailOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-all"><X size={22} /></button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500 text-sm">ID Aset</span>
                  <span className="font-mono font-medium">{selectedAsetDetail.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500 text-sm">Nama</span>
                  <span className="font-medium">{selectedAsetDetail.nama}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500 text-sm">Kategori</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${kategoriColors[selectedAsetDetail.kategori || ''] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    {kategoriIcons[selectedAsetDetail.kategori || '']}
                    {selectedAsetDetail.kategori || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500 text-sm">Jumlah</span>
                  <span className="font-bold">{selectedAsetDetail.jumlah} unit</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500 text-sm">Lokasi</span>
                  <span className="font-medium">{selectedAsetDetail.lokasi || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500 text-sm">Kondisi</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${kondisiColors[selectedAsetDetail.kondisi || 'Baik']}`}>
                    {selectedAsetDetail.kondisi || 'Baik'}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => generateQRCode(selectedAsetDetail)} className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2"><QrCode size={18} /> QR Code</button>
                <button onClick={() => { setAsetDetailOpen(false); openAsetModal(selectedAsetDetail); }} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"><Edit size={18} /> Edit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BHP Modal */}
      {bhpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setBhpModalOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className={`p-6 flex justify-between items-center text-white ${editBhp ? 'bg-gradient-to-r from-slate-700 to-slate-800' : 'bg-gradient-to-r from-teal-500 to-teal-600'}`}>
              <h3 className="font-bold text-xl">{editBhp ? 'Edit BHP ATK' : 'Tambah BHP ATK'}</h3>
              <button onClick={() => setBhpModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-all"><X size={22} /></button>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-medium text-gray-600">Nama BHP ATK *</label>
                  <input type="text" value={formBhpNama} onChange={e => setFormBhpNama(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Nama BHP ATK..." />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Kategori</label>
                  <select value={formBhpKategori} onChange={e => setFormBhpKategori(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Pilih Kategori</option>
                    <option value="BHP">BHP</option>
                    <option value="ATK">ATK</option>
                    <option value="Habis Pakai">Habis Pakai</option>
                    <option value="Peralatan">Peralatan</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600">{editBhp ? 'Sisa Stok' : 'Stok Awal'}</label>
                    <input type="number" min="0" value={formBhpStokAwal} onChange={e => setFormBhpStokAwal(parseInt(e.target.value) || 0)} className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" disabled={!!editBhp} />
                    {editBhp && <p className="text-xs text-gray-400 mt-1">Gunakan tombol Stok Masuk/Keluar</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Satuan</label>
                    <input type="text" value={formBhpSatuan} onChange={e => setFormBhpSatuan(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="pcs, box, dll" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Kondisi</label>
                  <select value={formBhpKondisi} onChange={e => setFormBhpKondisi(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="Baik">Baik</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                    <option value="Rusak">Rusak</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={saveBhp} className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-medium hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg flex items-center justify-center gap-2"><Save size={18} /> Simpan</button>
                <button onClick={() => setBhpModalOpen(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-medium hover:bg-slate-200 transition-all text-slate-700">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Transaction Modal */}
      {stokModalOpen && stokBhpItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setStokModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className={`p-5 flex justify-between items-center text-white ${stokJenis === 'MASUK' ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gradient-to-r from-red-600 to-red-500'}`}>
              <h3 className="font-bold text-lg flex items-center gap-2">
                {stokJenis === 'MASUK' ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                Stok {stokJenis === 'MASUK' ? 'Masuk' : 'Keluar'}
              </h3>
              <button onClick={() => setStokModalOpen(false)} className="p-1 hover:bg-white/20 rounded"><X size={20} /></button>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-500">Item</p>
                <p className="font-bold">{stokBhpItem.nama}</p>
                <p className="text-sm text-gray-500">Stok saat ini: <span className="font-bold">{stokBhpItem.sisaStok} {stokBhpItem.satuan || ''}</span></p>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-medium text-gray-600">Jumlah *</label>
                  <input type="number" min="1" max={stokJenis === 'KELUAR' ? stokBhpItem.sisaStok : undefined} value={stokJumlah} onChange={e => setStokJumlah(parseInt(e.target.value) || 0)} className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  {stokJenis === 'KELUAR' && stokJumlah > stokBhpItem.sisaStok && (
                    <p className="text-xs text-red-500 mt-1">Jumlah melebihi stok tersedia</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Keterangan</label>
                  <input type="text" value={stokKeterangan} onChange={e => setStokKeterangan(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Contoh: Pengadaan, Pemakaian ruangan, dll" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Petugas</label>
                  <input type="text" value={stokPetugas} onChange={e => setStokPetugas(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Nama petugas..." />
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={processStokTransaction} 
                  disabled={stokJenis === 'KELUAR' && stokJumlah > stokBhpItem.sisaStok}
                  className={`flex-1 py-3 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 ${stokJenis === 'MASUK' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {stokJenis === 'MASUK' ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                  Proses
                </button>
                <button onClick={() => setStokModalOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BHP Detail Modal */}
      {bhpDetailOpen && selectedBhpDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setBhpDetailOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-gray-700 to-gray-600 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-lg">Detail BHP ATK</h3>
              <button onClick={() => setBhpDetailOpen(false)} className="p-1 hover:bg-white/20 rounded"><X size={20} /></button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500 text-sm">Nama</span>
                  <span className="font-medium">{selectedBhpDetail.nama}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500 text-sm">Kategori</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${kategoriColors[selectedBhpDetail.kategori || ''] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    {bhpKategoriIcons[selectedBhpDetail.kategori || '']}
                    {selectedBhpDetail.kategori || '-'}
                  </span>
                </div>
                
                {/* Stock Info */}
                <div className="grid grid-cols-4 gap-3 py-2">
                  <div className="bg-cyan-50 rounded-lg p-3 text-center border border-cyan-200">
                    <p className="text-xs text-cyan-600">Stok Awal</p>
                    <p className="font-bold text-lg text-cyan-700">{selectedBhpDetail.stokAwal}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                    <p className="text-xs text-green-600">Stok Masuk</p>
                    <p className="font-bold text-lg text-green-700">{selectedBhpDetail.stokMasuk}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
                    <p className="text-xs text-red-600">Stok Keluar</p>
                    <p className="font-bold text-lg text-red-700">{selectedBhpDetail.stokKeluar}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                    <p className="text-xs text-blue-600">Sisa Stok</p>
                    <p className="font-bold text-lg text-blue-700">{selectedBhpDetail.sisaStok} {selectedBhpDetail.satuan || ''}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500 text-sm">Kondisi</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${kondisiColors[selectedBhpDetail.kondisi || 'Baik']}`}>
                    {selectedBhpDetail.kondisi || 'Baik'}
                  </span>
                </div>
                
                {/* Stock History */}
                {stokHistory.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2"><History size={16} /> Riwayat Stok</h4>
                    <div className="max-h-48 overflow-y-auto border rounded-lg">
                      {stokHistory.map((h, i) => (
                        <div key={h.id} className={`p-3 text-sm ${i > 0 ? 'border-t' : ''} ${h.jenis === 'MASUK' ? 'bg-green-50' : 'bg-red-50'}`}>
                          <div className="flex items-center justify-between">
                            <span className={`font-medium ${h.jenis === 'MASUK' ? 'text-green-700' : 'text-red-700'}`}>
                              {h.jenis === 'MASUK' ? '+' : '-'}{h.jumlah} {selectedBhpDetail.satuan || ''}
                            </span>
                            <span className="text-xs text-gray-400">{new Date(h.tanggal).toLocaleDateString('id-ID')}</span>
                          </div>
                          {h.keterangan && <p className="text-xs text-gray-500 mt-1">{h.keterangan}</p>}
                          {h.petugas && <p className="text-xs text-gray-400">Petugas: {h.petugas}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => openStokModal(selectedBhpDetail, 'MASUK')} className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"><ArrowUp size={18} /> Stok Masuk</button>
                <button onClick={() => openStokModal(selectedBhpDetail, 'KELUAR')} className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"><ArrowDown size={18} /> Stok Keluar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dokter Modal */}
      {dokterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDokterModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-800 to-amber-700 text-white p-5 flex justify-between items-center"><h3 className="font-bold text-lg">{editDokter ? 'Edit Dokter' : 'Tambah Dokter'}</h3><button onClick={() => setDokterModalOpen(false)} className="p-1 hover:bg-white/20 rounded"><X size={20} /></button></div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div><label className="text-xs font-medium text-gray-600">Nama Dokter</label><input type="text" value={formDokterNama} onChange={e => setFormDokterNama(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg" placeholder="Nama lengkap..." /></div>
                <div><label className="text-xs font-medium text-gray-600">Spesialis</label><input type="text" value={formDokterSpesialis} onChange={e => setFormDokterSpesialis(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg" placeholder="Spesialisasi..." /></div>
              </div>
              <div className="flex gap-3">
                <button onClick={saveDokter} className="flex-1 py-3 bg-amber-700 text-white rounded-lg font-medium hover:bg-amber-800 transition flex items-center justify-center gap-2"><Save size={18} /> Simpan</button>
                <button onClick={() => setDokterModalOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Peminjaman Tambah Modal */}
      {peminjamanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setPeminjamanModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-800 to-amber-700 text-white p-5 flex justify-between items-center"><h3 className="font-bold text-lg">Pinjam Aset</h3><button onClick={() => setPeminjamanModalOpen(false)} className="p-1 hover:bg-white/20 rounded"><X size={20} /></button></div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div><label className="text-xs font-medium text-gray-600">Pilih Aset *</label><select value={formPinjamAset} onChange={e => setFormPinjamAset(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg"><option value="">-- Pilih Aset --</option>{asetData.map(a => <option key={a.id} value={a.id}>{a.nama} ({a.jumlah} tersedia)</option>)}</select></div>
                <div><label className="text-xs font-medium text-gray-600">Jumlah</label><input type="number" min="1" value={formPinjamJumlah} onChange={e => setFormPinjamJumlah(parseInt(e.target.value) || 1)} className="w-full mt-1 px-4 py-2 border rounded-lg" /></div>
                <div><label className="text-xs font-medium text-gray-600">Nama Peminjam *</label><input type="text" value={formPinjamPeminjam} onChange={e => setFormPinjamPeminjam(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg" placeholder="Nama peminjam..." /></div>
                <div><label className="text-xs font-medium text-gray-600">Unit/Ruangan</label><input type="text" value={formPinjamUnit} onChange={e => setFormPinjamUnit(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg" placeholder="Unit peminjam..." /></div>
                <div><label className="text-xs font-medium text-gray-600">Tujuan Peminjaman</label><input type="text" value={formPinjamTujuan} onChange={e => setFormPinjamTujuan(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg" placeholder="Tujuan..." /></div>
                <div><label className="text-xs font-medium text-gray-600">Catatan</label><textarea value={formPinjamCatatan} onChange={e => setFormPinjamCatatan(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg" rows={2} placeholder="Catatan tambahan..." /></div>
              </div>
              <div className="flex gap-3">
                <button onClick={savePeminjaman} className="flex-1 py-3 bg-amber-700 text-white rounded-lg font-medium hover:bg-amber-800 transition flex items-center justify-center gap-2"><Save size={18} /> Simpan</button>
                <button onClick={() => setPeminjamanModalOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Peminjaman Detail Modal */}
      {peminjamanDetailOpen && selectedPeminjaman && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setPeminjamanDetailOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-800 to-amber-700 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-lg">Detail Peminjaman</h3>
              <button onClick={() => setPeminjamanDetailOpen(false)} className="p-1 hover:bg-white/20 rounded"><X size={20} /></button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500 text-sm">No. Referensi</span>
                  <span className="font-mono font-medium">{selectedPeminjaman.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500 text-sm">Nama Aset</span>
                  <span className="font-medium">{selectedPeminjaman.namaAset}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500 text-sm">Jumlah</span>
                  <span className="font-medium">{selectedPeminjaman.jumlah} unit</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500 text-sm">Peminjam</span>
                  <span className="font-medium">{selectedPeminjaman.peminjam}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500 text-sm">Unit/Ruangan</span>
                  <span className="font-medium">{selectedPeminjaman.unit || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500 text-sm">Tujuan</span>
                  <span className="font-medium">{selectedPeminjaman.tujuan || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500 text-sm">Tanggal Pinjam</span>
                  <span className="font-medium">{new Date(selectedPeminjaman.tanggalPinjam).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500 text-sm">Tanggal Kembali</span>
                  <span className="font-medium">{selectedPeminjaman.tanggalKembali ? new Date(selectedPeminjaman.tanggalKembali).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500 text-sm">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedPeminjaman.status === 'Dipinjam' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{selectedPeminjaman.status}</span>
                </div>
                <div className="py-2">
                  <span className="text-gray-500 text-sm block mb-1">Catatan</span>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedPeminjaman.catatan || 'Tidak ada catatan'}</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => printBuktiPeminjaman(selectedPeminjaman)} className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"><Printer size={18} /> Cetak Bukti</button>
                <button onClick={() => setPeminjamanDetailOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition">Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Peminjaman Edit Modal */}
      {peminjamanEditOpen && selectedPeminjaman && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setPeminjamanEditOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-5 flex justify-between items-center"><h3 className="font-bold text-lg">Edit Peminjaman</h3><button onClick={() => setPeminjamanEditOpen(false)} className="p-1 hover:bg-white/20 rounded"><X size={20} /></button></div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div><label className="text-xs font-medium text-gray-600">Pilih Aset *</label><select value={formPinjamAset} onChange={e => setFormPinjamAset(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg"><option value="">-- Pilih Aset --</option>{asetData.map(a => <option key={a.id} value={a.id}>{a.nama} ({a.jumlah} tersedia)</option>)}</select></div>
                <div><label className="text-xs font-medium text-gray-600">Jumlah</label><input type="number" min="1" value={formPinjamJumlah} onChange={e => setFormPinjamJumlah(parseInt(e.target.value) || 1)} className="w-full mt-1 px-4 py-2 border rounded-lg" /></div>
                <div><label className="text-xs font-medium text-gray-600">Nama Peminjam *</label><input type="text" value={formPinjamPeminjam} onChange={e => setFormPinjamPeminjam(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg" placeholder="Nama peminjam..." /></div>
                <div><label className="text-xs font-medium text-gray-600">Unit/Ruangan</label><input type="text" value={formPinjamUnit} onChange={e => setFormPinjamUnit(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg" placeholder="Unit peminjam..." /></div>
                <div><label className="text-xs font-medium text-gray-600">Tujuan Peminjaman</label><input type="text" value={formPinjamTujuan} onChange={e => setFormPinjamTujuan(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg" placeholder="Tujuan..." /></div>
                <div><label className="text-xs font-medium text-gray-600">Status</label><select value={formPinjamStatus} onChange={e => setFormPinjamStatus(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg"><option value="Dipinjam">Dipinjam</option><option value="Dikembalikan">Dikembalikan</option></select></div>
                <div><label className="text-xs font-medium text-gray-600">Catatan</label><textarea value={formPinjamCatatan} onChange={e => setFormPinjamCatatan(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg" rows={2} placeholder="Catatan tambahan..." /></div>
              </div>
              <div className="flex gap-3">
                <button onClick={updatePeminjaman} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"><Save size={18} /> Simpan Perubahan</button>
                <button onClick={() => setPeminjamanEditOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden print area */}
      <div ref={printRef} className="hidden" />
    </div>
  )
}
