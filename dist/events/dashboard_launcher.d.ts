/**
 * Dashboard Auto-Launcher
 *
 * Automatically spawns the Next.js dashboard when MCP server starts.
 * Manages dashboard lifecycle (start/stop) and health monitoring.
 */
export interface DashboardLauncherConfig {
    dashboardPath: string;
    autoStart: boolean;
    port: number;
    env?: Record<string, string>;
}
/**
 * Dashboard process manager
 */
export declare class DashboardLauncher {
    private config;
    private dashboardProcess;
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
     * Wait for dashboard to be ready
     */
    private waitForReady;
    /**
     * Stop the dashboard
     */
    stop(): Promise<void>;
    /**
     * Get dashboard status
     */
    getStatus(): {
        running: boolean;
        pid: number | undefined;
        port: number;
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