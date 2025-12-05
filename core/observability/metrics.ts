import * as client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Create a Registry
export const register = new client.Registry();

// Add default metrics (cpu, memory, etc.)
client.collectDefaultMetrics({ register });

// Define custom metrics
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const anomalyDetectionsTotal = new client.Counter({
  name: 'anomaly_detections_total',
  help: 'Total number of anomalies detected',
  labelNames: ['severity', 'type'],
  registers: [register],
});

// Middleware to track requests
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;

    httpRequestsTotal.inc({
      method: req.method,
      route: route,
      status: res.statusCode,
    });

    httpRequestDurationSeconds.observe(
      {
        method: req.method,
        route: route,
        status: res.statusCode,
      },
      duration,
    );
  });

  next();
};
