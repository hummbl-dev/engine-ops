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

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';

export enum Permission {
    READ = 'read',
    WRITE = 'write',
    ADMIN = 'admin'
}

const rolePermissions: Record<string, Permission[]> = {
    admin: [Permission.READ, Permission.WRITE, Permission.ADMIN],
    user: [Permission.READ, Permission.WRITE],
    readonly: [Permission.READ]
};

/**
 * RBAC middleware - check if user has required permission
 */
export function requirePermission(permission: Permission) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    requirePermission(Permission.ADMIN)(req, res, next);
}
