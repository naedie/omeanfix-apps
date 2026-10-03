import { ServiceCategory, Service } from '../types';

export const CATEGORIES: ServiceCategory[] = [
  {
    id: 'otomotif',
    name: 'Otomotif',
    slug: 'otomotif',
    icon: 'Car',
    colorClass: 'text-rose-500',
    bgGradient: 'from-rose-500 to-red-600',
    display_order: 1,
    description: 'Perbaikan Motor, Mobil, Truck, dan Bus'
  },
  {
    id: 'perkakas',
    name: 'Perkakas',
    slug: 'perkakas',
    icon: 'Wrench',
    colorClass: 'text-amber-600',
    bgGradient: 'from-amber-500 to-orange-600',
    display_order: 2,
    description: 'Perbaikan Genset, Welding, Jack Hammer, Tamper'
  },
  {
    id: 'alat_berat',
    name: 'Alat Berat',
    slug: 'alat_berat',
    icon: 'Truck',
    colorClass: 'text-yellow-600',
    bgGradient: 'from-yellow-500 to-amber-600',
    display_order: 3,
    description: 'Perbaikan Excavator dan Scaffolding'
  },
  {
    id: 'pendingin',
    name: 'Pendingin',
    slug: 'pendingin',
    icon: 'Snowflake',
    colorClass: 'text-blue-500',
    bgGradient: 'from-blue-500 to-cyan-600',
    display_order: 4,
    description: 'Perbaikan Kulkas dan AC'
  },
  {
    id: 'elektronik',
    name: 'Elektronik',
    slug: 'elektronik',
    icon: 'Tv',
    colorClass: 'text-indigo-500',
    bgGradient: 'from-indigo-500 to-purple-600',
    display_order: 5,
    description: 'Perbaikan Televisi, Monitor, Kipas, Speaker'
  },
  {
    id: 'gadget',
    name: 'Gadget',
    slug: 'gadget',
    icon: 'Smartphone',
    colorClass: 'text-slate-700',
    bgGradient: 'from-slate-700 to-slate-900',
    display_order: 6,
    description: 'Perbaikan Ponsel, Laptop, PC'
  },
  {
    id: 'kelistrikan',
    name: 'Kelistrikan',
    slug: 'kelistrikan',
    icon: 'Zap',
    colorClass: 'text-amber-500',
    bgGradient: 'from-amber-400 to-yellow-500',
    display_order: 7,
    description: 'Instalasi & Maintenance Kelistrikan'
  }
];

export const SERVICES: Service[] = [
  // 1. Otomotif
  { id: 'oto-1', category_id: 'otomotif', name: 'Motor', description: 'Servis & perbaikan motor segala merk', base_price: 65000, price_unit: 'unit', estimated_duration_minutes: 60 },
  { id: 'oto-2', category_id: 'otomotif', name: 'Mobil', description: 'Servis ringan & perbaikan mobil', base_price: 150000, price_unit: 'unit', estimated_duration_minutes: 120 },
  { id: 'oto-3', category_id: 'otomotif', name: 'Truck', description: 'Perbaikan mesin & kelistrikan truck', base_price: 300000, price_unit: 'unit', estimated_duration_minutes: 180 },
  { id: 'oto-4', category_id: 'otomotif', name: 'Bus', description: 'Perbaikan menyeluruh unit bus', base_price: 350000, price_unit: 'unit', estimated_duration_minutes: 240 },

  // 2. Perkakas
  { id: 'prk-1', category_id: 'perkakas', name: 'Genset', description: 'Perbaikan generator set portable & silent', base_price: 200000, price_unit: 'unit', estimated_duration_minutes: 90 },
  { id: 'prk-2', category_id: 'perkakas', name: 'Welding', description: 'Perbaikan mesin las listrik / karbit', base_price: 100000, price_unit: 'unit', estimated_duration_minutes: 60 },
  { id: 'prk-3', category_id: 'perkakas', name: 'Jack Hammer', description: 'Perbaikan alat bobok beton', base_price: 150000, price_unit: 'unit', estimated_duration_minutes: 90 },
  { id: 'prk-4', category_id: 'perkakas', name: 'Tamper', description: 'Perbaikan stamper pemadat tanah', base_price: 120000, price_unit: 'unit', estimated_duration_minutes: 90 },

  // 3. Alat Berat
  { id: 'alb-1', category_id: 'alat_berat', name: 'Excavator', description: 'Perbaikan sistem hidrolik & mesin excavator', base_price: 500000, price_unit: 'unit', estimated_duration_minutes: 300 },
  { id: 'alb-2', category_id: 'alat_berat', name: 'Scaffolding', description: 'Perbaikan & maintenance rangka perancah', base_price: 250000, price_unit: 'set', estimated_duration_minutes: 120 },

  // 4. Pendingin
  { id: 'pnd-1', category_id: 'pendingin', name: 'Kulkas', description: 'Perbaikan kulkas 1 & 2 pintu / freezer', base_price: 100000, price_unit: 'unit', estimated_duration_minutes: 60 },
  { id: 'pnd-2', category_id: 'pendingin', name: 'AC', description: 'Cuci, isi freon & perbaikan AC split/standing', base_price: 120000, price_unit: 'unit', estimated_duration_minutes: 60 },

  // 5. Elektronik
  { id: 'elk-1', category_id: 'elektronik', name: 'Televisi', description: 'Perbaikan TV LED / Smart TV', base_price: 90000, price_unit: 'unit', estimated_duration_minutes: 60 },
  { id: 'elk-2', category_id: 'elektronik', name: 'Monitor', description: 'Perbaikan monitor komputer / gaming', base_price: 80000, price_unit: 'unit', estimated_duration_minutes: 60 },
  { id: 'elk-3', category_id: 'elektronik', name: 'Kipas', description: 'Perbaikan kipas angin gantung / berdiri', base_price: 60000, price_unit: 'unit', estimated_duration_minutes: 45 },
  { id: 'elk-4', category_id: 'elektronik', name: 'Speaker', description: 'Perbaikan sound system & speaker aktif', base_price: 75000, price_unit: 'unit', estimated_duration_minutes: 60 },

  // 6. Gadget
  { id: 'gdg-1', category_id: 'gadget', name: 'Ponsel', description: 'Ganti LCD, baterai & perbaikan smartphone', base_price: 100000, price_unit: 'unit', estimated_duration_minutes: 60 },
  { id: 'gdg-2', category_id: 'gadget', name: 'Laptop', description: 'Servis laptop mati total, hang, ganti keyboard', base_price: 150000, price_unit: 'unit', estimated_duration_minutes: 120 },
  { id: 'gdg-3', category_id: 'gadget', name: 'PC', description: 'Perakitan & perbaikan komputer desktop', base_price: 130000, price_unit: 'unit', estimated_duration_minutes: 90 },

  // 7. Kelistrikan
  { id: 'kls-1', category_id: 'kelistrikan', name: 'Installasi & Maintenance', description: 'Pemasangan instalasi baru & perawatan kelistrikan', base_price: 150000, price_unit: 'layanan', estimated_duration_minutes: 120 }
];