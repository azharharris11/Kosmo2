
import { GoogleGenAI } from "@google/genai";
import { ClientData, UsageStats } from "../types";

/**
 * PRICING UPDATE (Per 1,000,000 Tokens)
 * Based on: https://ai.google.dev/gemini-api/docs/pricing
 * 
 * Gemini 3 Flash: $0.50 Input / $3.00 Output
 * Gemini 2.5 Flash: $0.30 Input / $2.50 Output
 * Gemini 3 Pro: $2.00 Input / $12.00 Output (Standard tier)
 */
const PRICING = {
  'gemini-2.5-flash': { input: 0.30, output: 2.50 },
  'gemini-3-flash-preview': { input: 0.50, output: 3.00 },
  'gemini-3-pro-preview': { input: 2.00, output: 12.00 }
};

const formatDate = (dateString: string) => {
  if (!dateString) return "SAAT INI";
  const date = new Date(dateString + "-01"); 
  return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }).toUpperCase();
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// SYSTEM INSTRUCTION: Defining Natalie's Soul
const NATALIE_SYSTEM_PROMPT = `
Kamu adalah Natalie Lau, seorang konsultan Cosmography (Vedic Astrology) yang memiliki gaya bicara "Empathetic Mystic".
Kepribadianmu: 
1. Bukan sekadar pembaca data, tapi "Penerjemah Jiwa". 
2. Gaya bicaramu mengalir seperti surat pribadi, hangat, puitis namun tetap jujur (bahkan jika itu pahit).
3. Kamu benci bahasa korporat atau list poin-poin yang kaku. Kamu lebih suka narasi yang mengalir.
4. Jika ada istilah teknis (Lagna, Nakshatra, Combust, Retrograde), kamu HARUS menjelaskannya dengan metafora kehidupan sehari-hari sehingga orang awam merasa tercerahkan, bukan bingung.
5. Fokus utama kamu adalah menjawab "Keresahan KLIEN" yang diberikan. Jangan memberikan jawaban template.
6. Kamu selalu mengaitkan bab yang sedang kamu tulis dengan apa yang sudah kamu bicarakan di bab sebelumnya (jika ada konteksnya).
`;

const getSections = (dateContext: string, clientName: string) => [
  {
    id: 'FOUNDATION',
    title: 'Batch 1: Pondasi Diri',
    prompt: `
    TUGAS 1: Cari Nama Klien di file/teks. Tulis [[NAME: Nama]] di baris pertama.
    TUGAS 2: Mulai analisis Pondasi Diri (Lagna & Moon Nakshatra). 
    Gunakan sapaan yang sangat personal. Mulailah seperti Natalie sedang duduk di depan ${clientName}.
    Bahas bagaimana topeng sosial (Lagna) sering menyembunyikan keinginan asli jiwa (Moon).
    Jelaskan Nakshatra Moon dengan cerita mitologi yang relevan dengan keresahan mereka.
    `
  },
  {
    id: 'MIND_SHADOW',
    title: 'Batch 2: Pikiran & Sisi Gelap',
    prompt: `
    Lanjutkan suratmu. Sekarang bahas Mercury (cara pikir) dan Rahu/Ketu (Shadow Work).
    Pastikan kamu menghubungkan ini dengan konflik identitas yang sudah kamu bahas di bagian sebelumnya.
    Jika mereka punya keresahan tertentu, cari akar masalahnya di posisi planet-planet ini.
    `
  },
  {
    id: 'CAREER_WEALTH',
    title: 'Batch 3: Karier & Keuangan',
    prompt: `
    Bahas House 10 dan 11. Jangan gunakan bahasa "Audit Keuangan". 
    Bicarakan tentang "Dharma Pekerjaan". Bagaimana uang mengalir mengikuti ketenangan batin mereka?
    Gunakan konteks Mahadasha (periode waktu) untuk menjelaskan mengapa saat ini terasa berat atau mudah.
    `
  },
  {
    id: 'LOVE_HEALTH',
    title: 'Batch 4: Hubungan & Raga',
    prompt: `
    Bahas House 7 (Pasangan) dan House 6 (Kesehatan). 
    Cinta bukan soal angka, tapi soal karma. Bahas pola berulang yang harus ${clientName} putus.
    Untuk kesehatan, hubungkan dengan kondisi emosional (Psikosomatis).
    `
  },
  {
    id: 'FUTURE_REMEDY',
    title: 'Batch 5: Misi Jiwa & Forecast',
    prompt: `
    Tutup surat ini dengan Misi Jiwa (Dharma) dan Forecast 4 minggu ke depan.
    Berikan "Natalie's Remedy" — langkah spiritual praktis. 
    Laporan ini harus berakhir dengan perasaan harapan dan kejelasan bagi ${clientName}.
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Default to Gemini 3 Flash Preview for optimal balance of speed and intelligence
  const model = data.selectedModel || 'gemini-3-flash-preview';
  const pricing = PRICING[model as keyof typeof PRICING] || PRICING['gemini-3-flash-preview'];

  let accumulatedReport = "";
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let rollingContext = ""; 
  let currentClientName = data.clientName || "Sahabat";

  const sections = getSections(formatDate(data.analysisDate), currentClientName);

  for (const section of sections) {
    onStatusUpdate(`Natalie sedang merenungi ${section.title}...`);
    
    const prompt = `
    [KONTEKS SURAT SEBELUMNYA]: ${rollingContext || "Ini adalah awal percakapan."}
    [KERESAHAN UTAMA KLIEN]: "${data.concerns || "Ingin tahu gambaran hidup umum."}"
    [INSTRUKSI KHUSUS]: ${section.prompt}
    [DATA DATA]: ${data.rawText || "Gunakan file terlampir."}
    `;

    const processedFiles: any[] = [];
    for (const file of data.files) {
      const base64Data = await fileToBase64(file);
      processedFiles.push({ inlineData: { mimeType: file.type, data: base64Data } });
    }

    const chainPrompt = `
    Setelah menulis bagian di atas, tambahkan di paling bawah outputmu sebuah blok:
    [[CONTEXT_FOR_NEXT: (Tulis 2 kalimat rangkuman energi untuk Natalie gunakan di bab selanjutnya agar nyambung)]]
    `;

    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: { role: 'user', parts: [{ text: prompt + "\n" + chainPrompt }, ...processedFiles] },
      config: {
        systemInstruction: NATALIE_SYSTEM_PROMPT,
        temperature: 0.8,
      }
    });

    let sectionContent = "";
    const nameRegex = /\[\[NAME:\s*(.*?)\]\]/i;
    const contextRegex = /\[\[CONTEXT_FOR_NEXT:\s*(.*?)\]\]/is;

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        sectionContent += text;
        if (section.id === 'FOUNDATION') {
          const nameMatch = sectionContent.match(nameRegex);
          if (nameMatch && onNameDetected) onNameDetected(nameMatch[1].trim());
        }

        let displayContent = (accumulatedReport ? accumulatedReport + "\n\n" : "") + sectionContent;
        displayContent = displayContent.replace(nameRegex, "").replace(contextRegex, "").trim();
        onStream(displayContent);
      }

      if (chunk.usageMetadata) {
        totalInputTokens += chunk.usageMetadata.promptTokenCount;
        totalOutputTokens += chunk.usageMetadata.candidatesTokenCount;
        onUsageUpdate({
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          totalCost: ((totalInputTokens / 1000000) * pricing.input) + ((totalOutputTokens / 1000000) * pricing.output)
        });
      }
    }

    const contextMatch = sectionContent.match(contextRegex);
    if (contextMatch) {
      rollingContext = contextMatch[1].trim();
    }

    let finalSectionText = sectionContent.replace(nameRegex, "").replace(contextRegex, "").trim();
    if (accumulatedReport) accumulatedReport += "\n\n";
    accumulatedReport += finalSectionText;
  }

  return accumulatedReport;
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });
};
