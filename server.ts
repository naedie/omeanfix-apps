import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API endpoint for Gemini Voice Assistant / Troubleshooting / Guide / Cost Estimation
app.post("/api/gemini/voice-chat", async (req, res) => {
  try {
    const { prompt, mode, history } = req.body;

    let systemInstruction = `Anda adalah "OMEANFIX Voice AI Assistant", asisten suara cerdas untuk platform layanan perbaikan on-demand OMEANFIX di Kota & Kabupaten Cirebon.
Keahlian Anda:
1. Konsultasi & Diagnosa Mandiri Kerusakan (Smart Troubleshooting Voice): Menganalisis masalah AC, Mesin Cuci, Kulkas, Pompa Air, Elektronik, dan Kendaraan, lalu memberikan solusi langkah demi langkah.
2. Panduan Interaktif Tutorial Penggunaan Aplikasi (Voice App Guide): Menjelaskan cara memesan teknisi, melacak status pesanan secara real-time, klaim voucher, dan menghubungi teknisi.
3. Estimasi Biaya & Pengecekan Suku Cadang: Memberikan estimasi biaya jasa, sparepart (kompresor, kapasitor, freon, v-belt, dll), serta ketersediaan stok.
4. Mode Hands-Free untuk Teknisi di Lapangan: Membantu teknisi mencatat temuan lapangan, update status pesanan, dan kalkulasi tagihan secara suara.

Berikan jawaban yang ramah, profesional, solutif, akurat, ringkas, dan langsung pada intinya dalam Bahasa Indonesia yang natural.`;

    if (mode === 'troubleshooting') {
      systemInstruction += "\nFokus utama saat ini: Diagnosa kerusakan perangkat dan panduan troubleshooting mandiri yang aman.";
    } else if (mode === 'guide') {
      systemInstruction += "\nFokus utama saat ini: Panduan penggunaan aplikasi OMEANFIX langkah demi langkah.";
    } else if (mode === 'cost_sparepart') {
      systemInstruction += "\nFokus utama saat ini: Estimasi biaya perbaikan dan pengecekan suku cadang original.";
    } else if (mode === 'handsfree_technician') {
      systemInstruction += "\nFokus utama saat ini: Mode Hands-Free khusus teknisi lapangan untuk pencatatan cepat dan update status.";
    }

    const contents = history && Array.isArray(history) && history.length > 0 
      ? [...history, { role: 'user', parts: [{ text: prompt }] }]
      : prompt;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        topP: 0.95,
      }
    });

    res.json({ text: response.text || "Maaf, asisten sedang memproses suara Anda. Silakan coba lagi." });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Terjadi kesalahan pada server AI." });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
