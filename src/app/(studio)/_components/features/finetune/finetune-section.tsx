"use client";

import { useEffect, useMemo, useState, useCallback, ReactNode, useRef } from "react";
import { Loader3D } from "@/studio/_components/common/loader-3d";
import { LoadingIcon, SendIcon } from "@/studio/_components/common/icons";
// AUTH DISABLED: login trigger no longer rendered.
// import { AuthLoginTrigger } from "@/studio/_components/auth/auth-login-trigger";
import styles from "@/app/page.module.css";
import type { FinetuneFormData, EvaluateResponse, PlanLimits } from "@/hooks/useFinetune";

interface FinetuneSectionProps {
  formData: Partial<FinetuneFormData>;
  updateField: <K extends keyof FinetuneFormData>(field: K, value: FinetuneFormData[K]) => void;
  loading: boolean;
  error: string | null;
  evaluateResponse: EvaluateResponse | null;
  evaluateFinetune: () => void;
  resetForm: () => void;
  selectedOrgPlan: "Plus" | "Pro" | null;
  hasAnyOrgWithPlan: boolean;
  profileLoading: boolean;
  allowVLA: boolean;
  organizationId: string;
  organizations: Array<{ id: string; name: string }>;
  getPlanLimits: () => PlanLimits;
  llmBaseModels: string[];
  vlaPolicyTypes: string[];
  libraries: string[];
  fetchProfile: () => void;
  isFeatureDisabled: boolean;
  isLoggedIn: boolean;
}

export function FinetuneSection({
  formData,
  updateField,
  loading,
  error,
  evaluateResponse,
  evaluateFinetune,
  resetForm,
  selectedOrgPlan,
  profileLoading,
  allowVLA,
  organizationId,
  organizations,
  getPlanLimits,
  llmBaseModels,
  vlaPolicyTypes,
  libraries,
  fetchProfile,
  isFeatureDisabled,
}: FinetuneSectionProps) {
  const limits = getPlanLimits();

  // AUTH DISABLED: fine-tuning is open to everyone, with no plan or login requirement.
  // const hasFinetuneAccess = !!selectedOrgPlan;
  // const isFormDisabled = isFeatureDisabled || !hasFinetuneAccess;
  const isFormDisabled = false;
  const [currentStep, setCurrentStep] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0])); // Track visited steps, start with first step
  const [expressMode, setExpressMode] = useState(false);

  // Generate options for numeric ranges
  const generateNumberOptions = (min: number, max: number, step: number = 1) => {
    const options = [];
    for (let i = min; i <= max; i += step) {
      options.push(i);
    }
    return options;
  };

  // Options for form fields
  const epochsOptions = useMemo(() => generateNumberOptions(1, limits.maxEpochs), [limits.maxEpochs]);
  const stepsOptions = useMemo(() => generateNumberOptions(10, limits.maxSteps, 10), [limits.maxSteps]);
  const datasetSizeOptions = useMemo(() => generateNumberOptions(10, limits.maxDatasetSize, 10), [limits.maxDatasetSize]);
  const actionOptions = ["finetune"];

  // Smart input helper - check if field should be read-only
  const shouldShowAsReadOnly = (options: unknown[]): boolean => {
    return options.length === 1;
  };

  // Determine read-only states
  const isActionReadOnly = shouldShowAsReadOnly(actionOptions);
  const isLibraryReadOnly = useMemo(() => libraries.length === 1, [libraries]);
  const isBatchSizeReadOnly = selectedOrgPlan === "Plus" || (selectedOrgPlan === "Pro" && limits.batchSizes.length === 1);
  const isGradientAccumulationReadOnly = selectedOrgPlan === "Plus" || (selectedOrgPlan === "Pro" && limits.gradientAccumulations.length === 1);

  // Fetch profile on mount when logged in
  useEffect(() => {
    if (!isFeatureDisabled) {
      fetchProfile();
    }
  }, [isFeatureDisabled, fetchProfile]);

  // Plus plan: only LLM. If type is VLA, reset to finetune.
  useEffect(() => {
    if (!allowVLA && formData.type === "vla") {
      updateField("type", "finetune");
      updateField("library", "transformers");
      updateField("policyType", undefined);
    }
  }, [allowVLA, formData.type, updateField]);

  // Section definitions - only include applicable sections
  const sections = useMemo(() => {
    type Section = {
      id: string;
      label: string;
      required: (keyof FinetuneFormData)[];
      color: string;
      optional?: boolean;
    };

    const modelRequiredFields: (keyof FinetuneFormData)[] = formData.type === "vla" ? ["modelName", "policyType"] : ["baseModelName", "modelName", "modelSize"];

    const basicRequired: (keyof FinetuneFormData)[] = formData.type === "vla" ? ["action", "type"] : ["action", "type", "library"];
    const trainingRequired: (keyof FinetuneFormData)[] = formData.type === "vla" ? ["steps"] : ["epochs", "steps", "loraAdapters"];

    const baseSections: Section[] = [
      { 
        id: 'basic', 
        label: 'Type & Library', 
        required: basicRequired,
        color: '#7c3aed'
      },
      { 
        id: 'model', 
        label: 'Model Selection', 
        required: modelRequiredFields,
        color: '#3b82f6'
      },
      { 
        id: 'training', 
        label: 'Training Parameters', 
        required: trainingRequired,
        color: '#10b981'
      },
      { 
        id: 'dataset', 
        label: 'Data Source', 
        required: (formData.type === 'vla' ? ['dataseturl', 'datasetSize'] : ['dataseturl', 'textField', 'datasetSize']) as (keyof FinetuneFormData)[],
        color: '#f59e0b'
      },
    ];

    // Optional sections
    baseSections.push(
      { 
        id: 'hf', 
        label: 'HuggingFace Hub', 
        required: [], 
        optional: true,
        color: '#ec4899'
      },
      { 
        id: 'wandb', 
        label: 'Weights & Biases', 
        required: [], 
        optional: true,
        color: '#06b6d4'
      }
    );

    return baseSections;
  }, [formData.type]);

  // Check if section is complete
  const isSectionComplete = useCallback((sectionId: string): boolean | null => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return null;
    
    if (section.optional) return true; // Optional sections always "complete"
    
    return section.required.every(field => {
      const value = formData[field];
      return value !== undefined && value !== null && value !== '' && value !== 0;
    });
  }, [sections, formData]);

  // Get section completion stats
  const completionStats = useMemo(() => {
    const completed = sections.filter(s => isSectionComplete(s.id) === true).length;
    return { completed, total: sections.length };
  }, [sections, isSectionComplete]);

  // Express mode completion - single step experience
  const isExpressComplete = useMemo(() => {
    const hasBaseModel = !!formData.baseModelName;
    const hasDatasetUrl = !!formData.dataseturl;
    const hasOrg = !!(formData.organizationId || organizationId);
    const isVla = formData.type === "vla";
    const hasPolicy = !!formData.policyType;

    if (isVla) {
      // VLA does not require a base model; require dataset, org, and policy type
      return hasDatasetUrl && hasOrg && hasPolicy;
    }

    // LLM fine-tune requires base model, dataset, and org
    return hasBaseModel && hasDatasetUrl && hasOrg;
  }, [formData.baseModelName, formData.dataseturl, formData.organizationId, formData.policyType, formData.type, organizationId]);

  // Group base models by provider for nicer dropdowns
  const groupedBaseModels = useMemo(() => {
    const groups: Record<string, { label: string; models: string[] }> = {};

    const providerLabel = (provider: string) => {
      const p = provider.toLowerCase();
      if (p === "google") return "Google";
      if (p === "openai") return "OpenAI";
      if (p === "meta-llama") return "Meta LLaMA";
      if (p === "microsoft") return "Microsoft";
      if (p === "qwen") return "Qwen";
      return provider;
    };

    llmBaseModels.forEach(model => {
      const [provider] = model.split("/");
      const label = providerLabel(provider);
      if (!groups[provider]) {
        groups[provider] = { label, models: [] };
      }
      groups[provider].models.push(model);
    });

    return Object.entries(groups).map(([provider, info]) => ({
      id: provider,
      label: info.label,
      models: info.models,
    }));
  }, [llmBaseModels]);

  const renderBaseModelSelect = (
    value: string,
    onChange: (val: string) => void,
    placeholder: string = "Select base model"
  ) => (
    <select
      className={styles.finetuneFormSelect}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={isFormDisabled || loading}
    >
      <option value="">{placeholder}</option>
      {groupedBaseModels.map(group => (
        <optgroup key={group.id} label={group.label}>
          {group.models.map(model => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );

  // Help tooltip component
  const HelpTooltip = ({ text }: { text: string }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const tooltipRef = useRef<HTMLDivElement>(null);
    const tooltipContentRef = useRef<HTMLDivElement>(null);
    const iconRef = useRef<HTMLButtonElement>(null);

    // Calculate tooltip position to prevent overflow
    useEffect(() => {
      if (showTooltip && iconRef.current && tooltipContentRef.current) {
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
          if (!iconRef.current || !tooltipContentRef.current) return;
          
          const iconRect = iconRef.current.getBoundingClientRect();
          const tooltipRect = tooltipContentRef.current.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const padding = 20;
          
          // Calculate positions for each direction
          const spaceTop = iconRect.top;
          const spaceBottom = viewportHeight - iconRect.bottom;
          const spaceLeft = iconRect.left;
          const spaceRight = viewportWidth - iconRect.right;
          
          const tooltipWidth = tooltipRect.width;
          const tooltipHeight = tooltipRect.height;
          
          let position: 'top' | 'bottom' | 'left' | 'right' = 'top';
          const style: React.CSSProperties = {};
          
          // Determine best position based on available space
          if (spaceTop >= tooltipHeight + padding && spaceTop >= spaceBottom) {
            position = 'top';
            // Adjust horizontal position to prevent overflow
            const centerX = iconRect.left + iconRect.width / 2;
            const halfWidth = tooltipWidth / 2;
            if (centerX - halfWidth < padding) {
              style.left = `${padding}px`;
              style.transform = 'translateX(0)';
            } else if (centerX + halfWidth > viewportWidth - padding) {
              style.right = `${padding}px`;
              style.left = 'auto';
              style.transform = 'translateX(0)';
            }
          } else if (spaceBottom >= tooltipHeight + padding) {
            position = 'bottom';
            // Adjust horizontal position to prevent overflow
            const centerX = iconRect.left + iconRect.width / 2;
            const halfWidth = tooltipWidth / 2;
            if (centerX - halfWidth < padding) {
              style.left = `${padding}px`;
              style.transform = 'translateX(0)';
            } else if (centerX + halfWidth > viewportWidth - padding) {
              style.right = `${padding}px`;
              style.left = 'auto';
              style.transform = 'translateX(0)';
            }
          } else if (spaceRight >= tooltipWidth + padding && spaceRight >= spaceLeft) {
            position = 'right';
          } else if (spaceLeft >= tooltipWidth + padding) {
            position = 'left';
          } else {
            // Default to top if no good position
            position = 'top';
            // Constrain to viewport
            style.maxWidth = `${viewportWidth - 2 * padding}px`;
            style.left = `${padding}px`;
            style.transform = 'translateX(0)';
          }
          
          setTooltipPosition(position);
          setTooltipStyle(style);
        });
      }
    }, [showTooltip]);

    // Click outside detection
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
          setShowTooltip(false);
        }
      };

      if (showTooltip) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }
    }, [showTooltip]);

    return (
      <div className={styles.helpTooltipContainer} ref={tooltipRef}>
        <button
          ref={iconRef}
          type="button"
          className={styles.helpIcon}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowTooltip(!showTooltip);
          }}
          aria-label="Show help information"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M6 4.5V4.25C6 3.83579 6.33579 3.5 6.75 3.5C7.16421 3.5 7.5 3.83579 7.5 4.25V4.5C7.5 4.91421 7.16421 5.25 6.75 5.25H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="6" cy="8" r="0.5" fill="currentColor"/>
          </svg>
        </button>
        {showTooltip && (
          <div 
            ref={tooltipContentRef}
            className={`${styles.helpTooltip} ${styles[`helpTooltip${tooltipPosition.charAt(0).toUpperCase() + tooltipPosition.slice(1)}`]}`}
            style={tooltipStyle}
          >
            {text}
          </div>
        )}
      </div>
    );
  };

  // Get section content for wizard mode - returns the JSX for each section
  const getSectionContent = (sectionId: string): ReactNode => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return null;

    switch (sectionId) {
      case 'basic':
        return (
          <div className={styles.finetuneFormRow}>
            {organizations.length > 0 && (
              <div className={styles.finetuneFormField}>
                <label className={styles.finetuneFormLabel}>
                  Organization
                  <HelpTooltip text="Select the organization for this fine-tuning job. The model will be associated with this organization." />
                </label>
                <select
                  className={styles.finetuneFormSelect}
                  value={formData.organizationId || organizationId || ""}
                  onChange={(e) => updateField("organizationId", e.target.value)}
                  disabled={isFeatureDisabled || loading}
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className={styles.finetuneFormField}>
              <label className={styles.finetuneFormLabel}>
                Action
                <HelpTooltip text="The action type for fine-tuning. Currently only 'Fine-tune' is available." />
              </label>
              {renderSmartInput(
                "action",
                formData.action || "finetune",
                actionOptions,
                isActionReadOnly,
                (value) => updateField("action", value as "finetune"),
                "Fine-tune"
              )}
            </div>
            <div className={styles.finetuneFormField}>
              <label className={styles.finetuneFormLabel}>
                Type
                <HelpTooltip text="Choose between LLM Fine-tuning for language models or VLA (Vision-Language-Action) for robotics. VLA requires Pro subscription." />
              </label>
              <select
                className={styles.finetuneFormSelect}
                value={formData.type || "finetune"}
                onChange={(e) => {
                  const value = e.target.value as "finetune" | "vla";
                  if (!allowVLA && value === "vla") return;
                  updateField("type", value);
                  if (value === "vla") {
                    updateField("library", "lerobot");
                  } else {
                    updateField("library", "transformers");
                    updateField("policyType", undefined);
                  }
                }}
                disabled={isFormDisabled || loading}
              >
                <option value="finetune">LLM Fine-tuning</option>
                <option value="vla" disabled={!allowVLA} title={!allowVLA ? "Upgrade to Pro for VLA fine-tuning" : undefined}>
                  VLA (Robotics){!allowVLA ? " — Pro only" : ""}
                </option>
              </select>
              {!allowVLA && selectedOrgPlan === "Plus" && (
                <p className={styles.finetuneTypeUpgradeNote}>
                  For VLA fine-tuning you need to upgrade your subscription to Pro.
                </p>
              )}
            </div>
            {formData.type !== "vla" && (
              <div className={styles.finetuneFormField}>
                <label className={styles.finetuneFormLabel}>
                  Library
                  <HelpTooltip text="The library to use for fine-tuning. Automatically set based on type selection." />
                </label>
                {renderSmartInput(
                  "library",
                  formData.library || "transformers",
                  libraries,
                  isLibraryReadOnly,
                  (value) => updateField("library", value as string)
                )}
              </div>
            )}
          </div>
        );
      case 'model':
        if (formData.type === "vla") {
          // VLA: model name and policy type in same row (no base model or size)
          return (
            <div className={styles.finetuneFormRow}>
              <div className={styles.finetuneFormField}>
                <label className={styles.finetuneFormLabel}>
                  Model Name
                  <HelpTooltip text="A unique name for your VLA policy. This will be used to identify your model." />
                </label>
                <input
                  type="text"
                  className={styles.finetuneFormInput}
                  value={formData.modelName || ""}
                  onChange={(e) => updateField("modelName", e.target.value)}
                  placeholder="my-vla-policy"
                  disabled={isFormDisabled || loading}
                />
              </div>
              <div className={styles.finetuneFormField}>
                <label className={styles.finetuneFormLabel}>
                  Policy Type
                  <HelpTooltip text="Select the VLA policy type: ACT (Action Chunking Transformer), SmolVLA (Small Vision-Language-Action), or PI05 (Physical Intelligence)." />
                </label>
                <select
                  className={styles.finetuneFormSelect}
                  value={formData.policyType || ""}
                  onChange={(e) => updateField("policyType", e.target.value)}
                  disabled={isFormDisabled || loading}
                >
                  <option value="">Select policy type</option>
                  {vlaPolicyTypes.map((policy) => (
                    <option key={policy} value={policy}>
                      {policy}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        }

        // LLM fine-tune: show base model, model name, and derived model size (read-only)
        return (
          <div className={styles.finetuneFormRow}>
            <div className={`${styles.finetuneFormField} ${styles.finetuneFormFieldFull}`}>
              <label className={styles.finetuneFormLabel}>
                Base Model
                <HelpTooltip text="Select the pre-trained base model to fine-tune. Different models have different capabilities and sizes." />
              </label>
              {renderBaseModelSelect(formData.baseModelName || "", (val) => updateField("baseModelName", val))}
            </div>
            <div className={styles.finetuneFormField}>
              <label className={styles.finetuneFormLabel}>
                Model Name
                <HelpTooltip text="A unique name for your fine-tuned model. This will be used to identify your model." />
              </label>
              <input
                type="text"
                className={styles.finetuneFormInput}
                value={formData.modelName || ""}
                onChange={(e) => updateField("modelName", e.target.value)}
                placeholder="my-finetuned-model"
                disabled={isFormDisabled || loading}
              />
            </div>
            <div className={styles.finetuneFormField}>
              <label className={styles.finetuneFormLabel}>
                Model Size
                <HelpTooltip text="The size of the model in billions of parameters. Automatically derived from the selected base model." />
              </label>
              <input
                type="number"
                step="0.1"
                className={styles.finetuneFormInput}
                value={formData.modelSize ?? ""}
                readOnly
                disabled
                placeholder="Select a base model to see size"
              />
            </div>
          </div>
        );
      case 'training': {
        const isVla = formData.type === "vla";
        const gridClass = isVla
          ? `${styles.finetuneTrainingGrid} ${styles.finetuneTrainingGridVla}`
          : `${styles.finetuneTrainingGrid} ${styles.finetuneTrainingGridLlm}`;
        return (
          <div className={gridClass}>
            {isVla ? (
              <>
                <div className={styles.finetuneFormField}>
                  <label className={styles.finetuneFormLabel}>
                    Steps
                    <HelpTooltip text="Number of training steps. Each step processes a batch of data. Higher steps = more training iterations." />
                  </label>
                  <select
                    className={styles.finetuneFormSelect}
                    value={formData.steps || 100}
                    onChange={(e) => updateField("steps", parseInt(e.target.value))}
                    disabled={isFormDisabled || loading}
                  >
                    {stepsOptions.map((step) => (
                      <option key={step} value={step}>
                        {step}
                      </option>
                    ))}
                  </select>
                </div>
                {(selectedOrgPlan === "Pro" || selectedOrgPlan === "Plus") && (
                  <div className={styles.finetuneFormField}>
                    <label className={styles.finetuneFormLabel}>
                      Batch Size
                      <HelpTooltip text="Number of samples processed in one forward/backward pass. Larger batches = faster training but more memory." />
                    </label>
                    {renderSmartInput(
                      "batchSize",
                      formData.batchSize ?? 2,
                      limits.batchSizes,
                      isBatchSizeReadOnly,
                      (value) => updateField("batchSize", parseInt(value as string))
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className={styles.finetuneFormField}>
                  <label className={styles.finetuneFormLabel}>
                    Epochs
                    <HelpTooltip text="Number of complete passes through the training dataset. More epochs = better learning but longer training time." />
                  </label>
                  <select
                    className={styles.finetuneFormSelect}
                    value={formData.epochs || 1}
                    onChange={(e) => updateField("epochs", parseInt(e.target.value))}
                    disabled={isFormDisabled || loading}
                  >
                    {epochsOptions.map((epoch) => (
                      <option key={epoch} value={epoch}>
                        {epoch}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.finetuneFormField}>
                  <label className={styles.finetuneFormLabel}>
                    Steps
                    <HelpTooltip text="Number of training steps. Each step processes a batch of data. Higher steps = more training iterations." />
                  </label>
                  <select
                    className={styles.finetuneFormSelect}
                    value={formData.steps || 100}
                    onChange={(e) => updateField("steps", parseInt(e.target.value))}
                    disabled={isFormDisabled || loading}
                  >
                    {stepsOptions.map((step) => (
                      <option key={step} value={step}>
                        {step}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.finetuneFormField}>
                  <label className={styles.finetuneFormLabel}>
                    LoRA Adapters
                    <HelpTooltip text="LoRA (Low-Rank Adaptation) adapters control the number of trainable parameters. More adapters = more capacity but slower training." />
                  </label>
                  <select
                    className={styles.finetuneFormSelect}
                    value={formData.loraAdapters || 4}
                    onChange={(e) => updateField("loraAdapters", parseInt(e.target.value))}
                    disabled={isFormDisabled || loading}
                  >
                    {limits.loraAdapters.map((adapter: number) => (
                      <option key={adapter} value={adapter}>
                        {adapter}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedOrgPlan === "Pro" && (
                  <div className={styles.finetuneFormFieldLoraAlpha}>
                    <label className={styles.finetuneFormLabel}>LoRA α</label>
                    <div className={styles.finetuneLoraAlphaValue} title="Same as LoRA Adapters (lora_r)">
                      {formData.loraAdapters ?? 4}
                    </div>
                  </div>
                )}
                {(selectedOrgPlan === "Pro" || selectedOrgPlan === "Plus") && (
                  <div className={styles.finetuneFormField}>
                    <label className={styles.finetuneFormLabel}>
                      Batch Size
                      <HelpTooltip text="Number of samples processed in one forward/backward pass. Larger batches = faster training but more memory." />
                    </label>
                    {renderSmartInput(
                      "batchSize",
                      formData.batchSize ?? 2,
                      limits.batchSizes,
                      isBatchSizeReadOnly,
                      (value) => updateField("batchSize", parseInt(value as string))
                    )}
                  </div>
                )}
                {(selectedOrgPlan === "Pro" || selectedOrgPlan === "Plus") && (
                  <div className={styles.finetuneFormField}>
                    <label className={styles.finetuneFormLabel}>
                      Gradient Accumulation
                      <HelpTooltip text="Number of gradient accumulation steps. Allows effective larger batch sizes without increasing memory usage." />
                    </label>
                    {renderSmartInput(
                      "gradientAccumulation",
                      formData.gradientAccumulation ?? 4,
                      limits.gradientAccumulations,
                      isGradientAccumulationReadOnly,
                      (value) => updateField("gradientAccumulation", parseInt(value as string))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      }
      case 'dataset':
        return (
          <>
            <div className={styles.finetuneFormRow}>
              <div className={`${styles.finetuneFormField} ${styles.finetuneFormFieldFull}`}>
                <label className={styles.finetuneFormLabel}>
                  Dataset URL or HF identifier
                  <HelpTooltip text="Enter a full URL to your training dataset, or copy the org-name/dataset-name from the Hugging Face dataset page (e.g. username/my-dataset) and paste it here. The dataset should be in a format compatible with the selected library." />
                </label>
                <input
                  type="text"
                  className={styles.finetuneFormInput}
                  value={formData.dataseturl || ""}
                  onChange={(e) => updateField("dataseturl", e.target.value)}
                  placeholder="https://... or org-name/dataset-name"
                  disabled={isFormDisabled || loading}
                />
              </div>
            </div>
            {formData.type === "vla" ? (
              <div className={styles.finetuneFormRow}>
                <div className={styles.finetuneFormField}>
                  <label className={styles.finetuneFormLabel}>
                    Dataset Size
                    <HelpTooltip text="The number of training examples in your dataset. Larger datasets generally improve model performance." />
                  </label>
                  <select
                    className={styles.finetuneFormSelect}
                    value={formData.datasetSize || 100}
                    onChange={(e) => updateField("datasetSize", parseInt(e.target.value))}
                    disabled={isFormDisabled || loading}
                  >
                    {datasetSizeOptions.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className={styles.finetuneFormRow}>
                <div className={styles.finetuneFormField}>
                  <label className={styles.finetuneFormLabel}>
                    Text Field
                    <HelpTooltip text="The field name in your dataset that contains the text to fine-tune on. Default is 'messages'." />
                  </label>
                  <input
                    type="text"
                    className={styles.finetuneFormInput}
                    value="messages"
                    placeholder="messages"
                    readOnly
                    disabled={isFormDisabled || loading}
                  />
                </div>
                <div className={styles.finetuneFormField}>
                  <label className={styles.finetuneFormLabel}>
                    Dataset Size
                    <HelpTooltip text="The number of training examples in your dataset. Larger datasets generally improve model performance." />
                  </label>
                  <select
                    className={styles.finetuneFormSelect}
                    value={formData.datasetSize || 100}
                    onChange={(e) => updateField("datasetSize", parseInt(e.target.value))}
                    disabled={isFormDisabled || loading}
                  >
                    {datasetSizeOptions.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </>
        );
      case 'hf':
        return (
          <>
            <div className={styles.finetuneFormRow}>
              <div className={styles.finetuneFormField}>
                <label className={styles.finetuneFormCheckboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.finetuneFormCheckbox}
                    checked={formData.pushToHub || false}
                    onChange={(e) => updateField("pushToHub", e.target.checked)}
                    disabled={isFormDisabled || loading}
                  />
                  <span>Push to Hub</span>
                  <HelpTooltip text="Push your model directly to HuggingFace Hub. When enabled, both a HuggingFace access token and repository name (username/repo-name) are required." />
                </label>
              </div>
            </div>
            {formData.pushToHub && (
              <div className={styles.finetuneFormRow}>
                <div className={styles.finetuneFormField}>
                  <label className={styles.finetuneFormLabel}>
                    HF Token
                    <HelpTooltip text="Your HuggingFace access token. Get it from https://huggingface.co/settings/tokens" />
                  </label>
                  <input
                    type="text"
                    className={styles.finetuneFormInput}
                    value={formData.hfToken || ""}
                    onChange={(e) => updateField("hfToken", e.target.value)}
                    placeholder="hf_..."
                    disabled={isFormDisabled || loading}
                  />
                </div>
                <div className={styles.finetuneFormField}>
                  <label className={styles.finetuneFormLabel}>
                    HF Repository
                    <HelpTooltip text="Repository name in format 'username/repo-name'. The repository will be created if it doesn't exist." />
                  </label>
                  <input
                    type="text"
                    className={styles.finetuneFormInput}
                    value={formData.hfRepoName || ""}
                    onChange={(e) => updateField("hfRepoName", e.target.value)}
                    placeholder="username/repo"
                    disabled={isFormDisabled || loading}
                  />
                </div>
              </div>
            )}
          </>
        );
      case 'wandb':
        return (
          <div className={styles.finetuneFormRow}>
            <div className={styles.finetuneFormField}>
              <label className={styles.finetuneFormCheckboxLabel}>
                <input
                  type="checkbox"
                  className={styles.finetuneFormCheckbox}
                  checked={formData.isWandbTokenSecret || false}
                  onChange={(e) => updateField("isWandbTokenSecret", e.target.checked)}
                  disabled={isFormDisabled || loading}
                />
                <span>Use W&B</span>
                <HelpTooltip text="Enable Weights & Biases for experiment tracking and visualization. Track training metrics, losses, and model performance." />
              </label>
            </div>
            {formData.isWandbTokenSecret && (
              <div className={styles.finetuneFormField}>
                <label className={styles.finetuneFormLabel}>
                  W&B Token
                  <HelpTooltip text="Your Weights & Biases API token. Get it from https://wandb.ai/authorize" />
                </label>
                <input
                  type="text"
                  className={styles.finetuneFormInput}
                  value={formData.wandbTokenSecret || ""}
                  onChange={(e) => updateField("wandbTokenSecret", e.target.value)}
                  placeholder="wandb_token"
                  disabled={isFormDisabled || loading}
                />
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // Get section description
  const getSectionDescription = (sectionId: string): string => {
    const descriptions: Record<string, string> = {
      'basic': 'Select the type of fine-tuning (LLM or VLA) and the appropriate library. This determines the training framework and capabilities of your model.',
      'model': 'Choose your base model, assign a unique name, and specify the model size. The base model provides the foundation for fine-tuning, while the name helps identify your custom model.',
      'training': 'Configure training parameters that control how your model learns. Epochs determine training cycles, steps control iterations, LoRA adapters manage trainable parameters, and dataset size affects learning quality.',
      'dataset': 'Provide a URL to your training dataset or the Hugging Face identifier (org-name/dataset-name). The dataset contains the examples your model will learn from during fine-tuning.',
      'hf': 'Optional: Upload your fine-tuned model to HuggingFace Hub for easy sharing and deployment. This allows others to access and use your model.',
      'wandb': 'Optional: Enable Weights & Biases integration to track training metrics, visualize performance, and monitor your fine-tuning progress in real-time.'
    };
    return descriptions[sectionId] || '';
  };

  // Render form section
  const renderFormSection = (
    sectionId: string,
    title: string,
    children: ReactNode,
    color: string,
    isOptional?: boolean
  ) => {
    const description = getSectionDescription(sectionId);
    return (
      <div 
        id={`section-${sectionId}`}
        className={styles.finetuneFormGroup}
        style={{ borderLeftColor: color, borderLeftWidth: '3px', borderLeftStyle: 'solid' }}
      >
        <div className={styles.finetuneFormGroupHeader}>
          <h3 className={styles.finetuneFormGroupTitle}>
            {title}
            {isOptional && <span className={styles.finetuneOptionalBadge}>Optional</span>}
          </h3>
        </div>
        {description && (
          <p className={styles.finetuneFormGroupDescription}>
            {description}
          </p>
        )}
        <div className={styles.finetuneFormContent}>
          {children}
        </div>
      </div>
    );
  };

  // Render smart input - either read-only display or dropdown
  const renderSmartInput = (
    fieldName: string,
    value: unknown,
    options: unknown[],
    isReadOnly: boolean,
    onChange?: (value: unknown) => void,
    displayValue?: string
  ) => {
    if (isReadOnly && options.length === 1) {
      return (
        <div className={styles.finetuneFormReadOnly}>
          {displayValue ?? String(value ?? options[0] ?? "")}
        </div>
      );
    }
    return (
      <select
        className={styles.finetuneFormSelect}
        value={typeof value === "string" || typeof value === "number" ? value : ""}
        onChange={(e) => onChange && onChange(e.target.value)}
        disabled={isFormDisabled || loading}
      >
        {options.map((option, i) => (
          <option key={i} value={String(option)}>
            {String(option)}
          </option>
        ))}
      </select>
    );
  };

  // Get status badge color
  const getStatusBadgeClass = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower.includes("success") || statusLower.includes("completed")) {
      return styles.finetuneStatusBadgeSuccess;
    }
    if (statusLower.includes("pending") || statusLower.includes("processing")) {
      return styles.finetuneStatusBadgePending;
    }
    if (statusLower.includes("error") || statusLower.includes("failed")) {
      return styles.finetuneStatusBadgeError;
    }
    return styles.finetuneStatusBadge;
  };

  // Handle start new fine-tune
  const handleStartNewFinetune = () => {
    resetForm();
    setCurrentStep(0);
    setVisitedSteps(new Set([0])); // Reset visited steps, keep first step visited
  };

  // Handle step navigation and mark as visited
  const handleStepChange = (newStep: number) => {
    setCurrentStep(newStep);
    setVisitedSteps(prev => new Set([...prev, newStep]));
  };

  return (
    <div className={styles.finetuneSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.finetuneHeader}>
          <h2 className={styles.sectionTitle}>CREATE POWERFUL MODELS FOR YOUR WORLD!</h2>
          <p className={styles.finetuneHookLine}>A new way to automatically train, evaluate, and deploy state-of-the-art LLM and VLA models.</p>
        </div>
        <button
          type="button"
          className={styles.badgeMuted}
          onClick={() => setExpressMode(prev => !prev)}
          /* AUTH DISABLED: mode switch always available. */
          title={expressMode ? "Currently in Express mode. Click to try Advanced mode." : "Currently in Advanced mode. Click to try Express mode."}
        >
          {expressMode ? "Try Advanced mode" : "Try Express mode"}
        </button>
      </div>

      {profileLoading && !isFeatureDisabled && (
        <div className={styles.finetuneLoadingPlan}>
          <p>Loading your subscription plan...</p>
        </div>
      )}

      {/* AUTH DISABLED: login prompt and subscription upgrade banners hidden.
      {!isLoggedIn && (
        <div className={styles.finetuneDisabled}>
          <p>
            Please login to access this feature.{" "}
            <AuthLoginTrigger className={styles.finetuneSubscribeLink}>
              Log in
            </AuthLoginTrigger>
          </p>
        </div>
      )}

      {isLoggedIn && !profileLoading && !hasAnyOrgWithPlan && (
        <div className={styles.finetuneUpgradeBanner}>
          <p>
            You need a Plus or Pro subscription to access fine-tuning.
          </p>
        </div>
      )}

      {isLoggedIn && !profileLoading && hasAnyOrgWithPlan && !hasFinetuneAccess && (
        <div className={styles.finetuneUpgradeBanner}>
          <p>
            Selected organization doesn&apos;t have a Plus or Pro plan. Switch to another organization or upgrade.
          </p>
        </div>
      )}
      */}

      {(
        <div className={styles.finetuneContainer}>
          {/* Results Display - Show only when response exists and not loading */}
          {evaluateResponse && !loading ? (
            <div className={styles.finetuneResults}>
              <div className={styles.finetuneResultsHeader}>
                <h4 className={styles.resultsTitle}>Fine-tuning Results</h4>
                <span className={`${styles.finetuneStatusBadge} ${getStatusBadgeClass(evaluateResponse.status)}`}>
                  {evaluateResponse.status}
                </span>
              </div>
              <div className={styles.finetuneResultsGrid}>
                <div className={styles.finetuneResultItem}>
                  <span className={styles.finetuneResultLabel}>Job ID</span>
                  <span className={styles.finetuneResultValue}>{evaluateResponse.id}</span>
                </div>
                <div className={styles.finetuneResultItem}>
                  <span className={styles.finetuneResultLabel}>Model Name</span>
                  <span className={styles.finetuneResultValue}>{evaluateResponse.modelName}</span>
                </div>
                {/* Credit estimate card - display commented out for now
                <div className={styles.finetuneResultItem}>
                  <span className={styles.finetuneResultLabel}>Credit Estimate</span>
                  <span className={`${styles.finetuneResultValue} ${styles.finetuneResultValueCredit}`}>
                    {evaluateResponse.creditsEstimate || evaluateResponse.creditEstimation || "N/A"}
                  </span>
                </div>
                */}
              </div>
              {evaluateResponse.errors && (
                <div className={styles.finetuneResultError}>
                  <span className={styles.finetuneResultErrorLabel}>Errors</span>
                  <span className={styles.finetuneResultErrorValue}>{evaluateResponse.errors}</span>
                </div>
              )}
              <div className={styles.finetuneHubMessage}>
                <div className={styles.finetuneHubIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className={styles.finetuneHubContent}>
                  <h5 className={styles.finetuneHubTitle}>Your model is being fine-tuned!</h5>
                  <p className={styles.finetuneHubText}>
                    Your fine-tune has begun. You can check the results under your organization{" "}
                    <span className={styles.finetuneHubLink}>
                      {organizations.find((o) => o.id === (formData.organizationId || organizationId))?.name ?? ""}/{formData.modelName || evaluateResponse?.modelName || ""}
                    </span>
                    .
                  </p>
                </div>
              </div>
              <div className={styles.finetuneResultsActions}>
                <button
                  type="button"
                  className={styles.finetuneStartNewButton}
                  onClick={handleStartNewFinetune}
                  disabled={loading}
                >
                  Start New Fine-tune
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Progress Checkpoint Component - Only show when no results */}
              {expressMode ? (
                <div className={styles.progressCheckpoint}>
                  <div className={styles.progressHeader}>
                    <span className={styles.progressTitle}>Express Setup</span>
                    <span className={styles.progressCount}>
                      {isExpressComplete ? "1" : "0"}/1
                    </span>
                  </div>
                  <div className={styles.progressSteps}>
                    <div className={styles.progressStep}>
                      <div
                        className={`${styles.progressCircle} ${
                          isExpressComplete ? styles.progressComplete : styles.progressIncomplete
                        }`}
                        title={isExpressComplete ? "Express setup ready" : "Provide required fields to continue"}
                      >
                        {isExpressComplete ? (
                          <svg
                            className={styles.progressCheckmarkIcon}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <div className={styles.progressIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                              <path d="M9 9h6v6H9z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <span className={styles.progressLabel}>Express</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.progressCheckpoint}>
                  <div className={styles.progressHeader}>
                    <span className={styles.progressTitle}>Setup Progress</span>
                    <span className={styles.progressCount}>
                      {completionStats.completed}/{completionStats.total}
                    </span>
                  </div>
                  <div className={styles.progressSteps}>
                    <div className={styles.progressConnectorsLayer} aria-hidden>
                      {sections.length > 1 &&
                        sections.map((_, index) => {
                          if (index === 0) return null;
                          const prevComplete =
                            isSectionComplete(sections[index - 1].id) === true && visitedSteps.has(index - 1);
                          const n = sections.length;
                          const segmentLeft = (index - 0.5) / n;
                          return (
                            <div
                              key={`connector-${index}`}
                              className={`${styles.progressConnectorSegment} ${
                                prevComplete ? styles.progressConnectorComplete : ""
                              }`}
                              style={{
                                left: `calc(20px + ${segmentLeft} * (100% - 40px))`,
                                width: `calc((100% - 40px) / ${n})`,
                              }}
                            />
                          );
                        })}
                    </div>
                    <div
                      className={styles.progressRobotWrapper}
                      style={{
                        left:
                          sections.length > 0
                            ? `calc(20px + (${Math.min(currentStep + 1, sections.length - 1)} / ${
                                sections.length
                              }) * (100% - 40px))`
                            : "50%",
                      }}
                      aria-hidden
                    >
                      <svg
                        className={styles.progressRobotIcon}
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="10"
                          y="6"
                          width="12"
                          height="10"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          fill="var(--progress-circle-bg)"
                        />
                        <circle cx="14" cy="10" r="1.5" fill="currentColor" />
                        <circle cx="18" cy="10" r="1.5" fill="currentColor" />
                        <rect
                          x="12"
                          y="16"
                          width="3"
                          height="6"
                          rx="1"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          fill="none"
                        />
                        <rect
                          x="17"
                          y="16"
                          width="3"
                          height="6"
                          rx="1"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          fill="none"
                        />
                        <path d="M8 12h2M22 12h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    </div>
                    {sections.map((section, index) => {
                      const isComplete = isSectionComplete(section.id);
                      const hasBeenVisited = visitedSteps.has(index);
                      const showCheckmark = isComplete === true && hasBeenVisited;

                      return (
                        <div key={section.id} className={styles.progressStep}>
                          <div
                            className={`${styles.progressCircle} ${
                              showCheckmark
                                ? styles.progressComplete
                                : isComplete === false
                                ? styles.progressIncomplete
                                : styles.progressSkipped
                            }`}
                            onClick={() => handleStepChange(index)}
                            style={{ borderColor: section.color }}
                            title={`${section.label} - ${showCheckmark ? "Complete" : "Incomplete"}`}
                          >
                            {showCheckmark ? (
                              <svg
                                className={styles.progressCheckmarkIcon}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                              >
                                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <div className={styles.progressIcon} style={{ borderColor: section.color }}>
                                {section.id === "basic" && (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
                                  </svg>
                                )}
                                {section.id === "model" && (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <path d="M9 9h6v6H9z" />
                                  </svg>
                                )}
                                {section.id === "training" && (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 3v18h18" />
                                    <path d="M7 16l4-4 4 4 4-4" />
                                  </svg>
                                )}
                                {section.id === "dataset" && (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <path d="M14 2v6h6" />
                                    <path d="M16 13H8" />
                                    <path d="M16 17H8" />
                                    <path d="M10 9H8" />
                                  </svg>
                                )}
                                {section.id === "hf" && (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                  </svg>
                                )}
                                {section.id === "wandb" && (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 3v18h18" />
                                    <path d="M18 7c0 2-2 4-5 4s-5-2-5-4" />
                                    <path d="M18 12c0 2-2 4-5 4s-5-2-5-4" />
                                    <path d="M18 17c0 2-2 4-5 4s-5-2-5-4" />
                                  </svg>
                                )}
                              </div>
                            )}
                          </div>
                          <span className={styles.progressLabel}>{section.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Wizard / Express modes */}
              {expressMode ? (
                <div className={styles.wizardContainer}>
                  <div className={styles.wizardStep}>
                    {renderFormSection(
                      "express",
                      "Express Fine-tune",
                      <>
                        <div className={styles.finetuneFormRow}>
                          {organizations.length > 0 && (
                            <div className={styles.finetuneFormField}>
                              <label className={styles.finetuneFormLabel}>
                                Organization
                                <HelpTooltip text="Select the organization for this fine-tuning job. The model will be associated with this organization." />
                              </label>
                              <select
                                className={styles.finetuneFormSelect}
                                value={formData.organizationId || organizationId || ""}
                                onChange={(e) => updateField("organizationId", e.target.value)}
                                disabled={isFeatureDisabled || loading}
                              >
                                {organizations.map((org) => (
                                  <option key={org.id} value={org.id}>
                                    {org.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div className={styles.finetuneFormField}>
                            <label className={styles.finetuneFormLabel}>
                              Type
                              <HelpTooltip text="Choose between LLM Fine-tuning for language models or VLA (Vision-Language-Action) for robotics. VLA requires Pro subscription." />
                            </label>
                            <select
                              className={styles.finetuneFormSelect}
                              value={formData.type || "finetune"}
                              onChange={(e) => {
                                const value = e.target.value as "finetune" | "vla";
                                if (!allowVLA && value === "vla") return;
                                updateField("type", value);
                                if (value === "vla") {
                                  updateField("library", "lerobot");
                                } else {
                                  updateField("library", "transformers");
                                  updateField("policyType", undefined);
                                }
                              }}
                              disabled={isFormDisabled || loading}
                            >
                              <option value="finetune">LLM Fine-tuning</option>
                              <option
                                value="vla"
                                disabled={!allowVLA}
                                title={!allowVLA ? "Upgrade to Pro for VLA fine-tuning" : undefined}
                              >
                                VLA (Robotics){!allowVLA ? " — Pro only" : ""}
                              </option>
                            </select>
                            {!allowVLA && selectedOrgPlan === "Plus" && (
                              <p className={styles.finetuneTypeUpgradeNote}>
                                For VLA fine-tuning you need to upgrade your subscription to Pro.
                              </p>
                            )}
                          </div>
                        </div>
                        <div className={styles.finetuneFormRow}>
                          {formData.type !== "vla" && (
                            <div className={styles.finetuneFormField}>
                              <label className={styles.finetuneFormLabel}>
                                Base Model
                                <HelpTooltip text="Select the pre-trained base model to fine-tune. Different models have different capabilities and sizes." />
                              </label>
                              {renderBaseModelSelect(
                                formData.baseModelName || "",
                                (val) => updateField("baseModelName", val),
                                "Select base model"
                              )}
                            </div>
                          )}
                          <div className={styles.finetuneFormField}>
                            <label className={styles.finetuneFormLabel}>
                              Model Name
                              <HelpTooltip text="A unique name for your fine-tuned model. This will be used to identify your model." />
                            </label>
                            <input
                              type="text"
                              className={styles.finetuneFormInput}
                              value={formData.modelName || ""}
                              onChange={(e) => updateField("modelName", e.target.value)}
                              placeholder="my-finetuned-model"
                              disabled={isFormDisabled || loading}
                            />
                          </div>
                          {formData.type === "vla" && allowVLA && (
                            <div className={styles.finetuneFormField}>
                              <label className={styles.finetuneFormLabel}>
                                Policy Type
                                <HelpTooltip text="Select the VLA policy type: ACT (Action Chunking Transformer), SmolVLA (Small Vision-Language-Action), or PI05 (Physical Intelligence)." />
                              </label>
                              <select
                                className={styles.finetuneFormSelect}
                                value={formData.policyType || ""}
                                onChange={(e) => updateField("policyType", e.target.value)}
                                disabled={isFormDisabled || loading}
                              >
                                <option value="">Select policy type</option>
                                {vlaPolicyTypes.map((policy) => (
                                  <option key={policy} value={policy}>
                                    {policy}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                        <div className={styles.finetuneFormRow}>
                          <div className={`${styles.finetuneFormField} ${styles.finetuneFormFieldFull}`}>
                            <label className={styles.finetuneFormLabel}>
                              Dataset URL / HF identifier
                              <HelpTooltip text="Enter a full URL to your training dataset, or copy the org-name/dataset-name from the Hugging Face dataset page (e.g. username/my-dataset) and paste it here. The dataset should be in a format compatible with the selected library." />
                            </label>
                            <input
                              type="text"
                              className={styles.finetuneFormInput}
                              value={formData.dataseturl || ""}
                              onChange={(e) => updateField("dataseturl", e.target.value)}
                              placeholder="https://... or org-name/dataset-name"
                              disabled={isFormDisabled || loading}
                            />
                          </div>
                        </div>
                      </>,
                      "#7c3aed"
                    )}
                    <div className={`${styles.wizardNavigation} ${styles.wizardNavigationExpress}`}>
                      <div className={styles.wizardNavLeft}>
                        {loading ? (
                          <Loader3D message="evaluating fine-tune parameters..." />
                        ) : error ? (
                          <div className={styles.finetuneErrorInline}>
                            <p className={styles.errorText}>{error}</p>
                          </div>
                        ) : null}
                      </div>
                      <div className={styles.wizardNavCenterSpacer} />
                      <div className={styles.wizardNavCenterSpacerRight}>
                        <button
                          type="button"
                          className={styles.finetuneSubmitButton}
                          onClick={evaluateFinetune}
                          disabled={isFormDisabled || loading}
                          title="Fine-tune"
                        >
                          {loading ? <LoadingIcon size={18} /> : <SendIcon size={18} />}
                          <span style={{ marginLeft: "8px" }}>Fine-tune</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                (() => {
                  const currentSection = sections[currentStep];

                  return (
                    <div className={styles.wizardContainer}>
                      <div className={styles.wizardStep}>
                        {currentSection && (
                          <>
                            {renderFormSection(
                              currentSection.id,
                              currentSection.label,
                              getSectionContent(currentSection.id),
                              currentSection.color,
                              currentSection.optional
                            )}
                            <div className={styles.wizardNavigation}>
                              <button
                                type="button"
                                className={styles.wizardNavButton}
                                onClick={() => {
                                  const prevStep = Math.max(0, currentStep - 1);
                                  handleStepChange(prevStep);
                                }}
                                disabled={currentStep === 0}
                              >
                                ← Previous
                              </button>
                              <div className={styles.wizardNavCenter}>
                                {loading ? (
                                  <Loader3D message="evaluating fine-tune parameters..." />
                                ) : error ? (
                                  <div className={styles.finetuneErrorInline}>
                                    <p className={styles.errorText}>{error}</p>
                                  </div>
                                ) : (
                                  <span className={styles.wizardStepIndicator}>
                                    Step {currentStep + 1} of {sections.length}
                                  </span>
                                )}
                              </div>
                              {currentStep === sections.length - 1 ? (
                                <button
                                  type="button"
                                  className={styles.finetuneSubmitButton}
                                  onClick={evaluateFinetune}
                                  disabled={isFormDisabled || loading}
                                  title="Fine-tune"
                                >
                                  {loading ? <LoadingIcon size={18} /> : <SendIcon size={18} />}
                                  <span style={{ marginLeft: "8px" }}>Fine-tune</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className={styles.wizardNavButton}
                                  onClick={() => {
                                    const nextStep = Math.min(sections.length - 1, currentStep + 1);
                                    handleStepChange(nextStep);
                                  }}
                                  disabled={currentStep >= sections.length - 1}
                                >
                                  Next →
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
            </>
          )}

        </div>
      )}
    </div>
  );
}
