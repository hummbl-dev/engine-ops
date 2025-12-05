/*
 * Copyright (c) 2025, HUMMBL, LLC
 *
 * This file is part of Engine-Ops and is licensed under the
 * Business Source License 1.1 (BSL 1.1).
 *
 * You may use this file in accordance with the BSL 1.1. See the
 * LICENSE file at the root of this repository for details.
 *
 * Change Date: 2029-01-01
 * Change License: Apache License, Version 2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

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
export class MigrationManager {
  private migrations: Map<string, Migration> = new Map();
  private appliedMigrations: MigrationRecord[] = [];
  private migrationsPath: string;
  private stateFile: string;

  constructor(migrationsPath: string, stateFile?: string) {
    this.migrationsPath = migrationsPath;
    this.stateFile = stateFile || path.join(migrationsPath, '.migrations-state.json');
    this.loadState();
  }

  /**
   * Register a migration
   */
  registerMigration(migration: Migration): void {
    if (this.migrations.has(migration.version)) {
      throw new Error(`Migration ${migration.version} is already registered`);
    }
    this.migrations.set(migration.version, migration);
  }

  /**
   * Load migrations state from file
   */
  private loadState(): void {
    try {
      if (fs.existsSync(this.stateFile)) {
        const data = fs.readFileSync(this.stateFile, 'utf-8');
        const state = JSON.parse(data);
        this.appliedMigrations = state.migrations.map((m: MigrationRecord) => ({
          ...m,
          appliedAt: new Date(m.appliedAt),
        }));
      }
    } catch (error) {
      console.warn('Could not load migrations state:', error);
      this.appliedMigrations = [];
    }
  }

  /**
   * Save migrations state to file
   */
  private saveState(): void {
    try {
      const dir = path.dirname(this.stateFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const state = {
        migrations: this.appliedMigrations,
        lastUpdated: new Date().toISOString(),
      };

      fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('Could not save migrations state:', error);
      throw error;
    }
  }

  /**
   * Calculate checksum for a migration using SHA-256
   */
  private calculateChecksum(migration: Migration): string {
    const content = migration.up.toString() + migration.down.toString();
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Check if a migration has been applied
   */
  isMigrationApplied(version: string): boolean {
    return this.appliedMigrations.some((m) => m.version === version);
  }

  /**
   * Get pending migrations
   */
  getPendingMigrations(): Migration[] {
    const pending: Migration[] = [];
    const sortedVersions = Array.from(this.migrations.keys()).sort();

    for (const version of sortedVersions) {
      if (!this.isMigrationApplied(version)) {
        const migration = this.migrations.get(version)!;
        pending.push(migration);
      }
    }

    return pending;
  }

  /**
   * Apply a single migration
   */
  async applyMigration(migration: Migration): Promise<void> {
    console.log(`Applying migration ${migration.version}: ${migration.name}`);

    try {
      // Run the migration
      await migration.up();

      // Validate if validation function is provided
      if (migration.validateUp) {
        const isValid = await migration.validateUp();
        if (!isValid) {
          throw new Error('Migration validation failed');
        }
      }

      // Record the migration
      const record: MigrationRecord = {
        version: migration.version,
        name: migration.name,
        appliedAt: new Date(),
        checksum: this.calculateChecksum(migration),
      };

      this.appliedMigrations.push(record);
      this.saveState();

      console.log(`✓ Migration ${migration.version} applied successfully`);
    } catch (error) {
      console.error(`✗ Migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  /**
   * Rollback a single migration
   */
  async rollbackMigration(version: string): Promise<void> {
    const migration = this.migrations.get(version);
    if (!migration) {
      throw new Error(`Migration ${version} not found`);
    }

    const recordIndex = this.appliedMigrations.findIndex((m) => m.version === version);
    if (recordIndex === -1) {
      throw new Error(`Migration ${version} is not applied`);
    }

    console.log(`Rolling back migration ${version}: ${migration.name}`);

    try {
      // Run the rollback
      await migration.down();

      // Validate if validation function is provided
      if (migration.validateDown) {
        const isValid = await migration.validateDown();
        if (!isValid) {
          throw new Error('Rollback validation failed');
        }
      }

      // Remove the migration record
      this.appliedMigrations.splice(recordIndex, 1);
      this.saveState();

      console.log(`✓ Migration ${version} rolled back successfully`);
    } catch (error) {
      console.error(`✗ Rollback of migration ${version} failed:`, error);
      throw error;
    }
  }

  /**
   * Apply all pending migrations
   */
  async migrate(): Promise<void> {
    const pending = this.getPendingMigrations();

    if (pending.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log(`Found ${pending.length} pending migration(s)`);

    for (const migration of pending) {
      await this.applyMigration(migration);
    }

    console.log('All migrations applied successfully');
  }

  /**
   * Rollback the last N migrations
   */
  async rollback(count: number = 1): Promise<void> {
    if (this.appliedMigrations.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const toRollback = Math.min(count, this.appliedMigrations.length);
    console.log(`Rolling back ${toRollback} migration(s)`);

    // Rollback in reverse order
    for (let i = 0; i < toRollback; i++) {
      const lastMigration = this.appliedMigrations[this.appliedMigrations.length - 1];
      await this.rollbackMigration(lastMigration.version);
    }

    console.log('Rollback completed successfully');
  }

  /**
   * Get migration status
   */
  getStatus(): {
    applied: MigrationRecord[];
    pending: Migration[];
    total: number;
  } {
    return {
      applied: [...this.appliedMigrations],
      pending: this.getPendingMigrations(),
      total: this.migrations.size,
    };
  }

  /**
   * Verify migration integrity
   */
  verifyIntegrity(): boolean {
    for (const record of this.appliedMigrations) {
      const migration = this.migrations.get(record.version);
      if (!migration) {
        console.error(`Migration ${record.version} is applied but not found in registry`);
        return false;
      }

      const currentChecksum = this.calculateChecksum(migration);
      if (currentChecksum !== record.checksum) {
        console.error(`Migration ${record.version} has been modified after being applied`);
        return false;
      }
    }

    return true;
  }
}
