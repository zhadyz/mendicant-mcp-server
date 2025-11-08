import { createServer } from 'http';

/**
 * Check if a port is available
 */
async function isPortAvailable(port: number, host: string = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();

    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
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
export async function findAvailablePort(
  preferredPort: number,
  host: string = '127.0.0.1',
  maxAttempts: number = 100
): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = preferredPort + i;
    const available = await isPortAvailable(port, host);

    if (available) {
      return port;
    }
  }

  throw new Error(
    `Could not find available port in range ${preferredPort}-${preferredPort + maxAttempts - 1}`
  );
}
