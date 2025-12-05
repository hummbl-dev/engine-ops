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
 * Minimal Kubernetes Pod types for security policy enforcement
 * Based on Kubernetes v1 Pod specification
 */

export interface KubernetesObject {
  apiVersion?: string;
  kind?: string;
  metadata?: {
    name?: string;
    namespace?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
}

export interface PodSecurityContext {
  runAsNonRoot?: boolean;
  runAsUser?: number;
  runAsGroup?: number;
  fsGroup?: number;
}

export interface ContainerSecurityContext {
  runAsNonRoot?: boolean;
  runAsUser?: number;
  runAsGroup?: number;
  allowPrivilegeEscalation?: boolean;
  privileged?: boolean;
  readOnlyRootFilesystem?: boolean;
  capabilities?: {
    add?: string[];
    drop?: string[];
  };
}

export interface ResourceRequirements {
  requests?: Record<string, string>;
  limits?: Record<string, string>;
}

export interface Container {
  name: string;
  image: string;
  command?: string[];
  args?: string[];
  ports?: Array<{
    containerPort: number;
    protocol?: 'TCP' | 'UDP';
  }>;
  env?: Array<{
    name: string;
    value?: string;
    valueFrom?: {
      configMapKeyRef?: {
        name: string;
        key: string;
      };
      secretKeyRef?: {
        name: string;
        key: string;
      };
    };
  }>;
  resources?: ResourceRequirements;
  securityContext?: ContainerSecurityContext;
  volumeMounts?: Array<{
    name: string;
    mountPath: string;
    readOnly?: boolean;
  }>;
}

export interface PodSpec {
  containers: Container[];
  initContainers?: Container[];
  volumes?: Array<{
    name: string;
    configMap?: {
      name: string;
    };
    secret?: {
      name: string;
    };
    emptyDir?: Record<string, never>;
    persistentVolumeClaim?: {
      claimName: string;
    };
  }>;
  securityContext?: PodSecurityContext;
  serviceAccountName?: string;
  automountServiceAccountToken?: boolean;
  nodeSelector?: Record<string, string>;
  affinity?: {
    nodeAffinity?: {
      requiredDuringSchedulingIgnoredDuringExecution?: {
        nodeSelectorTerms: Array<{
          matchExpressions: Array<{
            key: string;
            operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist' | 'Gt' | 'Lt';
            values?: string[];
          }>;
        }>;
      };
    };
  };
}

export interface PodMetadata {
  name?: string;
  namespace?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  ownerReferences?: Array<{
    apiVersion: string;
    kind: string;
    name: string;
    uid: string;
  }>;
}

export interface Pod {
  apiVersion: string;
  kind: 'Pod';
  metadata?: PodMetadata;
  spec?: PodSpec;
}

/**
 * Type guard to check if an unknown object is a Pod
 */
export function isPod(obj: unknown): obj is Pod {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'kind' in obj &&
    (obj as KubernetesObject).kind === 'Pod' &&
    'apiVersion' in obj &&
    'metadata' in obj &&
    'spec' in obj &&
    'containers' in (obj as KubernetesObject & { spec: { containers: unknown[] } }).spec
  );
}

/**
 * Type guard to check if an unknown object is a Container
 */
export function isContainer(obj: unknown): obj is Container {
  return typeof obj === 'object' && obj !== null && 'name' in obj && 'image' in obj;
}
