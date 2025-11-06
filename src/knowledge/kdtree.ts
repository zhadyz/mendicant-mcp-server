/**
 * KD-TREE FOR PATTERN MATCHING - ADAPTATION 6
 * 
 * Spatial indexing for O(log n) similarity search instead of O(n) linear search.
 * Uses feature vectors extracted from ExecutionPatterns for efficient nearest neighbor queries.
 */

import type { ExecutionPattern } from '../types.js';

interface KDNode<T> {
  point: number[];
  data: T;
  left: KDNode<T> | null;
  right: KDNode<T> | null;
  axis: number;
}

interface NearestResult<T> {
  point: number[];
  data: T;
  distance: number;
}

export class KDTree<T> {
  private root: KDNode<T> | null = null;
  private k: number; // dimensionality

  constructor(dimensionality: number) {
    this.k = dimensionality;
  }

  /**
   * Build KD-tree from points
   */
  build(points: Array<{ point: number[]; data: T }>): void {
    this.root = this.buildRecursive(points, 0);
  }

  private buildRecursive(points: Array<{ point: number[]; data: T }>, depth: number): KDNode<T> | null {
    if (points.length === 0) return null;

    const axis = depth % this.k;

    // Sort points by current axis
    points.sort((a, b) => a.point[axis] - b.point[axis]);

    const medianIdx = Math.floor(points.length / 2);
    const median = points[medianIdx];

    return {
      point: median.point,
      data: median.data,
      axis,
      left: this.buildRecursive(points.slice(0, medianIdx), depth + 1),
      right: this.buildRecursive(points.slice(medianIdx + 1), depth + 1)
    };
  }

  /**
   * Find k nearest neighbors - O(log n) average case
   */
  kNearestNeighbors(query: number[], k: number): NearestResult<T>[] {
    if (!this.root) return [];

    const heap: NearestResult<T>[] = [];

    this.searchRecursive(this.root, query, k, heap);

    return heap.sort((a, b) => a.distance - b.distance);
  }

  private searchRecursive(
    node: KDNode<T> | null,
    query: number[],
    k: number,
    heap: NearestResult<T>[]
  ): void {
    if (!node) return;

    const distance = this.euclideanDistance(query, node.point);

    // Add to heap if we don't have k items yet, or if this is closer than furthest in heap
    if (heap.length < k) {
      heap.push({ point: node.point, data: node.data, distance });
      heap.sort((a, b) => b.distance - a.distance); // Max heap
    } else if (distance < heap[0].distance) {
      heap[0] = { point: node.point, data: node.data, distance };
      heap.sort((a, b) => b.distance - a.distance);
    }

    const axis = node.axis;
    const axisDist = query[axis] - node.point[axis];

    // Decide which subtree to search first
    const primarySubtree = axisDist < 0 ? node.left : node.right;
    const secondarySubtree = axisDist < 0 ? node.right : node.left;

    // Search primary subtree
    this.searchRecursive(primarySubtree, query, k, heap);

    // Check if we need to search secondary subtree
    // Only if the hyperplane could contain closer points
    if (heap.length < k || Math.abs(axisDist) < heap[0].distance) {
      this.searchRecursive(secondarySubtree, query, k, heap);
    }
  }

  /**
   * Insert single point - O(log n)
   */
  insert(point: number[], data: T): void {
    if (!this.root) {
      this.root = { point, data, left: null, right: null, axis: 0 };
      return;
    }

    this.insertRecursive(this.root, point, data, 0);
  }

  private insertRecursive(node: KDNode<T>, point: number[], data: T, depth: number): void {
    const axis = depth % this.k;

    if (point[axis] < node.point[axis]) {
      if (node.left === null) {
        node.left = { point, data, left: null, right: null, axis: (depth + 1) % this.k };
      } else {
        this.insertRecursive(node.left, point, data, depth + 1);
      }
    } else {
      if (node.right === null) {
        node.right = { point, data, left: null, right: null, axis: (depth + 1) % this.k };
      } else {
        this.insertRecursive(node.right, point, data, depth + 1);
      }
    }
  }

  private euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  /**
   * Get tree size
   */
  size(): number {
    return this.sizeRecursive(this.root);
  }

  private sizeRecursive(node: KDNode<T> | null): number {
    if (!node) return 0;
    return 1 + this.sizeRecursive(node.left) + this.sizeRecursive(node.right);
  }

  /**
   * Clear tree
   */
  clear(): void {
    this.root = null;
  }
}

/**
 * Feature extraction for ExecutionPatterns
 * Converts patterns into numeric feature vectors for KD-tree
 */
export class PatternFeatureExtractor {
  private objectiveTypeMap: Map<string, number> = new Map();
  private projectTypeMap: Map<string, number> = new Map();
  private tagVocabulary: Map<string, number> = new Map();
  private nextObjectiveTypeId = 0;
  private nextProjectTypeId = 0;
  private nextTagId = 0;
  private readonly TAG_VECTOR_SIZE = 10; // Use top 10 most common tags

  /**
   * Extract feature vector from pattern
   * Returns 12-dimensional vector:
   * [0] = objective_type_id (categorical as number)
   * [1] = project_type_id (categorical as number)
   * [2-11] = tag_vector (10 dimensions for top tags)
   */
  extractFeatures(pattern: ExecutionPattern): number[] {
    const features: number[] = new Array(12).fill(0);

    // Feature 0: Objective type
    if (!this.objectiveTypeMap.has(pattern.objective_type)) {
      this.objectiveTypeMap.set(pattern.objective_type, this.nextObjectiveTypeId++);
    }
    features[0] = this.objectiveTypeMap.get(pattern.objective_type)!;

    // Feature 1: Project type
    const projectType = pattern.project_context?.project_type || 'unknown';
    if (!this.projectTypeMap.has(projectType)) {
      this.projectTypeMap.set(projectType, this.nextProjectTypeId++);
    }
    features[1] = this.projectTypeMap.get(projectType)!;

    // Features 2-11: Tag vector (multi-hot encoding)
    for (const tag of pattern.tags) {
      if (!this.tagVocabulary.has(tag)) {
        if (this.tagVocabulary.size < this.TAG_VECTOR_SIZE) {
          this.tagVocabulary.set(tag, this.tagVocabulary.size + 2); // +2 to skip first 2 features
        }
      }
      const tagIdx = this.tagVocabulary.get(tag);
      if (tagIdx !== undefined && tagIdx < 12) {
        features[tagIdx] = 1.0;
      }
    }

    return features;
  }

  /**
   * Extract query vector from objective
   */
  extractQueryFeatures(objective: string, objectiveType: string, tags: string[], projectType?: string): number[] {
    const features: number[] = new Array(12).fill(0);

    // Feature 0: Objective type
    features[0] = this.objectiveTypeMap.get(objectiveType) || -1;

    // Feature 1: Project type
    const projType = projectType || 'unknown';
    features[1] = this.projectTypeMap.get(projType) || -1;

    // Features 2-11: Tag vector
    for (const tag of tags) {
      const tagIdx = this.tagVocabulary.get(tag);
      if (tagIdx !== undefined && tagIdx < 12) {
        features[tagIdx] = 1.0;
      }
    }

    return features;
  }
}
