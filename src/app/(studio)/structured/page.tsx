"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { StructuredSection } from "@/studio/_components/features/structured/structured-section";
import { ErrorBoundary } from "@/studio/_components/common/error-boundary";
import { useStructuredSection } from "@/hooks/useStructuredSection";
import { getPageTitle } from "@/lib/page-titles";
import { pushStudioSection } from "@/lib/studio-nav";

export default function StructuredPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { auth, structured, chat } = useStructuredSection();

  useEffect(() => {
    document.title = getPageTitle(pathname ?? "/structured");
  }, [pathname]);

  const onSectionChange = (section: string) => {
    pushStudioSection(router, section);
  };

  return (
    <ErrorBoundary>
      <StructuredSection
        structuredPrompt={structured.structuredPrompt}
        onStructuredPromptChange={structured.setStructuredPrompt}
        onRunStructured={structured.runStructured}
        structuredResult={structured.structuredResult}
        structuredError={structured.structuredError}
        structuredLoading={structured.structuredLoading}
        isProcessing={chat.isProcessing}
        onCopy={structured.copyStructuredJSON}
        onDownload={structured.downloadStructuredJSON}
        copySuccess={structured.copySuccess}
        isFeatureDisabled={auth.isFeatureDisabled}
        activeSection="structured"
        onSectionChange={onSectionChange}
      />
    </ErrorBoundary>
  );
}
