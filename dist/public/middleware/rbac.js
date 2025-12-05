'use strict';
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.Permission = void 0;
exports.requirePermission = requirePermission;
exports.requireAdmin = requireAdmin;
var Permission;
(function (Permission) {
  Permission['READ'] = 'read';
  Permission['WRITE'] = 'write';
  Permission['ADMIN'] = 'admin';
})(Permission || (exports.Permission = Permission = {}));
const rolePermissions = {
  admin: [Permission.READ, Permission.WRITE, Permission.ADMIN],
  user: [Permission.READ, Permission.WRITE],
  readonly: [Permission.READ],
};
/**
 * RBAC middleware - check if user has required permission
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const userPermissions = rolePermissions[req.user.role] || [];
    if (!userPermissions.includes(permission)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
/**
 * Admin-only middleware
 */
function requireAdmin(req, res, next) {
  requirePermission(Permission.ADMIN)(req, res, next);
}
