import { GoogleGenAI } from "@google/genai";
import { ClientData, UsageStats } from "../types";

// Pricing estimation (per 1 Million tokens)
const PRICING = {
  'gemini-2.5-flash': { input: 0.075, output: 0.30 },
  'gemini-3-pro-preview': { input: 1.25, output: 5.00 }
};

// Helper to format date nicely
const formatDate = (dateString: string) => {
  if (!dateString) return "SAAT INI";
  const date = new Date(dateString + "-01"); // Append day to make it parseable
  return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }).toUpperCase();
};

// Consolidated Sections with CONTINUATION LOGIC
const getConsolidatedSections = (dateContext: string, clientName: string = "Klien") => [
  {
    id: 'BATCH_1_FOUNDATION',
    title: 'BATCH 1: FONDASI & PSIKOLOGI',
    isFirstBatch: true, 
    prompt: `
    TULIS 3 BAB PERTAMA.
    
    ## BAB 1: SURAT DARI SEMESTA (Introduction)
    - Sapa ${clientName} dengan hangat namun serius layaknya mentor.
    - Jelaskan mengapa chart mereka unik.
    - Disclaimer: Jelaskan bedanya chart ini dengan zodiak majalah (Western vs Vedic) dengan bahasa sederhana.
    - **PENTING**: Gunakan nada bicara yang personal, bukan seperti mesin.
    
    ## BAB 2: TOPENG & WAJAH ASLI (Psychological Profile)
    - Analisis Lagna (Ascendant) sebagai "Wajah yang Anda tunjukkan pada dunia" vs Rasi (Moon) sebagai "Siapa Anda saat sendirian di kamar".
    - Jelaskan konflik batin yang sering mereka rasakan berdasarkan posisi ini.
    - Gunakan analogi (contoh: "Lagna Anda seperti pakaian yang Anda kenakan, tapi Moon adalah kulit Anda").
    
    ## BAB 3: INVENTARIS KEKUATAN & BAYANGAN (SWOT Analysis)
    - Terjemahkan Shadbala menjadi "Inventory Senjata". Apa senjata terkuat mereka?
    - **Shadow Work (Kejujuran Brutal)**: Jelaskan sisi gelap/kelemahan mereka dengan jujur. Berikan contoh perilaku nyata yang mungkin sering mereka lakukan tanpa sadar (self-sabotage) akibat posisi planet buruk. 
    - *Ingat*: Jangan hanya memuji. Tunjukkan lubang di kapal mereka agar mereka bisa menambalnya.
    `
  },
  {
    id: 'BATCH_2_PATH_CAREER',
    title: 'BATCH 2: NAVIGASI HIDUP & KARIER',
    isFirstBatch: false,
    prompt: `
    TULIS 3 BAB BERIKUTNYA (BAB 4-6).
    **ATURAN KERAS**: JANGAN MENYAPA KLIEN LAGI. JANGAN ADA KATA PENGANTAR (seperti "Berikut adalah...", "Baiklah...").
    LANGSUNG MULAI DENGAN HEADING "## BAB 4...".

    ## BAB 4: GPS KEHIDUPAN SAAT INI (Dasha Analysis)
    - Anda sedang membaca "Jam Kosmik" klien. Periode Dasha apa yang sedang aktif sekarang? (${dateContext})
    - Apakah ini fase menanam, fase merawat, atau fase memanen? Jelaskan dengan analogi musim.
    - Gunakan **TANGGAL SPESIFIK** (misal: "Antara 12 Oktober - 15 Desember 2025").

    ## BAB 5: MOMEN EMAS & LAMPU MERAH (Timing Presisi)
    - Gunakan KP Astrology untuk mencari tanggal spesifik kejadian penting.
    - Berikan "Jendela Waktu" konkret. Misal: "Hindari tanda tangan kontrak besar di minggu ke-2 ${dateContext}."

    ## BAB 6: STRATEGI KARIER & KEKAYAAN
    - Lihat House 2, 6, 10, 11.
    - Jawab pertanyaan: Apakah klien cocok jadi Pengusaha (Risk Taker) atau Profesional (Structure Oriented)?
    - Di mana "Kebocoran Finansial" mereka biasanya terjadi? (Misal: belanja impulsif, terlalu baik meminjamkan uang, dll).
    - Berikan strategi: "Gas pol" di area mana, dan "Rem mendadak" di area mana.
    `
  },
  {
    id: 'BATCH_3_RELATIONSHIP_HEALTH',
    title: 'BATCH 3: CINTA & VITALITAS',
    isFirstBatch: false,
    prompt: `
    TULIS 3 BAB BERIKUTNYA (BAB 7-9).
    **ATURAN KERAS**: JANGAN MENYAPA. LANGSUNG MULAI DENGAN HEADING "## BAB 7...".

    ## BAB 7: DINAMIKA HATI & RELASI
    - Bedah House 7 & Venus.
    - Jangan gunakan istilah "House 7" terus menerus, ganti dengan "Sektor Kemitraan".
    - Jika single: Kapan peluang bertemu? Karakter jodoh?
    - Jika pasangan: Apa potensi konflik terbesar (Ego? Komunikasi? Uang?) dan solusinya.

    ## BAB 8: SINYAL TUBUH & KESEHATAN
    - Bedah House 6.
    - Apa sinyal tubuh yang sering diabaikan klien? (Misal: masalah pencernaan karena stres, atau migrain karena overthinking).
    - Solusi preventif berbasis elemen (Api/Air/Udara/Tanah).

    ## BAB 9: PETA KEBERUNTUNGAN (ASHTAKVARGA)
    - Analisis skor Ashtakvarga.
    - Identifikasi "Zona Emas" (Zodiak poin tinggi) vs "Zona Kering" (Zodiak poin rendah).
    - Terjemahkan ini menjadi tindakan: "Bulan ini fokuslah pada [Area Zona Emas], dan jangan memaksakan diri di [Area Zona Kering]."
    `
  },
  {
    id: 'BATCH_4_INNER_DYNAMICS',
    title: 'BATCH 4: JIWA & SPIRITUALITAS',
    isFirstBatch: false,
    prompt: `
    TULIS 3 BAB BERIKUTNYA (BAB 10-12).
    **ATURAN KERAS**: JANGAN MENYAPA. LANGSUNG MULAI DENGAN HEADING "## BAB 10...".

    ## BAB 10: PERANG & DAMAI DALAM DIRI
    - Friendship Table: Planet mana yang "berperang" dalam diri klien?
    - Bagaimana konflik internal ini memengaruhi keputusan hidup? (Misal: Hati ingin seni, tapi Logika ingin uang).

    ## BAB 11: MISI JIWA (DHARMA)
    - Analisis House 9, 12, Ketu & Jupiter.
    - Apa "Hutang Karma" atau misi jiwa yang harus dibayar di hidup ini?
    - Mengapa jiwa mereka memilih lahir di badan ini?

    ## BAB 12: PRESKRIPSI PERBAIKAN NASIB
    - Berikan solusi praktis: Warna keberuntungan, Batu mulia (Gemstone) jika perlu.
    - **LARANGAN**: JANGAN BERIKAN MANTRA AGAMA.
    - Gantilah dengan "Tindakan Nyata" atau "Charity". Misal: "Untuk menenangkan Saturnus, sering-seringlah berdonasi ke panti jompo atau membantu orang tua."
    `
  },
  {
    id: 'BATCH_5_CONCLUSION',
    title: 'BATCH 5: RANGKUMAN & PENUTUP',
    isFirstBatch: false,
    prompt: `
    TULIS 3 BAB TERAKHIR (BAB 13-15).
    **ATURAN KERAS**: JANGAN MENYAPA. LANGSUNG MULAI DENGAN HEADING "## BAB 13...".

    ## BAB 13: RAMALAN CUACA KOSMIK (${dateContext})
    - Buatlah Tabel Prediksi Sederhana untuk bulan ini.
    - Apa satu hal yang HARUS dilakukan dan satu hal yang HARUS dihindari bulan ini?

    ## BAB 14: PERSIAPAN SIKLUS BESAR
    - Apakah ada transisi besar mendekat (Sade Sati, Pergantian Mahadasha)?
    - Bagaimana mempersiapkan mental untuk ini?
    - Gunakan analogi: "Bersiaplah menghadapi musim dingin" atau "Siapkan layar untuk angin kencang".

    ## BAB 15: PESAN TERAKHIR NATALIE
    - Rangkuman eksekutif dari seluruh analisis.
    - Kalimat penutup yang sangat kuat tentang Free Will.
    - Di akhir, buatlah blok kutipan (> Blockquote) berjudul **"NATALIE'S NOTE"** yang berisi 1 nasihat paling krusial untuk hidup mereka saat ini.
    `
  }
];

export const generateReport = async (
  data: ClientData,
  onStream: (fullContent: string) => void,
  onStatusUpdate: (status: string) => void,
  onUsageUpdate: (stats: UsageStats) => void
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });
  
  let accumulatedReport = ""; 
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  
  const model = data.selectedModel || 'gemini-2.5-flash';
  const pricing = PRICING[model];

  const updateUsage = (input: number, output: number) => {
    totalInputTokens += input;
    totalOutputTokens += output;
    const inputCost = (totalInputTokens / 1_000_000) * pricing.input;
    const outputCost = (totalOutputTokens / 1_000_000) * pricing.output;
    
    onUsageUpdate({
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      totalCost: inputCost + outputCost
    });
  };

  const processedFiles: any[] = [];
  for (const file of data.files) {
    const base64Data = await fileToBase64(file);
    processedFiles.push({
      inlineData: {
        mimeType: file.type,
        data: base64Data
      }
    });
  }

  const contextDate = formatDate(data.analysisDate);
  
  // Extract generic name or try to find it in text, default to "Sahabat"
  const clientName = "Sahabat"; 

  // System Instruction: Updated for "Translator" Persona & Hand-crafted feel
  const SYSTEM_INSTRUCTION = `
PERAN: Anda adalah Natalie Lau, Konsultan Kosmografi Senior.
VISI: Menerjemahkan bahasa langit (Astrologi Veda/KP) menjadi strategi hidup yang praktis.

GAYA BICARA & TONE:
1. **Personal & Intim**: Bicara langsung pada klien ("Anda", sebut nama klien sesekali). Jangan bicara seperti buku teks.
2. **THE TRANSLATOR RULE**: Setiap kali Anda menyebutkan istilah teknis (misal: "Rahu di House 12" atau "Sade Sati"), Anda WAJIB langsung menjelaskan analoginya di dunia nyata.
   - *JANGAN TULIS*: "Saturnus Anda lemah di Shadbala."
   - *TULISLAH*: "Saturnus Anda memiliki energi yang rendah. Ini ibarat Anda memiliki mobil bagus tapi bensinnya sering kosong saat dibutuhkan..."
3. **Brutal tapi Empatik**: Katakan kebenaran pahit dengan elegan. Jangan sugar-coating, tapi berikan solusi mitigasi.
4. **Storytelling Flow**: Gunakan kalimat penghubung yang mengalir. Hindari format "Listicle" (poin-poin) yang berlebihan kecuali untuk data singkat.

FORMATTING:
- Gunakan Markdown yang bersih.
- Gunakan **Bold** untuk poin penting.
- Gunakan > Blockquote untuk "Nasihat Kunci" atau "Mantra Psikologis".
- Gunakan Tabel untuk data tanggal/prediksi jika memungkinkan.
`;

  const sections = getConsolidatedSections(contextDate, clientName);
  const BATCH_SIZE = 1; 

  for (let i = 0; i < sections.length; i += BATCH_SIZE) {
    const batch = sections.slice(i, i + BATCH_SIZE);
    
    for (const section of batch) {
       onStatusUpdate(`Menulis ${section.title}... (${model === 'gemini-3-pro-preview' ? 'Deep Analysis' : 'Fast Analysis'})`);
       
       // Construct Prompt based on position
       let promptPrefix = "";
       if (!section.isFirstBatch) {
         promptPrefix = `
         [INSTRUKSI KHUSUS: INI ADALAH LANJUTAN DARI BAGIAN SEBELUMNYA]
         1. JANGAN menyapa klien lagi.
         2. JANGAN membuat kata pengantar (Intro) seperti "Berikut adalah...".
         3. LANGSUNG mulai output Anda dengan karakter "##" (Judul Bab).
         4. Jaga alur cerita tetap menyambung.
         `;
       }

       // IMPORTANT: Inject Context into every prompt so the AI doesn't "forget"
       const reminderContext = `
       [PENGINGAT KONTEKS PENTING]
       Keresahan utama klien adalah: "${data.concerns || 'Ingin tahu potensi terbaik dan terburuk diri'}".
       Pastikan bab ini secara spesifik menjawab atau menyenggol keresahan tersebut. Jangan berikan nasihat general (copy-paste).
       Gunakan data dari file/text input untuk personalisasi.
       `;

       const prompt = `
       ${promptPrefix}
       
       ${reminderContext}

       ${section.prompt}

       DATA KLIEN (RAW):
       ${data.rawText || "Lihat lampiran chart."}
       
       KONTEKS WAKTU: ${contextDate}
       `;

       const parts = [{ text: prompt }, ...processedFiles];

       try {
         const responseStream = await ai.models.generateContentStream({
           model: model, 
           contents: { role: 'user', parts: parts },
           config: {
             systemInstruction: SYSTEM_INSTRUCTION,
             temperature: 0.7,
             maxOutputTokens: 8192,
           }
         });
 
         let sectionUsageInput = 0;
         let sectionUsageOutput = 0;
         let chunkText = "";
 
         for await (const chunk of responseStream) {
           const text = chunk.text;
           if (text) {
             chunkText += text;
             
             // Live update logic
             const displayContent = accumulatedReport 
               ? accumulatedReport + "\n\n" + chunkText 
               : chunkText;
             onStream(displayContent);
           }
           if (chunk.usageMetadata) {
              sectionUsageInput = chunk.usageMetadata.promptTokenCount;
              sectionUsageOutput = chunk.usageMetadata.candidatesTokenCount;
           }
         }
         updateUsage(sectionUsageInput, sectionUsageOutput);
         
         // Final concatenation for the next loop
         if (accumulatedReport) accumulatedReport += "\n\n";
         accumulatedReport += chunkText;
         onStream(accumulatedReport);

       } catch (error) {
         console.error(`Error in section ${section.id}:`, error);
         accumulatedReport += `\n\n[Maaf, koneksi terputus di bagian ini. Silakan generate ulang...]\n\n`;
         onStream(accumulatedReport);
       }
    }
  }

  return accumulatedReport;
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};