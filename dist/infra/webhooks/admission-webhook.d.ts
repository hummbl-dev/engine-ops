/**
 * Kubernetes Admission Review types
 */
export interface AdmissionRequest {
    uid: string;
    kind: {
        group: string;
        version: string;
        kind: string;
    };
    resource: {
        group: string;
        version: string;
        resource: string;
    };
    operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'CONNECT';
    object?: unknown;
    oldObject?: unknown;
    userInfo?: {
        username: string;
        uid: string;
        groups: string[];
    };
}
export interface AdmissionReview {
    apiVersion: string;
    kind: string;
    request: AdmissionRequest;
}
export interface AdmissionResponse {
    uid: string;
    allowed: boolean;
    status?: {
        code: number;
        message: string;
    };
    patch?: string;
    patchType?: 'JSONPatch';
    warnings?: string[];
}
/**
 * Security policy for K8s resources
 */
export interface SecurityPolicy {
    name: string;
    enabled: boolean;
    enforce: (request: AdmissionRequest) => Promise<PolicyResult>;
}
export interface PolicyResult {
    allowed: boolean;
    message?: string;
    patch?: PatchOperation[];
    warnings?: string[];
}
/**
 * JSON Patch operation
 */
export interface PatchOperation {
    op: 'add' | 'remove' | 'replace' | 'copy' | 'move' | 'test';
    path: string;
    value?: unknown;
    from?: string;
}
//# sourceMappingURL=admission-webhook.d.ts.map