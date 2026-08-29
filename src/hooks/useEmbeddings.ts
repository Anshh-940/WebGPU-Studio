/**
 * Hook for managing embeddings state and operations
 */

import { useEffect, useState } from "react";
import { generateEmbeddings, generateSimilarityMatrix, findSimilarTexts } from "@/lib/utils/embeddings";
import { loadFromStorage, saveToStorage, StoredText } from "@/lib/utils/storage";
import { logger } from "@/lib/utils/logger";

interface UseEmbeddingsProps {
  isFeatureDisabled: boolean;
  incrementQueryCount: () => void;
}

export function useEmbeddings({ isFeatureDisabled, incrementQueryCount }: UseEmbeddingsProps) {
  const [embedMode, setEmbedMode] = useState<"compare" | "search" | "visualize">("compare");
  const [embedText, setEmbedText] = useState("The cat sat on the mat\nA feline rested on a rug\nDogs are loyal pets\nCats are independent animals\nPets bring joy to families");
  const [allEmbeddings, setAllEmbeddings] = useState<number[][]>([]);
  const [embedTexts, setEmbedTexts] = useState<string[]>([]);
  const [comparisonResults, setComparisonResults] = useState<number[][] | null>(null);
  const [storedTexts, setStoredTexts] = useState<StoredText[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ text: string; similarity: number; id: string }>>([]);
  const [embedLoading, setEmbedLoading] = useState(false);

  useEffect(() => {
    const loaded = loadFromStorage();
    if (loaded.length > 0) {
      setStoredTexts(loaded);
    }
  }, []);

  async function runEmbeddings() {
    if (isFeatureDisabled) {
      return;
    }
    
    setEmbedLoading(true);
    incrementQueryCount();
    
    try {
      const lines = embedText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      
      if (lines.length === 0) {
        setEmbedLoading(false);
        return;
      }

      const embeddings = await generateEmbeddings(lines);
      
      if (embedMode === "compare" || embedMode === "visualize") {
        setEmbedTexts(lines);
        setAllEmbeddings(embeddings);
        if (embeddings.length > 0) {
          const matrix = generateSimilarityMatrix(embeddings);
          setComparisonResults(matrix);
        }
      }
    } catch (error) {
      logger.error('Failed to generate embeddings:', error);
    } finally {
      setEmbedLoading(false);
    }
  }

  async function addToLibrary() {
    if (isFeatureDisabled || !embedText.trim()) return;
    
    setEmbedLoading(true);
    try {
      const lines = embedText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      
      if (lines.length === 0) {
        setEmbedLoading(false);
        return;
      }

      const embeddings = await generateEmbeddings(lines);
      
      const newItems = lines.map((text, idx) => ({
        id: `${Date.now()}-${idx}`,
        text,
        embedding: embeddings[idx] || [],
        timestamp: Date.now(),
      }));

      const updated = [...storedTexts, ...newItems];
      setStoredTexts(updated);
      saveToStorage(updated);
      setEmbedText("");
    } catch (error) {
      logger.error('Failed to add to library:', error);
    } finally {
      setEmbedLoading(false);
    }
  }

  async function runSearch() {
    if (isFeatureDisabled || !searchQuery.trim() || storedTexts.length === 0) {
      setSearchResults([]);
      return;
    }
    
    setEmbedLoading(true);
    try {
      const queryEmbeddings = await generateEmbeddings([searchQuery]);
      if (queryEmbeddings.length > 0) {
        const results = findSimilarTexts(queryEmbeddings[0], storedTexts, 10);
        setSearchResults(results);
      }
    } catch (error) {
      logger.error('Failed to search:', error);
    } finally {
      setEmbedLoading(false);
    }
  }

  function removeFromLibrary(id: string) {
    const updated = storedTexts.filter((item) => item.id !== id);
    setStoredTexts(updated);
    saveToStorage(updated);
  }

  function exportEmbeddings() {
    if (allEmbeddings.length === 0) return;
    
    const data = {
      texts: embedTexts,
      embeddings: allEmbeddings,
      similarityMatrix: comparisonResults,
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `embeddings-${timestamp}.json`;
    
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return {
    embedMode,
    setEmbedMode,
    embedText,
    setEmbedText,
    allEmbeddings,
    embedTexts,
    comparisonResults,
    storedTexts,
    searchQuery,
    setSearchQuery,
    searchResults,
    embedLoading,
    runEmbeddings,
    addToLibrary,
    runSearch,
    removeFromLibrary,
    exportEmbeddings,
  };
}

