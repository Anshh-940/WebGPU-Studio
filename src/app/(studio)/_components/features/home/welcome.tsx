"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { useFocusWhen } from "@/hooks/use-focus-when";
import { useSidebar } from "@/contexts/SidebarContext";

// AUTH DISABLED: no session lookup, so the hero greeting is not personalised.
// import { useEffect } from "react";
// import { useProfile } from "@/hooks/useProfile";
// import { useUser } from "@auth0/nextjs-auth0/client";
import { ModelSelector } from "@/studio/_components/common/model-selector";
import { StopIcon, LoadingIcon, SendIcon } from "@/studio/_components/common/icons";
import Floating, { FloatingElement } from "@/studio/_components/common/parallax-floating";

const HERO_CARDS = [
  { url: "https://images.unsplash.com/photo-1734597949889-f8e2ec87c8ea?q=80&w=3432&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", title: "Creative", depth: 0.5, pos: "top-[15%] left-[2%] md:top-[25%] md:left-[5%]", imgClass: "w-16 h-12 sm:w-24 sm:h-16 md:w-28 md:h-20 lg:w-32 lg:h-24 -rotate-[3deg]", delay: 0.5 },
  { url: "https://plus.unsplash.com/premium_photo-1682824037662-441941b8e4e1?q=80&w=3687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", title: "Neon", depth: 1, pos: "top-[0%] left-[8%] md:top-[6%] md:left-[11%]", imgClass: "w-40 h-28 sm:w-48 sm:h-36 md:w-56 md:h-44 lg:w-60 lg:h-48 -rotate-12", delay: 0.7 },
  { url: "https://images.unsplash.com/photo-1639046380152-8603868f2e6a?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", title: "Crowd", depth: 4, pos: "top-[90%] left-[6%] md:top-[80%] md:left-[8%]", imgClass: "w-40 h-40 sm:w-48 sm:h-48 md:w-60 md:h-60 lg:w-64 lg:h-64 -rotate-[4deg]", delay: 0.9 },
  { url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", title: "Water", depth: 2, pos: "top-[0%] left-[87%] md:top-[2%] md:left-[83%]", imgClass: "w-40 h-36 sm:w-48 sm:h-44 md:w-60 md:h-52 lg:w-64 lg:h-56 rotate-[6deg]", delay: 1.1 },
  { url: "https://plus.unsplash.com/premium_photo-1682124651258-410b25fa9dc0?q=80&w=3421&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", title: "Sky", depth: 1, pos: "top-[78%] left-[83%] md:top-[68%] md:left-[83%]", imgClass: "w-44 h-44 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 rotate-[19deg]", delay: 1.3 },
];

const GRADIENT_STYLE = (varName: string) => ({
  background: `var(${varName})`,
  WebkitBackgroundClip: "text" as const,
  WebkitTextFillColor: "transparent" as const,
  backgroundClip: "text" as const,
  color: "transparent",
});

const FADE_IN = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2, ease: "easeOut" as const } };

const FloatingHeroSection = memo(function FloatingHeroSection() {
  return (
    <section className="absolute inset-0 top-0 left-0 right-0 min-h-[420px] md:min-h-[520px] pointer-events-none overflow-visible hidden md:block">
      <Floating sensitivity={-0.5} className="h-full w-full">
        {HERO_CARDS.map((card) => (
          <FloatingElement key={card.title} depth={card.depth} className={card.pos}>
            <motion.img
              src={card.url}
              alt={card.title}
              className={`object-cover rounded-xl shadow-2xl ${card.imgClass}`}
              {...FADE_IN}
              transition={{ ...FADE_IN.transition, delay: card.delay }}
            />
          </FloatingElement>
        ))}
      </Floating>
    </section>
  );
});

interface WelcomeProps {
  onNavigateToSection?: (section: string) => void;
  input?: string;
  onInputChange?: (value: string) => void;
  onSend?: () => void;
  pending?: boolean;
  isFeatureDisabled?: boolean;
  modelId?: string;
  onModelChange?: (modelId: string) => void;
  activeSection?: string;
  onStop?: () => void;
}

export function Welcome({
  onNavigateToSection,
  input = "",
  onInputChange,
  onSend,
  pending = false,
  isFeatureDisabled = false,
  modelId,
  onModelChange,
  activeSection,
  onStop,
}: WelcomeProps) {
  const sidebar = useSidebar();

  // AUTH DISABLED: profile-based greeting turned off.
  // const { profile, fetchProfile } = useProfile();
  // const { user } = useUser();
  // const isAuth = !!user;
  // const firstName = profile?.name?.split(" ")[0] ?? user?.name?.split(" ")[0] ?? null;
  //
  // useEffect(() => {
  //   if (isAuth && !profile) fetchProfile();
  // }, [isAuth, profile, fetchProfile]);
  const firstName: string | null = null;

  const onEnterSend = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend?.();
    }
  };

  const showInput = onInputChange && onSend;
  const placeholder = firstName ? "" : "How can I help you today?";
  const inputDisabled = pending || isFeatureDisabled;
  const sendDisabled = pending || !input.trim() || isFeatureDisabled;
  const inputRef = useFocusWhen(!!showInput && !pending);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] h-full py-10 px-5 text-center w-full max-w-full box-border relative m-0 shrink-0 grow-0 top-0 overflow-x-hidden overflow-y-visible bg-transparent">
      <FloatingHeroSection />

      <div className="w-full max-w-[800px] mx-auto relative z-10 pointer-events-auto flex flex-col items-center justify-center flex-1 min-h-0 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 dark:border-violet-300/30 bg-gray-800/95 dark:bg-black/40 px-4 py-1.5 mb-6 shadow-sm">
          <svg className="h-3.5 w-3.5 text-amber-200 dark:text-violet-200 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-xs font-medium tracking-wide text-white">Introducing WebGPU Studio</span>
        </div>
        <motion.h1
          className="font-[family-name:var(--font-aspekta)] w-full text-center font-bold tracking-[-2px] mb-4 leading-[1.2] flex flex-col items-center justify-center gap-3 py-4 px-2 sm:px-4 md:px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...FADE_IN.transition, delay: 0.3 }}
        >
          <span
            style={GRADIENT_STYLE("--welcome-title-gradient")}
            className="block font-bold text-3xl sm:text-4xl md:text-5xl lg:text-[52px] xl:text-[56px] whitespace-nowrap"
          >
            WebGPU Studio
          </span>
          <span className="block w-full text-center text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal text-violet-500 dark:text-violet-400">
            OWN YOUR AI
          </span>
        </motion.h1>
        <motion.p
          className="text-lg font-medium tracking-[0.12em] leading-relaxed max-w-[640px] mx-auto py-2 px-2 overflow-visible"
          style={GRADIENT_STYLE("--welcome-subtitle-gradient")}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...FADE_IN.transition, delay: 0.5 }}
        >
          Your local-first AI playground — chat, vision, and embeddings powered by WebGPU
        </motion.p>
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 mt-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...FADE_IN.transition, delay: 0.6 }}
        >
          <motion.button
            type="button"
            onClick={() => sidebar?.expandSidebar()}
            className="rounded-xl border-2 border-gray-300 dark:border-gray-500 bg-gray-900/80 dark:bg-black/50 px-6 py-3 text-sm font-semibold text-gray-100 dark:text-white hover:bg-gray-800/90 hover:border-violet-400/60 dark:hover:bg-white/10 dark:hover:border-violet-400/60 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Explore Playground
          </motion.button>
        </motion.div>

      {showInput && (
        <div className="mt-12 w-full max-w-[800px] px-0 flex-shrink-0">
          <div className="relative rounded-2xl border border-gray-200/80 dark:border-gray-600/60 overflow-hidden transition-all bg-gradient-to-br from-slate-50 via-white to-slate-50/80 shadow-lg shadow-gray-300/40 dark:from-gray-800 dark:via-gray-800/95 dark:to-gray-900 dark:shadow-black/40 backdrop-blur-sm">
            {!isFeatureDisabled && firstName && !input && (
              <label className="absolute top-[18px] left-6 pointer-events-none text-[15px] text-gray-500 dark:text-gray-400 z-[1] font-[family-name:var(--font-aspekta)]">
                <span className="bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">Hello {firstName}</span>, How can I help you today?
              </label>
            )}
            <textarea
              ref={inputRef}
              className="w-full min-h-[60px] max-h-[300px] py-[18px] px-6 pt-5 border-none bg-transparent text-gray-900 dark:text-gray-100 text-[15px] resize-none relative z-[2] overflow-y-auto focus:outline-none font-[family-name:var(--font-aspekta)]"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={placeholder}
              disabled={inputDisabled}
              onKeyDown={onEnterSend}
              rows={1}
              autoFocus
            />
            <div className="flex items-center justify-between py-2 px-3">
              <div className="flex items-center gap-1.5">
                {modelId && onModelChange && activeSection && (
                  <ModelSelector modelId={modelId} onModelChange={onModelChange} activeSection={activeSection} disabled={inputDisabled} />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {pending && onStop && (
                  <button type="button" className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 bg-transparent text-gray-500 dark:text-gray-400 flex items-center justify-center flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={onStop} title="Stop generation">
                  <StopIcon size={16} />
                </button>
                )}
                <button type="button" className="w-8 h-8 rounded-lg border-none bg-violet-600 text-white flex items-center justify-center flex-shrink-0 hover:bg-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed" onClick={onSend} disabled={sendDisabled} title="Send message">
                  {pending ? <LoadingIcon size={18} /> : <SendIcon size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
