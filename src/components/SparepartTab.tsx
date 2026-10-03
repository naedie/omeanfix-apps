import React, { useState, useEffect } from 'react';
import { Search, PackageX, ShoppingCart, Plus, ChevronDown, ChevronRight, Loader2, X, FileText, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabase';
import { triggerRipple } from '../utils/ripple';
import VoiceInputButton from './VoiceInputButton';

// TAMBAHAN AMAN: Menambahkan props untuk menerima data kiriman dari Beranda
export default function SparepartTab({ preSelectedPart, onClearPreSelectedPart }: { preSelectedPart?: any, onClearPreSelectedPart?: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  
  const [spareParts, setSpareParts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [serviceUnits, setServiceUnits] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  const [visibleCount, setVisibleCount] = useState(6);

  const [selectedPart, setSelectedPart] = useState<any | null>(null);
  const [showOrderSelector, setShowOrderSelector] = useState(false);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [isFetchingOrders, setIsFetchingOrders] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);

  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);

  // EFEK JEMBATAN DATA: Langsung membuka modal jika ada data kiriman dari Beranda
  useEffect(() => {
    if (preSelectedPart) {
      setSelectedPart(preSelectedPart);
      if (onClearPreSelectedPart) {
        onClearPreSelectedPart(); // Bersihkan memori agar tidak terbuka terus
      }
    }
  }, [preSelectedPart, onClearPreSelectedPart]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [resCat, resPart, resUnit] = await Promise.all([
          supabase.from('service_categories').select('*').order('id', { ascending: true }),
          supabase.from('spare_parts').select('*').order('id', { ascending: false }),
          supabase.from('services').select('*') 
        ]);

        if (resCat.data) setCategories([{ id: 'Semua', name: 'Semua' }, ...resCat.data]);
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
        if (resUnit.data) setServiceUnits(resUnit.data);

      } catch (error) {
        console.error("Error fetching spare parts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setVisibleCount(6);
  }, [searchQuery, selectedCategory]);

  const filteredParts = spareParts.filter((part) => {
    const matchSearch = part.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === 'Semua' || String(part.category_id) === String(selectedCategory);
    return matchSearch && matchCategory;
  });

  const displayedParts = filteredParts.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  const handleOpenPartDetail = (part: any) => {
    setSelectedPart(part);
  };

  const handleInitiateOrder = async () => {
    setIsFetchingOrders(true);
    setShowOrderSelector(true);
    setConfirmingOrderId(null);
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        const active = data.filter(o => {
            let st = (o.status || o.order_status || '').toLowerCase();
            if (st === 'selesai ditangani') st = 'ditangani';
            return ['menunggu_konfirmasi', 'menunggu konfirmasi', 'diterima', 'berjalan', 'ditangani', 'menunggu pembayaran', 'dijadwalkan', 'dalam_pengerjaan'].includes(st);
        });
        setActiveOrders(active);
      }
    } catch (err) {
      console.error("Gagal memuat pesanan aktif", err);
    } finally {
      setIsFetchingOrders(false);
    }
  };

  const handleConfirmMerge = async (order: any) => {
    if (!selectedPart) return;
    
    setIsOrdering(true);
    try {
      const currentNote = order.note || order.complaint_description || '';
      const partRequestText = `[PELANGGAN MEMINTA TAMBAHAN PART: ${selectedPart.name} - Rp${selectedPart.price?.toLocaleString('id-ID')}]`;
      
      const newNote = currentNote ? `${currentNote}\n${partRequestText}` : partRequestText;

      const { error } = await supabase.from('orders').update({
          note: newNote
      }).eq('id', order.id);

      if (error) throw error;
      
      alert('🎉 Permintaan Suku Cadang Berhasil Ditambahkan!\n\nAdmin kami akan melihat permintaan ini dan memasukkannya ke dalam total tagihan akhir pesanan Anda.');
      
      setShowOrderSelector(false);
      setSelectedPart(null);
      setConfirmingOrderId(null);
    } catch (err: any) {
      alert('Gagal menyatukan pesanan: ' + err.message);
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 animate-in fade-in transition-colors">
      
      <div className="bg-white dark:bg-slate-900 px-5 pt-4 pb-4 border-b border-slate-100 dark:border-slate-800 shadow-sm z-10 sticky top-0 transition-colors">
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari sparepart... (mis: Kapasitor AC)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-11 pr-20 py-3.5 rounded-2xl text-[13px] font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <VoiceInputButton
              compact
              appendMode={false}
              onTranscript={(text) => setSearchQuery(text)}
            />
          </div>
        </div>

        <div className="flex overflow-x-auto scrollbar-hide gap-2 -mx-5 px-5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-none px-5 py-2.5 rounded-full text-[12px] font-bold transition-all active:scale-95 ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 border border-blue-600'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : filteredParts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center mt-20 px-6">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <PackageX className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-[18px] font-bold text-slate-800 dark:text-slate-100 mb-2 tracking-tight">Tidak Ditemukan</h3>
            <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
              Suku cadang yang Anda cari kosong atau belum ditambahkan oleh Admin.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="grid grid-cols-2 gap-4">
              {displayedParts.map((part) => {
                const parentUnit = serviceUnits.find(u => String(u.id) === String(part.unit_id));
                const unitName = parentUnit ? parentUnit.name : 'Umum';

                return (
                  <div key={part.id} onClick={() => handleOpenPartDetail(part)} className="bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-[0_2px_15px_rgba(0,0,0,0.03)] flex flex-col group hover:shadow-md transition-all active:scale-95 cursor-pointer">
                    <div className="w-full aspect-square bg-slate-50 dark:bg-slate-800/60 relative p-4 flex items-center justify-center pointer-events-none">
                      {part.stock < 5 && (
                        <span className="absolute top-3 left-3 px-2 py-1 bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 text-[8px] font-bold uppercase tracking-wider rounded-md z-10 border border-rose-200 dark:border-rose-900/50">Sisa {part.stock}</span>
                      )}
                      <img 
                        src={part.image_url || 'https://cdn-icons-png.flaticon.com/128/683/683100.png'} 
                        alt={part.name} 
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 dark:brightness-95"
                      />
                    </div>
                    
                    <div className="p-4 flex flex-col flex-1 pointer-events-none">
                      <div className="mb-1.5 flex items-center">
                        <span className="inline-block px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 rounded-md text-[8.5px] font-extrabold tracking-widest uppercase truncate max-w-full">
                          {unitName}
                        </span>
                      </div>

                      <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-tight mb-1 line-clamp-2">{part.name}</h4>
                      
                      <div className="mt-auto pt-3 flex items-end justify-between">
                        <div>
                          <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 block mb-0.5">Harga</span>
                          <span className="text-[14px] font-black text-blue-600 dark:text-blue-400 leading-none">Rp{part.price?.toLocaleString('id-ID')}</span>
                        </div>
                        <button className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 shadow-md pointer-events-auto">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {visibleCount < filteredParts.length ? (
              <button 
                onClick={handleLoadMore}
                className="mt-6 w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-[20px] text-[13px] font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-slate-50 outline-none"
              >
                Lihat Lebih Banyak <ChevronDown className="w-4 h-4" />
              </button>
            ) : (
              <div className="mt-8 text-center flex items-center justify-center gap-2">
                 <div className="h-px bg-slate-200 flex-1"></div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Semua Ditampilkan</span>
                 <div className="h-px bg-slate-200 flex-1"></div>
              </div>
            )}

          </div>
        )}
      </div>

      <div className="h-32 w-full shrink-0 pointer-events-none"></div>

      {/* MODAL 1: DETAIL PRODUK */}
      {selectedPart && !showOrderSelector && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedPart(null)}>
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 pb-28 animate-in slide-in-from-bottom-full duration-300 shadow-2xl relative flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
             <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 shrink-0"></div>
             
             <div className="overflow-y-auto scrollbar-hide flex-1 pb-4">
                <div className="w-full aspect-square bg-slate-50 rounded-[24px] border border-slate-100 flex items-center justify-center p-6 mb-5 relative">
                   <img src={selectedPart.image_url || 'https://cdn-icons-png.flaticon.com/128/683/683100.png'} alt={selectedPart.name} className="w-full h-full object-contain mix-blend-multiply" />
                   <button onClick={() => setSelectedPart(null)} className="absolute top-4 right-4 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 shadow-sm active:scale-90"><X className="w-4 h-4" /></button>
                </div>
                
                <h3 className="text-[20px] font-black text-slate-800 leading-snug tracking-tight mb-2">{selectedPart.name}</h3>
                <div className="flex items-center gap-2 mb-4">
                   <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-extrabold tracking-widest uppercase">
                     {serviceUnits.find(u => String(u.id) === String(selectedPart.unit_id))?.name || 'Umum'}
                   </span>
                   <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[9px] font-extrabold tracking-widest uppercase flex items-center gap-1">
                     <PackageX className="w-3 h-3" /> Stok: {selectedPart.stock}
                   </span>
                </div>
                
                <div className="mb-6">
                   <h4 className="text-[12px] font-bold text-slate-800 mb-1">Harga Suku Cadang:</h4>
                   <p className="text-[24px] font-black text-blue-600 tracking-tight">Rp {selectedPart.price?.toLocaleString('id-ID')}</p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4">
                   <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Deskripsi / Catatan</h4>
                   <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                     {selectedPart.description || 'Suku cadang original/berkualitas. Harga belum termasuk biaya pemasangan oleh teknisi (apabila ada tindakan berat di lapangan).'}
                   </p>
                </div>

                <button 
                  onClick={(e) => { triggerRipple(e); handleInitiateOrder(); }}
                  className="ripple-btn w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-[20px] text-[15px] font-bold shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 outline-none mt-2"
                >
                  Tambahkan ke Pesanan <ShoppingCart className="w-4 h-4" />
                </button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PEMILIHAN ORDER AKTIF */}
      {showOrderSelector && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowOrderSelector(false)}>
           <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 pb-28 h-[75vh] flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl relative" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-6 shrink-0">
                  <div>
                    <h3 className="text-[18px] font-bold text-slate-800 tracking-tight leading-none">Pilih Pesanan Anda</h3>
                    <p className="text-[11px] font-medium text-slate-500 mt-1.5">Satukan suku cadang dengan pesanan aktif.</p>
                  </div>
                  <button onClick={() => setShowOrderSelector(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 active:scale-90"><X className="w-4 h-4" /></button>
               </div>

               <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3 pb-4">
                  {isFetchingOrders ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
                  ) : activeOrders.length === 0 ? (
                    <div className="bg-slate-50 p-6 rounded-[20px] border border-slate-100 text-center flex flex-col items-center">
                       <FileText className="w-10 h-10 text-slate-300 mb-3" />
                       <h4 className="text-[14px] font-bold text-slate-800 mb-1">Tidak Ada Pesanan Aktif</h4>
                       <p className="text-[11px] font-medium text-slate-500 leading-relaxed">Anda tidak memiliki pesanan jasa yang sedang berjalan. Silakan buat pesanan teknisi terlebih dahulu di halaman Beranda.</p>
                    </div>
                  ) : (
                    activeOrders.map(order => {
                       const activeStatus = (order.status || order.order_status || '').replace(/_/g, ' ');
                       const orderDate = new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                       const isSelectedForConfirm = confirmingOrderId === order.id;
                       
                       return (
                         <div 
                           key={order.id} 
                           className={`w-full bg-white border transition-all rounded-[20px] p-4 text-left ${isSelectedForConfirm ? 'border-blue-600 ring-2 ring-blue-500/10 shadow-md bg-blue-50/20' : 'border-slate-200 hover:border-slate-300'}`}
                         >
                            <div className="flex justify-between items-center mb-2">
                               <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-extrabold uppercase rounded-md">#{order.order_code || 'CRB-0000'}</span>
                               <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md uppercase">{activeStatus}</span>
                            </div>
                            <h4 className="text-[14px] font-bold text-slate-800 mb-0.5 truncate">{order.custom_service_title || order.unit_name}</h4>
                            <p className="text-[10px] text-slate-500 font-medium">Tanggal Masuk: {orderDate}</p>
                            
                            {!isSelectedForConfirm ? (
                               <button 
                                 type="button"
                                 onClick={() => setConfirmingOrderId(order.id)}
                                 className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between w-full text-left outline-none group"
                               >
                                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-600 transition-colors">Ketuk untuk satukan ke pesanan ini</span>
                                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600" />
                               </button>
                            ) : (
                               <div className="mt-3 pt-3 border-t border-blue-100 space-y-2 animate-in fade-in">
                                  <p className="text-[11px] font-bold text-blue-700">Yakin ingin menyatukan part ini ke pesanan ini?</p>
                                  <div className="flex gap-2">
                                     <button 
                                       type="button"
                                       disabled={isOrdering}
                                       onClick={() => setConfirmingOrderId(null)}
                                       className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-bold active:scale-95"
                                     >
                                        Batal
                                     </button>
                                     <button 
                                       type="button"
                                       disabled={isOrdering}
                                       onClick={() => handleConfirmMerge(order)}
                                       className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold shadow-md shadow-blue-600/30 flex items-center justify-center gap-1 active:scale-95"
                                     >
                                        {isOrdering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle2 className="w-3.5 h-3.5" /> Ya, Satukan</>}
                                     </button>
                                  </div>
                               </div>
                            )}
                         </div>
                       )
                    })
                  )}
               </div>
           </div>
        </div>
      )}

    </div>
  );
}