"use client";

import { useFocusWhen } from "@/hooks/use-focus-when";
import { Loader3D } from "@/studio/_components/common/loader-3d";
import { LoadingIcon, SendIcon } from "@/studio/_components/common/icons";
import styles from "@/app/page.module.css";

interface StructuredSectionProps {
  structuredPrompt: string;
  onStructuredPromptChange: (value: string) => void;
  onRunStructured: () => void;
  structuredResult: object | null;
  structuredError: string;
  structuredLoading: boolean;
  isProcessing: boolean;
  onCopy: () => void;
  onDownload: () => void;
  copySuccess: boolean;
  isFeatureDisabled: boolean;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function StructuredSection({
  structuredPrompt,
  onStructuredPromptChange,
  onRunStructured,
  structuredResult,
  structuredError,
  structuredLoading,
  isProcessing,
  onCopy,
  onDownload,
  copySuccess,
  isFeatureDisabled,
  activeSection,
  onSectionChange,
}: StructuredSectionProps) {
  const inputRef = useFocusWhen(!structuredLoading && !isProcessing);

  const handleEnterSend = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && event.ctrlKey) {
      event.preventDefault();
      onRunStructured();
    }
  };

  return (
    <div className={styles.structuredSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Structured JSON</h2>
      </div>
      <p className={styles.panelHelper}>
        Describe the JSON you want. The model returns a typed object (title, summary, steps)
        using your current system prompt. Press Ctrl+Enter to generate.
      </p>
      
      <div className="sticky bottom-0 left-0 right-0 py-2 pb-3 flex-shrink-0 z-10">
        <div className="max-w-[1200px] mx-auto w-full">
          <div className="relative rounded-2xl border border-gray-200/80 dark:border-gray-600/60 overflow-hidden transition-all bg-gradient-to-br from-slate-50 via-white to-slate-50/80 dark:from-gray-800 dark:via-gray-800/95 dark:to-gray-900 shadow-lg shadow-gray-300/40 dark:shadow-black/40 backdrop-blur-sm">
            <textarea
              ref={inputRef}
              className="w-full min-h-[60px] max-h-[300px] py-[18px] px-6 pt-5 border-none bg-transparent text-gray-900 dark:text-gray-100 text-[15px] resize-none relative z-[2] overflow-y-auto focus:outline-none font-[family-name:var(--font-aspekta)]"
              value={structuredPrompt}
              onChange={(e) => onStructuredPromptChange(e.target.value)}
              disabled={isFeatureDisabled || structuredLoading}
              placeholder="Describe the JSON structure you want (e.g., 'Create a project plan with title, summary, and steps')..."
              onKeyDown={handleEnterSend}
              rows={3}
              autoFocus
            />
            <div className="flex items-center justify-between py-2 px-3">
              <div className="flex items-center gap-1.5" />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg border-none bg-violet-600 text-white flex items-center justify-center flex-shrink-0 hover:bg-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={onRunStructured}
                  disabled={isFeatureDisabled || structuredLoading || isProcessing}
                  title="Generate JSON (Ctrl+Enter)"
                >
                  {structuredLoading || isProcessing ? (
                    <LoadingIcon size={18} />
                  ) : (
                    <SendIcon size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.inputRow}>
        {structuredResult && !structuredLoading && !isProcessing && <span className={styles.badge}>Ready</span>}
        {structuredError && <span className={styles.badgeMuted}>Error</span>}
        {copySuccess && <span className={styles.badge} style={{ background: "var(--accent-2)", color: "var(--bg)" }}>Copied!</span>}
      </div>
      {(structuredLoading || isProcessing) && (
        <Loader3D message="preparing json..." />
      )}
      {structuredError && <p className={styles.errorText}>{structuredError}</p>}
      {structuredResult && (
        <div className={styles.jsonViewer}>
          <div className={styles.jsonActionRow}>
            <button 
              type="button" 
              className={styles.jsonActionButton}
              onClick={onCopy}
              title="Copy to clipboard"
            >
              Copy
            </button>
            <button 
              type="button" 
              className={styles.jsonActionButton}
              onClick={onDownload}
              title="Download as JSON file"
            >
              Download
            </button>
          </div>
          <pre className={styles.jsonCodeBlock}>
            {JSON.stringify(structuredResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

