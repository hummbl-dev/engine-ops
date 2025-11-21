/*
 * Copyright (c) 2025, HUMMBL, LLC
 *
 * Licensed under the Business Source License 1.1 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://mariadb.com/bsl11/
 *
 * Change Date: 2029-01-01
 * Change License: Apache License, Version 2.0
 */

/**
 * Cloud provider types supported by the engine
 */
export type CloudProvider = 'aws' | 'gcp' | 'azure' | 'edge';

/**
 * Geographical region configuration
 */
export interface GeoRegion {
    /**
     * Region identifier (e.g., 'us-east-1', 'europe-west1')
     */
    id: string;

    /**
     * Cloud provider for this region
     */
    provider: CloudProvider;

    /**
     * Display name for the region
     */
    name: string;

    /**
     * Latitude coordinate for geo-calculations
     */
    latitude?: number;

    /**
     * Longitude coordinate for geo-calculations
     */
    longitude?: number;
}

/**
 * Resource capacity for a node or cluster
 */
export interface ResourceCapacity {
    /**
     * CPU capacity in cores or millicores
     */
    cpu: number;

    /**
     * Memory capacity in MB
     */
    memory: number;

    /**
     * Storage capacity in GB (optional)
     */
    storage?: number;

    /**
     * GPU capacity (optional)
     */
    gpu?: number;
}

/**
 * Node information in a cloud provider
 */
export interface CloudNode {
    /**
     * Unique node identifier
     */
    id: string;

    /**
     * Cloud provider
     */
    provider: CloudProvider;

    /**
     * Region where the node is located
     */
    region: string;

    /**
     * Node capacity
     */
    capacity: ResourceCapacity;

    /**
     * Current resource utilization
     */
    utilization: ResourceCapacity;

    /**
     * Node status
     */
    status: 'available' | 'busy' | 'unavailable';

    /**
     * Node labels/tags
     */
    labels?: Record<string, string>;

    /**
     * Node metadata
     */
    metadata?: Record<string, unknown>;
}

/**
 * Workload to be scheduled
 */
export interface Workload {
    /**
     * Unique workload identifier
     */
    id: string;

    /**
     * Resource requirements
     */
    resources: ResourceCapacity;

    /**
     * Preferred regions (optional)
     */
    preferredRegions?: string[];

    /**
     * Required labels (optional)
     */
    requiredLabels?: Record<string, string>;

    /**
     * Workload constraints
     */
    constraints?: {
        /**
         * Maximum latency requirement in ms
         */
        maxLatencyMs?: number;

        /**
         * Data residency requirements
         */
        dataResidency?: string[];

        /**
         * Provider preferences
         */
        providerPreferences?: CloudProvider[];
    };
}

/**
 * Placement decision result
 */
export interface PlacementResult {
    /**
     * Workload that was placed
     */
    workloadId: string;

    /**
     * Selected node
     */
    node: CloudNode;

    /**
     * Placement score (0-1, higher is better)
     */
    score: number;

    /**
     * Reason for placement
     */
    reason?: string;
}

/**
 * Cloud provider adapter interface
 */
export interface ICloudProvider {
    /**
     * Get provider name
     */
    getProvider(): CloudProvider;

    /**
     * Initialize the provider
     */
    initialize(config: Record<string, unknown>): Promise<void>;

    /**
     * List available nodes in the provider
     */
    listNodes(region?: string): Promise<CloudNode[]>;

    /**
     * Get node details
     */
    getNode(nodeId: string): Promise<CloudNode | null>;

    /**
     * Deploy workload to a node
     */
    deployWorkload(nodeId: string, workload: Workload): Promise<boolean>;

    /**
     * Remove workload from a node
     * Note: In the current implementation, workload tracking is simplified.
     * A production implementation should maintain a mapping of workloads to nodes
     * for accurate resource accounting.
     */
    removeWorkload(nodeId: string, workloadId: string): Promise<boolean>;

    /**
     * Get available regions
     */
    getRegions(): Promise<GeoRegion[]>;

    /**
     * Health check for the provider
     */
    healthCheck(): Promise<boolean>;
}

/**
 * Multi-cloud resource manager interface
 */
export interface IResourceManager {
    /**
     * Register a cloud provider
     */
    registerProvider(provider: ICloudProvider): void;

    /**
     * Get all registered providers
     */
    getProviders(): ICloudProvider[];

    /**
     * List all available nodes across providers
     */
    listAllNodes(filters?: { provider?: CloudProvider; region?: string }): Promise<CloudNode[]>;

    /**
     * Schedule a workload across providers
     */
    scheduleWorkload(workload: Workload): Promise<PlacementResult | null>;

    /**
     * Schedule multiple workloads with geo-sharding
     */
    scheduleWorkloadsWithGeoSharding(workloads: Workload[]): Promise<PlacementResult[]>;

    /**
     * Get resource utilization across providers
     */
    getUtilization(): Promise<Record<CloudProvider, { total: ResourceCapacity; used: ResourceCapacity }>>;
}
