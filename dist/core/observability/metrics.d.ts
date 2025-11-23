import * as client from 'prom-client';
import { Request, Response, NextFunction } from 'express';
export declare const register: client.Registry<"text/plain; version=0.0.4; charset=utf-8">;
export declare const httpRequestsTotal: client.Counter<"status" | "method" | "route">;
export declare const httpRequestDurationSeconds: client.Histogram<"status" | "method" | "route">;
export declare const anomalyDetectionsTotal: client.Counter<"type" | "severity">;
export declare const metricsMiddleware: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=metrics.d.ts.map