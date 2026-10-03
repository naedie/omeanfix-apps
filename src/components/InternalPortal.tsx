import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, RefreshCw, Menu, X, FileText, Package, Layers, 
  BarChart3, Settings, Trash2, Edit3, Box, Megaphone, 
  Loader2, Hash, Award, UserPlus, Users, Search, Mail, Phone, User,
  Wind, Car, ShieldCheck, Wrench, Snowflake, Truck, Zap, Smartphone, CheckCircle2, Ticket, QrCode, Printer, Plus, ChevronLeft, ChevronRight, Calendar, Camera, Home, MessageCircle, ChevronDown, ChevronUp, XCircle
} from 'lucide-react';
import { supabase } from '../supabase';

interface InternalPortalProps {
  onBackToCustomer: () => void;
}

const ADMIN_MODULES = [
  { id: 'dashboard', label: 'Dashboard Analitik', icon: Home, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { id: 'pesanan', label: 'Kelola Pesanan', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
  { id: 'pelanggan', label: 'Data Pelanggan', icon: Users, color: 'text-sky-600', bg: 'bg-sky-100' },
  { id: 'banner', label: 'Manajemen Banner', icon: Megaphone, color: 'text-rose-600', bg: 'bg-rose-100' },
  { id: 'voucher', label: 'Manajemen Voucher', icon: Ticket, color: 'text-teal-600', bg: 'bg-teal-100' },
  { id: 'katalog', label: 'Katalog Reguler', icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { id: 'katalog_khusus', label: 'Katalog Khusus', icon: Award, color: 'text-fuchsia-600', bg: 'bg-fuchsia-100' },
  { id: 'stok', label: 'Manajemen Stok', icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { id: 'laporan', label: 'Laporan & Keuangan', icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-100' },
  { id: 'pengaturan', label: 'Pengaturan Sistem', icon: Settings, color: 'text-slate-600', bg: 'bg-slate-200' }
];

// STRUKTUR MENU 3 PILAR (SECTIONED MENU)
const MENU_SECTIONS = [
  {
    title: 'Ringkasan & Analitik',
    items: ['dashboard']
  },
  {
    title: 'Operasional Utama',
    items: ['pesanan', 'pelanggan']
  },
  {
    title: 'Etalase & Beranda',
    items: ['banner', 'voucher', 'katalog', 'katalog_khusus', 'stok']
  },
  {
    title: 'Sistem & Laporan',
    items: ['laporan', 'pengaturan']
  }
];

export default function InternalPortal({ onBackToCustomer }: InternalPortalProps) {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [specialSubs, setSpecialSubs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [serviceUnits, setServiceUnits] = useState<any[]>([]);
  const [savedBanners, setSavedBanners] = useState<any[]>([]);
  const [spareParts, setSpareParts] = useState<any[]>([]);
  const [specialCatalogs, setSpecialCatalogs] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [customersData, setCustomersData] = useState<any[]>([]);

  const [pendingStatusUpdates, setPendingStatusUpdates] = useState<Record<string, string>>({});
  const [estimasiInput, setEstimasiInput] = useState<Record<string, string>>({});
  const [invoiceInputs, setInvoiceInputs] = useState<Record<string, {jasa: string, part: string, layanan: string, desc: string}>>({});
  
  const [viewReceiptModal, setViewReceiptModal] = useState<string | null>(null); 
  const [showInvoiceModal, setShowInvoiceModal] = useState<any | null>(null);
  const [viewPhotoModal, setViewPhotoModal] = useState<string | null>(null);

  // STATE KATEGORI, UNIT, BANNER, SPAREPART, DLL
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  const [unitName, setUnitName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [isSubmittingUnit, setIsSubmittingUnit] = useState(false);

  const [bannerBgUrl, setBannerBgUrl] = useState('');
  const [bannerLabel, setBannerLabel] = useState('');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerDesc, setBannerDesc] = useState('');
  const [bannerBtnText, setBannerBtnText] = useState('');
  const [isSubmittingBanner, setIsSubmittingBanner] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<number | null>(null);

  const [partName, setPartName] = useState('');
  const [partCategoryId, setPartCategoryId] = useState('');
  const [partUnitId, setPartUnitId] = useState('');
  const [partPrice, setPartPrice] = useState('');
  const [partStock, setPartStock] = useState('');
  const [partImage, setPartImage] = useState('');
  const [partDesc, setPartDesc] = useState('');
  const [isSubmittingPart, setIsSubmittingPart] = useState(false);
  const [editingPartId, setEditingPartId] = useState<any | null>(null);

  const [spcTitle, setSpcTitle] = useState('');
  const [spcCategory, setSpcCategory] = useState('');
  const [spcSubtitle, setSpcSubtitle] = useState('');
  const [spcDesc, setSpcDesc] = useState('');
  const [spcBenefits, setSpcBenefits] = useState('');
  const [spcCta, setSpcCta] = useState('');
  const [spcTheme, setSpcTheme] = useState('sky');
  const [spcIcon, setSpcIcon] = useState('Wind');
  const [isSubmittingSpc, setIsSubmittingSpc] = useState(false);
  const [editingSpcId, setEditingSpcId] = useState<string | null>(null);

  const [voucherCode, setVoucherCode] = useState('');
  const [voucherTitle, setVoucherTitle] = useState('');
  const [voucherCategory, setVoucherCategory] = useState('');
  const [voucherDesc, setVoucherDesc] = useState('');
  const [voucherTheme, setVoucherTheme] = useState('rose');
  const [isSubmittingVoucher, setIsSubmittingVoucher] = useState(false);
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);

  const [customerTab, setCustomerTab] = useState<'reguler' | 'member'>('reguler');
  const [customerSearch, setCustomerSearch] = useState('');
  const [editingCustId, setEditingCustId] = useState<string | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [isSubmittingCust, setIsSubmittingCust] = useState(false);

  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [showSubForm, setShowSubForm] = useState(false);
  const [subName, setSubName] = useState('');
  const [subPhone, setSubPhone] = useState('');
  const [subTitle, setSubTitle] = useState('');
  const [subDuration, setSubDuration] = useState('1_bulan');
  const [subStatus, setSubStatus] = useState('aktif');
  const [isSubmittingSub, setIsSubmittingSub] = useState(false);

  const [orderTab, setOrderTab] = useState<'baru' | 'proses' | 'jadwal' | 'selesai' | 'batal'>('baru');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderPage, setOrderPage] = useState(0);
  const [orderPerPage, setOrderPerPage] = useState(5);

  const [reportPeriod, setReportPeriod] = useState<'semua' | 'hari_ini' | 'minggu_ini' | 'bulan_ini'>('bulan_ini');
  const [reportStatusFilter, setReportStatusFilter] = useState<'semua' | 'lunas' | 'menunggu' | 'dengan_part'>('semua');
  const [reportSearch, setReportSearch] = useState('');
  
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [confirmingCancelId, setConfirmingCancelId] = useState<string | null>(null);

  // STATE UNTUK 2 TAB KATALOG REGULER + STATE BARU FILTER & AKORDION OBJEK
  const [katalogTab, setKatalogTab] = useState<'kategori' | 'objek'>('kategori');
  const [objekFilter, setObjekFilter] = useState<string>('Semua');
  const [expandedObjKategori, setExpandedObjKategori] = useState<string[]>([]);

  // STATE BARU FILTER & AKORDION STOK SUKU CADANG
  const [stokFilter, setStokFilter] = useState<string>('Semua');
  const [expandedStokKategori, setExpandedStokKategori] = useState<string[]>([]);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [resCat, resUnit, resBanner, resPart, resOrders, resSpcCat, resSpcSubs, resVouchers, resCustomers] = await Promise.all([
        supabase.from('service_categories').select('*').order('id', { ascending: true }),
        supabase.from('services').select('*').order('id', { ascending: false }),
        supabase.from('banners').select('*').order('id', { ascending: false }),
        supabase.from('spare_parts').select('*').order('id', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('special_services_catalog').select('*').order('created_at', { ascending: false }),
        supabase.from('special_service_subscriptions').select('*').order('created_at', { ascending: false }),
        supabase.from('vouchers_promos').select('*').order('id', { ascending: false }),
        supabase.from('customers').select('*').order('created_at', { ascending: false })
      ]);

      if (resCat.data) setCategories(resCat.data);
      if (resUnit.data) setServiceUnits(resUnit.data);
      if (resBanner.data) setSavedBanners(resBanner.data);
      if (resPart.data) {
        const DEFAULT_DESC = 'Suku cadang original/berkualitas. Harga belum termasuk biaya pemasangan oleh teknisi (apabila ada tindakan berat di lapangan).';
        const updatedParts = resPart.data.map((p: any) => ({
          ...p,
          description: p.description && p.description.trim() ? p.description : DEFAULT_DESC
        }));
        setSpareParts(updatedParts);

        const emptyDescIds = resPart.data.filter((p: any) => !p.description || !p.description.trim()).map((p: any) => p.id);
        if (emptyDescIds.length > 0) {
          supabase.from('spare_parts').update({ description: DEFAULT_DESC }).in('id', emptyDescIds).then(() => {});
        }
      }
      if (resOrders.data) setAdminOrders(resOrders.data);
      if (resSpcCat.data) setSpecialCatalogs(resSpcCat.data);
      if (resSpcSubs.data) setSpecialSubs(resSpcSubs.data);
      if (resVouchers.data) setVouchers(resVouchers.data);
      if (resCustomers.data) setCustomersData(resCustomers.data);
    } catch (error) { console.error('Error fetching data:', error); } 
    finally { setIsRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, [activeModule]);

  useEffect(() => {
    setOrderPage(0);
    setExpandedOrderId(null); 
    setConfirmingCancelId(null);
  }, [orderTab, orderSearch, orderPerPage]);

  const cancelEditCust = () => { setEditingCustId(null); setCustName(''); setCustPhone(''); setCustEmail(''); };
  const handleEditCust = (cust: any) => { 
     setEditingCustId(cust.id); 
     setCustName(cust.full_name || ''); 
     setCustPhone(cust.phone_number || ''); 
     setCustEmail(cust.email || ''); 
  };
  const handleSaveCust = async (e: React.FormEvent) => {
     e.preventDefault();
     if(!editingCustId || !custName || !custPhone) return;
     setIsSubmittingCust(true);
     try {
        const { error } = await supabase.from('customers').update({
           full_name: custName, phone_number: custPhone, email: custEmail
        }).eq('id', editingCustId);
        if(error) throw error;
        cancelEditCust();
        fetchData();
     } catch (err: any) { alert('Gagal update: ' + err.message); } 
     finally { setIsSubmittingCust(false); }
  };
  const handleDeleteCust = async (id: string) => {
     if(window.confirm('Yakin ingin menghapus akun pelanggan ini secara permanen?')) {
        try { await supabase.from('customers').delete().eq('id', id); fetchData(); } 
        catch (err) { console.error(err); }
     }
  };

  const cancelEditSub = () => { 
     setEditingSubId(null); setShowSubForm(false); 
     setSubName(''); setSubPhone(''); setSubTitle(''); 
     setSubDuration('1_bulan'); setSubStatus('aktif');
  };
  const handleEditSub = (sub: any) => { 
     setEditingSubId(sub.id); setShowSubForm(true); 
     setSubName(sub.customer_name || ''); setSubPhone(sub.customer_phone || ''); 
     setSubTitle(sub.custom_service_title || ''); setSubDuration(sub.duration || '1_bulan'); 
     setSubStatus(sub.status || 'aktif');
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleSaveSub = async (e: React.FormEvent) => {
     e.preventDefault();
     if(!subName || !subPhone || !subTitle) { alert('Harap isi Nama, WA, dan Paket Layanan!'); return; }
     setIsSubmittingSub(true);
     try {
        const payload = {
           customer_name: subName, customer_phone: subPhone, custom_service_title: subTitle,
           duration: subDuration, status: subStatus,
           subscription_code: `MBR-${Math.floor(Math.random() * 9000) + 1000}`
         };
        if(editingSubId) {
           await supabase.from('special_service_subscriptions').update(payload).eq('id', editingSubId);
        } else {
           await supabase.from('special_service_subscriptions').insert([payload]);
        }
        cancelEditSub(); fetchData();
     } catch (err: any) { alert('Gagal menyimpan member: ' + err.message); } 
     finally { setIsSubmittingSub(false); }
  };
  const handleDeleteSub = async (id: string) => {
     if(window.confirm('Yakin ingin menghapus status/pendaftaran member ini?')) {
        try { await supabase.from('special_service_subscriptions').delete().eq('id', id); fetchData(); } 
        catch (err) { console.error(err); }
     }
  };

  const handleCancelOrder = async (orderId: string) => {
      try {
         const { error } = await supabase.from('orders').update({
            status: 'Dibatalkan'
         }).eq('id', orderId);
         if(error) throw error;
         setConfirmingCancelId(null);
         fetchData();
      } catch (err: any) {
         alert('Gagal membatalkan pesanan: ' + err.message);
      }
  };

  const handleConfirmStatus = async (orderId: string) => {
    const newStatus = pendingStatusUpdates[orderId];
    if (!newStatus) return;
     try {
       let updates: any = { status: newStatus };
      if (newStatus.toLowerCase() === 'selesai') updates.payment_status = 'lunas';
      await supabase.from('orders').update(updates).eq('id', orderId);
       fetchData();
       setPendingStatusUpdates(prev => { const ns = { ...prev }; delete ns[orderId]; return ns; });
    } catch (err) { console.error(err); }
  };

  const handleSendEstimasi = async (orderId: string, currentNote: string) => {
    const val = estimasiInput[orderId];
    if (!val) return;
    try {
      const cleanNote = (currentNote || '').replace(/\[ESTIMASI:[^\]]+\]/g, '').trim();
      const newNote = cleanNote ? `${cleanNote} [ESTIMASI:${val}]` : `[ESTIMASI:${val}]`;
      const { error } = await supabase.from('orders').update({ note: newNote }).eq('id', orderId);
      if (error) throw error;
      alert("Estimasi biaya berhasil diinfokan ke pelanggan!"); fetchData();
      setEstimasiInput(prev => { const ns = { ...prev }; delete ns[orderId]; return ns; });
    } catch (err: any) { alert("Gagal menyimpan estimasi: " + err.message); }
  };

  const handleSendInvoice = async (orderId: string, currentNote: string) => {
    const inv = invoiceInputs[orderId];
    if (!inv) return;
    const jasa = Number(inv.jasa) || 0;
    const part = Number(inv.part) || 0;
    const layanan = Number(inv.layanan) || 0;
    const total = jasa + part + layanan;
    const desc = (inv.desc || '-').replace(/\|/g, ' ').replace(/\]/g, ' ').trim();

     try {
        let cleanNote = (currentNote || '').replace(/\[ESTIMASI:[^\]]+\]/g, '').replace(/\[INVOICE:[^\]]+\]/g, '').trim();
        const invString = `[INVOICE:J=${jasa}|P=${part}|L=${layanan}|T=${total}|D=${desc}]`;
        const newNote = cleanNote ? `${cleanNote} ${invString}` : invString;
        
        const { error } = await supabase.from('orders').update({ note: newNote, status: 'Menunggu Pembayaran' }).eq('id', orderId);
        if (error) throw error;
        alert("Tagihan/Invoice berhasil diterbitkan!"); fetchData();
        setInvoiceInputs(p => { const ns = {...p}; delete ns[orderId]; return ns; });
        setPendingStatusUpdates(p => { const ns = {...p}; delete ns[orderId]; return ns; });
    } catch (err: any) { alert("Gagal kirim invoice: " + err.message); }
  };

  const resetBannerForm = () => {
    setBannerBgUrl(''); setBannerLabel(''); setBannerTitle(''); setBannerDesc(''); setBannerBtnText(''); setEditingBannerId(null);
  };

  const handleSaveBanner = async () => {
    if (!bannerTitle || !bannerBgUrl) { alert("URL Gambar dan Judul Utama wajib diisi!"); return; }
    setIsSubmittingBanner(true);
    const payload = { label: bannerLabel, title: bannerTitle, description: bannerDesc, btn_text: bannerBtnText, bg_url: bannerBgUrl };
    try {
      if (editingBannerId) await supabase.from('banners').update(payload).eq('id', editingBannerId);
      else await supabase.from('banners').insert([payload]);
      resetBannerForm(); fetchData();
    } catch (error) { console.error(error); } finally { setIsSubmittingBanner(false); }
  };

  const handleEditBanner = (banner: any) => {
    setEditingBannerId(banner.id); setBannerBgUrl(banner.bg_url || ''); setBannerLabel(banner.label || ''); 
    setBannerTitle(banner.title || ''); setBannerDesc(banner.description || ''); setBannerBtnText(banner.btn_text || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBanner = async (id: number) => {
    try { await supabase.from('banners').delete().eq('id', id); fetchData(); } catch (error) { console.error(error); }
  };

  const cancelEditCategory = () => { setEditingCategoryId(null); setCategoryName(''); setCategoryIcon(''); };
  
  const handleSaveCategory = async () => {
    if (!categoryName) return;
     setIsSubmittingCat(true);
    try {
      if (editingCategoryId) await supabase.from('service_categories').update({ name: categoryName, icon: categoryIcon }).eq('id', editingCategoryId);
      else await supabase.from('service_categories').insert([{ name: categoryName, icon: categoryIcon }]);
      cancelEditCategory(); fetchData();
    } catch (error) {} finally { setIsSubmittingCat(false); }
  };

  const handleDeleteCategory = async (id: string) => {
     try { await supabase.from('service_categories').delete().eq('id', id); fetchData(); } catch (error) {} 
  };

  const cancelEditUnit = () => { setEditingUnitId(null); setUnitName(''); setSelectedCategoryId(''); };
  
  const handleSaveUnit = async () => {
    if (!unitName || !selectedCategoryId) return;
     setIsSubmittingUnit(true);
    try {
      const payload = { name: unitName, category_id: String(selectedCategoryId) };
      if (editingUnitId) await supabase.from('services').update(payload).eq('id', editingUnitId);
      else await supabase.from('services').insert([payload]);
      cancelEditUnit(); fetchData();
    } catch (error) {} finally { setIsSubmittingUnit(false); }
  };

  const handleDeleteUnit = async (id: string) => {
     try { await supabase.from('services').delete().eq('id', id); fetchData(); } catch (error) {} 
  };

  const DEFAULT_SPAREPART_DESC = "Suku cadang original/berkualitas. Harga belum termasuk biaya pemasangan oleh teknisi (apabila ada tindakan berat di lapangan).";

  const cancelEditPart = () => {
    setEditingPartId(null); setPartName(''); setPartCategoryId(''); setPartUnitId(''); setPartPrice(''); setPartStock(''); setPartImage(''); setPartDesc('');
  };

  const handleSavePart = async () => {
    if (!partName || !partCategoryId || !partUnitId || !partPrice || !partStock) return;
    setIsSubmittingPart(true);
    try {
      const payload = { 
        name: partName, category_id: String(partCategoryId), unit_id: String(partUnitId),
        price: Number(partPrice), stock: Number(partStock), image_url: partImage,
        description: partDesc.trim() || DEFAULT_SPAREPART_DESC
      };
      if (editingPartId) await supabase.from('spare_parts').update(payload).eq('id', editingPartId);
      else await supabase.from('spare_parts').insert([payload]);
      cancelEditPart(); fetchData();
    } catch (error) {} finally { setIsSubmittingPart(false); }
  };

  const handleDeletePart = async (id: any) => {
    try { await supabase.from('spare_parts').delete().eq('id', id); fetchData(); } catch (error) {}
  };

  const getThemeMapping = (theme: string) => {
    if (theme === 'sky') return { bg_class: 'bg-sky-50', icon_color: 'text-sky-500', border_color: 'border-sky-100' };
    if (theme === 'indigo') return { bg_class: 'bg-indigo-50', icon_color: 'text-indigo-500', border_color: 'border-indigo-100' };
    if (theme === 'emerald') return { bg_class: 'bg-emerald-50', icon_color: 'text-emerald-500', border_color: 'border-emerald-100' };
    if (theme === 'rose') return { bg_class: 'bg-rose-50', icon_color: 'text-rose-500', border_color: 'border-rose-100' };
    return { bg_class: 'bg-slate-50', icon_color: 'text-slate-500', border_color: 'border-slate-100' };
  };

  const getIconComponent = (name: string, className: string) => {
    if (name === 'Wind') return <Wind className={className} />;
    if (name === 'Car') return <Car className={className} />;
    if (name === 'ShieldCheck') return <ShieldCheck className={className} />;
    if (name === 'Wrench') return <Wrench className={className} />;
    if (name === 'Snowflake') return <Snowflake className={className} />;
    if (name === 'Truck') return <Truck className={className} />;
    if (name === 'Zap') return <Zap className={className} />;
    if (name === 'Smartphone') return <Smartphone className={className} />;
    return <Layers className={className} />; // Fallback ke Layers
  };

  const cancelEditSpc = () => {
    setEditingSpcId(null); setSpcTitle(''); setSpcCategory(''); setSpcSubtitle(''); setSpcDesc(''); 
    setSpcBenefits(''); setSpcCta(''); setSpcTheme('sky'); setSpcIcon('Wind');
  };

  const handleSaveSpc = async () => {
    if (!spcTitle || !spcCategory) { alert('Judul dan Kategori wajib diisi'); return; }
    setIsSubmittingSpc(true);
    try {
      const themeColors = getThemeMapping(spcTheme);
      const benefitsArray = spcBenefits.split(',').map(b => b.trim()).filter(b => b.length > 0);
      const payload = {
        title: spcTitle, category: spcCategory, subtitle: spcSubtitle || 'Member',
        description: spcDesc, benefits: benefitsArray, cta_text: spcCta || 'Pesan Sekarang',
        icon_name: spcIcon, image_url: '', ...themeColors 
      };
      
      if (editingSpcId) await supabase.from('special_services_catalog').update(payload).eq('id', editingSpcId);
      else await supabase.from('special_services_catalog').insert([payload]);
      
      cancelEditSpc(); fetchData();
    } catch (err) { console.error(err); } finally { setIsSubmittingSpc(false); }
  };

  const handleEditSpc = (item: any) => {
    setEditingSpcId(item.id); setSpcTitle(item.title); setSpcCategory(item.category); setSpcSubtitle(item.subtitle);
    setSpcDesc(item.description); setSpcBenefits((item.benefits || []).join(', ')); setSpcCta(item.cta_text);
    setSpcIcon(item.icon_name || 'Wind');
    
    let themeStr = 'sky';
    if (item.bg_class?.includes('indigo')) themeStr = 'indigo';
    if (item.bg_class?.includes('emerald')) themeStr = 'emerald';
    if (item.bg_class?.includes('rose')) themeStr = 'rose';
    setSpcTheme(themeStr);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSpc = async (id: string) => {
    try { await supabase.from('special_services_catalog').delete().eq('id', id); fetchData(); } catch (err) {}
  };

  const cancelEditVoucher = () => {
    setEditingVoucherId(null); setVoucherCode(''); setVoucherTitle(''); setVoucherCategory(''); setVoucherDesc(''); setVoucherTheme('rose');
  };

  const handleSaveVoucher = async () => {
    if (!voucherTitle || !voucherCategory) { alert("Judul dan Kategori Voucher wajib diisi!"); return; }
    setIsSubmittingVoucher(true);
    const payload = { code: voucherCode, title: voucherTitle, category: voucherCategory, description: voucherDesc, theme_color: voucherTheme, is_active: true };
    try {
      if (editingVoucherId) await supabase.from('vouchers_promos').update(payload).eq('id', editingVoucherId);
      else await supabase.from('vouchers_promos').insert([payload]);
      cancelEditVoucher(); fetchData();
    } catch (error) { console.error(error); } finally { setIsSubmittingVoucher(false); }
  };

  const handleEditVoucher = (v: any) => {
    setEditingVoucherId(v.id); setVoucherCode(v.code || ''); setVoucherTitle(v.title || ''); setVoucherCategory(v.category || ''); setVoucherDesc(v.description || ''); setVoucherTheme(v.theme_color || 'rose');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteVoucher = async (id: string) => {
    try { await supabase.from('vouchers_promos').delete().eq('id', id); fetchData(); } catch (error) { console.error(error); }
  };

  // ==========================================
  // SMART FORMATTER & WHATSAPP AUTO-DRAFT
  // ==========================================
  const formatWhatsAppNumber = (phone: string) => {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
       cleaned = '62' + cleaned.substring(1);
    }
    return cleaned;
  };

  const generateWaLink = (ord: any, cleanNote: string, schedule: string | null) => {
    const phone = formatWhatsAppNumber(ord.customer_phone || ord.user_phone || '');
    if (!phone) return '#';
    
    const orderId = ord.order_code ? `#${ord.order_code}` : 'PESANAN BARU';
    const unit = ord.unit_name || '-';
    const action = ord.action_type || 'Servis';
    const name = ord.customer_name || 'Kak';
    
    let text = `Halo kak *${name}*,\nKami dari Admin OMEANFIX ingin mengonfirmasi pesanan jasa Anda yang baru saja masuk ke sistem kami:\n\n  *No. Pesanan:* ${orderId}\n  *Unit:* ${unit} - ${action}\n  *Keluhan:* "${cleanNote}"`;
    
    if (schedule) {
       text += `\n  *Jadwal Reservasi:* ${schedule}`;
    }
    
    text += `\n\nApakah detail pesanan ini sudah benar dan bisa kami proses lebih lanjut untuk dihubungkan ke teknisi kami? Terima kasih!`;
    
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const renderManajemenPelanggan = () => {
    const filteredCustomers = customersData.filter(cust => {
       const q = customerSearch.toLowerCase();
       const nama = (cust.full_name || '').toLowerCase();
       const wa = (cust.phone_number || '').toLowerCase();
       return nama.includes(q) || wa.includes(q);
    });

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 space-y-4">
         <div className="flex p-1 bg-slate-200/60 backdrop-blur-sm rounded-xl mb-4">
            <button onClick={() => setCustomerTab('reguler')} className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-all outline-none ${customerTab === 'reguler' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Reguler</button>
            <button onClick={() => setCustomerTab('member')} className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-all outline-none ${customerTab === 'member' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Member VIP</button>
         </div>

         {customerTab === 'reguler' && (
            <div className="animate-in fade-in slide-in-from-right-4">
               <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[14px] font-extrabold text-slate-800 px-1">Daftar Akun Pelanggan:</h3>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded-lg">Total: {customersData.length}</span>
               </div>
               
               <div className="relative mb-4">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="w-4 h-4 text-slate-400" />
                   </div>
                   <input
                     type="text"
                     placeholder="Cari nama atau nomor WhatsApp..."
                     value={customerSearch}
                     onChange={(e) => setCustomerSearch(e.target.value)}
                     className="w-full bg-white border border-slate-200 pl-9 pr-4 py-3 rounded-[14px] text-[12px] font-medium outline-none focus:border-sky-500 transition-colors shadow-sm"
                   />
               </div>

               {customersData.length === 0 && !isRefreshing ? (
                  <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-[24px] border border-slate-100">Belum ada pelanggan terdaftar.</div>
               ) : filteredCustomers.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-[24px] border border-slate-100">Pencarian tidak ditemukan.</div>
               ) : (
                  <div className="space-y-3">
                     {filteredCustomers.map(cust => {
                        const isMember = specialSubs.some(sub => sub.customer_phone === cust.phone_number && sub.status === 'aktif');
                        
                        if (editingCustId === cust.id) {
                           return (
                              <form key={cust.id} onSubmit={handleSaveCust} className="bg-sky-50 p-4 rounded-[20px] border border-sky-200 space-y-3 animate-in fade-in shadow-sm">
                                 <div>
                                    <label className="text-[9px] font-bold text-sky-700 uppercase tracking-widest block mb-1">Nama Lengkap</label>
                                    <input type="text" value={custName} onChange={e => setCustName(e.target.value)} required className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-sky-200 focus:outline-none focus:border-sky-500" />
                                 </div>
                                 <div>
                                    <label className="text-[9px] font-bold text-sky-700 uppercase tracking-widest block mb-1">No WhatsApp</label>
                                    <input type="tel" value={custPhone} onChange={e => setCustPhone(e.target.value)} required className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-sky-200 focus:outline-none focus:border-sky-500" />
                                 </div>
                                 <div>
                                    <label className="text-[9px] font-bold text-sky-700 uppercase tracking-widest block mb-1">Email (Opsional)</label>
                                    <input type="email" value={custEmail} onChange={e => setCustEmail(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-sky-200 focus:outline-none focus:border-sky-500" />
                                 </div>
                                 <div className="flex gap-2 pt-1">
                                    <button type="submit" disabled={isSubmittingCust} className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm flex justify-center items-center gap-1 active:scale-95">
                                       {isSubmittingCust ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Simpan'}
                                    </button>
                                    <button type="button" onClick={cancelEditCust} className="px-4 py-2.5 bg-white border border-sky-200 text-sky-700 font-bold text-xs rounded-xl active:scale-95">Batal</button>
                                 </div>
                              </form>
                           );
                        }

                        return (
                           <div key={cust.id} className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-shadow">
                              <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-2 overflow-hidden shadow-sm ${isMember ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-slate-100 border-white text-slate-400'}`}>
                                 {cust.avatar_url ? <img src={cust.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-6 h-6" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-start mb-0.5 gap-2">
                                   <h4 className="font-bold text-slate-800 text-[14px] truncate">{cust.full_name || 'Tanpa Nama'}</h4>
                                   {isMember ? (
                                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black uppercase rounded-md tracking-widest shrink-0 border border-amber-200 shadow-sm flex items-center gap-1"><Award className="w-3 h-3"/> VIP</span>
                                   ) : (
                                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold uppercase rounded-md tracking-widest shrink-0 border border-slate-200">Reguler</span>
                                   )}
                                 </div>
                                 <p className="text-[12px] font-medium text-slate-600 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400"/> {cust.phone_number || '-'}</p>
                                 <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate"><Mail className="w-3.5 h-3.5 text-slate-300"/> {cust.email || 'Tidak ada email'}</p>
                              </div>
                              
                              <div className="flex flex-col gap-1.5 shrink-0 pl-1 border-l border-slate-100">
                                 <button onClick={() => handleEditCust(cust)} className="p-1.5 text-amber-500 bg-white border border-amber-100 rounded-lg shadow-sm hover:bg-amber-50 active:scale-95"><Edit3 className="w-3.5 h-3.5" /></button>
                                 <button onClick={() => handleDeleteCust(cust.id)} className="p-1.5 text-rose-500 bg-white border border-rose-100 rounded-lg shadow-sm hover:bg-rose-50 active:scale-95"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                           </div>
                        )
                     })}
                  </div>
               )}
            </div>
         )}

         {customerTab === 'member' && (
            <div className="animate-in fade-in slide-in-from-left-4 space-y-3">
               
               <div className="flex items-center justify-between mb-4 mt-2">
                  <h3 className="text-[14px] font-extrabold text-slate-800 px-1">Manajemen Member VIP:</h3>
                  {!showSubForm && (
                     <button onClick={() => setShowSubForm(true)} className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm hover:bg-purple-700 active:scale-95 transition-transform">
                        <Plus className="w-3 h-3" /> Tambah Manual
                     </button>
                  )}
               </div>

               {showSubForm && (
                  <form onSubmit={handleSaveSub} className="bg-white p-5 rounded-[24px] border border-purple-200 shadow-lg shadow-purple-500/10 mb-6 space-y-4 animate-in zoom-in-95">
                     <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-[14px] text-purple-800 flex items-center gap-2"><Award className="w-4 h-4"/> {editingSubId ? 'Edit Data Member' : 'Pendaftaran Member Baru'}</h4>
                        <button type="button" onClick={cancelEditSub} className="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"><X className="w-4 h-4"/></button>
                     </div>
                     <div className="space-y-3">
                        <input type="text" placeholder="Nama Pelanggan (*Wajib)" value={subName} onChange={e => setSubName(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-medium outline-none focus:border-purple-500 focus:bg-white" />
                        <input type="tel" placeholder="Nomor WhatsApp (*Wajib)" value={subPhone} onChange={e => setSubPhone(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-medium outline-none focus:border-purple-500 focus:bg-white" />
                        
                        <div className="grid grid-cols-2 gap-2">
                           <input type="text" placeholder="Paket (Cth: Cuci AC Rutin)" value={subTitle} onChange={e => setSubTitle(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 px-3 py-3 rounded-xl text-xs font-medium outline-none focus:border-purple-500 focus:bg-white" />
                           <select value={subDuration} onChange={e => setSubDuration(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-3 py-3 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-purple-500 focus:bg-white">
                              <option value="1_bulan">1 Bulan</option>
                              <option value="3_bulan">3 Bulan</option>
                              <option value="6_bulan">6 Bulan</option>
                              <option value="1_tahun">1 Tahun</option>
                              <option value="rutin_tanpa_batas">Rutin (Tanpa Batas)</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">Status Keanggotaan</label>
                           <select value={subStatus} onChange={e => setSubStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-purple-500 focus:bg-white">
                              <option value="menunggu_konfirmasi">Menunggu Konfirmasi</option>
                              <option value="aktif">Aktif (Member VIP)</option>
                              <option value="selesai">Selesai / Nonaktif</option>
                           </select>
                        </div>
                     </div>
                     <button type="submit" disabled={isSubmittingSub} className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-md shadow-purple-600/20 active:scale-95 flex justify-center items-center gap-2">
                        {isSubmittingSub ? <Loader2 className="w-4 h-4 animate-spin"/> : (editingSubId ? 'Update Member' : 'Daftarkan Member')}
                     </button>
                  </form>
               )}

               {!showSubForm && (specialSubs.length === 0 ? (
                 <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-[24px] border border-slate-100">Belum ada pendaftaran membership.</div>
               ) : (
                 specialSubs.map((sub) => (
                   <div key={sub.id} className={`bg-white p-4 rounded-[24px] border shadow-sm space-y-3 transition-colors ${editingSubId === sub.id ? 'border-amber-300' : 'border-purple-100'}`}>
                     <div className="flex justify-between items-center">
                       <span className="px-2.5 py-1 bg-purple-50 text-purple-600 text-[9px] font-bold uppercase rounded-full tracking-wider border border-purple-100/50">
                         {sub.subscription_code || 'MBR-0000'}
                       </span>
                       <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest ${['menunggu_konfirmasi'].includes(sub.status) ? 'bg-amber-100 text-amber-700 border border-amber-200' : sub.status === 'aktif' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                            {sub.status ? sub.status.replace(/_/g, ' ') : ''}
                          </span>
                          <div className="flex items-center gap-1 border-l border-slate-100 pl-2">
                             <button onClick={() => handleEditSub(sub)} className="p-1.5 text-amber-500 bg-white border border-amber-100 rounded-lg hover:bg-amber-50 active:scale-95"><Edit3 className="w-3.5 h-3.5"/></button>
                             <button onClick={() => handleDeleteSub(sub.id)} className="p-1.5 text-rose-500 bg-white border border-rose-100 rounded-lg hover:bg-rose-50 active:scale-95"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                       </div>
                     </div>
                     <div>
                       <h4 className="font-bold text-slate-800 text-[15px]">{sub.custom_service_title || 'Paket Layanan Khusus'}</h4>
                       <p className="text-[11px] text-slate-600 mt-1"><b>Pelanggan:</b> {sub.customer_name} ({sub.customer_phone})</p>
                       <p className="text-[11px] text-slate-600"><b>Durasi:</b> {sub.duration ? sub.duration.replace(/_/g, ' ') : ''}</p>
                       {(sub.customer_address || sub.notes) && (
                           <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 truncate"><b>Alamat/Catatan:</b> {sub.customer_address} - {sub.notes}</p>
                       )}
                     </div>
                   </div>
                 ))
               ))}
            </div>
         )}
      </div>
    );
  };

  const renderManajemenVoucher = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className={`bg-white p-6 rounded-[28px] shadow-[0_2px_20px_rgba(0,0,0,0.02)] border mb-6 relative overflow-hidden transition-colors ${editingVoucherId ? 'border-amber-300 shadow-amber-100' : 'border-slate-100'}`}>
        <div className="flex items-center gap-3 mb-5">
          <div className={`p-2.5 rounded-2xl ${editingVoucherId ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'}`}>
            <Ticket className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-[16px] tracking-tight">{editingVoucherId ? 'Edit Voucher Promo' : 'Tambah Voucher Baru'}</h3>
        </div>

        <div className="space-y-3.5 mb-6">
          <input type="text" placeholder="Kode Voucher (Cth: DISKON50K)" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-bold tracking-wider outline-none focus:bg-white uppercase" />
          <input type="text" placeholder="Judul Voucher (*Wajib)" value={voucherTitle} onChange={(e) => setVoucherTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-medium outline-none focus:bg-white" />
          <input type="text" placeholder="Kategori Promo (Cth: Diskon AC, Cashback, Member)" value={voucherCategory} onChange={(e) => setVoucherCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-medium outline-none focus:bg-white" />
          <textarea placeholder="Deskripsi Singkat Voucher..." value={voucherDesc} onChange={(e) => setVoucherDesc(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-medium resize-none outline-none focus:bg-white" />
          
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Pilih Tema Warna Card:</label>
            <div className="grid grid-cols-3 gap-2">
              {['rose', 'amber', 'emerald', 'sky', 'indigo', 'teal'].map((tm) => (
                <button key={tm} type="button" onClick={() => setVoucherTheme(tm)} className={`py-2 px-3 rounded-xl text-[11px] font-bold capitalize border transition-all ${voucherTheme === tm ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-xs' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>{tm}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleSaveVoucher} disabled={isSubmittingVoucher} className={`flex-1 py-3.5 font-bold text-white rounded-[16px] text-[13px] transition-transform active:scale-[0.98] flex items-center justify-center gap-2 ${editingVoucherId ? 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20' : 'bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/20'}`}>
            {isSubmittingVoucher && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{editingVoucherId ? 'Update Voucher' : 'Simpan Voucher'}</span>
          </button>
          {editingVoucherId && <button onClick={cancelEditVoucher} className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-[16px] text-[13px]">Batal</button>}
        </div>
      </div>

      <div className="bg-white p-6 rounded-[28px] shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-slate-100">
        <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-4 px-1">Voucher Tersimpan ({vouchers.length}):</h4>
        {vouchers.length === 0 ? (
          <p className="text-[12px] text-slate-400 font-medium py-6 text-center">Belum ada voucher tersimpan.</p>
        ) : (
          <div className="space-y-3">
            {vouchers.map((v) => (
              <div key={v.id} className="p-4 rounded-[20px] border border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-teal-100 text-teal-700 font-extrabold text-[10px] tracking-wider uppercase mb-1">{v.code || 'NO CODE'}</span>
                  <h5 className="font-bold text-slate-800 text-[14px]">{v.title}</h5>
                  <p className="text-[11px] text-slate-500 font-medium">{v.category} &bull; {v.description || '-'}</p>
                </div>
                <div className="flex gap-1.5 shrink-0 ml-3">
                  <button onClick={() => handleEditVoucher(v)} className="p-2 text-amber-600 bg-white border border-amber-200 rounded-xl hover:bg-amber-50 active:scale-95 shadow-2xs"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteVoucher(v.id)} className="p-2 text-rose-600 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 active:scale-95 shadow-2xs"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderKatalogKhusus = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className={`bg-white p-6 rounded-[28px] shadow-[0_2px_20px_rgba(0,0,0,0.02)] border mb-6 relative overflow-hidden transition-colors ${editingSpcId ? 'border-amber-300 shadow-amber-100' : 'border-slate-100'}`}>
        <div className="flex items-center gap-3 mb-5">
          <div className={`p-2.5 rounded-2xl ${editingSpcId ? 'bg-amber-50 text-amber-600' : 'bg-fuchsia-50 text-fuchsia-600'}`}>
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-[16px] tracking-tight">{editingSpcId ? 'Edit Paket Katalog Khusus' : 'Tambah Paket Khusus Baru'}</h3>
        </div>

        <div className="space-y-3.5 mb-6">
          <input type="text" placeholder="Judul Paket (*Wajib)" value={spcTitle} onChange={(e) => setSpcTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-medium outline-none focus:bg-white" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Kategori (*Wajib)" value={spcCategory} onChange={(e) => setSpcCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-medium outline-none focus:bg-white" />
            <input type="text" placeholder="Subtitle (Cth: Member VIP)" value={spcSubtitle} onChange={(e) => setSpcSubtitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-medium outline-none focus:bg-white" />
          </div>
          <textarea placeholder="Deskripsi Paket..." value={spcDesc} onChange={(e) => setSpcDesc(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-medium resize-none outline-none focus:bg-white" />
          <textarea placeholder="Keuntungan (pisahkan dengan koma: Gratis Cek, Disk 20%, Prioritas)" value={spcBenefits} onChange={(e) => setSpcBenefits(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-medium resize-none outline-none focus:bg-white" />
          <input type="text" placeholder="Teks Tombol CTA (Default: Pesan Sekarang)" value={spcCta} onChange={(e) => setSpcCta(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-medium outline-none focus:bg-white" />
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 px-1">Ikon Paket:</label>
              <select value={spcIcon} onChange={(e) => setSpcIcon(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-3 py-3 rounded-[14px] text-[12px] font-bold text-slate-700 outline-none">
                {['Wind', 'Car', 'ShieldCheck', 'Wrench', 'Snowflake', 'Truck', 'Zap', 'Smartphone'].map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 px-1">Tema Warna:</label>
              <select value={spcTheme} onChange={(e) => setSpcTheme(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-3 py-3 rounded-[14px] text-[12px] font-bold text-slate-700 outline-none">
                <option value="sky">Sky Blue</option>
                <option value="indigo">Indigo</option>
                <option value="emerald">Emerald Green</option>
                <option value="rose">Rose Red</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleSaveSpc} disabled={isSubmittingSpc} className={`flex-1 py-3.5 font-bold text-white rounded-[16px] text-[13px] transition-transform active:scale-[0.98] flex items-center justify-center gap-2 ${editingSpcId ? 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20' : 'bg-fuchsia-600 hover:bg-fuchsia-700 shadow-lg shadow-fuchsia-600/20'}`}>
            {isSubmittingSpc && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{editingSpcId ? 'Update Paket' : 'Simpan Paket'}</span>
          </button>
          {editingSpcId && <button onClick={cancelEditSpc} className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-[16px] text-[13px]">Batal</button>}
        </div>
      </div>

      <div className="bg-white p-6 rounded-[28px] shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-slate-100">
        <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-4 px-1">Katalog Tersimpan ({specialCatalogs.length}):</h4>
        {specialCatalogs.length === 0 ? (
          <p className="text-[12px] text-slate-400 font-medium py-6 text-center">Belum ada katalog khusus tersimpan.</p>
        ) : (
          <div className="space-y-3">
            {specialCatalogs.map((item) => (
              <div key={item.id} className="p-4 rounded-[20px] border border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${item.bg_class || 'bg-slate-100'}`}>
                    {getIconComponent(item.icon_name || 'Wind', `w-5 h-5 ${item.icon_color || 'text-slate-600'}`)}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-[14px]">{item.title}</h5>
                    <p className="text-[11px] text-slate-500 font-medium">{item.category} &bull; {item.subtitle}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0 ml-3">
                  <button onClick={() => handleEditSpc(item)} className="p-2 text-amber-600 bg-white border border-amber-200 rounded-xl hover:bg-amber-50 active:scale-95 shadow-2xs"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteSpc(item.id)} className="p-2 text-rose-600 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 active:scale-95 shadow-2xs"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderKatalogJasa = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 space-y-4">
       
      {/* SEGMENTED CONTROL 2 TAB */}
      <div className="flex p-1 bg-slate-200/60 backdrop-blur-sm rounded-xl mb-4">
        <button 
           onClick={() => setKatalogTab('kategori')} 
           className={`flex-1 py-2.5 text-[12px] font-bold rounded-lg transition-all outline-none ${katalogTab === 'kategori' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Kategori Jasa
        </button>
        <button 
           onClick={() => setKatalogTab('objek')} 
           className={`flex-1 py-2.5 text-[12px] font-bold rounded-lg transition-all outline-none ${katalogTab === 'objek' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Objek / Unit
        </button>
      </div>

      {katalogTab === 'kategori' && (
        <div className={`bg-white p-6 rounded-[28px] shadow-[0_2px_20px_rgba(0,0,0,0.02)] border transition-colors animate-in slide-in-from-right-4 duration-300 ${editingCategoryId ? 'border-amber-300 shadow-amber-100' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3 mb-5">
            <div className={`p-2 rounded-xl ${editingCategoryId ? 'bg-amber-50' : 'bg-indigo-50'}`}>{editingCategoryId ? <Edit3 className="w-5 h-5 text-amber-600" /> : <Layers className="w-5 h-5 text-indigo-600" />}</div>
            <h3 className="font-extrabold text-slate-800 text-[16px] tracking-tight">{editingCategoryId ? 'Edit Kategori Jasa' : 'Tambah Kategori Jasa Baru'}</h3>
          </div>

          <div className="space-y-3.5 mb-6">
            <input type="text" placeholder="Nama Kategori (Cth: Servis AC)" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-medium outline-none focus:bg-white" />
            <input type="text" placeholder="URL Ikon atau Nama Ikon (Opsional)" value={categoryIcon} onChange={(e) => setCategoryIcon(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-medium outline-none focus:bg-white" />
          </div>

          <div className="flex gap-2">
            <button onClick={handleSaveCategory} disabled={isSubmittingCat} className={`flex-1 py-3.5 font-bold text-white rounded-[16px] text-[13px] transition-transform active:scale-[0.98] flex items-center justify-center gap-2 ${editingCategoryId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              {isSubmittingCat && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editingCategoryId ? 'Update Kategori' : 'Simpan Kategori'}</span>
            </button>
            {editingCategoryId && <button onClick={cancelEditCategory} className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-[16px] text-[13px]">Batal</button>}
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3 px-1">Kategori Tersimpan ({categories.length}):</h4>
            <div className="space-y-2.5">
              {categories.map((cat) => (
                <div key={cat.id} className="p-3.5 rounded-[18px] border border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-[13px]">{cat.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingCategoryId(cat.id); setCategoryName(cat.name || ''); setCategoryIcon(cat.icon || ''); }} className="p-1.5 text-amber-600 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 active:scale-95"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 active:scale-95"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {katalogTab === 'objek' && (
        <div className={`bg-white p-6 rounded-[28px] shadow-[0_2px_20px_rgba(0,0,0,0.02)] border transition-colors animate-in slide-in-from-left-4 duration-300 ${editingUnitId ? 'border-amber-300 shadow-amber-100' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3 mb-5">
            <div className={`p-2 rounded-xl ${editingUnitId ? 'bg-amber-50' : 'bg-blue-50'}`}>{editingUnitId ? <Edit3 className="w-5 h-5 text-amber-600" /> : <Box className="w-5 h-5 text-blue-600" />}</div>
            <h3 className="font-extrabold text-slate-800 text-[16px] tracking-tight">{editingUnitId ? 'Edit Objek / Unit Jasa' : 'Tambah Objek / Unit Jasa Baru'}</h3>
          </div>

          <div className="space-y-3.5 mb-6">
            <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-bold text-slate-700 outline-none">
              <option value="">-- Pilih Kategori --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <input type="text" placeholder="Nama Unit (Cth: AC Split, Mobil Avanza, Kulkas 2 Pintu)" value={unitName} onChange={(e) => setUnitName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-medium outline-none focus:bg-white" />
          </div>

          <div className="flex gap-2">
            <button onClick={handleSaveUnit} disabled={isSubmittingUnit} className={`flex-1 py-3.5 font-bold text-white rounded-[16px] text-[13px] transition-transform active:scale-[0.98] flex items-center justify-center gap-2 ${editingUnitId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {isSubmittingUnit && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editingUnitId ? 'Update Unit' : 'Simpan Unit'}</span>
            </button>
            {editingUnitId && <button onClick={cancelEditUnit} className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-[16px] text-[13px]">Batal</button>}
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Objek Tersimpan ({serviceUnits.length}):</h4>
            </div>

            {/* FILTER PILLS */}
            <div className="flex overflow-x-auto scrollbar-hide gap-2 mb-4 px-1 -mx-1">
              <button
                onClick={() => setObjekFilter('Semua')}
                className={`flex-none px-4 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95 outline-none ${objekFilter === 'Semua' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'}`}
              >
                Semua
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setObjekFilter(cat.id);
                    if (!expandedObjKategori.includes(cat.id)) {
                      setExpandedObjKategori(prev => [...prev, cat.id]);
                    }
                  }}
                  className={`flex-none px-4 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95 outline-none ${objekFilter === cat.id ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* GROUPED LIST AKORDION */}
            <div className="space-y-3">
              {(() => {
                const filtered = serviceUnits.filter(u => objekFilter === 'Semua' || String(u.category_id) === objekFilter);

                if (filtered.length === 0) {
                  return <p className="text-[11px] text-slate-400 text-center py-4 bg-slate-50 rounded-2xl border border-slate-100">Tidak ada objek di kategori ini.</p>;
                }

                const grouped: Record<string, any[]> = {};
                const unassigned: any[] = [];
                
                filtered.forEach(u => {
                  if (u.category_id) {
                    if (!grouped[u.category_id]) grouped[u.category_id] = [];
                    grouped[u.category_id].push(u);
                  } else {
                    unassigned.push(u);
                  }
                });

                return (
                  <>
                    {Object.keys(grouped).map(catId => {
                      const cat = categories.find(c => String(c.id) === catId);
                      const catName = cat ? cat.name : 'Kategori Tidak Diketahui';
                      const isExpanded = expandedObjKategori.includes(catId) || objekFilter === catId;
                      const items = grouped[catId];

                      return (
                        <div key={catId} className="bg-white border border-slate-200 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden transition-all">
                          <button
                            onClick={() => {
                              if (isExpanded && objekFilter !== catId) {
                                setExpandedObjKategori(prev => prev.filter(id => id !== catId));
                              } else {
                                setExpandedObjKategori(prev => [...prev, catId]);
                              }
                            }}
                            className="w-full flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-100 transition-colors outline-none"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                                {getIconComponent(cat?.icon || 'Layers', 'w-4 h-4')}
                              </div>
                              <div className="text-left">
                                <h5 className="text-[13px] font-bold text-slate-800 leading-tight">{catName}</h5>
                                <span className="text-[10px] font-medium text-slate-500">{items.length} Objek Unit</span>
                              </div>
                            </div>
                            <div className="text-slate-400 p-1 bg-white rounded-full shadow-sm border border-slate-100">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="p-3 border-t border-slate-100 space-y-2 bg-white animate-in fade-in duration-200">
                              {items.map(u => (
                                <div key={u.id} className="p-3 rounded-[16px] border border-slate-100 flex justify-between items-center bg-slate-50/50 hover:border-blue-200 transition-colors">
                                  <h6 className="font-bold text-slate-700 text-[12px] pl-1">{u.name}</h6>
                                  <div className="flex gap-1.5">
                                    <button onClick={() => { setEditingUnitId(u.id); setUnitName(u.name || ''); setSelectedCategoryId(String(u.category_id || '')); }} className="p-2 text-amber-600 bg-white border border-amber-200 rounded-xl hover:bg-amber-50 active:scale-95 shadow-2xs">
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDeleteUnit(u.id)} className="p-2 text-rose-600 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 active:scale-95 shadow-2xs">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {unassigned.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden transition-all mt-3">
                        <div className="p-3.5 bg-slate-50/80 border-b border-slate-100">
                           <h5 className="text-[13px] font-bold text-slate-800">Tanpa Kategori</h5>
                        </div>
                        <div className="p-3 space-y-2 bg-white">
                          {unassigned.map(u => (
                            <div key={u.id} className="p-3 rounded-[16px] border border-slate-100 flex justify-between items-center bg-slate-50/50 hover:border-blue-200 transition-colors">
                              <h6 className="font-bold text-slate-700 text-[12px] pl-1">{u.name}</h6>
                              <div className="flex gap-1.5">
                                <button onClick={() => { setEditingUnitId(u.id); setUnitName(u.name || ''); setSelectedCategoryId(String(u.category_id || '')); }} className="p-2 text-amber-600 bg-white border border-amber-200 rounded-xl hover:bg-amber-50 active:scale-95 shadow-2xs">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteUnit(u.id)} className="p-2 text-rose-600 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 active:scale-95 shadow-2xs">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderManajemenBanner = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className={`bg-white p-6 rounded-[28px] shadow-[0_2px_20px_rgba(0,0,0,0.02)] border mb-6 relative overflow-hidden transition-colors ${editingBannerId ? 'border-amber-300 shadow-amber-100' : 'border-slate-100'}`}>
        <div className="flex items-center gap-3 mb-5">
          <div className={`p-2.5 rounded-2xl ${editingBannerId ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
            <Megaphone className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-[16px] tracking-tight">{editingBannerId ? 'Edit Banner Promosi' : 'Tambah Banner Promosi Baru'}</h3>
        </div>

        <div className="space-y-3.5 mb-6">
          <input type="text" placeholder="Judul Utama (*Wajib)" value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-medium outline-none focus:bg-white" />
          <input type="text" placeholder="URL Gambar Banner (*Wajib)" value={bannerBgUrl} onChange={(e) => setBannerBgUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-medium outline-none focus:bg-white" />
          <input type="text" placeholder="Label Badge / Subjudul (Cth: PROMO BULAN INI)" value={bannerLabel} onChange={(e) => setBannerLabel(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-medium outline-none focus:bg-white" />
          <textarea placeholder="Deskripsi Singkat Banner..." value={bannerDesc} onChange={(e) => setBannerDesc(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-medium resize-none outline-none focus:bg-white" />
          <input type="text" placeholder="Teks Tombol CTA (Cth: Pesan Sekarang)" value={bannerBtnText} onChange={(e) => setBannerBtnText(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-medium outline-none focus:bg-white" />
        </div>

        <div className="flex gap-2">
          <button onClick={handleSaveBanner} disabled={isSubmittingBanner} className={`flex-1 py-3.5 font-bold text-white rounded-[16px] text-[13px] transition-transform active:scale-[0.98] flex items-center justify-center gap-2 ${editingBannerId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-rose-600 hover:bg-rose-700'}`}>
            {isSubmittingBanner && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{editingBannerId ? 'Update Banner' : 'Simpan Banner'}</span>
          </button>
          {editingBannerId && <button onClick={resetBannerForm} className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-[16px] text-[13px]">Batal</button>}
        </div>
      </div>

      <div className="bg-white p-6 rounded-[28px] shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-slate-100">
        <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-4 px-1">Banner Tersimpan ({savedBanners.length}):</h4>
        {savedBanners.length === 0 ? (
          <p className="text-[12px] text-slate-400 font-medium py-6 text-center">Belum ada banner tersimpan.</p>
        ) : (
          <div className="space-y-3">
            {savedBanners.map((b) => (
              <div key={b.id} className="p-3.5 rounded-[20px] border border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img src={b.bg_url || 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=800&auto=format&fit=crop'} alt="" className="w-14 h-14 rounded-xl object-cover border border-slate-200" />
                  <div>
                    <h5 className="font-bold text-slate-800 text-[14px]">{b.title}</h5>
                    <p className="text-[11px] text-slate-400 font-medium">{b.label || 'Tanpa Label'}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0 ml-3">
                  <button onClick={() => handleEditBanner(b)} className="p-2 text-amber-600 bg-white border border-amber-200 rounded-xl hover:bg-amber-50 active:scale-95 shadow-2xs"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteBanner(b.id)} className="p-2 text-rose-600 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 active:scale-95 shadow-2xs"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderManajemenStok = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className={`bg-white p-6 rounded-[28px] shadow-[0_2px_20px_rgba(0,0,0,0.02)] border mb-6 relative overflow-hidden transition-colors ${editingPartId ? 'border-amber-300 shadow-amber-100' : 'border-slate-100'}`}>
        <div className="flex items-center gap-3 mb-5">
          <div className={`p-2.5 rounded-2xl ${editingPartId ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <Package className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-[16px] tracking-tight">{editingPartId ? 'Edit Suku Cadang' : 'Tambah Suku Cadang Baru'}</h3>
        </div>

        <div className="space-y-3.5 mb-6">
          <input type="text" placeholder="Nama Suku Cadang (Cth: Busi Iridium AC)" value={partName} onChange={(e) => setPartName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-medium outline-none focus:bg-white" />
          
          <div className="grid grid-cols-2 gap-3.5">
            <select value={partCategoryId} onChange={(e) => setPartCategoryId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-3 py-3.5 rounded-[16px] text-[13px] font-bold text-slate-700 outline-none">
              <option value="">-- Kategori --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select value={partUnitId} onChange={(e) => setPartUnitId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-3 py-3.5 rounded-[16px] text-[13px] font-bold text-slate-700 outline-none">
              <option value="">-- Unit / Objek --</option>
              {serviceUnits.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><span className="text-slate-400 text-[13px] font-bold">Rp</span></div>
              <input type="number" placeholder="Harga Jual" value={partPrice} onChange={(e) => setPartPrice(e.target.value)} className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded-[16px] text-[13px] font-bold text-slate-800 outline-none focus:bg-white" />
            </div>
            <input type="number" placeholder="Jumlah Stok (Pcs)" value={partStock} onChange={(e) => setPartStock(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-bold text-slate-800 outline-none focus:bg-white" />
          </div>

          <input type="text" placeholder="URL Gambar Produk (Opsional)" value={partImage} onChange={(e) => setPartImage(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-medium outline-none focus:bg-white" />

          <textarea placeholder="Deskripsi / Catatan Suku Cadang (Opsional)..." value={partDesc} onChange={(e) => setPartDesc(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[13px] font-medium resize-none outline-none focus:bg-white" />
        </div>

        <div className="flex gap-2">
          <button onClick={handleSavePart} disabled={isSubmittingPart} className={`flex-1 py-3.5 font-bold text-white rounded-[16px] text-[13px] transition-transform active:scale-[0.98] flex items-center justify-center gap-2 ${editingPartId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
            {isSubmittingPart && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{editingPartId ? 'Update Suku Cadang' : 'Simpan Suku Cadang'}</span>
          </button>
          {editingPartId && <button onClick={cancelEditPart} className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-[16px] text-[13px]">Batal</button>}
        </div>
      </div>

      <div className="bg-white p-6 rounded-[28px] shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-slate-100">
        <div className="flex items-center justify-between mb-3 px-1">
           <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Suku Cadang Tersimpan ({spareParts.length}):</h4>
        </div>

        {/* FILTER PILLS */}
        <div className="flex overflow-x-auto scrollbar-hide gap-2 mb-4 px-1 -mx-1">
          <button
            onClick={() => setStokFilter('Semua')}
            className={`flex-none px-4 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95 outline-none ${stokFilter === 'Semua' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'}`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setStokFilter(cat.id);
                if (!expandedStokKategori.includes(cat.id)) {
                  setExpandedStokKategori(prev => [...prev, cat.id]);
                }
              }}
              className={`flex-none px-4 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95 outline-none ${stokFilter === cat.id ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* GROUPED LIST AKORDION */}
        <div className="space-y-3">
          {(() => {
            const filteredParts = spareParts.filter(p => stokFilter === 'Semua' || String(p.category_id) === stokFilter);

            if (filteredParts.length === 0) {
              return <p className="text-[11px] text-slate-400 text-center py-4 bg-slate-50 rounded-2xl border border-slate-100">Tidak ada suku cadang di kategori ini.</p>;
            }

            const groupedParts: Record<string, any[]> = {};
            const unassignedParts: any[] = [];
            
            filteredParts.forEach(p => {
              if (p.category_id) {
                if (!groupedParts[p.category_id]) groupedParts[p.category_id] = [];
                groupedParts[p.category_id].push(p);
              } else {
                unassignedParts.push(p);
              }
            });

            return (
              <>
                {Object.keys(groupedParts).map(catId => {
                  const cat = categories.find(c => String(c.id) === catId);
                  const catName = cat ? cat.name : 'Kategori Tidak Diketahui';
                  const isExpanded = expandedStokKategori.includes(catId) || stokFilter === catId;
                  const items = groupedParts[catId];

                  return (
                    <div key={catId} className="bg-white border border-slate-200 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden transition-all">
                      <button
                        onClick={() => {
                          if (isExpanded && stokFilter !== catId) {
                            setExpandedStokKategori(prev => prev.filter(id => id !== catId));
                          } else {
                            setExpandedStokKategori(prev => [...prev, catId]);
                          }
                        }}
                        className="w-full flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-100 transition-colors outline-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                            {getIconComponent(cat?.icon || 'Layers', 'w-4 h-4')}
                          </div>
                          <div className="text-left">
                            <h5 className="text-[13px] font-bold text-slate-800 leading-tight">{catName}</h5>
                            <span className="text-[10px] font-medium text-slate-500">{items.length} Suku Cadang</span>
                          </div>
                        </div>
                        <div className="text-slate-400 p-1 bg-white rounded-full shadow-sm border border-slate-100">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="p-3 border-t border-slate-100 space-y-2 bg-white animate-in fade-in duration-200">
                          {items.map(p => (
                            <div key={p.id} className="p-3 rounded-[16px] border border-slate-100 flex justify-between items-center bg-slate-50/50 hover:border-emerald-200 transition-colors">
                              <div className="flex items-center gap-3">
                                <img src={p.image_url || 'https://cdn-icons-png.flaticon.com/128/683/683100.png'} alt="" className="w-10 h-10 rounded-lg object-cover bg-white border border-slate-200 p-0.5" />
                                <div>
                                  <h5 className="font-bold text-slate-800 text-[12px]">{p.name}</h5>
                                  <p className="text-[10px] font-bold text-emerald-600">Rp {Number(p.price || 0).toLocaleString('id-ID')} &bull; <span className="text-slate-400 font-medium">Stok: {p.stock || 0}</span></p>
                                </div>
                              </div>
                              <div className="flex gap-1.5 shrink-0 ml-2">
                                <button onClick={() => {
                                  setEditingPartId(p.id); setPartName(p.name || ''); setPartCategoryId(String(p.category_id || ''));
                                  setPartUnitId(String(p.unit_id || '')); setPartPrice(String(p.price || '')); setPartStock(String(p.stock || ''));
                                  setPartImage(p.image_url || ''); setPartDesc(p.description || ''); window.scrollTo({ top: 0, behavior: 'smooth' });
                                }} className="p-1.5 text-amber-600 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 active:scale-95 shadow-2xs">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeletePart(p.id)} className="p-1.5 text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 active:scale-95 shadow-2xs">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {unassignedParts.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden transition-all mt-3">
                    <div className="p-3.5 bg-slate-50/80 border-b border-slate-100">
                       <h5 className="text-[13px] font-bold text-slate-800">Tanpa Kategori</h5>
                    </div>
                    <div className="p-3 space-y-2 bg-white">
                      {unassignedParts.map(p => (
                        <div key={p.id} className="p-3 rounded-[16px] border border-slate-100 flex justify-between items-center bg-slate-50/50 hover:border-emerald-200 transition-colors">
                          <div className="flex items-center gap-3">
                            <img src={p.image_url || 'https://cdn-icons-png.flaticon.com/128/683/683100.png'} alt="" className="w-10 h-10 rounded-lg object-cover bg-white border border-slate-200 p-0.5" />
                            <div>
                              <h5 className="font-bold text-slate-800 text-[12px]">{p.name}</h5>
                              <p className="text-[10px] font-bold text-emerald-600">Rp {Number(p.price || 0).toLocaleString('id-ID')} &bull; <span className="text-slate-400 font-medium">Stok: {p.stock || 0}</span></p>
                            </div>
                          </div>
                          <div className="flex gap-1.5 shrink-0 ml-2">
                            <button onClick={() => {
                              setEditingPartId(p.id); setPartName(p.name || ''); setPartCategoryId(String(p.category_id || ''));
                              setPartUnitId(String(p.unit_id || '')); setPartPrice(String(p.price || '')); setPartStock(String(p.stock || ''));
                              setPartImage(p.image_url || ''); setPartDesc(p.description || ''); window.scrollTo({ top: 0, behavior: 'smooth' });
                            }} className="p-1.5 text-amber-600 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 active:scale-95 shadow-2xs">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeletePart(p.id)} className="p-1.5 text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 active:scale-95 shadow-2xs">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );

  const renderInvoiceModal = () => {
    if (!showInvoiceModal) return null;

    const { ord, invoiceData } = showInvoiceModal;
    const jasa = Number(invoiceData.jasa || invoiceData.J || 0);
    const part = Number(invoiceData.part || invoiceData.P || 0);
    const layanan = Number(invoiceData.layanan || invoiceData.L || 0);
    const total = Number(invoiceData.total || invoiceData.T || jasa + part + layanan);
    const desc = invoiceData.desc || invoiceData.D || '-';

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md overflow-y-auto" onClick={() => setShowInvoiceModal(null)}>
        <div className="min-h-full py-12 flex items-center justify-center w-full px-5">
          <div className="bg-white rounded-[24px] max-w-sm w-full p-6 relative animate-in zoom-in-95 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowInvoiceModal(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full outline-none"><X className="w-4 h-4"/></button>
            
            <div id="print-area" className="w-full bg-white text-black font-mono text-xs">
              <div className="text-center mb-4 pb-3 border-b border-dashed border-slate-300">
                <h2 className="font-bold text-[20px] uppercase tracking-wider">OMEANFIX</h2>
                <p className="text-[10px] text-slate-500">Jasa Servis & Perbaikan Terpercaya</p>
                <p className="text-[10px] text-slate-400 mt-1">Order #{ord?.order_code || (ord?.id ? String(ord.id).slice(0, 8) : 'PESANAN')}</p>
              </div>

              <div className="space-y-1.5 mb-4 pb-3 border-b border-dashed border-slate-300 text-[11px]">
                <p><strong>Pelanggan:</strong> {ord?.customer_name || 'Pelanggan'}</p>
                <p><strong>No. HP:</strong> {ord?.customer_phone || ord?.user_phone || '-'}</p>
                <p><strong>Tanggal:</strong> {new Date().toLocaleDateString('id-ID')}</p>
              </div>

              <div className="space-y-2 mb-4 pb-3 border-b border-dashed border-slate-300 text-[11px]">
                <div className="flex justify-between"><span>Biaya Jasa:</span><span>Rp {jasa.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Biaya Spare Part:</span><span>Rp {part.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Biaya Layanan:</span><span>Rp {layanan.toLocaleString('id-ID')}</span></div>
                {desc && desc !== '-' && <p className="text-[10px] text-slate-500 italic mt-1">Ket: {desc}</p>}
              </div>

              <div className="flex justify-between font-bold text-[13px] mb-4 pb-3 border-b-2 border-slate-800">
                <span>TOTAL TAGIHAN:</span>
                <span>Rp {total.toLocaleString('id-ID')}</span>
              </div>

              <p className="text-[10px] text-center text-slate-400">Terima kasih atas kepercayaan Anda!</p>
            </div>

            <div className="mt-6 flex gap-2">
              <button onClick={() => window.print()} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 transition-transform outline-none">
                <Printer className="w-4 h-4" /> Cetak Tagihan
              </button>
              <button onClick={() => setShowInvoiceModal(null)} className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl text-xs active:scale-95 outline-none">Tutup</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLaporanKeuangan = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const filteredOrders = adminOrders.filter(ord => {
      const raw = ord.note || ord.complaint || '';
      
      if (ord.created_at) {
        const ordDate = new Date(ord.created_at);
        if (reportPeriod === 'hari_ini') {
          const ordDateStr = ordDate.toISOString().split('T')[0];
          if (ordDateStr !== todayStr) return false;
        } else if (reportPeriod === 'minggu_ini') {
          const diffDays = (now.getTime() - ordDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) return false;
        } else if (reportPeriod === 'bulan_ini') {
          if (ordDate.getMonth() !== now.getMonth() || ordDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      const invMatch = raw.match(/\[INVOICE:\s*([^\]]+)\]/);
      let invPart = 0;
      if (invMatch && invMatch[1]) {
        invMatch[1].split('|').forEach((p: string) => {
          if (p.startsWith('P=')) invPart = Number(p.replace('P=', '')) || 0;
        });
      }

      const st = (ord.status || ord.order_status || '').toLowerCase();
      if (reportStatusFilter === 'lunas' && !['selesai', 'selesai ditangani', 'lunas', 'menunggu pembayaran', 'menunggu_pembayaran'].includes(st)) return false;
      if (reportStatusFilter === 'menunggu' && !['menunggu_konfirmasi', 'menunggu konfirmasi', 'ditangani', 'dalam_pengerjaan', 'proses'].includes(st)) return false;
      if (reportStatusFilter === 'dengan_part' && invPart <= 0) return false;

      if (reportSearch.trim()) {
        const q = reportSearch.toLowerCase();
        const code = (ord.order_code || '').toLowerCase();
        const name = (ord.customer_name || '').toLowerCase();
        const phone = (ord.customer_phone || ord.user_phone || '').toLowerCase();
        const unit = (ord.unit_name || '').toLowerCase();
        return code.includes(q) || name.includes(q) || phone.includes(q) || unit.includes(q);
      }

      return true;
    });

    let grandTotalOmzet = 0;
    let grandTotalJasa = 0;
    let grandTotalPart = 0;
    let grandTotalLayanan = 0;
    let invoiceCount = 0;

    filteredOrders.forEach(ord => {
      const raw = ord.note || ord.complaint || '';
      const invMatch = raw.match(/\[INVOICE:\s*([^\]]+)\]/);
      if (invMatch && invMatch[1]) {
        invoiceCount++;
        invMatch[1].split('|').forEach((p: string) => {
          if (p.startsWith('J=')) grandTotalJasa += Number(p.replace('J=', '')) || 0;
          if (p.startsWith('P=')) grandTotalPart += Number(p.replace('P=', '')) || 0;
          if (p.startsWith('L=')) grandTotalLayanan += Number(p.replace('L=', '')) || 0;
          if (p.startsWith('T=')) grandTotalOmzet += Number(p.replace('T=', '')) || 0;
        });
      }
    });

    const avgOrderValue = invoiceCount > 0 ? Math.round(grandTotalOmzet / invoiceCount) : 0;

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 space-y-4">
        
        {/* HEADER RINGKASAN PERIODE */}
        <div className="bg-white p-5 rounded-[28px] shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-slate-100 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Laporan & Keuangan
              </span>
              <h2 className="text-[18px] font-black text-slate-900 tracking-tight mt-1">Buku Kas & Transaksi</h2>
            </div>
            <button
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-transform"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Rekap</span>
            </button>
          </div>

          {/* PILLS PERIODE */}
          <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto scrollbar-hide gap-1">
            <button
              onClick={() => setReportPeriod('bulan_ini')}
              className={`flex-1 py-2 px-2 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap outline-none ${reportPeriod === 'bulan_ini' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setReportPeriod('minggu_ini')}
              className={`flex-1 py-2 px-2 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap outline-none ${reportPeriod === 'minggu_ini' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Minggu Ini
            </button>
            <button
              onClick={() => setReportPeriod('hari_ini')}
              className={`flex-1 py-2 px-2 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap outline-none ${reportPeriod === 'hari_ini' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setReportPeriod('semua')}
              className={`flex-1 py-2 px-2 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap outline-none ${reportPeriod === 'semua' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Semua
            </button>
          </div>
        </div>

        {/* METRIK KEUANGAN ATAS */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white p-5 rounded-[28px] shadow-xl space-y-4 relative overflow-hidden">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 block mb-1">Total Pemasukan Bruto</span>
            <h1 className="text-[28px] font-black tracking-tight leading-none text-emerald-400">
              Rp {grandTotalOmzet.toLocaleString('id-ID')}
            </h1>
            <p className="text-[11px] text-slate-300 font-medium mt-1">
              Dari {invoiceCount} transaksi terbit invoice ({reportPeriod.replace('_', ' ')})
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center">
            <div className="bg-white/5 p-2 rounded-xl backdrop-blur-xs border border-white/10">
              <span className="text-[9px] font-bold text-slate-300 block uppercase">Jasa Servis</span>
              <span className="text-[12px] font-black text-white">Rp {grandTotalJasa.toLocaleString('id-ID')}</span>
            </div>
            <div className="bg-white/5 p-2 rounded-xl backdrop-blur-xs border border-white/10">
              <span className="text-[9px] font-bold text-slate-300 block uppercase">Spare Part</span>
              <span className="text-[12px] font-black text-amber-300">Rp {grandTotalPart.toLocaleString('id-ID')}</span>
            </div>
            <div className="bg-white/5 p-2 rounded-xl backdrop-blur-xs border border-white/10">
              <span className="text-[9px] font-bold text-slate-300 block uppercase">Layanan</span>
              <span className="text-[12px] font-black text-sky-300">Rp {grandTotalLayanan.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER STATUS */}
        <div className="space-y-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari transaksi, no. order, pelanggan..."
              value={reportSearch}
              onChange={(e) => setReportSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 pl-10 pr-4 py-3 rounded-[16px] text-[12px] font-medium outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={reportStatusFilter}
              onChange={(e: any) => setReportStatusFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 outline-none shadow-xs"
            >
              <option value="semua">Semua Status Transaksi</option>
              <option value="lunas">Status Selesai / Lunas</option>
              <option value="menunggu">Status Dalam Pengerjaan</option>
              <option value="dengan_part">Ada Transaksi Spare Part</option>
            </select>
          </div>
        </div>

        {/* FORMAT TABEL VERTIKAL (VERTICAL TRANSACTION LEDGER CARDS) */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Daftar Transaksi ({filteredOrders.length}):
            </h4>
            <span className="text-[10px] font-bold text-slate-500">
              Rata-rata: Rp {avgOrderValue.toLocaleString('id-ID')}
            </span>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-[24px] border border-slate-100 p-6">
              <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 font-medium text-xs">Belum ada transaksi di periode ini.</p>
            </div>
          ) : (
            filteredOrders.map(ord => {
              const rawNote = ord.note || ord.complaint || '';
              
              let invoiceData = null;
              const invMatch = rawNote.match(/\[INVOICE:\s*([^\]]+)\]/);
              if (invMatch && invMatch[1]) {
                const parts = invMatch[1].split('|');
                const invObj: any = {};
                parts.forEach((p: string) => {
                  const [k, v] = p.split('=');
                  if (k && v) invObj[k.trim()] = v.trim();
                });
                invoiceData = invObj;
              }

              let paymentProofData = null;
              const proofMatch = rawNote.match(/\[PAYMENT_PROOF:\s*([^\]]+)\]/);
              if (proofMatch && proofMatch[1]) paymentProofData = proofMatch[1];

              const jasa = invoiceData ? Number(invoiceData.J || invoiceData.jasa || 0) : 0;
              const part = invoiceData ? Number(invoiceData.P || invoiceData.part || 0) : 0;
              const layanan = invoiceData ? Number(invoiceData.L || invoiceData.layanan || 0) : 0;
              const total = invoiceData ? Number(invoiceData.T || invoiceData.total || 0) : 0;
              const desc = invoiceData ? (invoiceData.D || invoiceData.desc || '-') : '-';

              const activeStatus = ord.status || ord.order_status || 'Menunggu Konfirmasi';
              const isSelesai = ['selesai', 'selesai ditangani', 'lunas'].includes(activeStatus.toLowerCase());

              const ordDate = ord.created_at ? new Date(ord.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

              return (
                <div key={ord.id} className="bg-white rounded-[24px] border border-slate-200/80 shadow-xs overflow-hidden transition-all space-y-3 p-4">
                  
                  {/* BARIS HEADER VERTIKAL (NO ORDER & STATUS) */}
                  <div className="flex justify-between items-start border-b border-dashed border-slate-200 pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md uppercase">
                          #{ord.order_code || (ord.id ? String(ord.id).slice(0, 8) : 'ORD')}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${isSelesai ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {activeStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[10px] font-medium text-slate-400">{ordDate}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Total Transaksi</span>
                      <span className="text-[16px] font-black text-indigo-600">Rp {total.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* INFO PELANGGAN & UNIT */}
                  <div className="text-xs space-y-1">
                    <p className="font-extrabold text-slate-800 text-[13px]">{ord.customer_name || 'Pelanggan'}</p>
                    <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> {ord.customer_phone || ord.user_phone || '-'}
                      {ord.unit_name && <span className="text-slate-400">&bull; {ord.unit_name} ({ord.action_type || 'Servis'})</span>}
                    </p>
                  </div>

                  {/* BREAKDOWN RINCIAN BIAYA (TABEL VERTIKAL) */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-[11px]">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Rincian Komponen Biaya:</span>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Biaya Jasa Servis:</span>
                      <span className="font-bold text-slate-800">Rp {jasa.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Biaya Spare Part:</span>
                      <span className="font-bold text-amber-700">Rp {part.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Biaya Layanan / Transport:</span>
                      <span className="font-bold text-sky-700">Rp {layanan.toLocaleString('id-ID')}</span>
                    </div>
                    {desc && desc !== '-' && (
                      <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-200/60 mt-1">
                        Ket: {desc}
                      </p>
                    )}
                  </div>

                  {/* TOMBOL AKSI TERKAIT LAPORAN */}
                  <div className="flex gap-2 pt-1">
                    {invoiceData && (
                      <button
                        onClick={() => setShowInvoiceModal({ ord, invoiceData })}
                        className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2 px-3 rounded-xl text-[11px] border border-indigo-100 flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                      >
                        <Printer className="w-3.5 h-3.5" /> Cetak Tagihan
                      </button>
                    )}

                    {paymentProofData && (
                      <button
                        onClick={() => setViewReceiptModal(paymentProofData)}
                        className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-2 px-3 rounded-xl text-[11px] border border-emerald-100 flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Bukti Bayar
                      </button>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    );
  };

  const renderDashboard = () => {
    const pesananBaruCount = adminOrders.filter(o => ['menunggu_konfirmasi', 'menunggu konfirmasi', 'diterima', 'baru'].includes((o.status || o.order_status || '').toLowerCase())).length;
    const prosesCount = adminOrders.filter(o => ['ditangani', 'dalam_pengerjaan', 'dalam pengerjaan', 'proses', 'pengerjaan', 'dijadwalkan', 'jadwal'].includes((o.status || o.order_status || '').toLowerCase())).length;
    const selesaiCount = adminOrders.filter(o => ['selesai', 'selesai ditangani', 'lunas', 'menunggu pembayaran', 'menunggu_pembayaran'].includes((o.status || o.order_status || '').toLowerCase())).length;
    
    // Hitung Estimasi Total Pendapatan dari Invoice Selesai / Menunggu Pembayaran
    let totalRevenue = 0;
    adminOrders.forEach(ord => {
      const raw = ord.note || ord.complaint || '';
      const invMatch = raw.match(/\[INVOICE:\s*([^\]]+)\]/);
      if (invMatch && invMatch[1]) {
        const parts = invMatch[1].split('|');
        parts.forEach((p: string) => {
          if (p.startsWith('T=')) {
            const val = Number(p.replace('T=', '')) || 0;
            totalRevenue += val;
          }
        });
      }
    });

    const lowStockItems = spareParts.filter(p => (p.stock || 0) <= 5);
    const recentOrders = adminOrders.slice(0, 3);

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 space-y-4">
        
        {/* HERO WELCOME BANNER */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white p-5 rounded-[28px] shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/20">
                Dashboard Operasional
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <h2 className="text-[20px] font-black tracking-tight leading-snug">Selamat Datang, Admin OMEANFIX!</h2>
            <p className="text-[12px] text-slate-300 font-medium mt-1">
              Ringkasan aktivitas bisnis & performa operasional Anda hari ini.
            </p>
          </div>
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* 4 KPI METRIC CARDS */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* CARD 1: PESANAN BARU */}
          <div 
            onClick={() => setActiveModule('pesanan')}
            className="bg-white p-4 rounded-[22px] border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.03)] cursor-pointer hover:border-blue-300 transition-all active:scale-95 group"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              {pesananBaruCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded-full animate-bounce">
                  {pesananBaruCount} Baru
                </span>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Perlu Konfirmasi</p>
            <h3 className="text-[22px] font-black text-slate-900 mt-0.5">{pesananBaruCount} <span className="text-[12px] text-slate-400 font-bold">Pesanan</span></h3>
            <p className="text-[10px] text-blue-600 font-bold mt-1 group-hover:underline flex items-center gap-1">
              Tangani Sekarang &rarr;
            </p>
          </div>

          {/* CARD 2: PROSES BERJALAN */}
          <div 
            onClick={() => setActiveModule('pesanan')}
            className="bg-white p-4 rounded-[22px] border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.03)] cursor-pointer hover:border-amber-300 transition-all active:scale-95 group"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded-full">
                Proses
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dalam Pengerjaan</p>
            <h3 className="text-[22px] font-black text-slate-900 mt-0.5">{prosesCount} <span className="text-[12px] text-slate-400 font-bold">Pesanan</span></h3>
            <p className="text-[10px] text-amber-600 font-bold mt-1 group-hover:underline flex items-center gap-1">
              Lihat Detail &rarr;
            </p>
          </div>

          {/* CARD 3: OMZET TAGIHAN */}
          <div 
            onClick={() => setActiveModule('pesanan')}
            className="bg-white p-4 rounded-[22px] border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.03)] cursor-pointer hover:border-emerald-300 transition-all active:scale-95 group"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full">
                {selesaiCount} Selesai
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimasi Tagihan</p>
            <h3 className="text-[18px] font-black text-emerald-600 mt-0.5 truncate">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1">
              Dari Invoice Diterbitkan
            </p>
          </div>

          {/* CARD 4: PERINGATAN STOK */}
          <div 
            onClick={() => setActiveModule('stok')}
            className={`p-4 rounded-[22px] border shadow-[0_2px_15px_rgba(0,0,0,0.03)] cursor-pointer transition-all active:scale-95 group ${
              lowStockItems.length > 0 ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300' : 'bg-white border-slate-100 hover:border-emerald-300'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${lowStockItems.length > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <Package className="w-5 h-5" />
              </div>
              {lowStockItems.length > 0 ? (
                <span className="px-2 py-0.5 bg-rose-600 text-white text-[9px] font-black rounded-full animate-pulse">
                  Restok!
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full">
                  Aman
                </span>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stok Suku Cadang</p>
            <h3 className="text-[22px] font-black text-slate-900 mt-0.5">
              {spareParts.length} <span className="text-[12px] text-slate-400 font-bold">Item</span>
            </h3>
            <p className={`text-[10px] font-bold mt-1 ${lowStockItems.length > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {lowStockItems.length > 0 ? `${lowStockItems.length} barang < 5 pcs` : 'Semua stok mencukupi'}
            </p>
          </div>

        </div>

        {/* AKSES CEPAT (QUICK ACTION SHORTCUTS) */}
        <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Navigasi Pintas Operasional</h3>
          <div className="grid grid-cols-4 gap-2">
            <button 
              onClick={() => setActiveModule('pesanan')}
              className="flex flex-col items-center p-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-100 active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-1.5 shadow-2xs">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 text-center leading-tight">Pesanan</span>
            </button>

            <button 
              onClick={() => setActiveModule('stok')}
              className="flex flex-col items-center p-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 transition-colors border border-slate-100 active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1.5 shadow-2xs">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 text-center leading-tight">Kelola Stok</span>
            </button>

            <button 
              onClick={() => setActiveModule('voucher')}
              className="flex flex-col items-center p-2.5 rounded-2xl bg-slate-50 hover:bg-teal-50 hover:text-teal-600 transition-colors border border-slate-100 active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center mb-1.5 shadow-2xs">
                <Ticket className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 text-center leading-tight">Voucher</span>
            </button>

            <button 
              onClick={() => setActiveModule('pelanggan')}
              className="flex flex-col items-center p-2.5 rounded-2xl bg-slate-50 hover:bg-sky-50 hover:text-sky-600 transition-colors border border-slate-100 active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-1.5 shadow-2xs">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 text-center leading-tight">Pelanggan</span>
            </button>
          </div>
        </div>

        {/* FEED PESANAN TERBARU */}
        <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[12px] font-extrabold text-slate-800 tracking-tight">Pesanan Masuk Terbaru</h3>
            <button 
              onClick={() => setActiveModule('pesanan')}
              className="text-[11px] font-bold text-blue-600 hover:underline"
            >
              Lihat Semua ({adminOrders.length})
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-[12px] text-slate-400 font-medium text-center py-6">Belum ada pesanan masuk.</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map(ord => (
                <div 
                  key={ord.id}
                  onClick={() => setActiveModule('pesanan')}
                  className="p-3 rounded-[18px] border border-slate-100 bg-slate-50/60 hover:bg-slate-100/80 transition-colors flex justify-between items-center cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-extrabold bg-white border border-slate-200 px-1.5 py-0.2 rounded text-slate-600">
                        #{ord.order_code || (ord.id ? String(ord.id).slice(0, 8) : 'ORD')}
                      </span>
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.2 rounded-full">
                        {ord.status || 'Menunggu Konfirmasi'}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-[13px]">{ord.customer_name || 'Pelanggan'}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">{ord.unit_name || 'Unit Servis'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    );
  };

  const renderPesananMasuk = () => {
    const pesananBaruCount = adminOrders.filter(o => ['menunggu_konfirmasi', 'menunggu konfirmasi', 'diterima', 'baru'].includes((o.status || o.order_status || '').toLowerCase())).length;
    const prosesCount = adminOrders.filter(o => ['ditangani', 'dalam_pengerjaan', 'dalam pengerjaan', 'proses', 'pengerjaan'].includes((o.status || o.order_status || '').toLowerCase())).length;
    const jadwalCount = adminOrders.filter(o => ['dijadwalkan', 'jadwal'].includes((o.status || o.order_status || '').toLowerCase())).length;
    const selesaiCount = adminOrders.filter(o => ['selesai', 'selesai ditangani', 'lunas', 'menunggu pembayaran', 'menunggu_pembayaran'].includes((o.status || o.order_status || '').toLowerCase())).length;
    const batalCount = adminOrders.filter(o => ['dibatalkan', 'batal'].includes((o.status || o.order_status || '').toLowerCase())).length;

    const filtered = adminOrders.filter(ord => {
      const st = (ord.status || ord.order_status || '').toLowerCase();
      
      let tabMatch = false;
      if (orderTab === 'baru') {
        tabMatch = ['menunggu_konfirmasi', 'menunggu konfirmasi', 'diterima', 'baru'].includes(st);
      } else if (orderTab === 'proses') {
        tabMatch = ['ditangani', 'dalam_pengerjaan', 'dalam pengerjaan', 'proses', 'pengerjaan'].includes(st);
      } else if (orderTab === 'jadwal') {
        tabMatch = ['dijadwalkan', 'jadwal'].includes(st);
      } else if (orderTab === 'selesai') {
        tabMatch = ['selesai', 'selesai ditangani', 'lunas', 'menunggu pembayaran', 'menunggu_pembayaran'].includes(st);
      } else if (orderTab === 'batal') {
        tabMatch = ['dibatalkan', 'batal'].includes(st);
      }

      if (!tabMatch) return false;

      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const code = (ord.order_code || '').toLowerCase();
        const name = (ord.customer_name || '').toLowerCase();
        const phone = (ord.customer_phone || ord.user_phone || '').toLowerCase();
        const unit = (ord.unit_name || '').toLowerCase();
        return code.includes(q) || name.includes(q) || phone.includes(q) || unit.includes(q);
      }

      return true;
    });

    const totalPages = Math.ceil(filtered.length / orderPerPage) || 1;
    const currentOrders = filtered.slice(orderPage * orderPerPage, (orderPage + 1) * orderPerPage);

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 space-y-4">
        {/* SEGMENTED CONTROL TAB PESANAN */}
        <div className="flex p-1 bg-slate-200/60 backdrop-blur-sm rounded-xl overflow-x-auto scrollbar-hide gap-1">
          <button onClick={() => setOrderTab('baru')} className={`flex-1 py-2 px-2 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap outline-none flex items-center justify-center gap-1 ${orderTab === 'baru' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <span>Baru</span>
            {pesananBaruCount > 0 && <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[9px] rounded-full font-extrabold">{pesananBaruCount}</span>}
          </button>
          <button onClick={() => setOrderTab('proses')} className={`flex-1 py-2 px-2 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap outline-none flex items-center justify-center gap-1 ${orderTab === 'proses' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <span>Proses</span>
            {prosesCount > 0 && <span className="px-1.5 py-0.2 bg-amber-100 text-amber-700 text-[9px] rounded-full font-extrabold">{prosesCount}</span>}
          </button>
          <button onClick={() => setOrderTab('jadwal')} className={`flex-1 py-2 px-2 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap outline-none flex items-center justify-center gap-1 ${orderTab === 'jadwal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <span>Jadwal</span>
            {jadwalCount > 0 && <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 text-[9px] rounded-full font-extrabold">{jadwalCount}</span>}
          </button>
          <button onClick={() => setOrderTab('selesai')} className={`flex-1 py-2 px-2 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap outline-none flex items-center justify-center gap-1 ${orderTab === 'selesai' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <span>Selesai</span>
            {selesaiCount > 0 && <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 text-[9px] rounded-full font-extrabold">{selesaiCount}</span>}
          </button>
          <button onClick={() => setOrderTab('batal')} className={`flex-1 py-2 px-2 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap outline-none flex items-center justify-center gap-1 ${orderTab === 'batal' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <span>Batal</span>
            {batalCount > 0 && <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[9px] rounded-full font-extrabold">{batalCount}</span>}
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari no. pesanan, pelanggan, unit, HP..."
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-10 pr-4 py-3 rounded-[16px] text-[12px] font-medium outline-none focus:border-blue-500 shadow-sm transition-colors"
          />
        </div>

        {/* DAFTAR PESANAN */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[24px] border border-slate-100 p-6">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 font-medium text-xs">Tidak ada pesanan di kategori ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentOrders.map(ord => {
              let rawNote = ord.note || ord.complaint || '';
              
              let paymentProofData = null;
              const proofMatch = rawNote.match(/\[PAYMENT_PROOF:\s*([^\]]+)\]/);
              if (proofMatch && proofMatch[1]) paymentProofData = proofMatch[1];

              let invoiceData = null;
              const invMatch = rawNote.match(/\[INVOICE:\s*([^\]]+)\]/);
              if (invMatch && invMatch[1]) {
                const parts = invMatch[1].split('|');
                let parsed: any = {};
                parts.forEach((p: string) => {
                  const [k, v] = p.split('=');
                  if (k && v) parsed[k.trim()] = v.trim();
                });
                invoiceData = parsed;
              }

              let estimasiData = null;
              const estMatch = rawNote.match(/\[ESTIMASI:\s*([^\]]+)\]/);
              if (estMatch && estMatch[1]) estimasiData = estMatch[1];

              let extractedSchedule = null;
              const schedMatch = rawNote.match(/\[JADWAL:\s*([^\]]+)\]/);
              if (schedMatch && schedMatch[1]) extractedSchedule = schedMatch[1];

              let photoAttachments: string[] = [];
              const photoMatches = rawNote.matchAll(/\[FOTO:\s*([^\]]+)\]/g);
              for (const m of photoMatches) {
                if (m[1]) photoAttachments.push(m[1]);
              }
              if (ord.attachment_image && !photoAttachments.includes(ord.attachment_image)) {
                photoAttachments.push(ord.attachment_image);
              }

              const hasFotoTag = rawNote.includes('[FOTO_TERLAMPIR]') || photoAttachments.length > 0;

              let sparePartRequests: string[] = [];
              const partMatches = rawNote.matchAll(/\[PELANGGAN MEMINTA TAMBAHAN PART:\s*([^\]]+)\]/g);
              for (const m of partMatches) {
                if (m[1]) sparePartRequests.push(m[1]);
              }

              let cleanNote = rawNote
                .replace(/\[PAYMENT_PROOF:[^\]]+\]/g, '')
                .replace(/\[INVOICE:[^\]]+\]/g, '')
                .replace(/\[ESTIMASI:[^\]]+\]/g, '')
                .replace(/\[JADWAL:[^\]]+\]/g, '')
                .replace(/\[FOTO:[^\]]+\]/g, '')
                .replace(/\[FOTO_TERLAMPIR\]/gi, '')
                .replace(/\[PELANGGAN MEMINTA TAMBAHAN PART:[^\]]+\]/g, '')
                .trim();
                
              if (!cleanNote) cleanNote = '-';

              const waLink = generateWaLink(ord, cleanNote, extractedSchedule);
              const activeStatus = ord.status || ord.order_status || 'Menunggu Konfirmasi';
              const activeStatusLower = activeStatus.toLowerCase();

              let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
              if (['menunggu_konfirmasi', 'menunggu konfirmasi', 'baru'].includes(activeStatusLower)) {
                badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
              } else if (['ditangani', 'dalam_pengerjaan', 'proses'].includes(activeStatusLower)) {
                badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
              } else if (['dijadwalkan', 'jadwal'].includes(activeStatusLower)) {
                badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
              } else if (['selesai', 'selesai ditangani', 'lunas'].includes(activeStatusLower)) {
                badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              } else if (['menunggu pembayaran', 'menunggu_pembayaran'].includes(activeStatusLower)) {
                badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
              } else if (['dibatalkan', 'batal'].includes(activeStatusLower)) {
                badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
              }

              const isExpanded = expandedOrderId === ord.id;
              const currentSelectedStatus = pendingStatusUpdates[ord.id] !== undefined ? pendingStatusUpdates[ord.id] : activeStatus;

              return (
                <div key={ord.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden transition-all">
                  {/* HEADER KARTU (AKORDION) */}
                  <div 
                    onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                    className="p-4 cursor-pointer hover:bg-slate-50/50 transition-colors flex justify-between items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                          #{ord.order_code || (ord.id ? String(ord.id).slice(0, 8) : 'ORD')}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${badgeClass}`}>
                          {activeStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                      
                      <h4 className="font-extrabold text-slate-900 text-[14px] truncate">{ord.customer_name || 'Pelanggan'}</h4>
                      <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" /> {ord.customer_phone || ord.user_phone || '-'}
                        {ord.unit_name && <span className="text-slate-400">&bull; {ord.unit_name}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* KONTEN EXPANDED */}
                  {isExpanded && (
                    <div className="px-4 pb-5 pt-2 border-t border-slate-100 bg-slate-50/30 space-y-4 animate-in fade-in duration-200">
                      
                      {/* DETAIL KELUHAN & PERMINTAAN */}
                      <div className="bg-white p-3.5 rounded-[18px] border border-slate-100 space-y-2 text-xs">
                        <p className="font-bold text-slate-700">Detail Pesanan & Keluhan:</p>
                        <p className="text-slate-600 italic pl-2 border-l-2 border-blue-400 font-medium">"{cleanNote}"</p>
                        
                        {extractedSchedule && (
                          <div className="flex items-center gap-1.5 text-indigo-700 font-bold bg-indigo-50 p-2 rounded-xl text-[11px]">
                            <Calendar className="w-3.5 h-3.5" /> Jadwal Reservasi: {extractedSchedule}
                          </div>
                        )}

                        {sparePartRequests.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Permintaan Spare Part:</span>
                            {sparePartRequests.map((partReq, idx) => (
                              <div key={idx} className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1">
                                <Package className="w-3 h-3" /> {partReq}
                              </div>
                            ))}
                          </div>
                        )}

                        {(photoAttachments.length > 0 || hasFotoTag) && (
                          <div className="pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                const targetImg = photoAttachments[0] || ord.attachment_image || 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=800&auto=format&fit=crop';
                                setViewPhotoModal(targetImg);
                              }}
                              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2.5 px-3 rounded-xl text-xs border border-blue-200/80 flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all outline-none"
                            >
                              <Camera className="w-4 h-4 text-blue-600" />
                              <span>Lihat Foto Kerusakan Pelanggan</span>
                              {photoAttachments.length > 0 && (
                                <span className="bg-blue-200/80 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-black">
                                  {photoAttachments.length}
                                </span>
                              )}
                            </button>

                            {photoAttachments.length > 0 && (
                              <div className="flex gap-2 overflow-x-auto mt-2 pt-1">
                                {photoAttachments.map((imgUrl, idx) => (
                                  <img
                                    key={idx}
                                    src={imgUrl}
                                    alt="Kerusakan"
                                    onClick={() => setViewPhotoModal(imgUrl)}
                                    className="w-12 h-12 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-80 active:scale-95 transition-all shadow-xs"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* TOMBOL KONFIRMASI WA */}
                      {waLink !== '#' && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform"
                        >
                          <MessageCircle className="w-4 h-4" /> Konfirmasi ke WhatsApp Pelanggan
                        </a>
                      )}

                      {/* UBAH STATUS PESANAN */}
                      <div className="bg-white p-3.5 rounded-[18px] border border-slate-100 space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Ubah Status Pesanan:</label>
                        <div className="flex gap-2">
                          <select
                            value={currentSelectedStatus}
                            onChange={(e) => setPendingStatusUpdates(prev => ({ ...prev, [ord.id]: e.target.value }))}
                            className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white"
                          >
                            <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                            <option value="Dijadwalkan">Dijadwalkan</option>
                            <option value="Ditangani">Dalam Pengerjaan / Ditangani</option>
                            <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
                            <option value="Selesai">Selesai</option>
                            <option value="Dibatalkan">Dibatalkan</option>
                          </select>
                          {pendingStatusUpdates[ord.id] && pendingStatusUpdates[ord.id] !== activeStatus && (
                            <button
                              onClick={() => handleConfirmStatus(ord.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm active:scale-95 transition-transform"
                            >
                              Simpan
                            </button>
                          )}
                        </div>
                      </div>

                      {/* FORM ESTIMASI BIAYA */}
                      <div className="bg-white p-3.5 rounded-[18px] border border-slate-100 space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Input Estimasi Biaya Awalan:</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Cth: Rp 150.000 - Rp 250.000"
                            value={estimasiInput[ord.id] || ''}
                            onChange={(e) => setEstimasiInput(prev => ({ ...prev, [ord.id]: e.target.value }))}
                            className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-medium outline-none focus:bg-white"
                          />
                          <button
                            onClick={() => handleSendEstimasi(ord.id, rawNote)}
                            disabled={!estimasiInput[ord.id]}
                            className={`font-bold px-3 py-2.5 rounded-xl text-xs shadow-sm active:scale-95 transition-transform ${
                              estimasiInput[ord.id] ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            Kirim
                          </button>
                        </div>
                        {estimasiData && (
                          <p className="text-[11px] font-bold text-amber-700 bg-amber-50 p-2 rounded-xl">Estimasi Terkirim: {estimasiData}</p>
                        )}
                      </div>

                      {/* FORM TAGIHAN / INVOICE */}
                      <div className="bg-white p-3.5 rounded-[18px] border border-slate-100 space-y-2.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Terbitkan Tagihan / Invoice:</label>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <span className="text-[9px] font-bold text-slate-500 block mb-0.5">Jasa (Rp)</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={invoiceInputs[ord.id]?.jasa || ''}
                              onChange={(e) => setInvoiceInputs(p => ({ ...p, [ord.id]: { ...(p[ord.id] || { jasa: '', part: '', layanan: '', desc: '' }), jasa: e.target.value } }))}
                              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-bold outline-none focus:bg-white"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-500 block mb-0.5">Spare Part (Rp)</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={invoiceInputs[ord.id]?.part || ''}
                              onChange={(e) => setInvoiceInputs(p => ({ ...p, [ord.id]: { ...(p[ord.id] || { jasa: '', part: '', layanan: '', desc: '' }), part: e.target.value } }))}
                              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-bold outline-none focus:bg-white"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-500 block mb-0.5">Layanan (Rp)</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={invoiceInputs[ord.id]?.layanan || ''}
                              onChange={(e) => setInvoiceInputs(p => ({ ...p, [ord.id]: { ...(p[ord.id] || { jasa: '', part: '', layanan: '', desc: '' }), layanan: e.target.value } }))}
                              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-bold outline-none focus:bg-white"
                            />
                          </div>
                        </div>
                        <input
                          type="text"
                          placeholder="Keterangan Rincian (Opsional)"
                          value={invoiceInputs[ord.id]?.desc || ''}
                          onChange={(e) => setInvoiceInputs(p => ({ ...p, [ord.id]: { ...(p[ord.id] || { jasa: '', part: '', layanan: '', desc: '' }), desc: e.target.value } }))}
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-medium outline-none focus:bg-white"
                        />
                        <button
                          onClick={() => handleSendInvoice(ord.id, rawNote)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                        >
                          <FileText className="w-4 h-4" /> Terbitkan & Kirim Invoice
                        </button>
                      </div>

                      {/* ACTIONS BAR (CETAK TAGIHAN / BUKTI BAYAR / BATALKAN) */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {invoiceData && (
                          <button
                            onClick={() => setShowInvoiceModal({ ord, invoiceData })}
                            className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2.5 px-3 rounded-xl text-xs border border-indigo-100 flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                          >
                            <Printer className="w-3.5 h-3.5" /> Cetak Tagihan
                          </button>
                        )}
                        
                        {paymentProofData && (
                          <button
                            onClick={() => setViewReceiptModal(paymentProofData)}
                            className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-2.5 px-3 rounded-xl text-xs border border-emerald-100 flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Bukti Bayar
                          </button>
                        )}
                      </div>

                      {/* TOMBOL KONFIRMASI PEMBATALAN */}
                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        {confirmingCancelId === ord.id ? (
                          <div className="flex items-center gap-2 animate-in fade-in">
                            <span className="text-[11px] font-bold text-rose-600">Yakin batalkan?</span>
                            <button
                              onClick={() => handleCancelOrder(ord.id)}
                              className="bg-rose-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg active:scale-95 shadow-sm"
                            >
                              Ya, Batalkan
                            </button>
                            <button
                              onClick={() => setConfirmingCancelId(null)}
                              className="bg-slate-200 text-slate-600 text-[11px] font-bold px-3 py-1.5 rounded-lg active:scale-95"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmingCancelId(ord.id)}
                            className="text-rose-500 hover:text-rose-700 text-[11px] font-bold flex items-center gap-1 hover:underline outline-none"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Batalkan Pesanan Ini
                          </button>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* PAGINASI */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center bg-white p-3 rounded-[20px] border border-slate-100 text-xs font-bold text-slate-600">
            <button
              onClick={() => setOrderPage(p => Math.max(0, p - 1))}
              disabled={orderPage === 0}
              className={`p-2 rounded-xl border flex items-center gap-1 ${orderPage === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'}`}
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span>Halaman {orderPage + 1} dari {totalPages}</span>
            <button
              onClick={() => setOrderPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={orderPage >= totalPages - 1}
              className={`p-2 rounded-xl border flex items-center gap-1 ${orderPage >= totalPages - 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'}`}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderPlaceholder = () => (
    <div className="flex flex-col items-center justify-center pt-24 text-center animate-in fade-in">
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-5 shadow-sm border border-slate-100 ${currentModuleData.bg}`}>
        <currentModuleData.icon className={`w-12 h-12 ${currentModuleData.color}`} />
      </div>
      <h3 className="text-[18px] font-bold text-slate-800 mb-2 tracking-tight">Modul {currentModuleData.label}</h3>
      <p className="text-[13px] font-medium text-slate-500 max-w-[250px]">Sedang dalam pengembangan tim IT.</p>
    </div>
  );

  const currentModuleData = ADMIN_MODULES.find(m => m.id === activeModule) || ADMIN_MODULES[0];

  return (
    <div className="max-w-md mx-auto bg-slate-50 h-[100dvh] w-full relative shadow-2xl overflow-hidden font-sans flex flex-col">
      <header className="flex-none z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] pt-7 pb-4 px-5 relative">
        <div className="flex justify-between items-center mb-1.5">
          <button onClick={onBackToCustomer} className="p-2.5 bg-slate-50 text-slate-600 rounded-full hover:bg-slate-100 border border-slate-100 shadow-sm outline-none"><ArrowLeft className="w-4 h-4" /></button>
          <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[9px] font-extrabold tracking-widest uppercase rounded-full border border-indigo-100/50">Portal Admin</span>
          <div className="flex gap-2">
            <button onClick={() => fetchData()} className={`p-2.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100/50 shadow-sm outline-none ${isRefreshing ? 'animate-spin' : 'hover:bg-blue-100'}`}><RefreshCw className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between px-1">
          <h1 className="text-[22px] font-black text-slate-900 tracking-tight leading-none">{currentModuleData.label}</h1>
          <button onClick={() => setIsMenuOpen(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-slate-800 active:scale-95 shadow-md shadow-slate-900/20 outline-none">
            <Menu className="w-4 h-4" /><span className="text-[12px] font-bold">Menu</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scrollbar-hide p-4 relative z-0">
        {activeModule === 'dashboard' ? renderDashboard() :
         activeModule === 'pesanan' ? renderPesananMasuk() : 
         activeModule === 'pelanggan' ? renderManajemenPelanggan() : 
         activeModule === 'voucher' ? renderManajemenVoucher() : 
         activeModule === 'katalog_khusus' ? renderKatalogKhusus() : 
         activeModule === 'katalog' ? renderKatalogJasa() : 
         activeModule === 'banner' ? renderManajemenBanner() : 
         activeModule === 'stok' ? renderManajemenStok() : 
         activeModule === 'laporan' ? renderLaporanKeuangan() : 
         renderPlaceholder()}
      </main>

      {/* RENDER MODALS */}
      {renderInvoiceModal()}

      {/* MODAL FULLSCREEN UNTUK LIHAT FOTO KERUSAKAN */}
      {viewPhotoModal && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 transition-opacity" onClick={() => setViewPhotoModal(null)}>
            <div className="relative w-full max-w-sm animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
               <button onClick={() => setViewPhotoModal(null)} className="absolute -top-12 right-0 w-10 h-10 bg-slate-800 text-white rounded-full flex items-center justify-center border border-slate-600 hover:bg-rose-500 outline-none"><X className="w-5 h-5" /></button>
               <img src={viewPhotoModal} alt="Foto Lampiran" className="w-full rounded-2xl object-contain bg-slate-900 border border-slate-800 shadow-2xl" />
               <p className="text-white text-center text-[11px] font-medium mt-4 text-slate-400">Lampiran foto kerusakan dari pelanggan</p>
            </div>
         </div>
      )}

      {viewReceiptModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 transition-opacity" onClick={() => setViewReceiptModal(null)}>
              <div className="bg-white p-2 rounded-[24px] max-w-sm w-full relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setViewReceiptModal(null)} className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg outline-none"><X className="w-4 h-4" /></button>
                  <img src={viewReceiptModal} alt="Bukti Pembayaran" className="w-full rounded-[18px] object-contain" />
              </div>
          </div>
      )}
      
      {/* MENU BERSEKAT VISUAL (3 PILAR) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMenuOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-t-[32px] overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-full duration-300 ease-out shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-full flex justify-center pt-4 pb-2 bg-white relative">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
              <button onClick={() => setIsMenuOpen(false)} className="absolute right-5 top-4 p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 outline-none"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="px-6 pb-6 pt-2 overflow-y-auto scrollbar-hide space-y-6">
              <div>
                 <h2 className="text-[20px] font-black text-slate-800 tracking-tight">Navigasi Admin</h2>
                 <p className="text-[11px] text-slate-500 font-medium">Pilih modul untuk mengelola OMEANFIX</p>
              </div>

              {MENU_SECTIONS.map((section, idx) => (
                <div key={idx} className="space-y-2.5">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 mb-1">{section.title}</h3>
                  <div className="space-y-2">
                     {section.items.map(itemId => {
                       const modul = ADMIN_MODULES.find(m => m.id === itemId);
                       if (!modul) return null;
                       return (
                         <button 
                            key={modul.id} 
                            onClick={() => { setActiveModule(modul.id); setIsMenuOpen(false); }} 
                            className={`w-full flex items-center justify-between p-3.5 rounded-[20px] transition-all duration-200 outline-none border ${activeModule === modul.id ? 'bg-white border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.04)] ring-1 ring-slate-100' : 'bg-transparent border-transparent hover:bg-slate-50'}`}
                         >
                           <div className="flex items-center gap-3.5">
                             <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center shadow-sm ${activeModule === modul.id ? modul.bg : 'bg-slate-100'}`}>
                                <modul.icon className={`w-5 h-5 ${activeModule === modul.id ? modul.color : 'text-slate-400'}`} />
                             </div>
                             <span className={`text-[14px] font-bold ${activeModule === modul.id ? 'text-slate-900' : 'text-slate-600'}`}>{modul.label}</span>
                           </div>
                           {activeModule === modul.id && <div className="w-2 h-2 rounded-full bg-blue-600 mr-2 shadow-sm"></div>}
                         </button>
                       )
                     })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}