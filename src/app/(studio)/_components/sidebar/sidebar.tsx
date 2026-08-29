"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/studio/_components/common/theme-toggle";

// AUTH DISABLED: the account block (log in / sign up / avatar / plan / sign out) and
// the profile modal are hidden. Imports and markup are preserved in comments.
// import { useEffect } from "react";
// import { useUser } from "@auth0/nextjs-auth0/client";
// import { useProfile } from "@/hooks/useProfile";
// import { removeSigningUpFlag } from "@/lib/utils/storage";
// import { ProfileModal } from "@/studio/_components/profile/profile-modal";
import { ChatIcon, VisionIcon, StructuredIcon, EmbeddingsIcon } from "@/studio/_components/common/icons";

const APP_SECTIONS = [
  { id: "chat", label: "Chat (text)", path: "/", Icon: ChatIcon },
  { id: "vision", label: "Vision", path: "/vision", Icon: VisionIcon },
  { id: "structured", label: "Structured JSON", path: "/structured", Icon: StructuredIcon },
  { id: "embeddings", label: "Embeddings", path: "/embeddings", Icon: EmbeddingsIcon },
  // Fine-tune: not shown in nav. In-app /finetune page retained in codebase.
  // { id: "finetune", label: "Fine-tune", path: "/finetune", Icon: FinetuneIcon },
] as const;

interface SidebarProps {
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

// AUTH DISABLED: helpers used only by the hidden account block.
// function getInitials(name: string | undefined | null): string {
//   if (!name) return "?";
//   const parts = name.trim().split(/\s+/);
//   return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
// }
//
// function getPlanLabel(profile: { memberships?: Array<{ organization?: { orgSubscription?: { subscription?: { title?: string } } } }> } | null): string {
//   return profile?.memberships?.[0]?.organization?.orgSubscription?.subscription?.title ?? "Free plan";
// }

const btn = "w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-white/15 dark:hover:bg-black/15 transition-colors";

export function Sidebar({ theme, onThemeChange, expanded: controlledExpanded, onExpandedChange, mobileOpen, onMobileOpenChange }: SidebarProps) {
  const pathname = usePathname();
  const activeSection =
    pathname === "/" ? "chat" : pathname === "/chat" ? "chat" : pathname.slice(1).split("/")[0] || "chat";
  const [internalExpanded, setInternalExpanded] = useState(false);

  // AUTH DISABLED: account state no longer read.
  // const [imageError, setImageError] = useState(false);
  // const [profileModalOpen, setProfileModalOpen] = useState(false);
  // const { user, isLoading } = useUser();
  // const isAuth = !!user;
  // const { profile, fetchProfile } = useProfile();

  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : internalExpanded;
  const setExpanded = useCallback(
    (v: boolean) => {
      if (!isControlled) setInternalExpanded(v);
      onExpandedChange?.(v);
    },
    [onExpandedChange, isControlled]
  );

  const closeMobile = useCallback(() => onMobileOpenChange(false), [onMobileOpenChange]);

  // AUTH DISABLED: profile fetch + avatar reset.
  // useEffect(() => { if (isAuth && !profile) fetchProfile(); }, [isAuth, profile, fetchProfile]);
  // useEffect(() => { setImageError(false); }, [user?.picture]);

  const headerMobile = (
    <div className="flex items-center justify-end flex-shrink-0 mb-4 min-h-11 px-2 md:hidden">
      <button type="button" onClick={closeMobile} className={btn} aria-label="Close menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
      </button>
    </div>
  );

  const headerDesktop = (
    <div className="hidden md:flex items-center justify-center flex-shrink-0 mb-4 min-h-11">
      {expanded ? (
        <button type="button" onClick={() => setExpanded(false)} className={`ml-auto flex-shrink-0 ${btn}`} aria-label="Collapse">&lt;&lt;</button>
      ) : (
        <button type="button" onClick={() => setExpanded(true)} className={btn} aria-label="Expand">&gt;&gt;</button>
      )}
    </div>
  );

  const nav = (
    <nav className="flex flex-col gap-2 flex-1 min-h-0 relative justify-evenly">
      {APP_SECTIONS.map(({ id, label, path, Icon }) => {
        const isActive = activeSection === id;
        return (
          <div key={id} className="relative group/item isolate">
            {isActive ? (
              <div className="absolute left-1 right-1 inset-y-0 rounded-xl bg-gradient-to-b from-violet-400 to-purple-500 dark:from-violet-500 dark:to-purple-600 opacity-25 blur-xl pointer-events-none -z-10" />
            ) : null}
            <Link href={path} prefetch={true} onClick={closeMobile} className={`flex items-center gap-3 w-full h-14 py-0 px-2 rounded-xl transition-colors ${isActive ? "text-violet-600 dark:text-violet-400 bg-white/25 dark:bg-black/25" : "text-gray-600 dark:text-gray-300 hover:bg-white/15 dark:hover:bg-black/15"}`}>
              <span className={`flex items-center justify-center flex-shrink-0 w-12 h-12 overflow-hidden ${isActive ? "scale-110" : "transition-transform duration-200 group-hover/item:scale-125"}`}>
                <Icon size={24} className={isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-600 dark:text-gray-300 group-hover/item:text-violet-500 dark:group-hover/item:text-violet-400"} />
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate hidden md:group-data-[expanded=true]:inline">{label}</span>
            </Link>
            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 shadow-lg border border-gray-700/50 dark:border-gray-300/50 pointer-events-none z-[200] opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 whitespace-nowrap md:group-data-[expanded=true]:hidden">{label}</span>
          </div>
        );
      })}
      <div className="relative group/item isolate">
        <a
          href="https://github.com/Anshh-940/WebGPU-Studio"
          target="_blank"
          rel="noopener noreferrer"
          onClick={closeMobile}
          className="flex items-center gap-3 w-full h-14 py-0 px-2 rounded-xl transition-colors text-gray-600 dark:text-gray-300 hover:bg-white/15 dark:hover:bg-black/15"
          aria-label="Open WebGPU Studio on GitHub"
        >
          <span className="flex items-center justify-center flex-shrink-0 w-12 h-12 overflow-hidden transition-transform duration-200 group-hover/item:scale-125">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="text-gray-600 dark:text-gray-300 group-hover/item:text-violet-500 dark:group-hover/item:text-violet-400">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.28-.01-1.02-.02-2-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.3 0 .32.22.7.82.58C20.56 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0z" />
            </svg>
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate hidden md:group-data-[expanded=true]:inline">GitHub</span>
        </a>
        <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 shadow-lg border border-gray-700/50 dark:border-gray-300/50 pointer-events-none z-[200] opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 whitespace-nowrap md:group-data-[expanded=true]:hidden">GitHub</span>
      </div>
    </nav>
  );

  const themeBlock = (
    <div className="flex-shrink-0 mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 flex justify-start px-2">
      <ThemeToggle theme={theme} onThemeChange={onThemeChange} className="relative top-[65px]" />
    </div>
  );

  /* AUTH DISABLED: account block hidden (log in / sign up / avatar / plan / sign out).
  const profileBlock = (
    <div className="flex-shrink-0 mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
      {isLoading ? (
        <div className="text-xs text-gray-500 dark:text-gray-400 py-2 text-center">Loading...</div>
      ) : isAuth && user ? (
        <div className="flex flex-col gap-2 md:group-data-[expanded=true]:flex-row">
          <button type="button" onClick={() => { setProfileModalOpen(true); closeMobile(); }} className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-white/15 dark:hover:bg-black/15 transition-colors min-w-0 flex-1" title="View profile" aria-label="View profile">
            <span className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold overflow-hidden ${user.picture && !imageError ? "" : "bg-gradient-to-br from-violet-500 to-purple-600 text-white"}`}>
              {user.picture && !imageError ? <Image src={user.picture} alt={user.name || "User"} width={36} height={36} className="w-full h-full object-cover" onError={() => setImageError(true)} /> : getInitials(profile?.name || user.name || user.email)}
            </span>
            <div className="min-w-0 text-left hidden md:group-data-[expanded=true]:block">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{profile?.name || user.name || "Account"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{getPlanLabel(profile)}</p>
            </div>
          </button>
          <a href="/auth/logout" className="hidden md:group-data-[expanded=true]:flex flex-shrink-0 w-9 h-9 rounded-lg items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-white/15 dark:hover:bg-black/15 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" title="Sign out" aria-label="Sign out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" /><polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" /><line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" /></svg>
          </a>
        </div>
      ) : (
        <>
          <div className="hidden md:group-data-[expanded=true]:flex gap-2">
            <a href="/auth/login" onClick={() => removeSigningUpFlag()} className="flex-1 py-2 px-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white/15 dark:hover:bg-black/15 transition-colors text-center">Log in</a>
            <a href="/auth/login?screen_hint=signup" onClick={() => { try { sessionStorage.setItem("is_signing_up", "true"); } catch {} }} className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 transition-colors text-center">Sign up</a>
          </div>
          <a href="/auth/login" onClick={() => removeSigningUpFlag()} className="flex md:group-data-[expanded=true]:hidden items-center justify-center w-10 h-10 rounded-full border-2 border-dashed border-gray-400 dark:border-gray-500 text-gray-500 dark:text-gray-400 hover:border-violet-500 hover:text-violet-500 dark:hover:text-violet-400 transition-colors mx-auto" aria-label="Log in">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>
          </a>
        </>
      )}
    </div>
  );
  */

  return (
    <>
      {/* <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} theme={theme} /> */}

      <button type="button" onClick={() => onMobileOpenChange(true)} className="fixed left-4 top-4 z-40 w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 dark:bg-black/20 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 shadow-lg md:hidden" aria-label="Open menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
      </button>

      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" onClick={closeMobile} aria-hidden />}

      <aside
        data-expanded={expanded}
        className={`group fixed left-0 top-0 bottom-0 z-50 w-[72px] py-5 px-2 flex flex-col bg-white/20 dark:bg-black/20 backdrop-blur-2xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-xl transition-[transform,width] duration-200 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:left-4 md:top-1/2 md:bottom-auto md:h-[60vh] md:-translate-y-1/2 md:translate-x-0 md:rounded-2xl md:border md:border-gray-200/50 dark:md:border-gray-700/50
          md:w-[72px] md:data-[expanded=true]:w-[260px] md:data-[expanded=true]:px-3`}
        onClick={(e) => e.stopPropagation()}
      >
        {headerMobile}
        {headerDesktop}
        {nav}
        {themeBlock}
        {/* {profileBlock} */}
      </aside>
    </>
  );
}
