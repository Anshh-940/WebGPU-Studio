/**
 * Section-scoped hook for the finetune page.
 * Runs only useAuth and useFinetune.
 */

import { useAuth } from "./useAuth";
import { useFinetune } from "./useFinetune";

export function useFinetuneSection() {
  const auth = useAuth();
  const finetune = useFinetune({
    isFeatureDisabled: auth.isFeatureDisabled,
  });

  return {
    auth,
    finetune,
  };
}
