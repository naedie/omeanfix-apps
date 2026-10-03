export type UserRole = 'superadmin' | 'admin' | 'keuangan' | 'manager';

export type OrderStatus = 
  | 'menunggu_konfirmasi'
  | 'teknisi_menuju_lokasi'
  | 'proses_perbaikan'
  | 'dijadwalkan'
  | 'dalam_pengerjaan'
  | 'selesai'
  | 'dibatalkan';

export type PaymentStatus = 
  | 'belum_dibayar'
  | 'menunggu_verifikasi'
  | 'lunas'
  | 'refund';

export type PaymentMethod = 
  | 'tunai_di_tempat'
  | 'transfer_bca'
  | 'transfer_mandiri'
  | 'qris';

export interface Profile {
  id: string;
  full_name: string;
  phone_number: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  slug?: string;
  colorClass?: string;
  bgGradient?: string;
  display_order?: number;
  description?: string;
}

export interface Service {
  id: string;
  category_id: string;
  name: string;
  base_price: number;
  description?: string;
  price_unit?: string;
  estimated_duration_minutes?: number;
  popular?: boolean;
}

export interface SparePart {
  id: string;
  category_id: string;
  part_name: string;
  stock_quantity: number;
  unit_price: number;
  created_at?: string;
}

export interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  customer_kecamatan: string;
  customer_kelurahan?: string;
  customer_address: string;
  address_benchmark?: string;
  customer_lat?: number;
  customer_lng?: number;
  service_id?: string;
  service_name: string;
  category_slug: string;
  service_action?: 'perawatan' | 'perbaikan'; // FITUR BARU
  complaint_description: string;
  service_method?: 'panggilan' | 'bawa_sendiri';
  order_status: OrderStatus;
  base_fee: number;
  material_fee: number;
  transport_fee: number;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  created_at: string;
  updated_at: string;
}