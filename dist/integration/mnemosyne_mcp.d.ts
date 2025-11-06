/**
 * MNEMOSYNE MCP INTEGRATION
 *
 * Wrapper around Mnemosyne MCP tools for knowledge graph persistence.
 * Provides clean interface for memory bridge to interact with long-term storage.
 */
/**
 * Create entities in Mnemosyne knowledge graph
 */
export declare function createMnemosyneEntities(entities: any[]): Promise<void>;
/**
 * Create relations in Mnemosyne knowledge graph
 */
export declare function createMnemosyneRelations(relations: any[]): Promise<void>;
/**
 * Semantic search in Mnemosyne knowledge graph
 */
export declare function semanticSearchMnemosyne(query: string, entityTypes?: string[], limit?: number, minSimilarity?: number): Promise<any[]>;
/**
 * Open specific nodes from Mnemosyne
 */
export declare function openMnemosyneNodes(names: string[]): Promise<any[]>;
/**
 * Add observations to existing entities
 */
export declare function addMnemosyneObservations(observations: any[]): Promise<void>;
/**
 * Initialize MCP client for Mnemosyne
 * Call this when the MCP server starts
 */
export declare function initializeMnemosyneClient(mcpClient: any): void;
//# sourceMappingURL=mnemosyne_mcp.d.ts.map