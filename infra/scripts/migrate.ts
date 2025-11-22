#!/usr/bin/env node
/*
 * Copyright (c) 2025, HUMMBL, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as path from 'path';
import { MigrationManager } from '../../core/migrations/migration-manager.js';
import { migration001 } from '../../schemas/migrations/001-add-versioning.js';
import { migration002 } from '../../schemas/migrations/002-add-metrics-retention.js';

/**
 * Migration CLI Tool
 * 
 * Usage:
 *   npm run migrate            # Apply all pending migrations
 *   npm run migrate up         # Apply all pending migrations
 *   npm run migrate down       # Rollback last migration
 *   npm run migrate down 2     # Rollback last 2 migrations
 *   npm run migrate status     # Show migration status
 *   npm run migrate verify     # Verify migration integrity
 */

const MIGRATIONS_PATH = path.join(process.cwd(), 'schemas', 'migrations');

async function main(): Promise<void> {
    const command = process.argv[2] || 'up';
    const arg = process.argv[3];

    console.log('🚀 Engine-Ops Migration Tool\n');

    // Initialize migration manager
    const manager = new MigrationManager(MIGRATIONS_PATH);

    // Register migrations
    console.log('📋 Registering migrations...');
    manager.registerMigration(migration001);
    manager.registerMigration(migration002);
    console.log('✓ Migrations registered\n');

    try {
        switch (command) {
            case 'up':
            case 'migrate':
                console.log('⬆️  Applying migrations...\n');
                await manager.migrate();
                break;

            case 'down':
            case 'rollback': {
                const count = arg ? parseInt(arg, 10) : 1;
                console.log(`⬇️  Rolling back ${count} migration(s)...\n`);
                await manager.rollback(count);
                break;
            }

            case 'status': {
                console.log('📊 Migration Status\n');
                const status = manager.getStatus();
                
                console.log(`Total migrations: ${status.total}`);
                console.log(`Applied: ${status.applied.length}`);
                console.log(`Pending: ${status.pending.length}\n`);

                if (status.applied.length > 0) {
                    console.log('Applied Migrations:');
                    for (const m of status.applied) {
                        console.log(`  ✓ ${m.version} - ${m.name} (${m.appliedAt.toISOString()})`);
                    }
                    console.log();
                }

                if (status.pending.length > 0) {
                    console.log('Pending Migrations:');
                    for (const m of status.pending) {
                        console.log(`  ○ ${m.version} - ${m.name}`);
                    }
                    console.log();
                }
                break;
            }

            case 'verify': {
                console.log('🔍 Verifying migration integrity...\n');
                const isValid = manager.verifyIntegrity();
                if (isValid) {
                    console.log('✓ All migrations are valid\n');
                } else {
                    console.error('✗ Migration integrity check failed\n');
                    process.exit(1);
                }
                break;
            }

            case 'help':
            default:
                printHelp();
                break;
        }

        console.log('✨ Done!\n');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

function printHelp(): void {
    console.log('Usage: npm run migrate [command] [args]\n');
    console.log('Commands:');
    console.log('  up, migrate       Apply all pending migrations (default)');
    console.log('  down, rollback    Rollback last migration');
    console.log('  down <n>          Rollback last n migrations');
    console.log('  status            Show migration status');
    console.log('  verify            Verify migration integrity');
    console.log('  help              Show this help message\n');
    console.log('Examples:');
    console.log('  npm run migrate');
    console.log('  npm run migrate status');
    console.log('  npm run migrate down 2');
    console.log('  npm run migrate verify\n');
}

// Run if called directly (relies on shebang and npm script)
// This file is executed via npm script, so we always run main()
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
