import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}
/**
 * Authentication middleware
 * Supports both API keys and JWT tokens
 */
export declare function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void;
/**
 * Generate JWT token
 */
export declare function generateToken(userId: string, role?: string): string;
//# sourceMappingURL=auth.d.ts.map
