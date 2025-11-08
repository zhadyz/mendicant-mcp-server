/**
 * Dashboard Bridge
 *
 * Provides HTTP/SSE endpoint for dashboard to consume orchestration events.
 * Bridges the gap between MCP server (stdio) and dashboard (HTTP).
 */
export interface DashboardBridgeConfig {
    port: number;
    host: string;
    cors_origin?: string;
}
/**
 * HTTP server that provides SSE endpoint for dashboard
 */
export declare class DashboardBridge {
    private server;
    private config;
    private actualPort;
    private sseClients;
    constructor(config: DashboardBridgeConfig); /**
     * Get the actual port the server is listening on
     */
    getPort(): number;
    /**
     * Start the bridge server
     */
    start(): Promise<void>;
    /**
     * Stop the bridge server
     */
    stop(): Promise<void>;
    /**
     * Handle HTTP requests
     */
    private handleRequest;
    /**
     * Health check endpoint
     */
    private handleHealth;
    /**
     * Server-Sent Events endpoint
     */
    private handleSSE;
    /**
     * Send SSE message to client
     */
    private sendSSE;
    /**
     * Broadcast event to all connected SSE clients
     */
    private broadcastEvent;
    /**
     * Stats endpoint
     */
    private handleStats;
    /**
     * History endpoint (REST API for historical events)
     */
    private handleHistory;
    /**
     * Subscribe to orchestration events and broadcast to SSE clients
     */
    private subscribeToEvents;
}
/**
 * Create and configure dashboard bridge
 */
export declare function createDashboardBridge(config?: Partial<DashboardBridgeConfig>): DashboardBridge;
//# sourceMappingURL=dashboard_bridge.d.ts.map