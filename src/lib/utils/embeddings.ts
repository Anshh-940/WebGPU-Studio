/**
 * Utility functions for embeddings operations
 */

export function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) return 0;
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }
  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

export function findSimilarTexts(
  queryEmbedding: number[],
  storedTexts: Array<{ id: string; text: string; embedding: number[]; timestamp: number }>,
  topK: number = 5
): Array<{ text: string; similarity: number; id: string }> {
  const results = storedTexts.map((item) => ({
    id: item.id,
    text: item.text,
    similarity: cosineSimilarity(queryEmbedding, item.embedding),
  }));
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .filter((r) => r.similarity > 0);
}

export function generateSimilarityMatrix(embeddings: number[][]): number[][] {
  const matrix: number[][] = [];
  for (let i = 0; i < embeddings.length; i++) {
    const row: number[] = [];
    for (let j = 0; j < embeddings.length; j++) {
      row.push(cosineSimilarity(embeddings[i], embeddings[j]));
    }
    matrix.push(row);
  }
  return matrix;
}

// Client-side embeddings using @huggingface/transformers in the browser
// Models are downloaded and cached in the browser's IndexedDB/cache
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let embeddingModel: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let modelLoading: Promise<any> | null = null;

async function loadEmbeddingModel() {
  if (embeddingModel) {
    return embeddingModel;
  }

  if (modelLoading) {
    return modelLoading;
  }

  modelLoading = (async () => {
    try {
      // Dynamic import of @huggingface/transformers for browser
      const { pipeline } = await import("@huggingface/transformers");
      
      // Use the same model as configured in models.ts
      // gte-small is a good balance of size and quality for browser use
      const model = await pipeline(
        "feature-extraction",
        "Supabase/gte-small",
        {
          // Use quantized model for faster loading and smaller size
          quantized: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any
      );

      embeddingModel = model;
      return model;
    } catch (error) {
      modelLoading = null;
      throw new Error(
        `Failed to load embedding model: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  })();

  return modelLoading;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  
  // Check if we're in the browser
  if (typeof window === "undefined") {
    throw new Error("Embeddings must be generated in the browser (client-side)");
  }

  try {
    // Load the model if not already loaded
    const model = await loadEmbeddingModel();

    // Generate embeddings for all texts
    // The pipeline returns embeddings as a tensor or array
    const embeddings = await model(texts, {
      pooling: "mean",
      normalize: true,
    });

    // Convert to number[][] format
    // transformers.js returns embeddings in different formats depending on input
    let embeddingsArray: number[][] = [];

    if (Array.isArray(embeddings)) {
      // If single text, embeddings might be a single array
      // If multiple texts, embeddings should be an array of arrays/tensors
      if (texts.length === 1) {
        // Single text - embeddings is likely a 1D array or tensor
        const emb = embeddings[0] || embeddings;
        if (Array.isArray(emb)) {
          embeddingsArray = [emb as number[]];
        } else if (emb && typeof emb === "object") {
          // Handle tensor objects
          if ("data" in emb) {
            embeddingsArray = [Array.from(emb.data as ArrayLike<number>)];
          } else if ("tolist" in emb && typeof emb.tolist === "function") {
            embeddingsArray = [emb.tolist() as number[]];
          } else if ("length" in emb) {
            embeddingsArray = [Array.from(emb as ArrayLike<number>)];
          }
        }
      } else {
        // Multiple texts - process each embedding
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        embeddingsArray = embeddings.map((emb: any) => {
          if (Array.isArray(emb)) {
            return emb as number[];
          }
          // Handle tensor-like objects
          if (emb && typeof emb === "object") {
            if ("data" in emb) {
              return Array.from(emb.data as ArrayLike<number>);
            }
            if ("tolist" in emb && typeof emb.tolist === "function") {
              return emb.tolist() as number[];
            }
            if ("length" in emb) {
              return Array.from(emb as ArrayLike<number>);
            }
          }
          return [];
        });
      }
    } else if (embeddings && typeof embeddings === "object") {
      // If embeddings is a tensor object
      if ("data" in embeddings) {
        const data = embeddings.data;
        if (Array.isArray(data)) {
          // Check if it's a 2D array (multiple texts) or 1D (single text)
          if (texts.length === 1 && Array.isArray(data[0])) {
            embeddingsArray = data as number[][];
          } else if (texts.length === 1) {
            embeddingsArray = [data as number[]];
          } else {
            embeddingsArray = data as number[][];
          }
        } else {
          // Tensor data - convert to array
          const arr = Array.from(data as ArrayLike<number>);
          // Reshape if needed (assuming [num_texts, embedding_dim])
          if (texts.length > 1 && arr.length % texts.length === 0) {
            const dim = arr.length / texts.length;
            embeddingsArray = [];
            for (let i = 0; i < texts.length; i++) {
              embeddingsArray.push(arr.slice(i * dim, (i + 1) * dim));
            }
          } else {
            embeddingsArray = [arr];
          }
        }
      } else if ("tolist" in embeddings && typeof embeddings.tolist === "function") {
        const list = embeddings.tolist();
        if (Array.isArray(list)) {
          embeddingsArray = Array.isArray(list[0]) ? (list as number[][]) : [list as number[]];
        }
      } else {
        // Try to extract from object values
        const values = Object.values(embeddings);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const arrays = values.filter((v: any) => Array.isArray(v) || (v && typeof v === "object" && "data" in v));
        if (arrays.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          embeddingsArray = arrays.map((arr: any) => 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Array.isArray(arr) ? arr : Array.from((arr as any).data as ArrayLike<number>)
          ) as number[][];
        }
      }
    }

    // Ensure we have the correct number of embeddings
    if (embeddingsArray.length !== texts.length) {
      // If we got a single embedding for multiple texts, try to split it
      if (embeddingsArray.length === 1 && texts.length > 1) {
        throw new Error(
          `Expected ${texts.length} embeddings, got 1. The model may not support batch processing.`
        );
      }
      throw new Error(
        `Expected ${texts.length} embeddings, got ${embeddingsArray.length}`
      );
    }

    // Validate embedding dimensions
    const firstEmbedding = embeddingsArray[0];
    if (!firstEmbedding || firstEmbedding.length === 0) {
      throw new Error("Invalid embedding format: empty embedding vector");
    }

    // Ensure all embeddings have the same dimension
    const dim = firstEmbedding.length;
    for (let i = 1; i < embeddingsArray.length; i++) {
      if (embeddingsArray[i].length !== dim) {
        throw new Error(
          `Inconsistent embedding dimensions: first has ${dim}, embedding ${i} has ${embeddingsArray[i].length}`
        );
      }
    }

    return embeddingsArray;
  } catch (error) {
    throw new Error(
      `Failed to generate embeddings: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

