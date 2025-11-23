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
export declare function isPod(obj: unknown): obj is Pod;
/**
 * Type guard to check if an unknown object is a Container
 */
export declare function isContainer(obj: unknown): obj is Container;
//# sourceMappingURL=kubernetes-types.d.ts.map