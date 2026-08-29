"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { EmbeddingsSection } from "@/studio/_components/features/embeddings/embeddings-section";
import { ErrorBoundary } from "@/studio/_components/common/error-boundary";
import { useEmbeddingsSection } from "@/hooks/useEmbeddingsSection";
import { getPageTitle } from "@/lib/page-titles";
import { pushStudioSection } from "@/lib/studio-nav";

export default function EmbeddingsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { auth, embeddings } = useEmbeddingsSection();

  useEffect(() => {
    document.title = getPageTitle(pathname ?? "/embeddings");
  }, [pathname]);

  const onSectionChange = (section: string) => {
    pushStudioSection(router, section);
  };

  return (
    <ErrorBoundary>
      <EmbeddingsSection
        embedMode={embeddings.embedMode}
        onEmbedModeChange={embeddings.setEmbedMode}
        embedText={embeddings.embedText}
        onEmbedTextChange={embeddings.setEmbedText}
        onRunEmbeddings={embeddings.runEmbeddings}
        onAddToLibrary={embeddings.addToLibrary}
        onRunSearch={embeddings.runSearch}
        searchQuery={embeddings.searchQuery}
        onSearchQueryChange={embeddings.setSearchQuery}
        onRemoveFromLibrary={embeddings.removeFromLibrary}
        onExportEmbeddings={embeddings.exportEmbeddings}
        embedLoading={embeddings.embedLoading}
        embedTexts={embeddings.embedTexts}
        allEmbeddings={embeddings.allEmbeddings}
        comparisonResults={embeddings.comparisonResults}
        storedTexts={embeddings.storedTexts}
        searchResults={embeddings.searchResults}
        isFeatureDisabled={auth.isFeatureDisabled}
        activeSection="embeddings"
        onSectionChange={onSectionChange}
      />
    </ErrorBoundary>
  );
}
