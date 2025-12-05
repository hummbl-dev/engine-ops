/**
 * Migration definition interface
 */
export interface Migration {
  version: string;
  name: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
  validateUp?: () => Promise<boolean>;
  validateDown?: () => Promise<boolean>;
}
/**
 * Migration record for tracking applied migrations
 */
export interface MigrationRecord {
  version: string;
  name: string;
  appliedAt: Date;
  checksum: string;
}
/**
 * Migration manager for handling database and schema migrations
 * with rollback safety
 */
export declare class MigrationManager {
  private migrations;
  private appliedMigrations;
  private migrationsPath;
  private stateFile;
  constructor(migrationsPath: string, stateFile?: string);
  /**
   * Register a migration
   */
  registerMigration(migration: Migration): void;
  /**
   * Load migrations state from file
   */
  private loadState;
  /**
   * Save migrations state to file
   */
  private saveState;
  /**
   * Calculate checksum for a migration using SHA-256
   */
  private calculateChecksum;
  /**
   * Check if a migration has been applied
   */
  isMigrationApplied(version: string): boolean;
  /**
   * Get pending migrations
   */
  getPendingMigrations(): Migration[];
  /**
   * Apply a single migration
   */
  applyMigration(migration: Migration): Promise<void>;
  /**
   * Rollback a single migration
   */
  rollbackMigration(version: string): Promise<void>;
  /**
   * Apply all pending migrations
   */
  migrate(): Promise<void>;
  /**
   * Rollback the last N migrations
   */
  rollback(count?: number): Promise<void>;
  /**
   * Get migration status
   */
  getStatus(): {
    applied: MigrationRecord[];
    pending: Migration[];
    total: number;
  };
  /**
   * Verify migration integrity
   */
  verifyIntegrity(): boolean;
}
//# sourceMappingURL=migration-manager.d.ts.map
