"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Play, Pause } from "lucide-react";

export default function WelcomeAudioPlayer() {
  const pathname = usePathname();
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeMode, setActiveMode] = useState("welcome"); // 'welcome' | 'product'

  const audioRef = useRef(null);
  const isProductPage = pathname?.startsWith("/product/") && pathname !== "/product";

  // Global Audio Controller
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isProductPage) {
      setActiveMode("product");
      const parts = pathname.split("/");
      const slug = parts[parts.length - 1];
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      let cancelled = false;

      // 1. Fetch AI Script & stream audio
      fetch(`${apiUrl}/api/ai/narrate/${slug}`)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          const script =
            data?.narration ||
            data?.data?.narration ||
            "এখনই ডট কমে আপনাকে স্বাগতম। সেরা অফারে আসল পণ্য কিনতে অর্ডার করুন।";

          const ttsUrl = `${apiUrl}/api/ai/tts?text=${encodeURIComponent(script)}`;

          if (audioRef.current) {
            audioRef.current.src = ttsUrl;
            audioRef.current.playbackRate = 1.15; // Natural, energetic speaking speed
            audioRef.current.load();
            audioRef.current.playbackRate = 1.15;
            
            // Play immediately
            const p = audioRef.current.play();
            if (p !== undefined) {
              p.then(() => setIsPlaying(true)).catch((err) => {
                console.log("Autoplay waiting for user tap:", err?.message);
                const unlock = () => {
                  if (audioRef.current) {
                    audioRef.current.playbackRate = 1.15;
                    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                  }
                  window.removeEventListener("click", unlock, true);
                  window.removeEventListener("touchstart", unlock, true);
                };
                window.addEventListener("click", unlock, true);
                window.addEventListener("touchstart", unlock, true);
              });
            }
          }
        })
        .catch((e) => console.error("Narration load error:", e));

      return () => {
        cancelled = true;
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
      };
    } else {
      setActiveMode("welcome");
      audio.src = "/audio/welcome.mp3";
      audio.playbackRate = 1.15;
      audio.load();
      audio.playbackRate = 1.15;

      const playWelcome = () => {
        if (!audioRef.current) return;
        audioRef.current.playbackRate = 1.15;
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            removeListeners();
          })
          .catch(() => {});
      };

      playWelcome();

      const removeListeners = () => {
        ["click", "touchstart", "touchend", "pointerdown", "keydown"].forEach((ev) => {
          window.removeEventListener(ev, playWelcome, true);
        });
      };

      ["click", "touchstart", "touchend", "pointerdown", "keydown"].forEach((ev) => {
        window.addEventListener(ev, playWelcome, { capture: true, passive: true });
      });

      return () => {
        removeListeners();
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
      };
    }
  }, [pathname, isProductPage]);

  // Toggle Play / Pause
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = 1.15;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.warn("Toggle play failed:", e));
    }
  };

  return (
    <aside
      aria-label="Ekhone Voice Assistant"
      className="fixed bottom-6 left-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-auto"
    >
      <audio
        ref={audioRef}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      <button
        type="button"
        onClick={togglePlay}
        className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-xl border-2 border-white cursor-pointer active:scale-90 ${
          isPlaying
            ? "bg-[#F45116] hover:bg-[#D9400B] scale-105"
            : "bg-[#102D50] hover:bg-[#1E4675]"
        }`}
        title={isPlaying ? "ভয়েস বন্ধ করুন (Pause)" : "ভয়েস চালু করুন (Play)"}
      >
        {isPlaying && (
          <span className="absolute -inset-1 rounded-full border-2 border-[#F45116] animate-ping opacity-60 pointer-events-none" />
        )}
        {isPlaying ? (
          <Pause size={18} className="drop-shadow-xs" />
        ) : (
          <Play size={18} className="ml-0.5 drop-shadow-xs" />
        )}
      </button>
    </aside>
  );
}
