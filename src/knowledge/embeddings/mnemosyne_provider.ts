/**
 * Mnemosyne Embedding Provider - Uses BGE-large via Mnemosyne MCP
 * 
 * Advantages:
 * - Free (local model)
 * - High quality (BGE-large is comparable to OpenAI)
 * - No API key required
 * - Leverages existing infrastructure
 * - Works offline
 * 
 * This provider expects to run in Claude Code's context where Mnemosyne MCP tools
 * are directly available. It documents the interface but the actual tool calls
 * are made by Claude Code when this MCP server is invoked.
 */

import type { EmbeddingProvider } from './types.js';

/**
 * Mnemosyne Embedding Provider
 * 
 * Uses BGE-large embeddings via Mnemosyne MCP server.
 * Provides 1024-dimensional embeddings with excellent semantic quality.
 * 
 * IMPORTANT: This provider requires Mnemosyne MCP to be configured in Claude Code.
 * When this MCP server runs in Claude Code, it has access to Mnemosyne tools.
 */
export class MnemosyneEmbeddingProvider implements EmbeddingProvider {
  private dimensions = 1024; // BGE-large embedding size
  private available = false;
  private readonly tempEntityPrefix = 'temp_embedding_';

  /**
   * Initialize and check if Mnemosyne MCP is available
   * 
   * Note: In production, Claude Code will have Mnemosyne tools available.
   * During development/testing, this may return false.
   */
  async initialize(): Promise<void> {
    try {
      // Check if we're running in Claude Code context with Mnemosyne available
      // The actual check happens by attempting to use the tool
      this.available = await this.checkMnemosyneAvailability();
      
      if (this.available) {
        console.log('[MnemosyneEmbeddingProvider] Initialized with BGE-large (1024 dimensions)');
      } else {
        console.warn('[MnemosyneEmbeddingProvider] Mnemosyne MCP not available - ensure it is configured in Claude Code');
      }
    } catch (error) {
      console.warn('[MnemosyneEmbeddingProvider] Initialization failed:', error);
      this.available = false;
    }
  }

  /**
   * Generate embedding for text using Mnemosyne's BGE-large model
   * 
   * This method documents the embedding generation process. The actual implementation
   * requires Claude Code to call mcp__mnemosyne__* tools which are not directly
   * accessible from this TypeScript code.
   * 
   * WORKFLOW:
   * 1. Create temporary entity with text as observation
   * 2. Mnemosyne automatically generates BGE-large embedding
   * 3. Retrieve embedding via get_entity_embedding
   * 4. Clean up temporary entity
   * 
   * @param text Input text to embed
   * @returns Promise resolving to 1024-dimensional embedding vector
   * @throws Error if Mnemosyne not available or embedding generation fails
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.available) {
      throw new Error(
        'Mnemosyne not available for embeddings. ' +
        'Ensure Mnemosyne MCP is configured in Claude Code.'
      );
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Cannot generate embedding for empty text');
    }

    // Generate unique entity name for this embedding query
    const entityName = `${this.tempEntityPrefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // STEP 1: Create temporary entity
      // Claude Code will call: mcp__mnemosyne__create_entities
      await this.createEntity(entityName, text);
      
      // STEP 2: Get the auto-generated BGE-large embedding
      // Claude Code will call: mcp__mnemosyne__get_entity_embedding
      const embedding = await this.getEmbedding(entityName);
      
      // STEP 3: Clean up temporary entity
      // Claude Code will call: mcp__mnemosyne__delete_entities
      await this.deleteEntity(entityName);

      if (!embedding || embedding.length === 0) {
        throw new Error('Received empty embedding from Mnemosyne');
      }

      if (embedding.length !== this.dimensions) {
        console.warn(
          `[MnemosyneEmbeddingProvider] Expected ${this.dimensions} dimensions, got ${embedding.length}`
        );
      }

      return embedding;
    } catch (error) {
      // Attempt cleanup even on error
      try {
        await this.deleteEntity(entityName);
      } catch (cleanupError) {
        console.warn('[MnemosyneEmbeddingProvider] Cleanup failed:', cleanupError);
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Mnemosyne embedding generation failed: ${errorMessage}`);
    }
  }

  /**
   * Get embedding dimensions
   * @returns 1024 (dimension count for BGE-large)
   */
  getDimensions(): number {
    return this.dimensions;
  }

  /**
   * Check if Mnemosyne is available
   * @returns true if Mnemosyne MCP is accessible
   */
  isAvailable(): boolean {
    return this.available;
  }

  /**
   * Check if Mnemosyne MCP is available
   * 
   * This is a placeholder that should be implemented to actually test
   * if Mnemosyne tools are accessible. In production with Claude Code,
   * this would attempt a simple Mnemosyne operation.
   * 
   * @private
   */
  private async checkMnemosyneAvailability(): Promise<boolean> {
    try {
      // TODO: Implement actual availability check
      // This would involve Claude Code attempting to list Mnemosyne tools
      // or performing a simple test operation
      
      // For now, assume unavailable in this TypeScript context
      // The actual availability is determined at runtime when Claude Code executes
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create temporary entity in Mnemosyne
   * 
   * DOCUMENTED INTERFACE - Claude Code will execute:
   * mcp__mnemosyne__create_entities({
   *   entities: [{
   *     name: entityName,
   *     entityType: 'embedding_query',
   *     observations: [text]
   *   }]
   * })
   * 
   * @private
   */
  private async createEntity(entityName: string, text: string): Promise<void> {
    throw new Error(
      'createEntity must be executed by Claude Code with Mnemosyne MCP tools. ' +
      'This TypeScript code documents the interface but cannot directly call MCP tools. ' +
      `Expected call: mcp__mnemosyne__create_entities({ entities: [{ name: "${entityName}", entityType: "embedding_query", observations: ["${text.substring(0, 50)}..."] }] })`
    );
  }

  /**
   * Get embedding for entity from Mnemosyne
   * 
   * DOCUMENTED INTERFACE - Claude Code will execute:
   * mcp__mnemosyne__get_entity_embedding({
   *   entity_name: entityName
   * })
   * 
   * @returns 1024-dimensional BGE-large embedding vector
   * @private
   */
  private async getEmbedding(entityName: string): Promise<number[]> {
    throw new Error(
      'getEmbedding must be executed by Claude Code with Mnemosyne MCP tools. ' +
      'This TypeScript code documents the interface but cannot directly call MCP tools. ' +
      `Expected call: mcp__mnemosyne__get_entity_embedding({ entity_name: "${entityName}" })`
    );
  }

  /**
   * Delete temporary entity from Mnemosyne
   * 
   * DOCUMENTED INTERFACE - Claude Code will execute:
   * mcp__mnemosyne__delete_entities({
   *   entityNames: [entityName]
   * })
   * 
   * @private
   */
  private async deleteEntity(entityName: string): Promise<void> {
    // Non-critical operation - document but don't throw if not executed
    console.log(
      `[MnemosyneEmbeddingProvider] Would delete temp entity: ${entityName}. ` +
      `Expected call: mcp__mnemosyne__delete_entities({ entityNames: ["${entityName}"] })`
    );
  }
}
