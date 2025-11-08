/**
 * Dashboard Bridge
 *
 * Provides HTTP/SSE endpoint for dashboard to consume orchestration events.
 * Bridges the gap between MCP server (stdio) and dashboard (HTTP).
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { orchestrationEvents, OrchestrationEventType } from './event_emitter.js';
import { findAvailablePort } from '../utils/port-finder.js';

export interface DashboardBridgeConfig {
  port: number;
  host: string;
  cors_origin?: string;
}

/**
 * HTTP server that provides SSE endpoint for dashboard
 */
export class DashboardBridge {
  private server: ReturnType<typeof createServer> | null = null;
  private config: DashboardBridgeConfig;
  private actualPort: number = 0;
  private sseClients: Set<ServerResponse> = new Set();

  constructor(config: DashboardBridgeConfig) {
    this.config = config;
  }  /**
   * Get the actual port the server is listening on
   */
  getPort(): number {
    return this.actualPort;
  }


  /**
   * Start the bridge server
   */
  async start(): Promise<void> {
    const preferredPort = this.config.port;
    this.actualPort = await findAvailablePort(preferredPort, this.config.host);
    if (this.actualPort !== preferredPort) {
      console.log(`[DashboardBridge] Port ${preferredPort} in use, using port ${this.actualPort} instead`);
    }
    return new Promise((resolve, reject) => {
      this.server = createServer(this.handleRequest.bind(this));

      this.server.on('error', (error) => {
        console.error('[DashboardBridge] Server error:', error);
        reject(error);
      });

      this.server.listen(this.actualPort, this.config.host, () => {
        console.log(`[DashboardBridge] Listening on http://${this.config.host}:${this.actualPort}`);
        this.subscribeToEvents();
        resolve();
      });
    });
  }

  /**
   * Stop the bridge server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      // Close all SSE connections
      for (const client of this.sseClients) {
        client.end();
      }
      this.sseClients.clear();

      if (this.server) {
        this.server.close(() => {
          console.log('[DashboardBridge] Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Handle HTTP requests
   */
  private handleRequest(req: IncomingMessage, res: ServerResponse) {
    // CORS headers
    const origin = this.config.cors_origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = req.url || '';

    if (url === '/health') {
      this.handleHealth(req, res);
    } else if (url === '/events') {
      this.handleSSE(req, res);
    } else if (url === '/stats') {
      this.handleStats(req, res);
    } else if (url.startsWith('/history')) {
      this.handleHistory(req, res);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  }

  /**
   * Health check endpoint
   */
  private handleHealth(req: IncomingMessage, res: ServerResponse) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      uptime: process.uptime(),
      connected_clients: this.sseClients.size,
      timestamp: Date.now()
    }));
  }

  /**
   * Server-Sent Events endpoint
   */
  private handleSSE(req: IncomingMessage, res: ServerResponse) {
    console.log('[DashboardBridge] New SSE client connected');

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': this.config.cors_origin || '*'
    });

    // Send initial connection confirmation
    this.sendSSE(res, 'connected', {
      message: 'Connected to Mendicant orchestration events',
      timestamp: Date.now()
    });

    // Add client to set
    this.sseClients.add(res);

    // Send buffered events (replay recent history)
    const buffered = orchestrationEvents.getBufferedEvents();
    for (const event of buffered.slice(-50)) { // Last 50 events
      this.sendSSE(res, event.type, event.payload);
    }

    // Handle client disconnect
    req.on('close', () => {
      console.log('[DashboardBridge] SSE client disconnected');
      this.sseClients.delete(res);
    });
  }

  /**
   * Send SSE message to client
   */
  private sendSSE(res: ServerResponse, event: string, data: any) {
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('[DashboardBridge] Failed to send SSE:', error);
    }
  }

  /**
   * Broadcast event to all connected SSE clients
   */
  private broadcastEvent(type: string, payload: any) {
    const deadClients: ServerResponse[] = [];

    for (const client of this.sseClients) {
      try {
        this.sendSSE(client, type, payload);
      } catch (error) {
        console.error('[DashboardBridge] Failed to send to client:', error);
        deadClients.push(client);
      }
    }

    // Remove dead clients
    for (const dead of deadClients) {
      this.sseClients.delete(dead);
    }
  }

  /**
   * Stats endpoint
   */
  private handleStats(req: IncomingMessage, res: ServerResponse) {
    const stats = orchestrationEvents.getStats();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ...stats,
      connected_clients: this.sseClients.size,
      timestamp: Date.now()
    }));
  }

  /**
   * History endpoint (REST API for historical events)
   */
  private handleHistory(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const since = parseInt(url.searchParams.get('since') || '0', 10);

    const events = orchestrationEvents.getBufferedEvents(since);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      events,
      count: events.length,
      timestamp: Date.now()
    }));
  }

  /**
   * Subscribe to orchestration events and broadcast to SSE clients
   */
  private subscribeToEvents() {
    // Subscribe to all event types
    orchestrationEvents.on('*', (data: { type: string; payload: any }) => {
      this.broadcastEvent(data.type, data.payload);
    });

    console.log('[DashboardBridge] Subscribed to orchestration events');
  }
}

/**
 * Create and configure dashboard bridge
 */
export function createDashboardBridge(config?: Partial<DashboardBridgeConfig>): DashboardBridge {
  const defaultConfig: DashboardBridgeConfig = {
    port: parseInt(process.env.DASHBOARD_BRIDGE_PORT || '3001', 10),
    host: process.env.DASHBOARD_HOST || '127.0.0.1',
    cors_origin: process.env.DASHBOARD_CORS_ORIGIN || 'http://localhost:3000'
  };

  return new DashboardBridge({ ...defaultConfig, ...config });
}
