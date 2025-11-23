import { Request, Response, NextFunction } from 'express';
/**
 * Supported API versions
 */
export declare enum ApiVersion {
    V1 = "v1",
    V2 = "v2"
}
/**
 * Extended Request interface with API version
 */
export interface ApiVersionRequest extends Request {
    apiVersion: string;
}
/**
 * API version detection and validation middleware
 * Supports version detection from:
 * - URL path: /api/v1/...
 * - Header: X-API-Version
 * - Query parameter: api_version
 */
export declare function apiVersionMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * API deprecation warning middleware
 */
export declare function deprecationWarningMiddleware(deprecatedVersion: ApiVersion, message: string, sunsetDate?: string): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Backward compatibility transformer
 * Transforms requests/responses between API versions
 */
export declare class ApiVersionTransformer {
    /**
     * Transform request from older version to current internal format
     */
    static transformRequestV1ToV2(body: Record<string, unknown>): Record<string, unknown>;
    /**
     * Transform response from internal format to older version
     */
    static transformResponseV2ToV1(data: Record<string, unknown>): Record<string, unknown>;
    /**
     * Apply transformation based on API version
     */
    static transformRequest(req: Request): Record<string, unknown>;
    /**
     * Transform response based on requested API version
     */
    static transformResponse(data: Record<string, unknown>, version: string): Record<string, unknown>;
}
/**
 * Middleware to automatically transform requests/responses
 */
export declare function autoTransformMiddleware(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=api-version.d.ts.map