'use strict';
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
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.MigrationManager = void 0;
const fs = __importStar(require('fs'));
const path = __importStar(require('path'));
const crypto = __importStar(require('crypto'));
/**
 * Migration manager for handling database and schema migrations
 * with rollback safety
 */
class MigrationManager {
  migrations = new Map();
  appliedMigrations = [];
  migrationsPath;
  stateFile;
  constructor(migrationsPath, stateFile) {
    this.migrationsPath = migrationsPath;
    this.stateFile = stateFile || path.join(migrationsPath, '.migrations-state.json');
    this.loadState();
  }
  /**
   * Register a migration
   */
  registerMigration(migration) {
    if (this.migrations.has(migration.version)) {
      throw new Error(`Migration ${migration.version} is already registered`);
    }
    this.migrations.set(migration.version, migration);
  }
  /**
   * Load migrations state from file
   */
  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        const data = fs.readFileSync(this.stateFile, 'utf-8');
        const state = JSON.parse(data);
        this.appliedMigrations = state.migrations.map((m) => ({
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
  saveState() {
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
  calculateChecksum(migration) {
    const content = migration.up.toString() + migration.down.toString();
    return crypto.createHash('sha256').update(content).digest('hex');
  }
  /**
   * Check if a migration has been applied
   */
  isMigrationApplied(version) {
    return this.appliedMigrations.some((m) => m.version === version);
  }
  /**
   * Get pending migrations
   */
  getPendingMigrations() {
    const pending = [];
    const sortedVersions = Array.from(this.migrations.keys()).sort();
    for (const version of sortedVersions) {
      if (!this.isMigrationApplied(version)) {
        const migration = this.migrations.get(version);
        pending.push(migration);
      }
    }
    return pending;
  }
  /**
   * Apply a single migration
   */
  async applyMigration(migration) {
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
      const record = {
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
  async rollbackMigration(version) {
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
  async migrate() {
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
  async rollback(count = 1) {
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
  getStatus() {
    return {
      applied: [...this.appliedMigrations],
      pending: this.getPendingMigrations(),
      total: this.migrations.size,
    };
  }
  /**
   * Verify migration integrity
   */
  verifyIntegrity() {
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
exports.MigrationManager = MigrationManager;
