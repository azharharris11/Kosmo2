import React, { useState } from 'react';
import { ClientData } from '../types';

interface InputSectionProps {
  onSubmit: (data: ClientData) => void;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onSubmit, isLoading }) => {
  const [clientName, setClientName] = useState('');
  const [rawText, setRawText] = useState('');
  const [concerns, setConcerns] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  // Default to current month YYYY-MM
  const [analysisDate, setAnalysisDate] = useState(new Date().toISOString().slice(0, 7));
  const [selectedModel, setSelectedModel] = useState<'gemini-2.5-flash' | 'gemini-3-pro-preview'>('gemini-2.5-flash');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = () => {
    if (!clientName.trim()) {
      alert("Mohon masukkan Nama Klien agar analisis lebih personal.");
      return;
    }
    if (!rawText && files.length === 0) {
      alert("Mohon masukkan data teks atau upload gambar/PDF chart.");
      return;
    }
    onSubmit({ clientName, rawText, concerns, files, analysisDate, selectedModel });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-midnight/50 border border-gold/30 rounded-lg backdrop-blur-sm shadow-2xl">
      <div className="text-center mb-10">
        <h2 className="font-cinzel text-3xl text-gold mb-2">Data Klien</h2>
        <p className="font-serif italic text-gray-400">Silahkan unggah data chart Vedic (PDF/Gambar) atau salin teks data di bawah ini.</p>
      </div>

      <div className="space-y-8">
        
        {/* Nama Klien Input */}
        <div>
          <label className="block font-cinzel text-gold-dim mb-2 text-sm tracking-widest">Nama Lengkap</label>
          <input 
            type="text" 
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Contoh: Budi Santoso"
            className="w-full bg-black/40 border border-gold/20 rounded p-4 text-parchment font-cinzel text-lg focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold placeholder-gray-600"
          />
        </div>

        {/* Context Date Selection & Model Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
             {/* File Upload */}
             <div className="md:col-span-1 border-2 border-dashed border-gold/30 rounded-lg p-6 text-center hover:border-gold/60 transition-colors bg-black/20 h-32 flex flex-col justify-center">
              <input 
                type="file" 
                id="fileInput" 
                multiple 
                accept="image/*,.txt,.pdf"
                onChange={handleFileChange}
                className="hidden" 
              />
              <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center">
                <svg className="w-8 h-8 text-gold mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-serif text-gold-light">
                  {files.length > 0 
                    ? `${files.length} file dipilih` 
                    : "Upload Chart"}
                </span>
              </label>
            </div>

            {/* Date Context */}
            <div>
              <label className="block font-cinzel text-gold-dim mb-2 text-sm tracking-widest">Waktu Analisis</label>
              <input 
                type="month"
                value={analysisDate}
                onChange={(e) => setAnalysisDate(e.target.value)}
                className="w-full bg-black/40 border border-gold/20 rounded p-4 text-gold font-cinzel text-center text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold appearance-none h-[52px]"
              />
            </div>

            {/* Model Selection */}
            <div>
              <label className="block font-cinzel text-gold-dim mb-2 text-sm tracking-widest">Model Intelijen</label>
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as any)}
                  className="w-full bg-black/40 border border-gold/20 rounded p-4 pr-8 text-gold font-cinzel text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold appearance-none h-[52px]"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Cepat)</option>
                  <option value="gemini-3-pro-preview">Gemini 3.0 Pro (Detail)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gold">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
        </div>

        {/* Manual Text Input */}
        <div>
          <label className="block font-cinzel text-gold-dim mb-2 text-sm tracking-widest">Atau Paste Data Manual</label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste raw Vedic data details here (Planetary positions, Dashas, etc)..."
            className="w-full h-32 bg-black/40 border border-gold/20 rounded p-4 text-parchment font-mono text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>

        {/* Concerns Input */}
        <div>
          <label className="block font-cinzel text-gold-dim mb-2 text-sm tracking-widest">Keresahan & Fokus (Opsional)</label>
          <p className="text-xs text-gray-500 mb-2 font-serif italic">
            "Jika ada keresahan yang anda jalani saat ini, silahkan di tuliskan dibawah ini, akan saya bantu carikan jawabannya, jika tidak ada bisa dikosongkan"
          </p>
          <textarea
            value={concerns}
            onChange={(e) => setConcerns(e.target.value)}
            placeholder="Ceritakan keresahan anda..."
            className="w-full h-32 bg-black/40 border border-gold/20 rounded p-4 text-parchment font-serif text-base focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="group relative px-12 py-4 bg-transparent overflow-hidden rounded-sm w-full md:w-auto"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-gold/10 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out origin-left"></span>
            <span className="absolute inset-0 border border-gold/40"></span>
            <span className="relative font-cinzel text-gold tracking-widest font-bold group-hover:text-white transition-colors">
              {isLoading ? "Reading the Stars..." : "Generate Analysis"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputSection;