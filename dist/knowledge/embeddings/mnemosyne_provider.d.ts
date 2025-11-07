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
export declare class MnemosyneEmbeddingProvider implements EmbeddingProvider {
    private dimensions;
    private available;
    private readonly tempEntityPrefix;
    /**
     * Initialize and check if Mnemosyne MCP is available
     *
     * Note: In production, Claude Code will have Mnemosyne tools available.
     * During development/testing, this may return false.
     */
    initialize(): Promise<void>;
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
    generateEmbedding(text: string): Promise<number[]>;
    /**
     * Get embedding dimensions
     * @returns 1024 (dimension count for BGE-large)
     */
    getDimensions(): number;
    /**
     * Check if Mnemosyne is available
     * @returns true if Mnemosyne MCP is accessible
     */
    isAvailable(): boolean;
    /**
     * Check if Mnemosyne MCP is available
     *
     * This is a placeholder that should be implemented to actually test
     * if Mnemosyne tools are accessible. In production with Claude Code,
     * this would attempt a simple Mnemosyne operation.
     *
     * @private
     */
    private checkMnemosyneAvailability;
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
    private createEntity;
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
    private getEmbedding;
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
    private deleteEntity;
}
//# sourceMappingURL=mnemosyne_provider.d.ts.map