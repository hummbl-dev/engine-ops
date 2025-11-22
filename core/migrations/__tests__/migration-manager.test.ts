/*
 * Copyright (c) 2025, HUMMBL, LLC
 *
 * This file is part of Engine-Ops and is licensed under the
 * Business Source License 1.1 (BSL 1.1).
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { MigrationManager, Migration } from '../migration-manager.js';

describe('MigrationManager', () => {
    let tempDir: string;
    let manager: MigrationManager;
    let testMigration1: Migration;
    let testMigration2: Migration;

    beforeEach(() => {
        // Create temporary directory for tests
        tempDir = path.join(process.cwd(), '.test-migrations');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        manager = new MigrationManager(tempDir);

        // Create test migrations
        testMigration1 = {
            version: '001',
            name: 'test-migration-1',
            up: async () => {
                // Simulate migration
            },
            down: async () => {
                // Simulate rollback
            }
        };

        testMigration2 = {
            version: '002',
            name: 'test-migration-2',
            up: async () => {
                // Simulate migration
            },
            down: async () => {
                // Simulate rollback
            }
        };
    });

    afterEach(() => {
        // Clean up temporary directory
        if (fs.existsSync(tempDir)) {
            const files = fs.readdirSync(tempDir);
            for (const file of files) {
                fs.unlinkSync(path.join(tempDir, file));
            }
            fs.rmdirSync(tempDir);
        }
    });

    describe('registerMigration', () => {
        it('should register a migration', () => {
            manager.registerMigration(testMigration1);
            const status = manager.getStatus();
            expect(status.total).toBe(1);
        });

        it('should throw error for duplicate version', () => {
            manager.registerMigration(testMigration1);
            expect(() => {
                manager.registerMigration(testMigration1);
            }).toThrow('Migration 001 is already registered');
        });
    });

    describe('getPendingMigrations', () => {
        it('should return all migrations when none applied', () => {
            manager.registerMigration(testMigration1);
            manager.registerMigration(testMigration2);

            const pending = manager.getPendingMigrations();
            expect(pending.length).toBe(2);
            expect(pending[0].version).toBe('001');
            expect(pending[1].version).toBe('002');
        });

        it('should return only unapplied migrations', async () => {
            manager.registerMigration(testMigration1);
            manager.registerMigration(testMigration2);

            await manager.applyMigration(testMigration1);

            const pending = manager.getPendingMigrations();
            expect(pending.length).toBe(1);
            expect(pending[0].version).toBe('002');
        });
    });

    describe('applyMigration', () => {
        it('should apply a migration', async () => {
            manager.registerMigration(testMigration1);
            await manager.applyMigration(testMigration1);

            const status = manager.getStatus();
            expect(status.applied.length).toBe(1);
            expect(status.applied[0].version).toBe('001');
        });

        it('should save migration state', async () => {
            manager.registerMigration(testMigration1);
            await manager.applyMigration(testMigration1);

            // Create new manager instance to test persistence
            const newManager = new MigrationManager(tempDir);
            newManager.registerMigration(testMigration1);

            const status = newManager.getStatus();
            expect(status.applied.length).toBe(1);
        });

        it('should handle migration with validation', async () => {
            const migrationWithValidation: Migration = {
                version: '003',
                name: 'test-with-validation',
                up: async () => {},
                down: async () => {},
                validateUp: async () => true
            };

            manager.registerMigration(migrationWithValidation);
            await manager.applyMigration(migrationWithValidation);

            const status = manager.getStatus();
            expect(status.applied.length).toBe(1);
        });
    });

    describe('rollbackMigration', () => {
        it('should rollback a migration', async () => {
            manager.registerMigration(testMigration1);
            await manager.applyMigration(testMigration1);

            await manager.rollbackMigration('001');

            const status = manager.getStatus();
            expect(status.applied.length).toBe(0);
        });

        it('should throw error for non-existent migration', async () => {
            await expect(
                manager.rollbackMigration('999')
            ).rejects.toThrow('Migration 999 not found');
        });

        it('should throw error for unapplied migration', async () => {
            manager.registerMigration(testMigration1);

            await expect(
                manager.rollbackMigration('001')
            ).rejects.toThrow('Migration 001 is not applied');
        });
    });

    describe('migrate', () => {
        it('should apply all pending migrations', async () => {
            manager.registerMigration(testMigration1);
            manager.registerMigration(testMigration2);

            await manager.migrate();

            const status = manager.getStatus();
            expect(status.applied.length).toBe(2);
            expect(status.pending.length).toBe(0);
        });

        it('should handle no pending migrations', async () => {
            manager.registerMigration(testMigration1);
            await manager.migrate();

            // Call again with no pending
            await manager.migrate();

            const status = manager.getStatus();
            expect(status.applied.length).toBe(1);
        });
    });

    describe('rollback', () => {
        it('should rollback last migration', async () => {
            manager.registerMigration(testMigration1);
            manager.registerMigration(testMigration2);
            await manager.migrate();

            await manager.rollback(1);

            const status = manager.getStatus();
            expect(status.applied.length).toBe(1);
            expect(status.applied[0].version).toBe('001');
        });

        it('should rollback multiple migrations', async () => {
            manager.registerMigration(testMigration1);
            manager.registerMigration(testMigration2);
            await manager.migrate();

            await manager.rollback(2);

            const status = manager.getStatus();
            expect(status.applied.length).toBe(0);
        });
    });

    describe('getStatus', () => {
        it('should return correct status', async () => {
            manager.registerMigration(testMigration1);
            manager.registerMigration(testMigration2);
            await manager.applyMigration(testMigration1);

            const status = manager.getStatus();
            expect(status.total).toBe(2);
            expect(status.applied.length).toBe(1);
            expect(status.pending.length).toBe(1);
        });
    });

    describe('verifyIntegrity', () => {
        it('should verify integrity of applied migrations', async () => {
            manager.registerMigration(testMigration1);
            await manager.applyMigration(testMigration1);

            const isValid = manager.verifyIntegrity();
            expect(isValid).toBe(true);
        });
    });
});
