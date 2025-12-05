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
Object.defineProperty(exports, '__esModule', { value: true });
exports.migration001 = void 0;
/**
 * Example migration: Add versioning support to schemas
 */
exports.migration001 = {
  version: '001',
  name: 'add-versioning',
  async up() {
    console.log('Adding versioning metadata to schemas...');
    // In a real scenario, this would update database schema
    // For this example, we're demonstrating the pattern
    // Example: Add version field to optimization request schema
    console.log('- Added version field to OptimizationRequest');
    console.log('- Added backward compatibility layer');
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 100));
  },
  async down() {
    console.log('Removing versioning metadata from schemas...');
    // Rollback the changes
    console.log('- Removed version field from OptimizationRequest');
    console.log('- Removed backward compatibility layer');
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 100));
  },
  async validateUp() {
    // Validate that the migration was successful
    console.log('Validating schema versioning...');
    // In real scenario: check if version field exists
    return true;
  },
  async validateDown() {
    // Validate that the rollback was successful
    console.log('Validating schema rollback...');
    // In real scenario: check if version field is removed
    return true;
  },
};
