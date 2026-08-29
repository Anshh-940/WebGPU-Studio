/**
 * Hook for managing fine-tune state and operations
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useProfile } from "./useProfile";
import { logger } from "@/lib/utils/logger";

// AUTH DISABLED: fine-tuning is open to everyone, so no session lookup.
// import { useUser } from "@auth0/nextjs-auth0/client";

type PlanType = "Plus" | "Pro" | null;

export interface FinetuneFormData {
  action: "finetune";
  type: "finetune" | "vla";
  organizationId: string;
  epochs: number;
  steps: number;
  loraAdapters: number;
  loraAlpha?: string;
  datasetSize: number;
  batchSize?: number;
  gradientAccumulation?: number;
  modelName: string;
  baseModelName: string;
  library: string;
  dataseturl: string;
  modelSize: number;
  textField: string;
  hfToken: string;
  pushToHub: boolean;
  hfRepoName: string;
  isWandbTokenSecret: boolean;
  wandbTokenSecret: string;
  policyType?: string;
}

export interface EvaluateResponse {
  id: string;
  modelName: string;
  organizationId: string;
  errors?: string;
  status: string;
  creditsEstimate?: number;
  creditEstimation?: number;
}

export interface PlanLimits {
  loraAdapters: number[];
  maxEpochs: number;
  maxSteps: number;
  maxDatasetSize: number;
  batchSizes: number[];
  gradientAccumulations: number[];
  loraAlphas: string[];
  vlaBatchSizes: number[];
  vlaMaxStepsByPolicy: Record<string, number>;
}

interface UseFinetuneProps {
  isFeatureDisabled: boolean;
}

export function useFinetune(props: UseFinetuneProps) {
  // AUTH DISABLED: the isFeatureDisabled flag is ignored; fine-tuning is always open.
  void props;

  const { profile, loading: profileLoading, fetchProfile } = useProfile();

  // AUTH DISABLED: treated as always authorised.
  // const { user } = useUser();


  const [formData, setFormData] = useState<Partial<FinetuneFormData>>({
    action: "finetune",
    type: "finetune",
    epochs: 1,
    steps: 100,
    loraAdapters: 4,
    datasetSize: 100,
    batchSize: 2,
    gradientAccumulation: 4,
    modelName: "",
    baseModelName: "",
    library: "transformers",
    dataseturl: "",
    modelSize: 0.6,
    textField: "messages",
    hfToken: "",
    pushToHub: false,
    hfRepoName: "",
    isWandbTokenSecret: false,
    wandbTokenSecret: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluateResponse, setEvaluateResponse] = useState<EvaluateResponse | null>(null);

  // Plan per organization (from profile memberships)
  const planByOrgId = useMemo<Record<string, PlanType>>(() => {
    const map: Record<string, PlanType> = {};
    if (!profile?.memberships) return map;
    for (const membership of profile.memberships) {
      const orgId = membership.organization?.id;
      if (!orgId) continue;
      const subscription = membership.organization?.orgSubscription?.subscription;
      if (subscription?.title) {
        const title = subscription.title.toLowerCase();
        if (title.includes("pro")) {
          map[orgId] = "Pro";
        } else if (title.includes("plus")) {
          map[orgId] = "Plus";
        } else {
          map[orgId] = null;
        }
      } else {
        map[orgId] = null;
      }
    }
    return map;
  }, [profile]);

  // Get organization ID from profile (default/first org)
  const organizationId = useMemo(() => {
    if (!profile?.memberships || profile.memberships.length === 0) {
      return "";
    }
    return profile.memberships[0]?.organization?.id || "";
  }, [profile]);

  // Get list of organizations from profile
  const organizations = useMemo(() => {
    if (!profile?.memberships || profile.memberships.length === 0) {
      return [];
    }
    return profile.memberships.map((membership) => ({
      id: membership.organization?.id || "",
      name: membership.organization?.name || membership.organization?.fullName || "Unknown Organization",
    })).filter(org => org.id); // Filter out any invalid organizations
  }, [profile]);

  // Selected org (form value or first from profile)
  const selectedOrgId = formData.organizationId || organizationId;
  const selectedOrgPlan = planByOrgId[selectedOrgId] ?? null;

  // At least one org has Plus or Pro (so user can switch to it)
  const hasAnyOrgWithPlan = useMemo(() => {
    return organizations.some((org) => (planByOrgId[org.id] ?? null) !== null);
  }, [organizations, planByOrgId]);

  // Update organizationId when profile changes
  useEffect(() => {
    if (organizationId && !formData.organizationId) {
      setFormData(prev => ({ ...prev, organizationId }));
    }
  }, [organizationId, formData.organizationId]);

  // Default type by plan: Pro -> VLA, otherwise LLM
  useEffect(() => {
    if (!selectedOrgId) return;
    const defaultType = selectedOrgPlan === "Pro" ? "vla" : "finetune";
    const defaultLibrary = defaultType === "vla" ? "lerobot" : "transformers";
    setFormData(prev => ({
      ...prev,
      type: defaultType,
      library: defaultLibrary,
      ...(defaultType === "finetune" ? { policyType: undefined } : {}),
    }));
  }, [selectedOrgId, selectedOrgPlan]);

  // Keep library in sync with type: LLM → transformers, VLA → lerobot (no mix-and-match)
  useEffect(() => {
    const expectedLibrary = formData.type === "vla" ? "lerobot" : "transformers";
    if (formData.library !== expectedLibrary) {
      setFormData(prev => ({ ...prev, library: expectedLibrary }));
    }
  }, [formData.type, formData.library]);

  // Canonical LLM base models and their sizes (in billions of parameters)
  const MODEL_SIZE_BY_BASE_MODEL: Record<string, number> = {
    "google/gemma-3-270m-it": 0.27,
    "google/gemma-3n-E2B-it": 2,
    "google/gemma-3-12b-it": 12,
    "google/gemma-3-27b-it": 27,
    "openai/gpt-oss-20b": 20,
    "openai/gpt-oss-120b": 120,
    "meta-llama/Llama-3.2-1B-Instruct": 1,
    "meta-llama/Llama-3.2-3B-Instruct": 3,
    "meta-llama/Llama-3.1-8B-Instruct": 8,
    "meta-llama/Llama-3.3-70B-Instruct": 70,
    "microsoft/phi-4": 15,
    "Qwen/Qwen3-0.6B": 0.6,
    "Qwen/Qwen3-30B-A3B-Thinking-2507": 3,
    "Qwen/Qwen3-4B-Instruct-2507": 4,
    "Qwen/Qwen3-8B": 8,
  };

  // Plus tier: only LLM fine-tuning. Supported models per documentation.
  const PLUS_LLM_MODELS = [
    "openai/gpt-oss-20b",
    "meta-llama/Llama-3.2-1B-Instruct",
    "meta-llama/Llama-3.2-3B-Instruct",
    "Qwen/Qwen3-0.6B",
    "Qwen/Qwen3-4B-Instruct-2507",
    "google/gemma-3-270m-it",
    "google/gemma-3n-E2B-it",
  ] as const;

  // Pro tier: LLM supported models (includes all Plus models plus more).
  const PRO_LLM_MODELS = [
    "openai/gpt-oss-20b",
    "meta-llama/Llama-3.2-1B-Instruct",
    "meta-llama/Llama-3.2-3B-Instruct",
    "Qwen/Qwen3-0.6B",
    "Qwen/Qwen3-4B-Instruct-2507",
    "google/gemma-3-270m-it",
    "google/gemma-3n-E2B-it",
    "openai/gpt-oss-120b",
    "google/gemma-3-12b-it",
    "google/gemma-3-27b-it",
    "meta-llama/Llama-3.1-8B-Instruct",
    "meta-llama/Llama-3.3-70B-Instruct",
    "Qwen/Qwen3-30B-A3B-Thinking-2507",
    "Qwen/Qwen3-8B",
    "microsoft/phi-4",
  ] as const;

  // Policy types for VLA (Pro only): ACT, SmolVLA, Pi05
  const vlaPolicyTypes = ["act", "smolvla", "pi05"];

  // VLA step limits by policy (Pro tier)
  const VLA_MAX_STEPS_BY_POLICY: Record<string, number> = {
    act: 100000,
    smolvla: 20000,
    pi05: 3000,
  };

  // LLM base models for selected org's plan (Plus = restricted list, Pro = full list)
  const llmBaseModels = useMemo(() => {
    if (selectedOrgPlan === "Pro") return [...PRO_LLM_MODELS];
    if (selectedOrgPlan === "Plus") return [...PLUS_LLM_MODELS];
    return [...PLUS_LLM_MODELS];
  }, [selectedOrgPlan]); // eslint-disable-line react-hooks/exhaustive-deps -- PLUS_LLM_MODELS, PRO_LLM_MODELS are stable

  // Plus: only LLM. Pro: LLM + VLA.
  const allowVLA = selectedOrgPlan === "Pro";

  // Get plan-specific field configurations (based on selected org's plan)
  const getPlanLimits = useCallback(() => {
    const loraAdapterList = selectedOrgPlan === "Pro" ? [4, 8, 16, 32, 64] : [4, 8];
    const loraAlphasMatchR = loraAdapterList.map(String);
    if (selectedOrgPlan === "Pro") {
      return {
        loraAdapters: loraAdapterList,
        maxEpochs: 3,
        maxSteps: 1500,
        maxDatasetSize: 10000,
        batchSizes: [2, 4, 6],
        gradientAccumulations: [4, 6],
        loraAlphas: loraAlphasMatchR,
        vlaBatchSizes: [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32],
        vlaMaxStepsByPolicy: VLA_MAX_STEPS_BY_POLICY,
      };
    }
    if (selectedOrgPlan === "Plus") {
      return {
        loraAdapters: [4, 8],
        maxEpochs: 1,
        maxSteps: 250,
        maxDatasetSize: 1500,
        batchSizes: [2],
        gradientAccumulations: [4],
        loraAlphas: [] as string[],
        vlaBatchSizes: [] as number[],
        vlaMaxStepsByPolicy: {} as Record<string, number>,
      };
    }
    return {
      loraAdapters: [4, 8],
      maxEpochs: 1,
      maxSteps: 250,
      maxDatasetSize: 1500,
      batchSizes: [] as number[],
      gradientAccumulations: [] as number[],
      loraAlphas: [] as string[],
      vlaBatchSizes: [] as number[],
      vlaMaxStepsByPolicy: {} as Record<string, number>,
    };
  }, [selectedOrgPlan]); // eslint-disable-line react-hooks/exhaustive-deps -- VLA_MAX_STEPS_BY_POLICY is stable

  // Libraries: one per type — LLM → transformers, VLA → lerobot (UI shows as immutable)
  const libraries = formData.type === "vla" ? ["lerobot"] : ["transformers"];

  // Update form field
  const updateField = useCallback(
    <K extends keyof FinetuneFormData>(field: K, value: FinetuneFormData[K]) => {
      setFormData(prev => {
        // When baseModelName changes for LLM fine-tune, automatically derive modelSize
        if (field === "baseModelName") {
          const newBaseModelName = value as unknown as string;
          const derivedModelSize =
            prev.type !== "vla" ? MODEL_SIZE_BY_BASE_MODEL[newBaseModelName] ?? prev.modelSize : prev.modelSize;

          return {
            ...prev,
            baseModelName: newBaseModelName,
            modelSize: derivedModelSize,
          };
        }

        return { ...prev, [field]: value };
      });
      setError(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MODEL_SIZE_BY_BASE_MODEL is a stable constant
    []
  );

  // Validate form data
  const validateForm = useCallback((): string | null => {
    const limits = getPlanLimits();
    const type = formData.type || "finetune";
    
    if (!formData.action) return "Action is required";
    if (!formData.type) return "Type is required";
    if (!formData.organizationId) return "Organization ID is required";
    if (!formData.modelName) return "Model name is required";

    // Base model and model size are only required for LLM fine-tuning (non-VLA)
    if (type !== "vla") {
      if (!formData.baseModelName) return "Base model is required";
      if (formData.modelSize === undefined || formData.modelSize === null || formData.modelSize === 0) {
        return "Model size is required";
      }
    }

    if (type !== "vla" && !formData.library) return "Library is required";
    if (!formData.dataseturl) return "Dataset URL is required";
    if (type !== "vla" && !formData.textField) return "Text field is required";
    
    if (type !== "vla") {
      if (formData.epochs && formData.epochs > limits.maxEpochs) {
        return `Epochs cannot exceed ${limits.maxEpochs} for ${selectedOrgPlan || "your"} plan`;
      }
      if (formData.loraAdapters && !limits.loraAdapters.includes(formData.loraAdapters)) {
        return `LoRA adapters must be one of: ${limits.loraAdapters.join(", ")}`;
      }
    }
    if (formData.steps && formData.steps > limits.maxSteps) {
      return `Steps cannot exceed ${limits.maxSteps} for ${selectedOrgPlan || "your"} plan`;
    }
    if (formData.datasetSize && formData.datasetSize > limits.maxDatasetSize) {
      return `Dataset size cannot exceed ${limits.maxDatasetSize} for ${selectedOrgPlan || "your"} plan`;
    }
    
    if (type === "vla" && !formData.policyType) {
      return "Policy type is required for VLA fine-tuning";
    }
    
    if (formData.pushToHub && !formData.hfToken) {
      return "HuggingFace token is required when pushing to hub";
    }
    if (formData.pushToHub && !formData.hfRepoName) {
      return "HuggingFace repository name is required when pushing to hub";
    }
    
    if (formData.isWandbTokenSecret && !formData.wandbTokenSecret) {
      return "Weights & Biases token is required when using W&B";
    }
    
    if (selectedOrgPlan === "Pro") {
      if (formData.batchSize == null || formData.batchSize === undefined) return "Batch size is required for Pro plan";
      if (type !== "vla" && (formData.gradientAccumulation == null || formData.gradientAccumulation === undefined)) return "Gradient accumulation is required for Pro plan";
    }
    
    return null;
  }, [formData, getPlanLimits, selectedOrgPlan]);

  // Format API error with details for display
  const formatApiError = useCallback((data: { error?: string; message?: string; details?: Array<{ field?: string; message: string }> | Record<string, string> }) => {
    const main = data.error || data.message || "Unknown error occurred";
    const details = data.details;
    if (!details) return main;
    const lines: string[] = [];
    if (Array.isArray(details)) {
      for (const d of details) {
        const msg = typeof d === "object" && d !== null && "message" in d ? d.message : String(d);
        const field = typeof d === "object" && d !== null && "field" in d ? d.field : null;
        lines.push(field ? `• ${field}: ${msg}` : `• ${msg}`);
      }
    } else if (typeof details === "object" && details !== null) {
      for (const [k, v] of Object.entries(details)) {
        lines.push(`• ${k}: ${v}`);
      }
    }
    return lines.length > 0 ? `${main}\n\n${lines.join("\n")}` : main;
  }, []);

  // Evaluate fine-tune
  const evaluateFinetune = useCallback(async () => {
    // AUTH DISABLED: no login gate and no query cap.
    // if (isFeatureDisabled) {
    //   setError("Please login to continue...");
    //   return;
    // }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Determine effective type (Plus plan is always LLM fine-tune)
      const effectiveType: "finetune" | "vla" = selectedOrgPlan === "Plus" ? "finetune" : (formData.type || "finetune");

      // Build request body based on plan (Plus: LLM only). VLA must not include epochs, loraAdapters, library, gradientAccumulation.
      const requestBody: Record<string, unknown> = {
        action: formData.action,
        type: effectiveType,
        organizationId: formData.organizationId,
        steps: formData.steps,
        datasetSize: formData.datasetSize,
        modelName: formData.modelName,
        dataseturl: formData.dataseturl,
        hfToken: formData.hfToken || "",
        pushToHub: formData.pushToHub || false,
        hfRepoName: formData.hfRepoName || "",
        isWandbTokenSecret: formData.isWandbTokenSecret || false,
        wandbTokenSecret: formData.wandbTokenSecret || "",
      };

      if (effectiveType === "vla") {
        // VLA: omit epochs, loraAdapters, library, gradientAccumulation, loraAlpha
        if (selectedOrgPlan === "Pro") {
          requestBody.batchSize = formData.batchSize ?? 2;
        } else if (selectedOrgPlan === "Plus") {
          requestBody.batchSize = 2;
        }
      } else {
        // LLM fine-tune: include all fields
        requestBody.epochs = formData.epochs;
        requestBody.loraAdapters = formData.loraAdapters;
        requestBody.library = formData.library;
        requestBody.baseModelName = formData.baseModelName;
        requestBody.modelSize =
          typeof formData.modelSize === "string"
            ? parseFloat(formData.modelSize) || 0
            : formData.modelSize || 0;
        requestBody.textField = "messages";
        if (selectedOrgPlan === "Pro") {
          requestBody.loraAlpha = String(formData.loraAdapters ?? 4);
          requestBody.batchSize = formData.batchSize ?? 2;
          requestBody.gradientAccumulation = formData.gradientAccumulation ?? 4;
        } else if (selectedOrgPlan === "Plus") {
          requestBody.batchSize = 2;
          requestBody.gradientAccumulation = 4;
        }
      }

      // Add VLA-specific fields
      if (effectiveType === "vla" && formData.policyType) {
        requestBody.policyType = formData.policyType;
      }

      const response = await fetch("/api/finetune/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      // Safely parse JSON response
      let data: EvaluateResponse | { error: string };
      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (parseError) {
          logger.error("Failed to parse JSON response:", parseError);
          throw new Error("Invalid JSON response from server");
        }
      } else {
        const text = await response.text();
        data = { error: text || "Unknown error occurred" };
      }

      if (!response.ok) {
        throw new Error(
          formatApiError(data as Parameters<typeof formatApiError>[0]) ||
            `Failed to evaluate fine-tune (${response.status})`
        );
      }

      setEvaluateResponse(data as EvaluateResponse);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      logger.error("Error evaluating fine-tune:", err);
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, selectedOrgPlan, formatApiError]);

  // Reset form (default type: Pro -> VLA, otherwise LLM)
  const defaultType = selectedOrgPlan === "Pro" ? "vla" : "finetune";
  const defaultLibrary = defaultType === "vla" ? "lerobot" : "transformers";
  const resetForm = useCallback(() => {
    setFormData({
      action: "finetune",
      type: defaultType,
      epochs: 1,
      steps: 100,
      loraAdapters: 4,
      datasetSize: 100,
      batchSize: 2,
      gradientAccumulation: 4,
      modelName: "",
      baseModelName: "",
      library: defaultLibrary,
      dataseturl: "",
      modelSize: 0.6,
      textField: "messages",
      hfToken: "",
      pushToHub: false,
      hfRepoName: "",
      isWandbTokenSecret: false,
      wandbTokenSecret: "",
      organizationId: organizationId || "",
    });
    setError(null);
    setEvaluateResponse(null);
  }, [organizationId, defaultType, defaultLibrary]);

  return {
    formData,
    updateField,
    loading,
    error,
    evaluateResponse,
    evaluateFinetune,
    resetForm,
    selectedOrgPlan,
    hasAnyOrgWithPlan,
    profileLoading,
    allowVLA,
    organizationId,
    organizations,
    getPlanLimits,
    llmBaseModels,
    vlaPolicyTypes,
    libraries,
    fetchProfile,
  };
}
