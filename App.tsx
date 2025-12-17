import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import InputSection from './components/InputSection';
import ReportView from './components/ReportView';
import LoadingScreen from './components/LoadingScreen';
import { ClientData, ReportState, Step, UsageStats } from './types';
import { generateReport } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.INPUT);
  const [analysisDate, setAnalysisDate] = useState<string>(''); // Store the selected date
  const [reportState, setReportState] = useState<ReportState>({
    isLoading: false,
    isStreaming: false,
    content: '',
    error: null,
    generatedDate: null,
    currentSection: null,
    usage: null,
  });

  const handleFormSubmit = async (data: ClientData) => {
    setStep(Step.GENERATING);
    setAnalysisDate(data.analysisDate); // Save the date context
    setReportState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      content: '',
      currentSection: 'Mempersiapkan koneksi...',
      usage: { inputTokens: 0, outputTokens: 0, totalCost: 0 }
    }));

    try {
      await generateReport(
        data, 
        (fullText) => {
          setReportState(prev => ({
            ...prev,
            isLoading: false,
            isStreaming: true,
            content: fullText
          }));
        },
        (status) => {
          setReportState(prev => ({
            ...prev,
            currentSection: status
          }));
        },
        (usage: UsageStats) => {
          setReportState(prev => ({
            ...prev,
            usage: usage
          }));
        }
      );
      
      setStep(Step.RESULT);
      setReportState(prev => ({ 
        ...prev, 
        isStreaming: false, 
        isLoading: false,
        generatedDate: new Date().toISOString(),
        currentSection: null
      }));

    } catch (error) {
      console.error(error);
      setReportState(prev => ({
        ...prev,
        isLoading: false,
        isStreaming: false,
        currentSection: null,
        error: "Gagal terhubung dengan energi kosmik (API Error). Silakan coba lagi."
      }));
      setStep(Step.INPUT);
    }
  };

  const handleReset = () => {
    setStep(Step.INPUT);
    setReportState({
      isLoading: false,
      isStreaming: false,
      content: '',
      error: null,
      generatedDate: null,
      currentSection: null,
      usage: null
    });
  };

  return (
    <div className="min-h-screen w-full bg-midnight text-parchment bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
      {/* Background Gradient */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-transparent via-midnight/80 to-midnight"></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        
        {step === Step.INPUT && (
          <header className="text-center mb-16 pt-10">
            <h1 className="font-cinzel text-5xl md:text-7xl text-gold mb-4 tracking-widest drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]">
              Natalie Lau
            </h1>
            <p className="font-serif text-xl md:text-2xl text-gray-300 tracking-wide uppercase border-t border-b border-gold/30 inline-block py-3 px-8">
              Senior Cosmography Consultant
            </p>
          </header>
        )}

        <main className="w-full">
          {step === Step.INPUT && (
            <div className="animate-fade-in-up">
              <InputSection onSubmit={handleFormSubmit} isLoading={reportState.isLoading} />
              {reportState.error && (
                <div className="max-w-4xl mx-auto mt-6 p-4 bg-red-900/30 border border-red-500/50 text-red-200 text-center rounded">
                  {reportState.error}
                </div>
              )}
            </div>
          )}

          {step === Step.GENERATING && (
            <div className="flex flex-col items-center">
              <LoadingScreen />
              
              {/* Status Indicator */}
              <div className="mt-8 text-center animate-pulse">
                <p className="font-cinzel text-xl text-gold tracking-widest">
                  {reportState.currentSection || "Connecting..."}
                </p>
                {/* Real-time Token Cost Display */}
                {reportState.usage && (
                  <p className="font-mono text-xs text-gold/60 mt-2">
                    {reportState.usage.totalCost > 0 && `Est. Cost: $${reportState.usage.totalCost.toFixed(4)}`}
                  </p>
                )}
              </div>

              {/* Live Preview of Stream */}
              <div className="w-full max-w-2xl mt-8 opacity-50 text-center font-serif text-sm">
                 <div className="h-48 overflow-hidden relative fade-bottom border-t border-gold/20 pt-4">
                    {reportState.content.slice(-500)}...
                 </div>
              </div>
            </div>
          )}

          {step === Step.RESULT && (
             <ReportView 
                content={reportState.content} 
                onReset={handleReset} 
                usage={reportState.usage}
                analysisDate={analysisDate} // Pass date to view
             />
          )}
        </main>

        <footer className="no-print mt-20 text-center text-gray-600 font-cinzel text-xs pb-8">
          &copy; 2025 Natalie Lau Cosmography. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default App;