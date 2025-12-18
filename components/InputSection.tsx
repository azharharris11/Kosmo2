import React, { useState } from 'react';
import { ClientData } from '../types';

interface InputSectionProps {
  onStartBatch: (queue: ClientData[]) => void;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onStartBatch, isLoading }) => {
  // Form States for Global Settings
  const [analysisDate, setAnalysisDate] = useState(new Date().toISOString().slice(0, 7));
  const [selectedModel, setSelectedModel] = useState<'gemini-2.5-flash' | 'gemini-3-flash-preview' | 'gemini-3-pro-preview'>('gemini-2.5-flash');

  // Queue State
  const [queue, setQueue] = useState<ClientData[]>([]);
  
  // State for manual entry
  const [manualName, setManualName] = useState('');
  const [manualText, setManualText] = useState('');

  // State to track which item is currently expanded for editing
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // BULK UPLOAD HANDLER
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: File[] = Array.from(e.target.files);
      
      const newQueueItems: ClientData[] = newFiles.map((file, index) => {
        // Use filename (without extension) as temporary name
        const tempName = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
        
        return {
          id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
          clientName: tempName, 
          rawText: "",
          files: [file],
          concerns: "", // Starts empty, user can edit in list
          analysisDate: analysisDate,
          selectedModel: selectedModel
        };
      });

      setQueue(prev => [...prev, ...newQueueItems]);
      e.target.value = '';
    }
  };

  const handleAddManual = () => {
    if (!manualName.trim() && !manualText.trim()) {
      alert("Untuk input manual, mohon isi Nama atau Data Teks.");
      return;
    }

    const newClient: ClientData = {
      id: Date.now().toString(),
      clientName: manualName || "Manual Client",
      rawText: manualText,
      concerns: "",
      files: [],
      analysisDate,
      selectedModel
    };

    setQueue([...queue, newClient]);
    setManualName('');
    setManualText('');
  };

  const handleRemoveFromQueue = (id: string) => {
    setQueue(queue.filter(q => q.id !== id));
    if (expandedClientId === id) setExpandedClientId(null);
  };

  const updateClientData = (id: string, field: keyof ClientData, value: any) => {
    setQueue(queue.map(client => 
      client.id === id ? { ...client, [field]: value } : client
    ));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl mx-auto">
      
      {/* LEFT: INPUT FORM */}
      <div className="flex-1 p-8 bg-midnight/50 border border-gold/30 rounded-lg backdrop-blur-sm shadow-2xl h-fit">
        <div className="text-center mb-8">
          <h2 className="font-cinzel text-2xl text-gold mb-2">Input Massal</h2>
          <p className="font-serif italic text-gray-400 text-sm">Upload banyak file chart sekaligus. AI akan mendeteksi nama otomatis, atau anda bisa edit detailnya di kolom kanan.</p>
        </div>

        <div className="space-y-6">
           {/* GLOBAL SETTINGS */}
           <div className="grid grid-cols-2 gap-4 p-4 bg-black/20 rounded border border-gold/10">
             <div>
              <label className="block font-cinzel text-gold-dim mb-1 text-xs tracking-widest">Waktu Analisis</label>
              <input 
                type="month"
                value={analysisDate}
                onChange={(e) => setAnalysisDate(e.target.value)}
                className="w-full bg-black/40 border border-gold/20 rounded p-2 text-gold font-cinzel text-xs h-[38px]"
              />
            </div>
            <div>
              <label className="block font-cinzel text-gold-dim mb-1 text-xs tracking-widest">Model Default</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as any)}
                className="w-full bg-black/40 border border-gold/20 rounded p-2 text-gold font-cinzel text-xs h-[38px]"
              >
                <option value="gemini-2.5-flash">Flash 2.5 (Cepat)</option>
                <option value="gemini-3-flash-preview">Flash 3.0 (Seimbang)</option>
                <option value="gemini-3-pro-preview">Pro 3.0 (Detail)</option>
              </select>
            </div>
          </div>

          {/* BULK FILE UPLOAD AREA */}
          <div className="border-2 border-dashed border-gold/30 rounded-lg p-8 text-center hover:border-gold/60 transition-colors bg-gold/5 group cursor-pointer relative">
            <input 
              type="file" 
              id="fileInput" 
              multiple 
              accept="image/*,.txt,.pdf"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            />
            <div className="flex flex-col items-center pointer-events-none">
              <span className="text-4xl text-gold mb-2 group-hover:scale-110 transition-transform">✦</span>
              <span className="font-cinzel font-bold text-gold text-lg">UPLOAD CHART IMAGES / PDF</span>
              <span className="text-xs font-serif text-gray-400 mt-2">Drag & Drop atau Klik untuk memilih banyak file</span>
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="flex-shrink-0 mx-4 text-gray-600 text-xs uppercase font-cinzel">Atau Input Manual</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          {/* MANUAL TEXT FALLBACK */}
          <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity">
            <input 
              type="text" 
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Nama Klien (Opsional jika upload file)"
              className="w-full bg-black/40 border border-gold/20 rounded p-3 text-parchment font-cinzel text-sm focus:border-gold focus:outline-none"
            />
             <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Paste Data Planet (Text)..."
              className="w-full h-16 bg-black/40 border border-gold/20 rounded p-3 text-parchment font-mono text-xs focus:border-gold focus:outline-none"
            />
            <button
              onClick={handleAddManual}
              className="w-full py-2 border border-gold/40 text-gold-dim font-cinzel hover:bg-gold hover:text-midnight transition-colors text-xs uppercase"
            >
              + Tambah Manual
            </button>
          </div>

        </div>
      </div>

      {/* RIGHT: QUEUE LIST (MANIFEST) */}
      <div className="w-full lg:w-1/3 bg-midnight/80 border-l border-gold/30 p-8 min-h-[500px] flex flex-col">
         <div className="mb-6 border-b border-gold/20 pb-4">
            <h2 className="font-cinzel text-2xl text-gold">Manifest Klien</h2>
            <p className="font-serif text-gray-500 text-sm">
              Klik pada kartu klien untuk menambahkan "Keresahan".
            </p>
         </div>

         <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar max-h-[600px]">
            {queue.length === 0 ? (
              <div className="text-center text-gray-600 mt-20 italic">
                Antrian kosong.
              </div>
            ) : (
              queue.map((client, idx) => {
                const isExpanded = expandedClientId === client.id;
                
                return (
                  <div 
                    key={client.id} 
                    className={`bg-black/40 border rounded transition-all duration-300 overflow-hidden
                      ${isExpanded ? 'border-gold shadow-lg' : 'border-gold/10 hover:border-gold/40'}
                    `}
                  >
                     {/* Card Header (Always Visible) */}
                     <div 
                       className="p-4 flex justify-between items-center cursor-pointer"
                       onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                     >
                        <div className="flex-1 min-w-0 pr-4">
                            <h4 className="font-cinzel text-parchment text-lg truncate">
                              {idx + 1}. {client.clientName}
                            </h4>
                            <div className="text-xs text-gold-dim font-serif mt-1 flex gap-2 items-center">
                              <span className="bg-gold/10 px-2 py-0.5 rounded">
                                {client.selectedModel.includes('pro') ? 'PRO 3.0' : client.selectedModel.includes('3-flash') ? 'FLASH 3.0' : 'FLASH 2.5'}
                              </span>
                              {client.concerns && (
                                <span className="text-green-500" title="Keresahan terisi">●</span>
                              )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-gold transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRemoveFromQueue(client.id); }}
                            className="text-gray-600 hover:text-red-500 transition-colors px-2 py-1"
                          >
                            ✕
                          </button>
                        </div>
                     </div>

                     {/* Expanded Edit Form */}
                     {isExpanded && (
                       <div className="p-4 pt-0 border-t border-gold/10 bg-black/20 animate-fade-in-down">
                          
                          {/* Edit Name */}
                          <div className="mb-3">
                            <label className="text-[10px] uppercase font-cinzel text-gray-500 block mb-1">Nama Klien</label>
                            <input 
                              type="text" 
                              value={client.clientName}
                              onChange={(e) => updateClientData(client.id, 'clientName', e.target.value)}
                              className="w-full bg-black/60 border border-gold/20 rounded p-2 text-parchment font-cinzel text-sm focus:border-gold focus:outline-none"
                            />
                          </div>

                          {/* Edit Model Per Client */}
                          <div className="mb-3">
                            <label className="text-[10px] uppercase font-cinzel text-gray-500 block mb-1">Model Khusus</label>
                            <select
                              value={client.selectedModel}
                              onChange={(e) => updateClientData(client.id, 'selectedModel', e.target.value)}
                              className="w-full bg-black/60 border border-gold/20 rounded p-2 text-gold font-cinzel text-xs focus:border-gold focus:outline-none"
                            >
                              <option value="gemini-2.5-flash">Flash 2.5</option>
                              <option value="gemini-3-flash-preview">Flash 3.0</option>
                              <option value="gemini-3-pro-preview">Pro 3.0</option>
                            </select>
                          </div>

                          {/* Edit Concerns */}
                          <div>
                            <label className="text-[10px] uppercase font-cinzel text-gray-500 block mb-1">Keresahan & Fokus (Penting)</label>
                            <textarea
                              value={client.concerns}
                              onChange={(e) => updateClientData(client.id, 'concerns', e.target.value)}
                              placeholder="Contoh: Takut gagal nikah, karir mentok..."
                              className="w-full h-24 bg-black/60 border border-gold/20 rounded p-2 text-parchment font-serif text-sm focus:border-gold focus:outline-none placeholder-gray-700"
                            />
                          </div>

                          <div className="mt-2 text-right">
                             <button 
                               onClick={() => setExpandedClientId(null)}
                               className="text-xs text-gold hover:underline"
                             >
                               Selesai
                             </button>
                          </div>
                       </div>
                     )}
                  </div>
                );
              })
            )}
         </div>

         <div className="mt-6 pt-6 border-t border-gold/20">
            <button
              onClick={() => onStartBatch(queue)}
              disabled={queue.length === 0 || isLoading}
              className={`w-full py-4 font-cinzel font-bold tracking-[0.2em] text-lg transition-all
                ${queue.length === 0 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-gold text-midnight hover:bg-white shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                }
              `}
            >
              MULAI ANALISIS ({queue.length})
            </button>
         </div>
      </div>

    </div>
  );
};

export default InputSection;