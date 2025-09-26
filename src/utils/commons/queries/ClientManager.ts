// ClientManager.ts (Updated)
import { generateClient } from 'aws-amplify/data';
import { logger } from '../log';

/**
 * Singleton manager for AWS Amplify client instances.
 * Assumes Amplify.configure() has already been called.
 */
export class ClientManager {
  private static instances = new Map<string, ClientManager>();
  private client: unknown | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor(private readonly clientKey: string) {}

  public static getInstance(clientKey: string = 'default'): ClientManager {
    if (!ClientManager.instances.has(clientKey)) {
      ClientManager.instances.set(clientKey, new ClientManager(clientKey));
    }
    return ClientManager.instances.get(clientKey)!;
  }

  /**
   * Initialize the client by generating it from Amplify.
   */
  public initialize<T extends Record<string, unknown>>(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.generateClient<T>();
    return this.initPromise;
  }

  /**
   * Get the initialized client.
   */
  public async getClient<T>(): Promise<T> {
    if (!this.initPromise) {
      throw new Error(
        `Client not initialized for key '${this.clientKey}'. Call initialize() first.`,
      );
    }

    await this.initPromise;
    return this.client as T;
  }

  /**
   * Check if client is initialized.
   */
  public isInitialized(): boolean {
    return this.client !== null;
  }

  /**
   * Reset this client instance.
   */
  public reset(): void {
    this.client = null;
    this.initPromise = null;
    logger.debug(`Client reset for key: ${this.clientKey}`);
  }

  /**
   * Reset all client instances.
   */
  public static resetAll(): void {
    ClientManager.instances.forEach(manager => manager.reset());
    ClientManager.instances.clear();
    logger.debug('All clients reset');
  }

  private async generateClient<
    T extends Record<string, unknown>,
  >(): Promise<void> {
    try {
      this.client = generateClient<T>();
    } catch (error) {
      this.initPromise = null; // Allow retry
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Client generation failed for key: ${this.clientKey}`, {
        error: message,
      });
      throw new Error(
        `Failed to generate client '${this.clientKey}': ${message}`,
      );
    }
  }
}
