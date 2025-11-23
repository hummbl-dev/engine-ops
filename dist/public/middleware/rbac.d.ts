import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
export declare enum Permission {
    READ = "read",
    WRITE = "write",
    ADMIN = "admin"
}
/**
 * RBAC middleware - check if user has required permission
 */
export declare function requirePermission(permission: Permission): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Admin-only middleware
 */
export declare function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=rbac.d.ts.map