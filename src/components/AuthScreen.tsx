import React, { useState } from 'react';
import { Mail, Lock, User, Sparkles, AlertCircle, ArrowRight, Wrench } from 'lucide-react';
import { supabase } from '../supabase';

interface AuthScreenProps {
  onSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        // Proses Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Jika sukses login, beritahu aplikasi utama
        onSuccess(); 
      } else {
        // Proses Daftar Akun Baru
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });
        if (error) throw error;
        
        setSuccessMsg('Pendaftaran berhasil! Anda sekarang bisa langsung masuk.');
        setIsLogin(true); // Otomatis pindah ke halaman login
        setPassword(''); // Kosongkan kata sandi demi keamanan
      }
    } catch (error: any) {
      // Terjemahkan pesan error bahasa Inggris ke bahasa Indonesia agar ramah pelanggan
      let pesan = error.message;
      if (pesan.includes('Invalid login credentials')) pesan = 'Email atau kata sandi Anda salah.';
      if (pesan.includes('User already registered')) pesan = 'Email ini sudah terdaftar sebelumnya.';
      if (pesan.includes('Password should be at least')) pesan = 'Kata sandi harus lebih dari 6 karakter.';
      setErrorMsg(pesan);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
      {/* Overlay Gelap Estetik */}
      <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm"></div>

      {/* Kotak Formulir Glassmorphism */}
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-[36px] p-8 shadow-2xl border border-white/60 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Logo & Judul */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 transform -rotate-3 hover:rotate-0 transition-all duration-300">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">CirebonFix</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {isLogin ? 'Selamat datang kembali!' : 'Daftar untuk mulai panggil teknisi'}
          </p>
        </div>

        {/* Pesan Error / Sukses */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}
        {successMsg && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-600 text-xs font-bold animate-in slide-in-from-top-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* Formulir Autentikasi */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {!isLogin && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider pl-1">Nama Lengkap</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider pl-1">Alamat Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider pl-1">Kata Sandi</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter rahasia"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-4 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-500/25 active:scale-98 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">Memproses ke server...</span>
            ) : (
              <>
                <span>{isLogin ? 'Masuk ke Beranda' : 'Buat Akun Sekarang'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Tombol Pindah Login/Register */}
        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-500 font-medium">
            {isLogin ? 'Belum punya akun pelanggan?' : 'Sudah mendaftar sebelumnya?'}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="ml-1.5 font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};