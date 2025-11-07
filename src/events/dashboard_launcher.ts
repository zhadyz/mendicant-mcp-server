/**
 * Dashboard Auto-Launcher
 *
 * Automatically spawns the Next.js dashboard when MCP server starts.
 * Manages dashboard lifecycle (start/stop) and health monitoring.
 */

import { spawn, type ChildProcess } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

export interface DashboardLauncherConfig {
  dashboardPath: string;
  autoStart: boolean;
  port: number;
  env?: Record<string, string>;
}

/**
 * Dashboard process manager
 */
export class DashboardLauncher {
  private config: DashboardLauncherConfig;
  private dashboardProcess: ChildProcess | null = null;
  private isRunning = false;
  private startupPromise: Promise<void> | null = null;

  constructor(config: DashboardLauncherConfig) {
    this.config = config;
  }

  /**
   * Start the dashboard
   */
  async start(): Promise<void> {
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
    } finally {
      this.startupPromise = null;
    }
  }

  /**
   * Internal start implementation
   */
  private async _startInternal(): Promise<void> {
    console.log('[DashboardLauncher] Starting dashboard...');

    // Validate dashboard path
    if (!existsSync(this.config.dashboardPath)) {
      throw new Error(`Dashboard path does not exist: ${this.config.dashboardPath}`);
    }

    const packageJsonPath = join(this.config.dashboardPath, 'package.json');
    if (!existsSync(packageJsonPath)) {
      throw new Error(`Dashboard package.json not found at: ${packageJsonPath}`);
    }

    // Prepare environment
    const env = {
      ...process.env,
      PORT: String(this.config.port),
      NODE_ENV: process.env.NODE_ENV || 'development',
      ...this.config.env
    };

    // Spawn dashboard process
    const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const args = ['run', 'dev'];

    this.dashboardProcess = spawn(command, args, {
      cwd: this.config.dashboardPath,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false
    });

    // Handle stdout
    if (this.dashboardProcess.stdout) {
      this.dashboardProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          console.log(`[Dashboard] ${output}`);
        }
      });
    }

    // Handle stderr
    if (this.dashboardProcess.stderr) {
      this.dashboardProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          console.error(`[Dashboard Error] ${output}`);
        }
      });
    }

    // Handle process exit
    this.dashboardProcess.on('exit', (code, signal) => {
      console.log(`[DashboardLauncher] Dashboard exited with code ${code}, signal ${signal}`);
      this.isRunning = false;
      this.dashboardProcess = null;
    });

    // Handle process errors
    this.dashboardProcess.on('error', (error) => {
      console.error('[DashboardLauncher] Dashboard process error:', error);
      this.isRunning = false;
      this.dashboardProcess = null;
    });

    this.isRunning = true;

    // Wait for dashboard to be ready (check for Next.js ready message or timeout)
    await this.waitForReady();

    console.log(`[DashboardLauncher] Dashboard started successfully on port ${this.config.port}`);
  }

  /**
   * Wait for dashboard to be ready
   */
  private async waitForReady(timeoutMs: number = 30000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.warn('[DashboardLauncher] Dashboard startup timeout, but continuing anyway');
        resolve();
      }, timeoutMs);

      // Check for Next.js ready indicators in stdout
      const checkReady = (data: Buffer) => {
        const output = data.toString();
        if (output.includes('Ready') || output.includes('started server') || output.includes('Local:')) {
          clearTimeout(timeout);
          if (this.dashboardProcess?.stdout) {
            this.dashboardProcess.stdout.removeListener('data', checkReady);
          }
          resolve();
        }
      };

      if (this.dashboardProcess?.stdout) {
        this.dashboardProcess.stdout.on('data', checkReady);
      } else {
        // If no stdout, just wait a bit
        setTimeout(() => {
          clearTimeout(timeout);
          resolve();
        }, 5000);
      }
    });
  }

  /**
   * Stop the dashboard
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.dashboardProcess) {
      console.log('[DashboardLauncher] Dashboard not running');
      return;
    }

    console.log('[DashboardLauncher] Stopping dashboard...');

    return new Promise((resolve) => {
      if (!this.dashboardProcess) {
        resolve();
        return;
      }

      // Set timeout for forceful kill
      const timeout = setTimeout(() => {
        if (this.dashboardProcess && !this.dashboardProcess.killed) {
          console.log('[DashboardLauncher] Force killing dashboard');
          this.dashboardProcess.kill('SIGKILL');
        }
        resolve();
      }, 5000);

      this.dashboardProcess.once('exit', () => {
        clearTimeout(timeout);
        this.isRunning = false;
        this.dashboardProcess = null;
        console.log('[DashboardLauncher] Dashboard stopped');
        resolve();
      });

      // Try graceful shutdown
      if (process.platform === 'win32') {
        this.dashboardProcess.kill('SIGTERM');
      } else {
        this.dashboardProcess.kill('SIGTERM');
      }
    });
  }

  /**
   * Get dashboard status
   */
  getStatus() {
    return {
      running: this.isRunning,
      pid: this.dashboardProcess?.pid,
      port: this.config.port
    };
  }

  /**
   * Restart the dashboard
   */
  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }
}

/**
 * Create and configure dashboard launcher
 */
export function createDashboardLauncher(config?: Partial<DashboardLauncherConfig>): DashboardLauncher {
  const defaultConfig: DashboardLauncherConfig = {
    dashboardPath: join(process.cwd(), '..', 'dashboard'),
    autoStart: process.env.MENDICANT_AUTO_LAUNCH_DASHBOARD !== 'false',
    port: parseInt(process.env.DASHBOARD_PORT || '3000', 10),
    env: {
      NEXT_PUBLIC_BRIDGE_URL: `http://127.0.0.1:${process.env.DASHBOARD_BRIDGE_PORT || '3001'}`
    }
  };

  return new DashboardLauncher({ ...defaultConfig, ...config });
}
