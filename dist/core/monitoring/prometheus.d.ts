import { Counter, Histogram, Gauge, register } from 'prom-client';
export declare const requestCounter: Counter<'type' | 'status'>;
export declare const requestDuration: Histogram<'type'>;
export declare const cacheHits: Counter<string>;
export declare const cacheMisses: Counter<string>;
export declare const activeConnections: Gauge<string>;
export { register };
//# sourceMappingURL=prometheus.d.ts.map
