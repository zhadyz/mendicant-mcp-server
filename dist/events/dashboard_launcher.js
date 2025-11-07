/**
 * Dashboard Auto-Launcher
 *
 * Serves the static dashboard build when MCP server starts.
 * Manages dashboard HTTP server lifecycle.
 */
import { createServer } from 'http';
import { join, extname } from 'path';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
/**
 * Dashboard HTTP server manager
 */
export class DashboardLauncher {
    config;
    httpServer = null;
    isRunning = false;
    startupPromise = null;
    constructor(config) {
        this.config = config;
    }
    /**
     * Start the dashboard
     */
    async start() {
        // Prevent multiple simultaneous starts
        if (this.startupPromise) {
            return this.startupPromise;
        }
        if (this.isRunning) {
            console.log('[DashboardLauncher] Dashboard already running');
            return;
        }
        this.startupPromise = this._startInternal();
        try {
            await this.startupPromise;
        }
        finally {
            this.startupPromise = null;
        }
    }
    /**
     * Internal start implementation
     */
    async _startInternal() {
        console.log('[DashboardLauncher] Starting dashboard HTTP server...');
        // Validate dashboard path
        if (!existsSync(this.config.dashboardPath)) {
            throw new Error(`Dashboard path does not exist: ${this.config.dashboardPath}`);
        }
        // Create HTTP server to serve static files
        this.httpServer = createServer((req, res) => {
            try {
                // Parse URL and remove query string
                const url = new URL(req.url || '/', `http://localhost:${this.config.port}`);
                let pathname = url.pathname;
                // Default to index.html for root
                if (pathname === '/') {
                    pathname = '/index.html';
                }
                // Map routes to .html files for Next.js static export
                if (!pathname.includes('.') && !pathname.endsWith('.html')) {
                    pathname = `${pathname}.html`;
                }
                // Build file path
                const filePath = join(this.config.dashboardPath, pathname);
                // Check if file exists
                if (!existsSync(filePath)) {
                    // Try 404.html
                    const notFoundPath = join(this.config.dashboardPath, '404.html');
                    if (existsSync(notFoundPath)) {
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end(readFileSync(notFoundPath));
                    }
                    else {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('Not Found');
                    }
                    return;
                }
                // Determine content type
                const ext = extname(filePath);
                const contentTypeMap = {
                    '.html': 'text/html',
                    '.js': 'application/javascript',
                    '.css': 'text/css',
                    '.json': 'application/json',
                    '.png': 'image/png',
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.gif': 'image/gif',
                    '.svg': 'image/svg+xml',
                    '.ico': 'image/x-icon',
                    '.woff': 'font/woff',
                    '.woff2': 'font/woff2',
                    '.ttf': 'font/ttf',
                    '.txt': 'text/plain'
                };
                const contentType = contentTypeMap[ext] || 'application/octet-stream';
                // Read and serve file
                const content = readFileSync(filePath);
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            }
            catch (error) {
                console.error('[Dashboard] Error serving file:', error);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            }
        });
        // Start listening
        await new Promise((resolve, reject) => {
            this.httpServer.listen(this.config.port, () => {
                this.isRunning = true;
                console.log(`[DashboardLauncher] Dashboard HTTP server started on http://localhost:${this.config.port}`);
                resolve();
            });
            this.httpServer.on('error', (error) => {
                console.error('[DashboardLauncher] HTTP server error:', error);
                reject(error);
            });
        });
    }
    /**
     * Stop the dashboard
     */
    async stop() {
        if (!this.isRunning || !this.httpServer) {
            console.log('[DashboardLauncher] Dashboard not running');
            return;
        }
        console.log('[DashboardLauncher] Stopping dashboard HTTP server...');
        return new Promise((resolve) => {
            if (!this.httpServer) {
                resolve();
                return;
            }
            this.httpServer.close(() => {
                this.isRunning = false;
                this.httpServer = null;
                console.log('[DashboardLauncher] Dashboard HTTP server stopped');
                resolve();
            });
        });
    }
    /**
     * Get dashboard status
     */
    getStatus() {
        return {
            running: this.isRunning,
            port: this.config.port,
            url: `http://localhost:${this.config.port}`
        };
    }
    /**
     * Restart the dashboard
     */
    async restart() {
        await this.stop();
        await this.start();
    }
}
/**
 * Create and configure dashboard launcher
 */
export function createDashboardLauncher(config) {
    // Dashboard is bundled in the npm package at ../dashboard (relative to dist/)
    // When running from dist/index.js, the dashboard is at ../dashboard
    const dashboardPath = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'dashboard');
    const defaultConfig = {
        dashboardPath,
        autoStart: process.env.MENDICANT_AUTO_LAUNCH_DASHBOARD !== 'false',
        port: parseInt(process.env.DASHBOARD_PORT || '3000', 10)
    };
    return new DashboardLauncher({ ...defaultConfig, ...config });
}
//# sourceMappingURL=dashboard_launcher.js.map