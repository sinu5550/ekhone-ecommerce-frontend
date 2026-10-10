"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Mic, MicOff, Volume2, VolumeX, Send, X, Bot, User, ShoppingBag } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function AiAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "আসসালামু আলাইকুম! Ekhone-এ আপনাকে স্বাগতম। আপনি কোন পণ্যটি খুঁজছেন বা কোনো তথ্য জানতে চান কি?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceGreetingPlayed, setVoiceGreetingPlayed] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition & Synthesis capabilities
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.lang = "bn-BD";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputValue(transcript);
            handleSendMessage(transcript);
          }
          setIsVoiceActive(false);
        };

        recognition.onerror = () => {
          setIsVoiceActive(false);
        };

        recognition.onend = () => {
          setIsVoiceActive(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Text-To-Speech function using browser native speech synthesis
  const speakText = (text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    // Clean markdown stars/formatting for clean voice
    const cleanText = text.replace(/[*#_~`]/g, "").trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "bn-BD";
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    // Pick Bengali voice if available
    const voices = window.speechSynthesis.getVoices();
    const bnVoice = voices.find((v) => v.lang.startsWith("bn") || v.name.includes("Bangla") || v.name.includes("Bengali"));
    if (bnVoice) {
      utterance.voice = bnVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Welcome Voice on first user gesture
  const playWelcomeVoice = () => {
    if (voiceGreetingPlayed) return;
    setVoiceGreetingPlayed(true);
    speakText("এখন এ আপনাকে স্বাগতম। সেরা মূল্যে খাঁটি পণ্য পেতে আমরা আছি আপনার সাথে।");
  };

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Toggle voice recording
  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) return;

    if (isVoiceActive) {
      recognitionRef.current.stop();
      setIsVoiceActive(false);
    } else {
      stopSpeaking();
      try {
        recognitionRef.current.start();
        setIsVoiceActive(true);
      } catch (err) {
        console.warn("Recognition start error:", err);
      }
    }
  };

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    setInputValue("");
    const userMsg = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await apiClient("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });

      const reply = res?.reply || res?.data?.reply || "দুঃখিত, কোনো উত্তর পাওয়া যায়নি।";
      const botMsg = { role: "assistant", text: reply };
      setMessages((prev) => [...prev, botMsg]);

      // Speak response out loud
      speakText(reply);
    } catch (err) {
      console.error("AI Assistant query failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "দুঃখিত, সার্ভারের সাথে সংযোগে সমস্যা হচ্ছে। একটু পর আবার চেষ্টা করুন।",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {!isOpen && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              playWelcomeVoice();
            }}
            className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-[#F45116] via-[#FF6B35] to-[#F45116] text-white font-bold text-xs sm:text-sm rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/40 cursor-pointer"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
            </span>
            <Sparkles size={17} className="animate-pulse" />
            <span>AI Voice Assistant</span>
          </button>
        )}
      </div>

      {/* AI Assistant Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 w-[92vw] sm:w-[380px] h-[520px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#102D50] to-[#1E4675] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-[#F45116]">
                <Bot size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  <span>Ekhone AI Assistant</span>
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                </h3>
                <p className="text-[11px] text-slate-300">বাংলায় কথা বলুন বা লিখুন</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {isSpeaking ? (
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  title="Stop speaking"
                >
                  <VolumeX size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => speakText(messages[messages.length - 1]?.text || "")}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  title="Listen last message"
                >
                  <Volume2 size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70">
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={i}
                  className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-[#F45116] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-xs">
                      E
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-2xs ${
                      isUser
                        ? "bg-[#F45116] text-white rounded-tr-none font-medium"
                        : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none font-normal"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => speakText(msg.text)}
                        className="mt-1.5 text-[10px] text-slate-400 hover:text-[#F45116] flex items-center gap-1 transition cursor-pointer"
                      >
                        <Volume2 size={12} />
                        <span>শুনুন</span>
                      </button>
                    )}
                  </div>
                  {isUser && (
                    <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      <User size={14} />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs pl-9">
                <span className="w-2 h-2 rounded-full bg-[#F45116] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#F45116] animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-[#F45116] animate-bounce delay-200" />
                <span className="text-[11px] text-slate-500 font-medium">AI চিন্তা করছে...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
            {["ডেলিভারি চার্জ কত?", "ক্যাশ অন ডেলিভারি আছে?", "নতুন কী অফার আছে?"].map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-full transition cursor-pointer font-medium"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input & Voice Controls */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            {speechSupported && (
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  isVoiceActive
                    ? "bg-red-500 text-white animate-pulse shadow-md"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
                title={isVoiceActive ? "Listening... Click to stop" : "Speak in Bengali"}
              >
                {isVoiceActive ? <MicOff size={17} /> : <Mic size={17} />}
              </button>
            )}

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isVoiceActive ? "বাংলায় কথা বলুন..." : "আপনার প্রশ্নটি বাংলায় লিখুন..."}
              className="flex-1 bg-slate-100/90 border border-slate-200/90 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F45116]/20 focus:border-[#F45116]"
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2.5 rounded-xl bg-[#F45116] hover:bg-[#D9400B] text-white disabled:opacity-40 transition cursor-pointer shadow-xs active:scale-95"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
