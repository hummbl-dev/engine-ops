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
    patch?: string; // base64 encoded JSON patch
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
