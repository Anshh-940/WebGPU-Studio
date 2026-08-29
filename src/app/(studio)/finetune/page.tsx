"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { FinetuneSection } from "@/studio/_components/features/finetune/finetune-section";
import { ErrorBoundary } from "@/studio/_components/common/error-boundary";
import { useFinetuneSection } from "@/hooks/useFinetuneSection";
import { getPageTitle } from "@/lib/page-titles";

export default function FinetunePage() {
  const pathname = usePathname();
  const { auth, finetune } = useFinetuneSection();

  useEffect(() => {
    document.title = getPageTitle(pathname ?? "/finetune");
  }, [pathname]);

  return (
    <ErrorBoundary>
      <FinetuneSection
        formData={finetune.formData}
        updateField={finetune.updateField}
        loading={finetune.loading}
        error={finetune.error}
        evaluateResponse={finetune.evaluateResponse}
        evaluateFinetune={finetune.evaluateFinetune}
        resetForm={finetune.resetForm}
        selectedOrgPlan={finetune.selectedOrgPlan}
        hasAnyOrgWithPlan={finetune.hasAnyOrgWithPlan}
        profileLoading={finetune.profileLoading}
        allowVLA={finetune.allowVLA}
        organizationId={finetune.organizationId}
        organizations={finetune.organizations}
        getPlanLimits={finetune.getPlanLimits}
        llmBaseModels={finetune.llmBaseModels}
        vlaPolicyTypes={finetune.vlaPolicyTypes}
        libraries={finetune.libraries}
        fetchProfile={finetune.fetchProfile}
        isFeatureDisabled={auth.isFeatureDisabled}
        isLoggedIn={!!auth.user}
      />
    </ErrorBoundary>
  );
}
