import React, { useState } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  X, 
  ExternalLink, 
  ShieldCheck, 
  Layers, 
  Terminal,
  Code
} from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'guide'>('sql');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_FULL_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-slate-900 border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Supabase Schema & Strict RBAC Engine</h3>
              <p className="text-xs text-slate-400">PostgreSQL 15+ Schema &bull; Zero RLS Recursion &bull; 4 Peran</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/25 active:scale-95 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Copy SQL'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-3 flex gap-2 border-b border-white/10 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-2 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'sql' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Script SQL Lengkap</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-2 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'guide' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Panduan Pasang di Supabase</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-300 bg-slate-950/40 no-scrollbar">
          {activeTab === 'sql' ? (
            <pre className="whitespace-pre overflow-x-auto leading-relaxed">
              <code>{SUPABASE_FULL_SQL}</code>
            </pre>
          ) : (
            <div className="font-sans space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-sm">Cara Pasang Dalam 3 Langkah:</h4>
                <ol className="list-decimal list-inside space-y-2 leading-relaxed text-slate-300">
                  <li>Buka dashboard proyek Anda di <strong>https://supabase.com</strong>.</li>
                  <li>Klik menu <strong>SQL Editor</strong> di bilah navigasi kiri, lalu klik <strong>New Query</strong>.</li>
                  <li>Salin kode dari tab <em>Script SQL Lengkap</em>, tempelkan ke editor, lalu klik <strong>RUN</strong>.</li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-sm">Struktur 4 Hak Akses (RBAC):</h4>
                <ul className="space-y-1.5 text-slate-300">
                  <li><strong className="text-red-400">Superadmin:</strong> Akses mutlak semua tabel, data operasional & keuangan.</li>
                  <li><strong className="text-blue-400">Admin:</strong> Akses jadwal, pengalihan teknisi, dan status pengerjaan lapangan.</li>
                  <li><strong className="text-emerald-400">Keuangan:</strong> Akses rincian biaya, validasi status pembayaran Lunas, tanpa hak ubah data teknis.</li>
                  <li><strong className="text-purple-400">Manager:</strong> Read-Only memantau metrik performa, kepuasan, & laporan omzet harian.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

const SUPABASE_FULL_SQL = `-- ==============================================================================
-- CIREBONFIX ON-DEMAND SERVICE ENGINE (SUPABASE POSTGRESQL)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'keuangan', 'manager');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'menunggu_konfirmasi', 'dijadwalkan', 'dalam_pengerjaan', 'selesai', 'dibatalkan'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'belum_dibayar', 'menunggu_verifikasi', 'lunas', 'refund'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- PROFILES (AUTH & RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    role user_role NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- SECURITY FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = true LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin' AND is_active = true
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'keuangan', 'manager') AND is_active = true
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- SERVICES & CATEGORIES
CREATE TABLE IF NOT EXISTS public.service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon_name TEXT DEFAULT 'Wrench',
    display_order INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT,
    base_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    price_unit TEXT NOT NULL DEFAULT 'per unit',
    estimated_duration_minutes INT DEFAULT 60,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- AUTO SEQUENCE ORDER CODE
CREATE SEQUENCE IF NOT EXISTS order_code_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_cirebon_order_code()
RETURNS TEXT AS $$
DECLARE
    seq_num INT;
    date_part TEXT;
BEGIN
    seq_num := nextval('order_code_seq');
    date_part := to_char(now(), 'YYMM');
    RETURN 'CRB-' || date_part || '-' || LPAD(seq_num::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code TEXT NOT NULL UNIQUE DEFAULT public.generate_cirebon_order_code(),
    
    -- Pelanggan Cirebon
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_kecamatan TEXT NOT NULL,
    customer_kelurahan TEXT,
    customer_address TEXT NOT NULL,
    address_benchmark TEXT,
    customer_lat NUMERIC(10, 7),
    customer_lng NUMERIC(10, 7),

    -- Detail Keluhan
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    custom_service_title TEXT,
    complaint_description TEXT NOT NULL,
    photo_urls TEXT[] DEFAULT '{}',

    -- Operasional (Admin & Superadmin)
    order_status order_status NOT NULL DEFAULT 'menunggu_konfirmasi',
    scheduled_date DATE,
    scheduled_time_slot TEXT,
    assigned_technician_name TEXT,
    operational_notes TEXT,

    -- Finansial & Tagihan (Keuangan & Superadmin)
    base_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    material_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    transport_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_status payment_status NOT NULL DEFAULT 'belum_dibayar',
    payment_method TEXT NOT NULL DEFAULT 'tunai_di_tempat',
    payment_proof_url TEXT,
    financial_notes TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public track orders" ON public.orders FOR SELECT USING (auth.role() = 'anon');
CREATE POLICY "Superadmin all orders" ON public.orders FOR ALL USING (public.is_superadmin());
CREATE POLICY "Admin manage operational" ON public.orders FOR UPDATE USING (public.get_current_role() = 'admin');
CREATE POLICY "Keuangan manage billing" ON public.orders FOR UPDATE USING (public.get_current_role() = 'keuangan');
CREATE POLICY "Manager read only" ON public.orders FOR SELECT USING (public.get_current_role() = 'manager');
`;
