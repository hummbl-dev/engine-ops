'use strict';
/*
 * Copyright (c) 2025, HUMMBL, LLC
 *
 * This file is part of Engine-Ops and is licensed under the
 * Business Source License 1.1 (BSL 1.1).
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
const globals_1 = require('@jest/globals');
const fs = __importStar(require('fs'));
const path = __importStar(require('path'));
const migration_manager_js_1 = require('../migration-manager.js');
(0, globals_1.describe)('MigrationManager', () => {
  let tempDir;
  let manager;
  let testMigration1;
  let testMigration2;
  (0, globals_1.beforeEach)(() => {
    // Create temporary directory for tests
    tempDir = path.join(process.cwd(), '.test-migrations');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    manager = new migration_manager_js_1.MigrationManager(tempDir);
    // Create test migrations
    testMigration1 = {
      version: '001',
      name: 'test-migration-1',
      up: async () => {
        // Simulate migration
      },
      down: async () => {
        // Simulate rollback
      },
    };
    testMigration2 = {
      version: '002',
      name: 'test-migration-2',
      up: async () => {
        // Simulate migration
      },
      down: async () => {
        // Simulate rollback
      },
    };
  });
  (0, globals_1.afterEach)(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        fs.unlinkSync(path.join(tempDir, file));
      }
      fs.rmdirSync(tempDir);
    }
  });
  (0, globals_1.describe)('registerMigration', () => {
    (0, globals_1.it)('should register a migration', () => {
      manager.registerMigration(testMigration1);
      const status = manager.getStatus();
      (0, globals_1.expect)(status.total).toBe(1);
    });
    (0, globals_1.it)('should throw error for duplicate version', () => {
      manager.registerMigration(testMigration1);
      (0, globals_1.expect)(() => {
        manager.registerMigration(testMigration1);
      }).toThrow('Migration 001 is already registered');
    });
  });
  (0, globals_1.describe)('getPendingMigrations', () => {
    (0, globals_1.it)('should return all migrations when none applied', () => {
      manager.registerMigration(testMigration1);
      manager.registerMigration(testMigration2);
      const pending = manager.getPendingMigrations();
      (0, globals_1.expect)(pending.length).toBe(2);
      (0, globals_1.expect)(pending[0].version).toBe('001');
      (0, globals_1.expect)(pending[1].version).toBe('002');
    });
    (0, globals_1.it)('should return only unapplied migrations', async () => {
      manager.registerMigration(testMigration1);
      manager.registerMigration(testMigration2);
      await manager.applyMigration(testMigration1);
      const pending = manager.getPendingMigrations();
      (0, globals_1.expect)(pending.length).toBe(1);
      (0, globals_1.expect)(pending[0].version).toBe('002');
    });
  });
  (0, globals_1.describe)('applyMigration', () => {
    (0, globals_1.it)('should apply a migration', async () => {
      manager.registerMigration(testMigration1);
      await manager.applyMigration(testMigration1);
      const status = manager.getStatus();
      (0, globals_1.expect)(status.applied.length).toBe(1);
      (0, globals_1.expect)(status.applied[0].version).toBe('001');
    });
    (0, globals_1.it)('should save migration state', async () => {
      manager.registerMigration(testMigration1);
      await manager.applyMigration(testMigration1);
      // Create new manager instance to test persistence
      const newManager = new migration_manager_js_1.MigrationManager(tempDir);
      newManager.registerMigration(testMigration1);
      const status = newManager.getStatus();
      (0, globals_1.expect)(status.applied.length).toBe(1);
    });
    (0, globals_1.it)('should handle migration with validation', async () => {
      const migrationWithValidation = {
        version: '003',
        name: 'test-with-validation',
        up: async () => {},
        down: async () => {},
        validateUp: async () => true,
      };
      manager.registerMigration(migrationWithValidation);
      await manager.applyMigration(migrationWithValidation);
      const status = manager.getStatus();
      (0, globals_1.expect)(status.applied.length).toBe(1);
    });
  });
  (0, globals_1.describe)('rollbackMigration', () => {
    (0, globals_1.it)('should rollback a migration', async () => {
      manager.registerMigration(testMigration1);
      await manager.applyMigration(testMigration1);
      await manager.rollbackMigration('001');
      const status = manager.getStatus();
      (0, globals_1.expect)(status.applied.length).toBe(0);
    });
    (0, globals_1.it)('should throw error for non-existent migration', async () => {
      await (0, globals_1.expect)(manager.rollbackMigration('999')).rejects.toThrow(
        'Migration 999 not found',
      );
    });
    (0, globals_1.it)('should throw error for unapplied migration', async () => {
      manager.registerMigration(testMigration1);
      await (0, globals_1.expect)(manager.rollbackMigration('001')).rejects.toThrow(
        'Migration 001 is not applied',
      );
    });
  });
  (0, globals_1.describe)('migrate', () => {
    (0, globals_1.it)('should apply all pending migrations', async () => {
      manager.registerMigration(testMigration1);
      manager.registerMigration(testMigration2);
      await manager.migrate();
      const status = manager.getStatus();
      (0, globals_1.expect)(status.applied.length).toBe(2);
      (0, globals_1.expect)(status.pending.length).toBe(0);
    });
    (0, globals_1.it)('should handle no pending migrations', async () => {
      manager.registerMigration(testMigration1);
      await manager.migrate();
      // Call again with no pending
      await manager.migrate();
      const status = manager.getStatus();
      (0, globals_1.expect)(status.applied.length).toBe(1);
    });
  });
  (0, globals_1.describe)('rollback', () => {
    (0, globals_1.it)('should rollback last migration', async () => {
      manager.registerMigration(testMigration1);
      manager.registerMigration(testMigration2);
      await manager.migrate();
      await manager.rollback(1);
      const status = manager.getStatus();
      (0, globals_1.expect)(status.applied.length).toBe(1);
      (0, globals_1.expect)(status.applied[0].version).toBe('001');
    });
    (0, globals_1.it)('should rollback multiple migrations', async () => {
      manager.registerMigration(testMigration1);
      manager.registerMigration(testMigration2);
      await manager.migrate();
      await manager.rollback(2);
      const status = manager.getStatus();
      (0, globals_1.expect)(status.applied.length).toBe(0);
    });
  });
  (0, globals_1.describe)('getStatus', () => {
    (0, globals_1.it)('should return correct status', async () => {
      manager.registerMigration(testMigration1);
      manager.registerMigration(testMigration2);
      await manager.applyMigration(testMigration1);
      const status = manager.getStatus();
      (0, globals_1.expect)(status.total).toBe(2);
      (0, globals_1.expect)(status.applied.length).toBe(1);
      (0, globals_1.expect)(status.pending.length).toBe(1);
    });
  });
  (0, globals_1.describe)('verifyIntegrity', () => {
    (0, globals_1.it)('should verify integrity of applied migrations', async () => {
      manager.registerMigration(testMigration1);
      await manager.applyMigration(testMigration1);
      const isValid = manager.verifyIntegrity();
      (0, globals_1.expect)(isValid).toBe(true);
    });
  });
});
