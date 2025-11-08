import { createServer } from 'http';
/**
 * Check if a port is available
 */
async function isPortAvailable(port, host = '127.0.0.1') {
    return new Promise((resolve) => {
        const server = createServer();
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(false);
            }
            else {
                resolve(false);
            }
        });
        server.once('listening', () => {
            server.close();
            resolve(true);
        });
        server.listen(port); // Test all interfaces
    });
}
/**
 * Find an available port starting from preferredPort
 * @param preferredPort - The port to try first
 * @param host - The host to bind to (default: 127.0.0.1)
 * @param maxAttempts - Maximum number of ports to try (default: 100)
 * @returns The available port number
 */
export async function findAvailablePort(preferredPort, host = '127.0.0.1', maxAttempts = 100) {
    for (let i = 0; i < maxAttempts; i++) {
        const port = preferredPort + i;
        const available = await isPortAvailable(port, host);
        if (available) {
            return port;
        }
    }
    throw new Error(`Could not find available port in range ${preferredPort}-${preferredPort + maxAttempts - 1}`);
}
//# sourceMappingURL=port-finder.js.map