/**
 * Dashboard Auto-Launcher
 *
 * Serves the static dashboard build when MCP server starts.
 * Manages dashboard HTTP server lifecycle.
 */
export interface DashboardLauncherConfig {
    dashboardPath: string;
    autoStart: boolean;
    port: number;
    env?: Record<string, string>;
}
/**
 * Dashboard HTTP server manager
 */
export declare class DashboardLauncher {
    private config;
    private httpServer;
    private isRunning;
    private startupPromise;
    constructor(config: DashboardLauncherConfig);
    /**
     * Start the dashboard
     */
    start(): Promise<void>;
    /**
     * Internal start implementation
     */
    private _startInternal;
    /**
     * Stop the dashboard
     */
    stop(): Promise<void>;
    /**
     * Get dashboard status
     */
    getStatus(): {
        running: boolean;
        port: number;
        url: string;
    };
    /**
     * Restart the dashboard
     */
    restart(): Promise<void>;
}
/**
 * Create and configure dashboard launcher
 */
export declare function createDashboardLauncher(config?: Partial<DashboardLauncherConfig>): DashboardLauncher;
//# sourceMappingURL=dashboard_launcher.d.ts.map