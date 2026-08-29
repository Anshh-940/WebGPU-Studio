/**
 * Main hook that combines all feature hooks.
 * activeSection is derived from the current route (pathname) and passed in.
 */

import { useAuth } from "./useAuth";
import { useModel } from "./useModel";
import { useChat } from "./useChat";
import { useVision } from "./useVision";
import { useStructured } from "./useStructured";
import { useEmbeddings } from "./useEmbeddings";
import { useFinetune } from "./useFinetune";
import { useTheme } from "@/contexts/ThemeContext";

export function useApp(activeSection: string) {
  const { theme, setTheme } = useTheme();
  const auth = useAuth();
  const model = useModel(activeSection);
  const vision = useVision();

  const defaultSystemPrompt =
    model.systemPrompt ??
    "You are WebGPU Studio, a concise local-first copilot. Be clear, structured, and brief.";

  const effectiveSystemPrompt = defaultSystemPrompt;

  const chat = useChat({
    activeSection,
    selectedPreset: model.selectedPreset,
    effectiveSystemPrompt,
    webLLMSupported: model.webLLMSupported,
    transformersJSSupported: model.transformersJSSupported,
    transformersJSWorkerRef: model.transformersJSWorkerRef,
    visionModelRef: model.visionModelRef,
    visionImage: vision.visionImage,
    modelId: model.modelId,
    ensureModelReady: model.ensureModelReady,
    setModelLoading: model.setModelLoading,
    setModelProgress: model.setModelProgress,
    setWebLLMStatus: model.setWebLLMStatus,
    isFeatureDisabled: auth.isFeatureDisabled,
    incrementQueryCount: auth.incrementQueryCount,
  });

  const structured = useStructured({
    selectedPreset: model.selectedPreset,
    effectiveSystemPrompt,
    webLLMSupported: model.webLLMSupported,
    setModelLoading: model.setModelLoading,
    setModelProgress: model.setModelProgress,
    setIsProcessing: chat.setIsProcessing,
    isFeatureDisabled: auth.isFeatureDisabled,
    incrementQueryCount: auth.incrementQueryCount,
  });

  const embeddings = useEmbeddings({
    isFeatureDisabled: auth.isFeatureDisabled,
    incrementQueryCount: auth.incrementQueryCount,
  });

  const finetune = useFinetune({
    isFeatureDisabled: auth.isFeatureDisabled,
  });

  return {
    theme,
    setTheme,
    activeSection,
    auth,
    model,
    vision,
    chat,
    structured,
    embeddings,
    finetune,
  };
}

