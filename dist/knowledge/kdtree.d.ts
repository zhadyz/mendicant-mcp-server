/**
 * KD-TREE FOR PATTERN MATCHING - ADAPTATION 6
 *
 * Spatial indexing for O(log n) similarity search instead of O(n) linear search.
 * Uses feature vectors extracted from ExecutionPatterns for efficient nearest neighbor queries.
 */
import type { ExecutionPattern } from '../types.js';
interface NearestResult<T> {
    point: number[];
    data: T;
    distance: number;
}
export declare class KDTree<T> {
    private root;
    private k;
    constructor(dimensionality: number);
    /**
     * Build KD-tree from points
     */
    build(points: Array<{
        point: number[];
        data: T;
    }>): void;
    private buildRecursive;
    /**
     * Find k nearest neighbors - O(log n) average case
     */
    kNearestNeighbors(query: number[], k: number): NearestResult<T>[];
    private searchRecursive;
    /**
     * Insert single point - O(log n)
     */
    insert(point: number[], data: T): void;
    private insertRecursive;
    private euclideanDistance;
    /**
     * Get tree size
     */
    size(): number;
    private sizeRecursive;
    /**
     * Clear tree
     */
    clear(): void;
}
/**
 * Feature extraction for ExecutionPatterns
 * Converts patterns into numeric feature vectors for KD-tree
 */
export declare class PatternFeatureExtractor {
    private objectiveTypeMap;
    private projectTypeMap;
    private tagVocabulary;
    private nextObjectiveTypeId;
    private nextProjectTypeId;
    private nextTagId;
    private readonly TAG_VECTOR_SIZE;
    /**
     * Extract feature vector from pattern
     * Returns 12-dimensional vector:
     * [0] = objective_type_id (categorical as number)
     * [1] = project_type_id (categorical as number)
     * [2-11] = tag_vector (10 dimensions for top tags)
     */
    extractFeatures(pattern: ExecutionPattern): number[];
    /**
     * Extract query vector from objective
     */
    extractQueryFeatures(objective: string, objectiveType: string, tags: string[], projectType?: string): number[];
}
export {};
//# sourceMappingURL=kdtree.d.ts.map