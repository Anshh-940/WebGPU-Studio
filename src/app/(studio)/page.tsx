"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Welcome } from "@/studio/_components/features/home/welcome";
import { ChatSection } from "@/studio/_components/features/chat/chat-section";
import { ErrorBoundary } from "@/studio/_components/common/error-boundary";
import { useChatSection } from "@/hooks/useChatSection";
import { getPageTitle } from "@/lib/page-titles";
import { pushStudioSection } from "@/lib/studio-nav";

export default function HomePage() {
  const pathname = usePathname();
  const router = useRouter();
  const { auth, model, vision, chat } = useChatSection("chat");

  useEffect(() => {
    document.title = getPageTitle(pathname ?? "/");
  }, [pathname]);

  useEffect(() => {
    if (chat.messages.length === 0) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [chat.messages.length]);

  const showHero = chat.messages.length === 0 && !chat.pending;
  const showChat = chat.messages.length > 0 || chat.pending;

  const handleResetChat = () => {
    chat.resetChat();
    vision.setVisionImage(null);
  };

  return (
    <>
      {showHero && (
        <Welcome
          onNavigateToSection={(section) => pushStudioSection(router, section)}
          input={chat.input}
          onInputChange={chat.setInput}
          onSend={() => chat.sendChat()}
          pending={chat.pending}
          isFeatureDisabled={auth.isFeatureDisabled}
          modelId={model.modelId}
          onModelChange={model.setModelId}
          activeSection="chat"
          onStop={chat.stop}
        />
      )}
      {showChat && (
        <ErrorBoundary>
          <ChatSection
            messages={chat.messages}
            input={chat.input}
            onInputChange={chat.setInput}
            onSend={() => chat.sendChat()}
            pending={chat.pending}
            isProcessing={chat.isProcessing}
            processingText={chat.processingText}
            onReset={handleResetChat}
            onStop={chat.stop}
            chatFeedRef={chat.chatFeedRef}
            isFeatureDisabled={auth.isFeatureDisabled}
            modelId={model.modelId}
            onModelChange={model.setModelId}
            activeSection="chat"
            onSectionChange={(section) => pushStudioSection(router, section)}
            modelLoading={model.modelLoading}
            modelProgress={model.modelProgress}
          />
        </ErrorBoundary>
      )}
    </>
  );
}
