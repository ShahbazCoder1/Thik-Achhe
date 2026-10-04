"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, CheckCircle2, AlertTriangle, Copy, Trash2, Send } from "lucide-react";
import type { OllamaResponse } from "@/lib/ollama";

type HistoryItem = {
  id: string;
  message: string;
  result: OllamaResponse;
  date: string;
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<OllamaResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem("thikAchheHistory");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history on change
  useEffect(() => {
    localStorage.setItem("thikAchheHistory", JSON.stringify(history));
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        throw new Error("Failed to check message.");
      }

      const data = await res.json();
      setResult(data);

      // Add to history
      setHistory((prev) => [
        { id: Date.now().toString(), message, result: data, date: new Date().toLocaleString() },
        ...prev.slice(0, 9), // Keep last 10
      ]);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please check your connection or try again.");
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
    if (confirm("Are you sure you want to clear your past checked messages?")) {
      setHistory([]);
    }
  };

  const getVerdictStyles = (verdict: "red" | "yellow" | "green") => {
    switch (verdict) {
      case "red":
        return "bg-red-100 text-red-900 border-red-500";
      case "yellow":
        return "bg-yellow-100 text-yellow-900 border-yellow-500";
      case "green":
        return "bg-green-100 text-green-900 border-green-500";
      default:
        return "bg-gray-100 text-gray-900 border-gray-300";
    }
  };

  const getVerdictIcon = (verdict: "red" | "yellow" | "green") => {
    switch (verdict) {
      case "red":
        return <ShieldAlert className="w-16 h-16 text-red-600 mb-4" />;
      case "yellow":
        return <AlertTriangle className="w-16 h-16 text-yellow-600 mb-4" />;
      case "green":
        return <CheckCircle2 className="w-16 h-16 text-green-600 mb-4" />;
      default:
        return null;
    }
  };

  const getVerdictTitle = (verdict: "red" | "yellow" | "green") => {
    switch (verdict) {
      case "red": return "DANGER / SCAM";
      case "yellow": return "SUSPICIOUS / BE CAREFUL";
      case "green": return "SAFE / NORMAL";
      default: return "";
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-6 font-sans selection:bg-blue-200">
      <div className="max-w-3xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="text-center space-y-4 pt-10">
          <h1 className="text-5xl font-extrabold tracking-tight text-blue-900">
            Thik Achhe?
          </h1>
          <p className="text-2xl text-gray-600">
            Paste any SMS or WhatsApp message here to see if it is a scam.
          </p>
        </header>

        {/* Input Form */}
        <section className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="message" className="sr-only">Paste your message</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Paste the message here..."
                className="w-full text-2xl p-6 border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all resize-none min-h-[160px]"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="w-full flex items-center justify-center gap-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-3xl font-bold py-6 px-8 rounded-2xl transition-transform active:scale-[0.98] shadow-lg disabled:shadow-none"
            >
              {isLoading ? "Checking..." : "Check Message"}
              {!isLoading && <Send className="w-8 h-8" />}
            </button>
            {error && <p className="text-xl text-red-600 text-center font-medium mt-4">{error}</p>}
          </form>
        </section>

        {/* Current Result */}
        {result && (
          <section className={`p-8 rounded-3xl border-4 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 ${getVerdictStyles(result.verdict)}`}>
            <div className="flex flex-col items-center text-center">
              {getVerdictIcon(result.verdict)}
              <h2 className="text-4xl font-black mb-6 tracking-tight">
                {getVerdictTitle(result.verdict)}
              </h2>
              
              <div className="space-y-6 text-left w-full bg-white/60 p-6 rounded-2xl">
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-wider opacity-80 mb-2">Why?</h3>
                  <p className="text-2xl font-medium leading-relaxed">{result.why}</p>
                </div>
                <hr className="border-current opacity-20" />
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-wider opacity-80 mb-2">What to do:</h3>
                  <p className="text-3xl font-bold leading-relaxed">{result.what_to_do}</p>
                </div>
              </div>

              <button
                onClick={handleCopy}
                className="mt-8 flex items-center gap-3 bg-white text-current px-6 py-4 rounded-xl font-bold text-xl hover:bg-opacity-90 active:scale-95 transition-all shadow"
              >
                {copySuccess ? <CheckCircle2 className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                {copySuccess ? "Copied!" : "Copy summary for family"}
              </button>
            </div>
          </section>
        )}

        {/* History */}
        {history.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-800">Past Messages</h2>
              <button 
                onClick={clearHistory}
                className="flex items-center gap-2 text-gray-500 hover:text-red-600 font-semibold p-2"
                aria-label="Clear history"
              >
                <Trash2 className="w-5 h-5" />
                Clear
              </button>
            </div>
            
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-lg text-gray-600 truncate font-medium">"{item.message}"</p>
                    <p className="text-sm text-gray-400 mt-1">{item.date}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-lg font-bold text-lg whitespace-nowrap border-2 ${getVerdictStyles(item.result.verdict).replace('bg-', 'bg-opacity-20 bg-')}`}>
                    {item.result.verdict.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer Disclaimer */}
        <footer className="text-center pb-12 pt-8 opacity-70">
          <p className="text-lg font-medium">
            If unsure, always call the number on the back of your bank card, or ask your family.
          </p>
          <p className="text-sm mt-2">
            Your messages stay on this computer and are never sent to the internet.
          </p>
        </footer>

      </div>
    </main>
  );
}
