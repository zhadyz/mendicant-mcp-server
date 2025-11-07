/**
 * Embedding Service
 * 
 * High-level service for embedding generation with caching and fallback.
 * Provides cosine similarity calculations for semantic matching.
 * 
 * PRIORITY ORDER:
 * 1. Mnemosyne BGE-large (free, local, high-quality) - DEFAULT
 * 2. OpenAI text-embedding-3-small (requires API key) - FALLBACK
 * 3. Keyword-based hashing (lowest quality) - FINAL FALLBACK
 */

import type { EmbeddingProvider, EmbeddingCache } from './types.js';
import { OpenAIEmbeddingProvider } from './openai_provider.js';
import { MnemosyneEmbeddingProvider } from './mnemosyne_provider.js';
import { ThreeTierEmbeddingCache } from './cache_layer.js';
import crypto from 'crypto';

export class EmbeddingService {
  private provider: EmbeddingProvider | null = null;
  private cache: ThreeTierEmbeddingCache;
  private fallbackEnabled: boolean;
  
  /**
   * Initialize embedding service
   * @param provider Optional embedding provider (auto-detected if not provided)
   * @param fallbackEnabled Enable keyword-based fallback on all failures (default: true)
   */
  constructor(provider?: EmbeddingProvider, fallbackEnabled = true) {
    this.provider = provider || null;
    this.cache = new ThreeTierEmbeddingCache();
    this.fallbackEnabled = fallbackEnabled;
  }
  
  /**
   * Initialize cache layers and detect best embedding provider
   * Must be called before using the service
   * 
   * Provider detection order:
   * 1. Mnemosyne BGE-large (free, local, high-quality)
   * 2. OpenAI text-embedding-3-small (requires OPENAI_API_KEY)
   * 3. Keyword-only mode (if fallback enabled)
   */
  async initialize(): Promise<void> {
    console.log('[EmbeddingService] Initializing...');
    
    await this.cache.initialize();

    // If provider already set via constructor, use it
    if (this.provider) {
      console.log('[EmbeddingService] Using provided embedding provider');
      return;
    }

    // Try Mnemosyne first (free, local, high-quality)
    try {
      const mnemosyneProvider = new MnemosyneEmbeddingProvider();
      await mnemosyneProvider.initialize();
      
      if (mnemosyneProvider.isAvailable()) {
        this.provider = mnemosyneProvider;
        console.log('[EmbeddingService] Using Mnemosyne BGE-large (local, free, 1024 dims)');
        return;
      } else {
        console.log('[EmbeddingService] Mnemosyne not available, trying OpenAI...');
      }
    } catch (error) {
      console.log('[EmbeddingService] Mnemosyne initialization failed, trying OpenAI...', error);
    }

    // Fallback to OpenAI if Mnemosyne unavailable and API key provided
    if (process.env.OPENAI_API_KEY) {
      try {
        const openaiProvider = new OpenAIEmbeddingProvider(process.env.OPENAI_API_KEY);
        // Test that it actually works
        await openaiProvider.generateEmbedding('test');
        
        this.provider = openaiProvider;
        console.log('[EmbeddingService] Using OpenAI text-embedding-3-small (1536 dims)');
        return;
      } catch (error) {
        console.warn('[EmbeddingService] OpenAI initialization failed:', error);
      }
    } else {
      console.log('[EmbeddingService] OPENAI_API_KEY not set, skipping OpenAI provider');
    }

    // No embedding provider available - keyword fallback only
    if (this.fallbackEnabled) {
      console.warn(
        '[EmbeddingService] No embedding provider available (Mnemosyne or OpenAI). ' +
        'Using keyword-based fallback only. ' +
        'For better results: configure Mnemosyne MCP or set OPENAI_API_KEY.'
      );
    } else {
      console.error(
        '[EmbeddingService] No embedding provider available and fallback disabled. ' +
        'Embedding generation will fail.'
      );
    }
  }
  
  /**
   * Get or generate embedding for text
   * Checks cache first, generates if not cached
   * 
   * @param text Input text to embed
   * @returns Promise resolving to embedding vector
   */
  async getOrGenerateEmbedding(text: string): Promise<number[]> {
    const cacheKey = this.generateCacheKey(text);
    
    // Try cache first (L1 → L2 → L3 cascade)
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;
    
    // Generate new embedding
    try {
      if (!this.provider) {
        if (this.fallbackEnabled) {
          console.warn('[EmbeddingService] No provider available, using keyword fallback');
          return this.generateFallbackEmbedding(text);
        } else {
          throw new Error('No embedding provider available and fallback disabled');
        }
      }

      const embedding = await this.provider.generateEmbedding(text);
      await this.cache.set(cacheKey, embedding);
      return embedding;
    } catch (error) {
      if (this.fallbackEnabled) {
        console.warn('[EmbeddingService] Provider failed, using keyword fallback:', error);
        const fallback = this.generateFallbackEmbedding(text);
        // Don't cache fallback embeddings
        return fallback;
      }
      throw error;
    }
  }
  
  /**
   * Calculate cosine similarity between two embeddings
   * 
   * Handles different embedding dimensions by normalizing if necessary.
   * 
   * @param a First embedding vector
   * @param b Second embedding vector
   * @returns Similarity score from -1 (opposite) to 1 (identical)
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      console.warn(
        `[EmbeddingService] Dimension mismatch: ${a.length} vs ${b.length}. ` +
        'This may indicate mixed embedding providers. Results may be inaccurate.'
      );
      // Pad shorter vector with zeros
      const maxLen = Math.max(a.length, b.length);
      a = a.concat(new Array(maxLen - a.length).fill(0));
      b = b.concat(new Array(maxLen - b.length).fill(0));
    }
    
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    return dotProduct / (magnitudeA * magnitudeB);
  }
  
  /**
   * Generate cache key from text
   * Uses SHA256 hash for consistent key generation
   * 
   * @param text Input text
   * @returns SHA256 hex digest
   */
  private generateCacheKey(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
  
  /**
   * Generate fallback embedding using keyword hashing
   * Used when no embedding provider is available
   * 
   * @param text Input text
   * @returns Embedding vector (dimensions match provider if available, else 1024)
   */
  private generateFallbackEmbedding(text: string): number[] {
    const dimensions = this.provider?.getDimensions() || 1024;
    const embedding = new Array(dimensions).fill(0);
    
    // Basic word hashing for semantic approximation
    const words = text.toLowerCase().split(/\s+/);
    words.forEach((word) => {
      const hash = this.hashString(word);
      const index = hash % dimensions;
      embedding[index] += 1.0 / words.length;
    });
    
    return embedding;
  }
  
  /**
   * Simple string hash function
   * @param str Input string
   * @returns Positive integer hash
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }
  
  /**
   * Get current provider info
   */
  getProviderInfo(): { name: string; dimensions: number; available: boolean } {
    if (!this.provider) {
      return {
        name: 'keyword-fallback',
        dimensions: 1024,
        available: this.fallbackEnabled
      };
    }

    if (this.provider instanceof MnemosyneEmbeddingProvider) {
      return {
        name: 'mnemosyne-bge-large',
        dimensions: this.provider.getDimensions(),
        available: this.provider.isAvailable()
      };
    }

    if (this.provider instanceof OpenAIEmbeddingProvider) {
      return {
        name: 'openai-text-embedding-3-small',
        dimensions: this.provider.getDimensions(),
        available: true
      };
    }

    return {
      name: 'unknown',
      dimensions: this.provider.getDimensions(),
      available: true
    };
  }
  
  /**
   * Clean up resources
   * Should be called on shutdown
   */
  destroy(): void {
    this.cache.destroy();
  }
}
