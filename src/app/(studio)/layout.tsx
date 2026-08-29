"use client";

import { useState, useCallback, useEffect } from "react";
import { Sidebar } from "@/studio/_components/sidebar/sidebar";
import { StudioMainArea } from "@/studio/_components/studio-main-area";
import { useTheme } from "@/contexts/ThemeContext";
import { bootWebLLMRuntime } from "@/lib/ai/webllm-session";

// AUTH DISABLED: inactivity auto-logout and the login/onboarding notifications are
// switched off. Components remain in the codebase.
// import { InactivityLogout } from "@/studio/_components/common/inactivity-logout";
// import { AuthNotifications } from "@/studio/_components/auth/auth-notifications";
import { SidebarProvider } from "@/contexts/SidebarContext";
import styles from "../page.module.css";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, setTheme } = useTheme();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const expandSidebar = useCallback(() => setSidebarExpanded(true), []);
  const isLhsNavOpen = sidebarExpanded || mobileSidebarOpen;

  useEffect(() => {
    bootWebLLMRuntime();
  }, []);

  return (
    <SidebarProvider expandSidebar={expandSidebar} isLhsNavOpen={isLhsNavOpen}>
      <div className={`${styles.page} ${styles[theme]}`}>
        {/* <InactivityLogout /> */}
        {/* <AuthNotifications /> */}
        <Sidebar
          theme={theme}
          onThemeChange={setTheme}
          expanded={sidebarExpanded}
          onExpandedChange={setSidebarExpanded}
          mobileOpen={mobileSidebarOpen}
          onMobileOpenChange={setMobileSidebarOpen}
        />
        <StudioMainArea sidebarExpanded={sidebarExpanded}>{children}</StudioMainArea>
      </div>
    </SidebarProvider>
  );
}
