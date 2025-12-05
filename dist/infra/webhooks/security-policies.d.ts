import { SecurityPolicy, AdmissionRequest, PolicyResult } from './admission-webhook.js';
/**
 * Policy: Enforce non-root containers
 */
export declare class NonRootContainerPolicy implements SecurityPolicy {
  name: string;
  enabled: boolean;
  enforce(request: AdmissionRequest): Promise<PolicyResult>;
}
/**
 * Policy: Enforce resource limits
 */
export declare class ResourceLimitsPolicy implements SecurityPolicy {
  name: string;
  enabled: boolean;
  private defaultLimits;
  constructor(defaultLimits?: { cpu: string; memory: string });
  enforce(request: AdmissionRequest): Promise<PolicyResult>;
}
/**
 * Policy: Deny privileged containers
 */
export declare class NoPrivilegedContainersPolicy implements SecurityPolicy {
  name: string;
  enabled: boolean;
  enforce(request: AdmissionRequest): Promise<PolicyResult>;
}
/**
 * Policy: Enforce security labels
 */
export declare class SecurityLabelsPolicy implements SecurityPolicy {
  name: string;
  enabled: boolean;
  private requiredLabels;
  enforce(request: AdmissionRequest): Promise<PolicyResult>;
}
/**
 * Policy registry
 */
export declare class SecurityPolicyRegistry {
  private policies;
  constructor();
  private registerDefaultPolicies;
  register(policy: SecurityPolicy): void;
  get(name: string): SecurityPolicy | undefined;
  getAll(): SecurityPolicy[];
  getEnabled(): SecurityPolicy[];
}
//# sourceMappingURL=security-policies.d.ts.map
