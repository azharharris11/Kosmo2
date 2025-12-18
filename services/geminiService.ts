import { GoogleGenAI } from "@google/genai";
import { ClientData, UsageStats } from "../types";

const PRICING = {
  'gemini-2.5-flash': { input: 0.075, output: 0.30 },
  'gemini-3-flash-preview': { input: 0.15, output: 0.60 },
  'gemini-3-pro-preview': { input: 1.25, output: 5.00 }
};

const formatDate = (dateString: string) => {
  if (!dateString) return "SAAT INI";
  const date = new Date(dateString + "-01"); 
  return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }).toUpperCase();
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getConsolidatedSections = (dateContext: string, clientName: string) => [
  {
    id: 'BATCH_1_FOUNDATION',
    title: 'BATCH 1: PSIKOLOGI & NAKSHATRA',
    isFirstBatch: true, 
    prompt: `
    TUGAS UTAMA (EXTRACTION):
    Cari nama lengkap klien yang tertulis di dalam file chart/gambar yang dilampirkan.
    Jika ketemu, TULIS DI BARIS PERTAMA output Anda dengan format persis: [[NAME: Nama Klien]].
    Jika tidak ketemu, tulis [[NAME: Sahabat]].
    
    SETELAH ITU, barulah mulai menulis Judul Bab 1.
    
    ## BAB 1: REFLEKSI DIRI (TOPENG VS REALITA)
    ### The Persona (Lagna)
    Mulai dengan sapaan hangat untuk ${clientName} (Gunakan nama yang Anda temukan).
    Analisis Lagna (Ascendant) secara mendalam.
    
    ### The Inner Soul (Moon & Nakshatra)
    Analisis Moon Sign DAN Nakshatra Moon. Ceritakan mitologi simbol hewan dari Nakshatra tersebut.
    
    ### The Gap
    Analisis konflik antara keinginan jiwa (Moon) dan tuntutan sosial (Lagna).

    ## BAB 2: CARA KERJA PIKIRAN
    ### Gaya Komunikasi (Mercury)
    Bedah posisi Mercury. Apakah ${clientName} tipe visual, auditori, atau kinestetik?
    ### Planet di Kepala
    Analisis planet yang ada di House 1 atau House 5.
    ### Pola Keputusan
    Analisis Mars/Saturnus dalam mengambil tindakan.

    ## BAB 3: SISI GELAP (SHADOW WORK)
    ### The Blind Spot
    Identifikasi planet lemah atau Rahu/Ketu.
    ### The Trigger
    Kapan sifat toxic ini muncul?
    ### Strategi Pemulihan
    Panduan psikologis naratif.
    `
  },
  {
    id: 'BATCH_2_CAREER_WEALTH',
    title: 'BATCH 2: KARIER & KEKAYAAN',
    isFirstBatch: false,
    prompt: `
    LANJUTKAN ANALISIS MENDALAM.

    ## BAB 4: PETA WAKTU (DASHA & TRANSIT)
    ### Mahadasha: Tema Besar
    Analisis planet penguasa periode saat ini.
    ### Antardasha: Fokus Spesifik (${dateContext})
    Apa sub-tema yang sedang aktif sekarang?
    ### Transit Saturnus (Karmic Task)
    Tugas berat apa yang sedang dibebankan semesta?

    ## BAB 5: BEDAH TOTAL KARIER
    ### DNA Karier (House 10)
    Analisis House 10. Memimpin, melayani, atau mencipta?
    ### Nakshatra Karier
    Simbolisme Nakshatra dari Lord House 10.
    ### Korporat vs Pengusaha
    Analisis SWOT naratif untuk ${clientName}.

    ## BAB 6: BLUEPRINT KEUANGAN
    ### Sumber Pemasukan (House 2 & 11)
    Dari mana uang paling mudah datang?
    ### Kebocoran Finansial (House 12 & 6)
    Analisis psikologi uang dan solusi manajemen aset.
    `
  },
  {
    id: 'BATCH_3_RELATIONSHIP',
    title: 'BATCH 3: CINTA & KESEHATAN',
    isFirstBatch: false,
    prompt: `
    ANALISIS SEKTOR PRIVASI.

    ## BAB 7: DINAMIKA JANTUNG HATI
    ### Desain Pasangan Ideal (House 7)
    Jiwa seperti apa yang dibutuhkan ${clientName}?
    ### Karma Percintaan
    Pola berulang dalam hubungan masa lalu yang harus diputus.
    ### Navigasi Konflik
    Gaya bertengkar dan solusi elemen planet.

    ## BAB 8: MEDICAL ASTROLOGY
    ### Titik Lemah Fisik
    Berdasarkan House 6 dan Planet elemen.
    ### Koneksi Psikosomatis
    Hubungan emosi spesifik dengan penyakit fisik.
    ### Resep Gaya Hidup
    Saran diet/rutinitas harian.

    ## BAB 9: ZONA KEBERUNTUNGAN (ASHTAKVARGA)
    ### Peta Kekuatan
    Di sektor mana ${clientName} memiliki "Power" terbesar bulan ini?
    ### Zona Bahaya
    Di mana harus menahan diri?
    `
  },
  {
    id: 'BATCH_4_SOUL_REMEDY',
    title: 'BATCH 4: MISI JIWA',
    isFirstBatch: false,
    prompt: `
    ANALISIS TINGKAT TINGGI.

    ## BAB 10: MISI JIWA (RAHU & KETU)
    ### Obsesi Kehidupan Ini (Rahu)
    Area mana yang selalu membuat lapar?
    ### Keahlian Masa Lalu (Ketu)
    Bakat bawaan lahir (past life).
    ### Dharma
    Tugas akhir jiwa ${clientName} di dunia.

    ## BAB 11: REMEDIES & RITUAL
    ### Gemstone & Color Therapy
    Saran praktis penguat energi.
    ### Karma Yoga
    Tindakan nyata membayar hutang karma.
    ### Lifestyle Remedy
    Kebiasaan kecil harian.

    ## BAB 12: THE POWER MANIFESTO
    ### Surat Cinta untuk Diri Sendiri
    Narasi penguatan mental yang menggabungkan kekuatan planet terbaik.
    `
  },
  {
    id: 'BATCH_5_FORECAST',
    title: 'BATCH 5: FORECAST & PENUTUP',
    isFirstBatch: false,
    prompt: `
    BAGIAN TERAKHIR: PANDUAN MASA DEPAN.

    ## BAB 13: FORECAST 4 MINGGU KE DEPAN (${dateContext})
    Buat narasi detail per minggu (Minggu 1-4).

    ## BAB 14: GRAND CONCLUSION
    ### Rangkuman Eksekutif
    Rangkuman padat seluruh analisis.
    ### Natalie's Final Wisdom
    Satu nasihat pamungkas original.
    ### Next Steps
    3 Langkah konkret selanjutnya.
    `
  }
];

export const generateReport = async (
  data: ClientData,
  onStream: (fullContent: string) => void,
  onStatusUpdate: (status: string) => void,
  onUsageUpdate: (stats: UsageStats) => void,
  onNameDetected?: (name: string) => void
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });
  
  let accumulatedReport = ""; 
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  
  const model = data.selectedModel || 'gemini-2.5-flash';
  const pricing = PRICING[model] || PRICING['gemini-2.5-flash'];

  // Dynamic Name Handling
  let currentClientName = data.clientName && data.clientName !== data.files[0]?.name.split('.')[0] 
    ? data.clientName 
    : "Sahabat"; // Default until detected

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
  const sections = getConsolidatedSections(contextDate, currentClientName);
  const BATCH_SIZE = 1; 

  // Regex to find [[NAME: ...]]
  const nameRegex = /\[\[NAME:\s*(.*?)\]\]/i;
  let nameFound = false;

  for (let i = 0; i < sections.length; i += BATCH_SIZE) {
    const batch = sections.slice(i, i + BATCH_SIZE);
    
    // Update prompts if name was found in previous batch
    const currentSections = getConsolidatedSections(contextDate, currentClientName);

    for (const originalSection of batch) {
       // Get the updated section (with correct name) if available
       const section = currentSections.find(s => s.id === originalSection.id) || originalSection;

       onStatusUpdate(`Menulis ${section.title}...`);
       
       let promptPrefix = "";
       if (!section.isFirstBatch) {
         promptPrefix = `
         [INSTRUKSI LANJUTAN]
         Nama Klien: ${currentClientName}
         Gunakan format NARASI SUB-HEADING (###). 
         JANGAN pakai intro, langsung ## JUDUL BAB.
         `;
       }

       // --- INJECT CLIENT CONCERNS IF AVAILABLE ---
       const concernContext = data.concerns 
        ? `\n[KERESAHAN KLIEN / FOKUS ANALISIS]: "${data.concerns}"\n(Pastikan analisis Anda menjawab atau menyentuh keresahan ini secara empatik).`
        : "";

       const prompt = `
       ${promptPrefix}
       ${concernContext}
       ${section.prompt}
       DATA CHART: ${data.rawText || "Lihat lampiran."}
       WAKTU: ${contextDate}
       `;

       const parts = [{ text: prompt }, ...processedFiles];
       let retryCount = 0;
       const maxRetries = 3;
       let sectionSuccess = false;

       while (!sectionSuccess && retryCount < maxRetries) {
         try {
            const SYSTEM_INSTRUCTION = `
            PERAN: Natalie Lau, Konsultan Astrologi.
            GAYA: Deep Narrative, Sub-headings (###), Personal (${currentClientName}).
            `;

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
            let bufferForNameDetection = "";
    
            for await (const chunk of responseStream) {
              const text = chunk.text;
              if (text) {
                // Name Detection Logic (Only for First Batch)
                if (section.isFirstBatch && !nameFound) {
                  bufferForNameDetection += text;
                  const match = bufferForNameDetection.match(nameRegex);
                  if (match) {
                    const detectedName = match[1].trim();
                    if (detectedName && detectedName !== 'Sahabat') {
                      currentClientName = detectedName;
                      nameFound = true;
                      if (onNameDetected) onNameDetected(detectedName);
                    }
                    // Remove the tag from display
                    chunkText += text.replace(match[0], "").trimStart();
                    // Reset buffer to prevent double detection, but keep rest
                    bufferForNameDetection = ""; 
                  } else {
                    // Check if we have passed the danger zone (first 100 chars) without match
                    // If buffer is huge and no match, just flush it.
                    if (bufferForNameDetection.length > 200) {
                       chunkText += bufferForNameDetection;
                       bufferForNameDetection = "";
                    }
                  }
                } else {
                  chunkText += text;
                }

                // If name detected, we flush buffer differently
                // For simplicity, let's just stream normally but clean artifacts if they appear in chunkText
                let cleanChunk = text;
                if (section.isFirstBatch) {
                   cleanChunk = text.replace(nameRegex, ""); 
                }

                const displayContentRaw = accumulatedReport + (accumulatedReport ? "\n\n" : "") + chunkText + (bufferForNameDetection);
                const displayContentClean = displayContentRaw.replace(nameRegex, "").trim();
                
                onStream(displayContentClean);
              }

              if (chunk.usageMetadata) {
                 sectionUsageInput = chunk.usageMetadata.promptTokenCount;
                 sectionUsageOutput = chunk.usageMetadata.candidatesTokenCount;
              }
            }
            updateUsage(sectionUsageInput, sectionUsageOutput);
            
            // Finalize chunk
            let finalText = chunkText + bufferForNameDetection;
            // Clean tag one last time
            finalText = finalText.replace(nameRegex, "").trim();

            if (accumulatedReport) accumulatedReport += "\n\n";
            accumulatedReport += finalText;
            onStream(accumulatedReport);
            sectionSuccess = true;

         } catch (error: any) {
            console.error(`Error in section ${section.id}:`, error);
            retryCount++;
            if (retryCount < maxRetries) {
               onStatusUpdate(`Koneksi terganggu. Mencoba ulang...`);
               await wait(2000); 
            } else {
               accumulatedReport += `\n\n[Error retrieving section: ${section.title}]\n\n`;
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