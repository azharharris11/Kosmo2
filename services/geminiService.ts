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
  const date = new Date(dateString + "-01"); 
  return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }).toUpperCase();
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- PROMPTS ---
const getConsolidatedSections = (dateContext: string, clientName: string) => [
  {
    id: 'BATCH_1_FOUNDATION',
    title: 'BATCH 1: PSIKOLOGI MENDALAM',
    isFirstBatch: true, 
    prompt: `
    TULIS ESAI ANALISIS MENDALAM.
    
    ## BAB 1: REFLEKSI DIRI (TOPENG VS REALITA)
    Mulai dengan kalimat pembuka yang menyentuh hati khusus untuk ${clientName}.
    Jelaskan kesenjangan antara Lagna (Wajah Luar) dan Moon (Hati Dalam).
    Ceritakan narasi tentang bagaimana ${clientName} sering merasa lelah harus berpura-pura kuat (atau sifat lain sesuai chart) padahal hatinya berbeda. Buat mereka merasa "Wah, kok Natalie tau?".

    ## BAB 2: MEKANISME LOGIKA & PENGAMBILAN KEPUTUSAN
    (Tulis minimal 4 Paragraf)
    Bedah posisi Mercury dan Planet di Kepala (House 1/5/9). 
    Bagaimana cara ${clientName} memproses informasi saat tertekan? Apakah impulsif, overthinking, atau denial? Jelaskan mekanisme astrologisnya dan dampaknya pada keputusan karir mereka.

    ## BAB 3: BAYANGAN DIRI & SELF-SABOTAGE
    (Tulis minimal 4 Paragraf)
    Identifikasi "Shadow Self" atau kelemahan fatal yang sering tidak disadari klien (berdasarkan planet yang debilitated atau aspek sulit).
    Ceritakan sebuah narasi tentang pola kegagalan berulang yang mungkin dialami klien akibat sifat ini. Berikan strategi psikologis untuk mematahkan pola ini.
    `
  },
  {
    id: 'BATCH_2_PATH_CAREER',
    title: 'BATCH 2: KARIER & KEUANGAN',
    isFirstBatch: false,
    prompt: `
    ANALISIS BAGIAN 2: STRATEGI PROFESIONAL.
    Ingat: Minimal 4 Paragraf per Bab. Jangan pakai Poin-poin.

    ## BAB 4: DIAGNOSA SITUASI SAAT INI (DASHA/TRANSIT)
    (Tulis minimal 4 Paragraf)
    Analisis periode waktu ${clientName} saat ini (${dateContext}).
    Apakah ini fase untuk menyerang (ekspansi) atau bertahan (konsolidasi)? Jelaskan "tema besar" dari babak kehidupan ini secara mendetail, bukan hanya tanggal.

    ## BAB 5: PROFIL KARIER & POTENSI SUKSES
    (Tulis minimal 4 Paragraf)
    Berdasarkan House 10, 6, dan 11, analisis jalur karier terbaik untuk ${clientName}.
    Bandingkan kecocokan menjadi Pengusaha vs Profesional Korporat. Berikan argumen logis yang panjang mengapa satu jalur lebih menguntungkan daripada yang lain bagi chart spesifik ini.

    ## BAB 6: ANALISIS KEBOCORAN KEUANGAN
    (Tulis minimal 4 Paragraf)
    Di mana letak kelemahan finansial ${clientName}? (House 2 & 12).
    Apakah masalahnya di pemasukan yang tidak stabil atau pengeluaran impulsif? Ceritakan skenario nyata bagaimana uang biasanya "hilang" dari tangan mereka dan berikan solusi manajemen aset yang praktis.
    `
  },
  {
    id: 'BATCH_3_RELATIONSHIP_HEALTH',
    title: 'BATCH 3: HUBUNGAN & KESEHATAN',
    isFirstBatch: false,
    prompt: `
    ANALISIS BAGIAN 3: KUALITAS HIDUP.
    Tetap dalam format Narasi Esai Panjang.

    ## BAB 7: DINAMIKA HUBUNGAN & PERNIKAHAN
    (Tulis minimal 4 Paragraf)
    Analisis sektor House 7. Tuliskan profil psikologis pasangan yang dibutuhkan ${clientName} untuk seimbang.
    Jelaskan tantangan komunikasi terbesar yang akan selalu dihadapi klien dalam hubungan jangka panjang dan cara mematahkannya. Jangan berikan tips klise, berikan analisis perilaku.

    ## BAB 8: SINYAL TUBUH & VITALITAS FISIK
    (Tulis minimal 4 Paragraf)
    Hubungkan kondisi mental ${clientName} dengan penyakit fisik (Medical Astrology).
    Jika chart didominasi elemen Api, bahas masalah peradangan/lambung. Jika Angin, bahas kecemasan/saraf. Berikan saran gaya hidup preventif yang spesifik.

    ## BAB 9: PETA NAVIGASI BULANAN (ASHTAKVARGA)
    (Tulis minimal 4 Paragraf)
    Tanpa tabel angka, terjemahkan skor kekuatan planet menjadi narasi strategi.
    Sektor hidup mana yang sedang "Lampu Hijau" (Kejar target di sini) dan mana yang "Lampu Merah" (Hati-hati di sini) untuk bulan ini? Jelaskan alasannya.
    `
  },
  {
    id: 'BATCH_4_INNER_DYNAMICS',
    title: 'BATCH 4: SOLUSI & MISI JIWA',
    isFirstBatch: false,
    prompt: `
    ANALISIS BAGIAN 4: SOLUSI STRATEGIS.
    
    ## BAB 10: MISI JIWA & OBSESI (RAHU/KETU)
    (Tulis minimal 4 Paragraf)
    Apa "rasa lapar" terbesar yang dirasakan jiwa ${clientName} di kehidupan ini?
    Jelaskan area kehidupan di mana mereka sering merasa tidak pernah cukup (Rahu) dan area di mana mereka harus belajar melepaskan (Ketu).

    ## BAB 11: PRESKRIPSI PERUBAHAN NASIB (REMEDIES)
    (Tulis minimal 4 Paragraf)
    Berikan satu strategi besar (Remedy) yang bersifat perilaku/kebiasaan (Habit).
    Jelaskan secara rinci *mengapa* tindakan kecil ini (misal: Puasa bicara tiap senin, atau Berdonasi ke yayasan buta) bisa mengubah nasib mereka secara drastis secara energi. Buat argumen yang sangat meyakinkan.
    
    ## BAB 12: MANIFESTO KEKUATAN
    (Tulis minimal 4 Paragraf)
    Tuliskan sebuah narasi penguatan mental untuk ${clientName}.
    Gabungkan semua kekuatan terbaik di chart klien menjadi satu esai motivasi yang berbasis fakta kekuatan planet mereka.
    `
  },
  {
    id: 'BATCH_5_CONCLUSION',
    title: 'BATCH 5: KESIMPULAN',
    isFirstBatch: false,
    prompt: `
    ANALISIS BAGIAN 5: PENUTUP.

    ## BAB 13: FORECAST 30 HARI KE DEPAN
    (Tulis minimal 4 Paragraf)
    Buatlah alur cerita naratif tentang apa yang akan dihadapi ${clientName} bulan ini.
    Bagi menjadi: Awal bulan, Pertengahan, dan Akhir bulan. Apa fokus utama di setiap fase?

    ## BAB 14: PESAN TERAKHIR NATALIE
    (Tulis minimal 4 Paragraf)
    Rangkuman eksekutif dari seluruh analisis di atas.
    Tutup dengan satu paragraf berisi "The One Thing": Satu tindakan paling krusial yang harus ${clientName} lakukan detik ini juga untuk merubah hidupnya ke arah positif. Sampaikan dengan tegas.
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
  const clientName = data.clientName || "Sahabat"; 

  // --- SYSTEM INSTRUCTION BARU (WARM AUTHORITY) ---
  const SYSTEM_INSTRUCTION = `
PERAN: Anda adalah Natalie Lau, Konsultan Strategi Astrologi Senior.
KARAKTER: Cerdas, Empatik, Elegan, namun Tegas pada Data.
VISI: Membuat klien merasa "Dilihat" dan "Dipahami" secara mendalam.

GAYA BICARA (TONE):
1. **SAPAAN PERSONAL**: Panggil klien dengan nama "${clientName}" secara natural (jangan terlalu sering, tapi di momen penting). JANGAN panggil "Sahabat".
2. **DEEP NARRATIVE**: Tulis seperti esai psikologi yang mengalir. Hindari bullet points (kecuali sangat perlu).
3. **WARM AUTHORITY**: Gunakan bahasa yang otoritatif (sebagai ahli) tapi tetap hangat (sebagai mentor). 
   - *Kaku (Salah)*: "Berdasarkan analisis House 1, Anda pemarah."
   - *Luwes (Benar)*: "Posisi Mars di House 1 Anda memberikan energi api yang luar biasa, ${clientName}. Ini membuat Anda punya dorongan kuat, namun seringkali disalahartikan orang sebagai kemarahan."
4. **NO ROBOTIC JARGON**: Hindari kata "Berikut adalah", "Analisis saya menunjukkan". Langsung masuk ke inti cerita.

STRUKTUR:
Setiap bab harus memiliki kedalaman (minimal 3-4 paragraf) yang menjelaskan "WHY" (Kenapa begini) dan "HOW" (Solusinya).
`;

  const sections = getConsolidatedSections(contextDate, clientName);
  const BATCH_SIZE = 1; 

  for (let i = 0; i < sections.length; i += BATCH_SIZE) {
    const batch = sections.slice(i, i + BATCH_SIZE);
    
    for (const section of batch) {
       onStatusUpdate(`Menulis ${section.title}... (${model === 'gemini-3-pro-preview' ? 'Deep Analysis' : 'Fast Analysis'})`);
       
       let promptPrefix = "";
       if (!section.isFirstBatch) {
         promptPrefix = `
         [INSTRUKSI KHUSUS: INI ADALAH LANJUTAN DARI BAGIAN SEBELUMNYA]
         1. Tetap gunakan gaya NARASI PANJANG (4 Paragraf).
         2. JANGAN membuat kata pengantar (Intro).
         3. LANGSUNG mulai output Anda dengan karakter "##" (Judul Bab).
         4. Jaga alur cerita tetap menyambung.
         `;
       }

       const reminderContext = `
       [KONTEKS KLIEN]
       Nama: ${clientName}
       Keresahan Utama: "${data.concerns || 'Ingin tahu potensi terbaik dan terburuk diri'}"
       
       Ingat: Jawaban harus NARATIF, LUGAS, dan MENDALAM. Jangan gunakan poin-poin.
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

       // --- RETRY MECHANISM ---
       let retryCount = 0;
       const maxRetries = 3;
       let sectionSuccess = false;

       while (!sectionSuccess && retryCount < maxRetries) {
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
            
            if (accumulatedReport) accumulatedReport += "\n\n";
            accumulatedReport += chunkText;
            onStream(accumulatedReport);
            sectionSuccess = true;

         } catch (error: any) {
            console.error(`Error in section ${section.id}, attempt ${retryCount + 1}:`, error);
            retryCount++;
            
            if (retryCount < maxRetries) {
               onStatusUpdate(`Koneksi terganggu (${error.status || '500'}). Mencoba ulang ${section.title} (${retryCount}/${maxRetries})...`);
               await wait(2000 * retryCount); 
            } else {
               const errorMessage = `\n\n> **SYSTEM NOTE**: Bagian ini (${section.title}) gagal dimuat setelah 3x percobaan. Error: ${error.message || 'Unknown Network Error'}. Lanjut ke bagian berikutnya.\n\n`;
               accumulatedReport += errorMessage;
               onStream(accumulatedReport);
               sectionSuccess = true; 
            }
         }
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