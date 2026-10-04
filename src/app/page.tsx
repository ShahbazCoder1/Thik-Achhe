"use client";

import { useState, useEffect, useRef } from "react";
import { ShieldAlert, CheckCircle2, AlertTriangle, Copy, Trash2, Send, UploadCloud, Globe } from "lucide-react";
import { initModel, checkMessageLocal, type LocalOllamaResponse } from "@/lib/llm-client";
import { evaluateRules } from "@/lib/rules";
import { translations, type SupportedLanguage } from "@/lib/i18n";

type HistoryItem = {
  id: string;
  message: string;
  result: LocalOllamaResponse;
  date: string;
};

export default function Home() {
  const [lang, setLang] = useState<SupportedLanguage>("en");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LocalOllamaResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[lang];

  useEffect(() => {
    const saved = localStorage.getItem("thikAchheHistory");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
    const savedLang = localStorage.getItem("thikAchheLang");
    if (savedLang && (savedLang === "en" || savedLang === "hi" || savedLang === "bn" || savedLang === "ne")) {
      setLang(savedLang as SupportedLanguage);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("thikAchheHistory", JSON.stringify(history));
  }, [history]);

  const handleLangChange = (l: SupportedLanguage) => {
    setLang(l);
    localStorage.setItem("thikAchheLang", l);
  };

  const handleModelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsModelLoading(true);
    setError("");
    
    try {
      const modelUrl = URL.createObjectURL(file);
      await initModel(modelUrl);
      setModelLoaded(true);
    } catch (err) {
      console.error(err);
      setError("Failed to load model. Ensure it is a valid MediaPipe GenAI .litertlm file.");
    } finally {
      setIsModelLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (!modelLoaded) {
      setError(t.errorSelectModel);
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      // 1. Rules Engine
      const ruleVerdict = evaluateRules(message);
      
      // 2. Local LLM check
      let finalVerdict = await checkMessageLocal(message, lang);
      
      // 3. Merge Logic safely
      if (ruleVerdict.isRedFlag) {
        if (finalVerdict.verdict !== "red") {
          finalVerdict.verdict = "red";
          finalVerdict.why = `${ruleVerdict.reason} ${finalVerdict.why}`.trim();
          finalVerdict.what_to_do = t.ruleFallbackAction;
        } else {
          finalVerdict.why = `${ruleVerdict.reason} ${finalVerdict.why}`.trim();
        }
      }

      setResult(finalVerdict);

      // Add to history
      setHistory((prev) => [
        { id: Date.now().toString(), message, result: finalVerdict, date: new Date().toLocaleString() },
        ...prev.slice(0, 9),
      ]);
    } catch (err) {
      console.error(err);
      setError(t.errorGeneric);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `Message: "${message}"\n\nVerdict: ${result.verdict.toUpperCase()}\nWhy: ${result.why}\nWhat to do: ${result.what_to_do}`;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const clearHistory = () => {
    if (confirm("Are you sure?")) {
      setHistory([]);
    }
  };

  const getVerdictStyles = (verdict: "red" | "yellow" | "green") => {
    switch (verdict) {
      case "red": return "bg-red-100 text-red-900 border-red-500";
      case "yellow": return "bg-yellow-100 text-yellow-900 border-yellow-500";
      case "green": return "bg-green-100 text-green-900 border-green-500";
      default: return "bg-gray-100 text-gray-900 border-gray-300";
    }
  };

  const getVerdictIcon = (verdict: "red" | "yellow" | "green") => {
    switch (verdict) {
      case "red": return <ShieldAlert className="w-12 h-12 md:w-16 md:h-16 text-red-600 mb-2 md:mb-4" />;
      case "yellow": return <AlertTriangle className="w-12 h-12 md:w-16 md:h-16 text-yellow-600 mb-2 md:mb-4" />;
      case "green": return <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 text-green-600 mb-2 md:mb-4" />;
      default: return null;
    }
  };

  const getVerdictTitle = (verdict: "red" | "yellow" | "green") => {
    switch (verdict) {
      case "red": return t.danger;
      case "yellow": return t.suspicious;
      case "green": return t.safe;
      default: return "";
    }
  };

  if (!modelLoaded) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6">
          <UploadCloud className="w-20 h-20 text-blue-600 mx-auto" />
          <h1 className="text-3xl font-extrabold text-gray-900">{t.setupTitle}</h1>
          <p className="text-gray-600 text-lg">{t.setupDesc}</p>
          <input 
            type="file" 
            accept=".litertlm" 
            ref={fileInputRef} 
            onChange={handleModelUpload}
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isModelLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl text-xl disabled:bg-gray-400"
          >
            {isModelLoading ? "Loading..." : t.selectModel}
          </button>
          {error && <p className="text-red-600 font-medium">{error}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-6 font-sans selection:bg-blue-200">
      <div className="max-w-3xl mx-auto space-y-8 md:space-y-10">
        
        {/* Top Bar with Language Selector */}
        <div className="flex justify-end pt-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
            <Globe className="w-5 h-5 text-gray-500" />
            <select 
              value={lang} 
              onChange={(e) => handleLangChange(e.target.value as SupportedLanguage)}
              className="bg-transparent text-lg font-medium outline-none cursor-pointer"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="bn">বাংলা</option>
              <option value="ne">नेपाली</option>
            </select>
          </div>
        </div>

        {/* Header */}
        <header className="text-center space-y-3 md:space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-blue-900">
            {t.title}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 px-2">
            {t.subtitle}
          </p>
        </header>

        {/* Input Form */}
        <section className="bg-white p-4 md:p-8 rounded-3xl shadow-xl border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div>
              <label htmlFor="message" className="sr-only">Paste your message</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.placeholder}
                className="w-full text-xl md:text-2xl p-4 md:p-6 border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all resize-none min-h-[140px] md:min-h-[160px]"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="w-full flex items-center justify-center gap-3 md:gap-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-2xl md:text-3xl font-bold py-5 md:py-6 px-6 md:px-8 rounded-2xl transition-transform active:scale-[0.98] shadow-lg disabled:shadow-none"
            >
              {isLoading ? t.checking : t.checkButton}
              {!isLoading && <Send className="w-6 h-6 md:w-8 md:h-8" />}
            </button>
            {error && <p className="text-lg md:text-xl text-red-600 text-center font-medium mt-4">{error}</p>}
          </form>
        </section>

        {/* Current Result */}
        {result && (
          <section className={`p-6 md:p-8 rounded-3xl border-4 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 ${getVerdictStyles(result.verdict)}`}>
            <div className="flex flex-col items-center text-center">
              {getVerdictIcon(result.verdict)}
              <h2 className="text-3xl md:text-4xl font-black mb-4 md:mb-6 tracking-tight">
                {getVerdictTitle(result.verdict)}
              </h2>
              
              <div className="space-y-4 md:space-y-6 text-left w-full bg-white/60 p-4 md:p-6 rounded-2xl">
                <div>
                  <h3 className="text-lg md:text-xl font-bold uppercase tracking-wider opacity-80 mb-1 md:mb-2">{t.why}</h3>
                  <p className="text-xl md:text-2xl font-medium leading-relaxed">{result.why}</p>
                </div>
                <hr className="border-current opacity-20" />
                <div>
                  <h3 className="text-lg md:text-xl font-bold uppercase tracking-wider opacity-80 mb-1 md:mb-2">{t.whatToDo}</h3>
                  <p className="text-2xl md:text-3xl font-bold leading-relaxed">{result.what_to_do}</p>
                </div>
              </div>

              <button
                onClick={handleCopy}
                className="mt-6 md:mt-8 flex items-center gap-3 bg-white text-current px-5 py-3 md:px-6 md:py-4 rounded-xl font-bold text-lg md:text-xl hover:bg-opacity-90 active:scale-95 transition-all shadow"
              >
                {copySuccess ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : <Copy className="w-5 h-5 md:w-6 md:h-6" />}
                {copySuccess ? t.copied : t.copyButton}
              </button>
            </div>
          </section>
        )}

        {/* History */}
        {history.length > 0 && (
          <section className="mt-12 md:mt-16">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{t.pastMessages}</h2>
              <button 
                onClick={clearHistory}
                className="flex items-center gap-2 text-gray-500 hover:text-red-600 font-semibold p-2"
                aria-label="Clear history"
              >
                <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                {t.clear}
              </button>
            </div>
            
            <div className="space-y-3 md:space-y-4">
              {history.map((item) => (
                <div key={item.id} className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center justify-between">
                  <div className="flex-1 min-w-0 w-full">
                    <p className="text-base md:text-lg text-gray-600 truncate font-medium">"{item.message}"</p>
                    <p className="text-xs md:text-sm text-gray-400 mt-1">{item.date}</p>
                  </div>
                  <div className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-sm md:text-lg whitespace-nowrap border-2 ${getVerdictStyles(item.result.verdict).replace('bg-', 'bg-opacity-20 bg-')}`}>
                    {t.verdicts[item.result.verdict].toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer Disclaimer */}
        <footer className="text-center pb-8 md:pb-12 pt-6 md:pt-8 opacity-70 px-2">
          <p className="text-base md:text-lg font-medium">
            {t.footerText1}
          </p>
          <p className="text-xs md:text-sm mt-2">
            {t.footerText2}
          </p>
        </footer>

      </div>
    </main>
  );
}
