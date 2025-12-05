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

import { Migration } from '../../core/migrations/migration-manager.js';

/**
 * Example migration: Add metrics retention policy
 */
export const migration002: Migration = {
  version: '002',
  name: 'add-metrics-retention',

  async up() {
    console.log('Adding metrics retention policy...');
    // Example: Configure metrics retention in storage

    console.log('- Set metrics retention period to 30 days');
    console.log('- Added cleanup job for old metrics');
    console.log('- Created metrics archival process');

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 100));
  },

  async down() {
    console.log('Removing metrics retention policy...');

    console.log('- Removed metrics retention configuration');
    console.log('- Removed cleanup job');
    console.log('- Removed archival process');

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 100));
  },

  async validateUp() {
    console.log('Validating metrics retention setup...');
    // Validate retention policy exists
    return true;
  },

  async validateDown() {
    console.log('Validating metrics retention removal...');
    // Validate retention policy is removed
    return true;
  },
};
