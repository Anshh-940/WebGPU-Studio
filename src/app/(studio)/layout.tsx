"use client";

import { useState, useEffect } from "react";
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isLhsNavOpen = mobileSidebarOpen;

  useEffect(() => {
    bootWebLLMRuntime();
  }, []);

  return (
    <SidebarProvider expandSidebar={() => undefined} isLhsNavOpen={isLhsNavOpen}>
      <div className={`${styles.page} ${styles[theme]}`}>
        {/* <InactivityLogout /> */}
        {/* <AuthNotifications /> */}
        <Sidebar
          theme={theme}
          onThemeChange={setTheme}
          mobileOpen={mobileSidebarOpen}
          onMobileOpenChange={setMobileSidebarOpen}
        />
        <StudioMainArea>{children}</StudioMainArea>
      </div>
    </SidebarProvider>
  );
}
