/**
 * Find an available port starting from preferredPort
 * @param preferredPort - The port to try first
 * @param host - The host to bind to (default: 127.0.0.1)
 * @param maxAttempts - Maximum number of ports to try (default: 100)
 * @returns The available port number
 */
export declare function findAvailablePort(preferredPort: number, host?: string, maxAttempts?: number): Promise<number>;
//# sourceMappingURL=port-finder.d.ts.map