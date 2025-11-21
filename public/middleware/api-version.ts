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

import { Request, Response, NextFunction } from 'express';

/**
 * Supported API versions
 */
export enum ApiVersion {
    V1 = 'v1',
    V2 = 'v2'
}

/**
 * API version detection and validation middleware
 * Supports version detection from:
 * - URL path: /api/v1/...
 * - Header: X-API-Version
 * - Query parameter: api_version
 */
export function apiVersionMiddleware(req: Request, res: Response, next: NextFunction): void {
    let version: string | undefined;

    // 1. Check URL path
    const pathMatch = req.path.match(/^\/api\/(v\d+)\//);
    if (pathMatch) {
        version = pathMatch[1];
    }

    // 2. Check X-API-Version header
    if (!version && req.headers['x-api-version']) {
        version = req.headers['x-api-version'] as string;
    }

    // 3. Check query parameter
    if (!version && req.query.api_version) {
        version = req.query.api_version as string;
    }

    // Default to v1 if no version specified
    version = version || ApiVersion.V1;

    // Validate version
    if (!Object.values(ApiVersion).includes(version as ApiVersion)) {
        res.status(400).json({
            error: 'Invalid API version',
            message: `API version '${version}' is not supported`,
            supportedVersions: Object.values(ApiVersion)
        });
        return;
    }

    // Store version in request for use by handlers
    (req as any).apiVersion = version;

    // Add version to response headers
    res.setHeader('X-API-Version', version);

    next();
}

/**
 * API deprecation warning middleware
 */
export function deprecationWarningMiddleware(
    deprecatedVersion: ApiVersion,
    message: string,
    sunsetDate?: string
) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const version = (req as any).apiVersion;

        if (version === deprecatedVersion) {
            res.setHeader('Warning', `299 - "API version ${deprecatedVersion} is deprecated. ${message}"`);
            
            if (sunsetDate) {
                res.setHeader('Sunset', sunsetDate);
            }

            res.setHeader('Link', '</api/v2>; rel="successor-version"');
        }

        next();
    };
}

/**
 * Backward compatibility transformer
 * Transforms requests/responses between API versions
 */
export class ApiVersionTransformer {
    /**
     * Transform request from older version to current internal format
     */
    static transformRequestV1ToV2(body: any): any {
        // Example transformation: add default values for new fields
        return {
            ...body,
            version: body.version || '1.0',
            metadata: body.metadata || {}
        };
    }

    /**
     * Transform response from internal format to older version
     */
    static transformResponseV2ToV1(data: any): any {
        // Example transformation: remove new fields not present in v1
        const { version, metadata, ...v1Data } = data;
        return v1Data;
    }

    /**
     * Apply transformation based on API version
     */
    static transformRequest(req: Request): any {
        const version = (req as any).apiVersion;

        if (version === ApiVersion.V1 && req.body) {
            return this.transformRequestV1ToV2(req.body);
        }

        return req.body;
    }

    /**
     * Transform response based on requested API version
     */
    static transformResponse(data: any, version: string): any {
        if (version === ApiVersion.V1) {
            return this.transformResponseV2ToV1(data);
        }

        return data;
    }
}

/**
 * Middleware to automatically transform requests/responses
 */
export function autoTransformMiddleware(req: Request, res: Response, next: NextFunction): void {
    const version = (req as any).apiVersion;

    // Transform request body
    if (req.body) {
        req.body = ApiVersionTransformer.transformRequest(req);
    }

    // Wrap res.json to transform responses
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
        const transformed = ApiVersionTransformer.transformResponse(data, version);
        return originalJson(transformed);
    };

    next();
}
