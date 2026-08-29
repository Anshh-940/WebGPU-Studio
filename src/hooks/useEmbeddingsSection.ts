/**
 * Section-scoped hook for the embeddings page.
 * Runs only useAuth and useEmbeddings.
 */

import { useAuth } from "./useAuth";
import { useEmbeddings } from "./useEmbeddings";

export function useEmbeddingsSection() {
  const auth = useAuth();
  const embeddings = useEmbeddings({
    isFeatureDisabled: auth.isFeatureDisabled,
    incrementQueryCount: auth.incrementQueryCount,
  });

  return {
    auth,
    embeddings,
  };
}
