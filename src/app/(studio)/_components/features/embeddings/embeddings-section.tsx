"use client";

import { useFocusWhen } from "@/hooks/use-focus-when";
import { Loader3D } from "@/studio/_components/common/loader-3d";
import { SendIcon, LoadingIcon, CloseIcon } from "@/studio/_components/common/icons";
import styles from "@/app/page.module.css";

interface EmbeddingsSectionProps {
  embedMode: "compare" | "search" | "visualize";
  onEmbedModeChange: (mode: "compare" | "search" | "visualize") => void;
  embedText: string;
  onEmbedTextChange: (value: string) => void;
  onRunEmbeddings: () => void;
  onAddToLibrary: () => void;
  onRunSearch: () => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onRemoveFromLibrary: (id: string) => void;
  onExportEmbeddings: () => void;
  embedLoading: boolean;
  embedTexts: string[];
  allEmbeddings: number[][];
  comparisonResults: number[][] | null;
  storedTexts: Array<{ id: string; text: string; embedding: number[]; timestamp: number }>;
  searchResults: Array<{ text: string; similarity: number; id: string }>;
  isFeatureDisabled: boolean;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function EmbeddingsSection({
  embedMode,
  onEmbedModeChange,
  embedText,
  onEmbedTextChange,
  onRunEmbeddings,
  onAddToLibrary,
  onRunSearch,
  searchQuery,
  onSearchQueryChange,
  onRemoveFromLibrary,
  onExportEmbeddings,
  embedLoading,
  embedTexts,
  allEmbeddings,
  comparisonResults,
  storedTexts,
  searchResults,
  isFeatureDisabled,
  activeSection,
  onSectionChange,
}: EmbeddingsSectionProps) {
  const compareInputRef = useFocusWhen(embedMode === "compare" && !embedLoading);
  const searchInputRef = useFocusWhen(embedMode === "search" && !embedLoading);
  const visualizeInputRef = useFocusWhen(embedMode === "visualize" && !embedLoading);

  return (
    <div className={styles.embeddingsSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Embeddings</h2>
      </div>
      {/* Tab Navigation */}
      <div className={styles.tabContainer}>
        <button
          type="button"
          className={`${styles.tab} ${embedMode === "compare" ? styles.tabActive : ""}`}
          onClick={() => onEmbedModeChange("compare")}
        >
          Embed & Compare
        </button>
        <button
          type="button"
          className={`${styles.tab} ${embedMode === "visualize" ? styles.tabActive : ""}`}
          onClick={() => onEmbedModeChange("visualize")}
        >
          Visualization
        </button>
        <button
          type="button"
          className={`${styles.tab} ${embedMode === "search" ? styles.tabActive : ""}`}
          onClick={() => onEmbedModeChange("search")}
        >
          Semantic Search
        </button>
      </div>

      {/* Mode 1: Embed & Compare */}
      {embedMode === "compare" && (
        <div className={styles.embedModeContent}>
          <p className={styles.panelHelper}>
            Enter multiple texts (one per line) to generate embeddings and compare their similarity. 
            Similarity scores range from -1 (opposite) to 1 (identical).
          </p>
          <div className="py-5">
            <div className="max-w-[1200px] mx-auto w-full">
              <div className="relative rounded-2xl border border-gray-200/80 dark:border-gray-600/60 overflow-hidden transition-all bg-gradient-to-br from-slate-50 via-white to-slate-50/80 dark:from-gray-800 dark:via-gray-800/95 dark:to-gray-900 shadow-lg shadow-gray-300/40 dark:shadow-black/40 backdrop-blur-sm">
                <textarea
                  ref={compareInputRef}
                  className="w-full min-h-[60px] max-h-[300px] py-[18px] px-6 pt-5 border-none bg-transparent text-gray-900 dark:text-gray-100 text-[15px] resize-none relative z-[2] overflow-y-auto focus:outline-none font-[family-name:var(--font-aspekta)]"
                  value={embedText}
                  onChange={(e) => onEmbedTextChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !isFeatureDisabled && !embedLoading) {
                      e.preventDefault();
                      onRunEmbeddings();
                    }
                  }}
                  disabled={isFeatureDisabled}
                  placeholder="Enter multiple texts (one per line) or press Enter to execute"
                  rows={5}
                  autoFocus
                />
                <div className="flex items-center justify-between py-2 px-3">
                  <div className="flex items-center gap-1.5" />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg border-none bg-violet-600 text-white flex items-center justify-center flex-shrink-0 hover:bg-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={onRunEmbeddings}
                      disabled={isFeatureDisabled || embedLoading}
                      title="Compare embeddings"
                    >
                      {embedLoading ? (
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
          
          {embedLoading && (
            <Loader3D message="creating similarity matrix..." />
          )}
          
          {comparisonResults && comparisonResults.length > 0 && (
            <div className={styles.comparisonResults}>
              <h4 className={styles.resultsTitle}>Similarity Matrix</h4>
              <div className={styles.similarityMatrix}>
                <table className={styles.similarityTable}>
                  <thead>
                    <tr>
                      <th></th>
                      {embedTexts.map((_, i) => (
                        <th key={i} className={styles.matrixHeader}>Text {i + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonResults.map((row, i) => (
                      <tr key={i}>
                        <td className={styles.matrixHeader}>Text {i + 1}</td>
                        {row.map((similarity, j) => (
                          <td 
                            key={j} 
                            className={styles.similarityCell}
                            style={{
                              backgroundColor: `rgba(124, 58, 237, ${Math.max(0, similarity) * 0.3})`,
                              color: similarity > 0.7 ? 'var(--text-primary)' : similarity > 0.4 ? 'var(--text-secondary)' : 'var(--muted)',
                            }}
                          >
                            {similarity.toFixed(2)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.comparisonList}>
                <h4 className={styles.resultsTitle}>Pairwise Comparisons</h4>
                {comparisonResults.map((row, i) => 
                  row.map((similarity, j) => {
                    if (i >= j) return null;
                    return (
                      <div key={`${i}-${j}`} className={styles.comparisonItem}>
                        <div className={styles.comparisonTexts}>
                          <span className={styles.comparisonText1}>&quot;{embedTexts[i]}&quot;</span>
                          <span className={styles.comparisonVs}>vs</span>
                          <span className={styles.comparisonText2}>&quot;{embedTexts[j]}&quot;</span>
                        </div>
                        <span 
                          className={styles.similarityScore}
                          style={{
                            color: similarity > 0.7 ? 'var(--accent-2)' : similarity > 0.4 ? 'var(--accent)' : 'var(--muted)',
                          }}
                        >
                          {similarity.toFixed(3)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Semantic Search */}
      {embedMode === "search" && (
        <div className={styles.embedModeContent}>
          <div className={styles.searchSection}>
            <h4 className={styles.sectionTitle}>Add to Library</h4>
            <p className={styles.panelHelper}>
              Add texts to your searchable library. Each line will be stored with its embedding.
            </p>
            <div className="py-5">
              <div className="max-w-[1200px] mx-auto w-full">
                <div className="relative rounded-2xl border border-gray-200/80 dark:border-gray-600/60 overflow-hidden transition-all bg-gradient-to-br from-slate-50 via-white to-slate-50/80 dark:from-gray-800 dark:via-gray-800/95 dark:to-gray-900 shadow-lg shadow-gray-300/40 dark:shadow-black/40 backdrop-blur-sm">
                  <textarea
                    className="w-full min-h-[60px] max-h-[300px] py-[18px] px-6 pt-5 border-none bg-transparent text-gray-900 dark:text-gray-100 text-[15px] resize-none relative z-[2] overflow-y-auto focus:outline-none font-[family-name:var(--font-aspekta)]"
                    value={embedText}
                    onChange={(e) => onEmbedTextChange(e.target.value)}
                    disabled={isFeatureDisabled}
                    placeholder="Python tutorial\nJavaScript guide\nReact documentation"
                    rows={3}
                  />
                  <div className="flex items-center justify-between py-2 px-3">
                    <div className="flex items-center gap-1.5" />
                    <div className="flex items-center gap-1.5">
                      <span className={styles.badge} style={{ fontSize: '11px', padding: '4px 8px' }}>{storedTexts.length} items</span>
                      <button
                        type="button"
                        className="w-8 h-8 rounded-lg border-none bg-violet-600 text-white flex items-center justify-center flex-shrink-0 hover:bg-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onAddToLibrary}
                        disabled={isFeatureDisabled || embedLoading}
                        title="Add to Library"
                      >
                        {embedLoading ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.searchSection}>
            <h4 className={styles.sectionTitle}>Search Library</h4>
            <p className={styles.panelHelper}>
              Enter a query to find the most similar texts in your library.
            </p>
            <div className="py-5">
              <div className="max-w-[1200px] mx-auto w-full">
                <div className="relative rounded-2xl border border-gray-200/80 dark:border-gray-600/60 overflow-hidden transition-all bg-gradient-to-br from-slate-50 via-white to-slate-50/80 dark:from-gray-800 dark:via-gray-800/95 dark:to-gray-900 shadow-lg shadow-gray-300/40 dark:shadow-black/40 backdrop-blur-sm">
                  <textarea
                    ref={searchInputRef}
                    className="w-full min-h-[60px] max-h-[300px] py-[18px] px-6 pt-5 border-none bg-transparent text-gray-900 dark:text-gray-100 text-[15px] resize-none relative z-[2] overflow-y-auto focus:outline-none font-[family-name:var(--font-aspekta)]"
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onRunSearch()}
                    disabled={isFeatureDisabled || storedTexts.length === 0}
                    placeholder={storedTexts.length === 0 ? "Add texts to library first..." : "learn programming"}
                    rows={1}
                    autoFocus
                  />
                  <div className="flex items-center justify-between py-2 px-3">
                    <div className="flex items-center gap-1.5" />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        className="w-8 h-8 rounded-lg border-none bg-violet-600 text-white flex items-center justify-center flex-shrink-0 hover:bg-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onRunSearch}
                        disabled={isFeatureDisabled || storedTexts.length === 0 || embedLoading}
                        title="Search"
                      >
                        {embedLoading ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {embedLoading && (
              <Loader3D message="creating similarity matrix..." />
            )}
            
            {searchResults.length > 0 && (
              <div className={styles.searchResults}>
                <h4 className={styles.resultsTitle}>Top Matches</h4>
                {searchResults.map((result) => (
                  <div key={result.id} className={styles.searchResultItem}>
                    <div className={styles.searchResultContent}>
                      <p className={styles.searchResultText}>{result.text}</p>
                      <span 
                        className={styles.similarityScore}
                        style={{
                          color: result.similarity > 0.7 ? 'var(--accent-2)' : result.similarity > 0.4 ? 'var(--accent)' : 'var(--muted)',
                        }}
                      >
                        {result.similarity.toFixed(3)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {storedTexts.length > 0 && (
              <div className={styles.libraryList}>
                <h4 className={styles.resultsTitle}>Library ({storedTexts.length} items)</h4>
                {storedTexts.map((item) => (
                  <div key={item.id} className={styles.libraryItem}>
                    <span className={styles.libraryText}>{item.text}</span>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => onRemoveFromLibrary(item.id)}
                      disabled={isFeatureDisabled}
                    >
                      <CloseIcon size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 3: Visualization */}
      {embedMode === "visualize" && (
        <div className={styles.embedModeContent}>
          <p className={styles.panelHelper}>
            Enter multiple texts to visualize their embeddings and similarity relationships.
          </p>
          <div className="py-5">
            <div className="max-w-[1200px] mx-auto w-full">
              <div className="relative rounded-2xl border border-gray-200/80 dark:border-gray-600/60 overflow-hidden transition-all bg-gradient-to-br from-slate-50 via-white to-slate-50/80 dark:from-gray-800 dark:via-gray-800/95 dark:to-gray-900 shadow-lg shadow-gray-300/40 dark:shadow-black/40 backdrop-blur-sm">
                <textarea
                  ref={visualizeInputRef}
                  className="w-full min-h-[60px] max-h-[300px] py-[18px] px-6 pt-5 border-none bg-transparent text-gray-900 dark:text-gray-100 text-[15px] resize-none relative z-[2] overflow-y-auto focus:outline-none font-[family-name:var(--font-aspekta)]"
                  value={embedText}
                  onChange={(e) => onEmbedTextChange(e.target.value)}
                  disabled={isFeatureDisabled}
                  placeholder="Machine learning\nArtificial intelligence\nDeep learning\nNeural networks"
                  rows={4}
                  autoFocus
                />
                <div className="flex items-center justify-between py-2 px-3">
                  <div className="flex items-center gap-1.5" />
                  <div className="flex items-center gap-1.5">
                    {allEmbeddings.length > 0 && (
                      <button
                        type="button"
                        className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 bg-transparent text-gray-500 dark:text-gray-400 flex items-center justify-center flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={onExportEmbeddings}
                        title="Export JSON"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg border-none bg-violet-600 text-white flex items-center justify-center flex-shrink-0 hover:bg-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={onRunEmbeddings}
                      disabled={isFeatureDisabled || embedLoading}
                      title="Visualize"
                    >
                      {embedLoading ? (
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

          {embedLoading && (
            <Loader3D message="creating similarity matrix..." />
          )}

          {comparisonResults && comparisonResults.length > 0 && (
            <div className={styles.visualizationResults}>
              <h4 className={styles.resultsTitle}>Similarity Heatmap</h4>
              <div className={styles.heatmapContainer}>
                <div className={styles.heatmap}>
                  {comparisonResults.map((row, i) => (
                    <div key={i} className={styles.heatmapRow}>
                      {row.map((similarity, j) => (
                        <div
                          key={j}
                          className={styles.heatmapCell}
                          style={{
                            backgroundColor: similarity > 0.7 
                              ? `rgba(34, 211, 238, ${similarity * 0.6})` 
                              : similarity > 0.4 
                              ? `rgba(124, 58, 237, ${similarity * 0.5})`
                              : `rgba(113, 130, 166, ${Math.max(0, similarity) * 0.3})`,
                          }}
                          title={`Text ${i + 1} vs Text ${j + 1}: ${similarity.toFixed(3)}`}
                        >
                          <span className={styles.heatmapValue}>{similarity.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className={styles.heatmapLabels}>
                  {embedTexts.map((text, i) => (
                    <div key={i} className={styles.heatmapLabel}>
                      <span className={styles.heatmapLabelNum}>{i + 1}</span>
                      <span className={styles.heatmapLabelText} title={text}>
                        {text.length > 30 ? text.substring(0, 30) + "..." : text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {allEmbeddings.length > 0 && (
                <div className={styles.vectorPreview}>
                  <h4 className={styles.resultsTitle}>Vector Preview (First 16 dimensions)</h4>
                  {allEmbeddings.map((embedding, idx) => (
                    <div key={idx} className={styles.vectorContainer}>
                      <div className={styles.vectorLabel}>Text {idx + 1}: &quot;{embedTexts[idx]}&quot;</div>
                      <div className={styles.vectorBars}>
                        {embedding.slice(0, 16).map((value, dimIdx) => (
                          <div
                            key={dimIdx}
                            className={styles.vectorBar}
                            style={{
                              height: `${Math.abs(value) * 100}%`,
                              backgroundColor: value > 0 ? 'var(--accent)' : 'var(--accent-2)',
                            }}
                            title={`Dim ${dimIdx + 1}: ${value.toFixed(3)}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

