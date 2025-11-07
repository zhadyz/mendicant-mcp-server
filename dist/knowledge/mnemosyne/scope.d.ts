/**
 * Scoped Mnemosyne Client
 *
 * Provides namespace scoping for privacy-aware cross-project learning.
 * Enables controlled data sharing across organizational boundaries.
 *
 * CYCLE 5 FEATURE 3 FOUNDATION: Scoped Learning with Privacy Controls
 */
export type ScopeLevel = 'user' | 'project' | 'organization' | 'global';
export type SensitivityLevel = 'public' | 'internal' | 'confidential' | 'restricted';
/**
 * Learning scope configuration
 *
 * Defines boundaries for cross-project learning:
 * - user: Private to single user
 * - project: Shared within project team
 * - organization: Shared across organization
 * - global: Public knowledge (anonymized)
 */
export interface LearningScope {
    /** Scope level determines visibility boundaries */
    level: ScopeLevel;
    /** Unique identifier for the scope (user ID, project ID, org ID, etc.) */
    identifier: string;
    /** Whether this scope can share data with broader scopes */
    canShare: boolean;
    /** Sensitivity level for data classification */
    sensitivity: SensitivityLevel;
}
/**
 * Scoped Key Builder
 *
 * Constructs namespace-scoped keys for Mnemosyne storage.
 * Format: pattern:{level}:{identifier}:{type}:{suffix?}
 *
 * Examples:
 * - pattern:user:alice:agent_preference
 * - pattern:project:mendicant:success_rate:hollowed_eyes
 * - pattern:organization:acme:pattern:api_integration
 */
export declare class ScopedKey {
    /**
     * Build scoped key for Mnemosyne storage
     *
     * @param type Data type (e.g., 'agent_preference', 'success_rate')
     * @param scope Learning scope configuration
     * @param suffix Optional additional identifier
     * @returns Fully scoped key string
     */
    static build(type: string, scope: LearningScope, suffix?: string): string;
    /**
     * Parse scoped key back into components
     *
     * @param key Scoped key string
     * @returns Parsed key components or null if invalid
     */
    static parse(key: string): {
        type: string;
        level: ScopeLevel;
        identifier: string;
        dataType: string;
    } | null;
}
/**
 * Data Anonymizer
 *
 * Strips sensitive information for cross-scope sharing.
 * Ensures privacy when promoting data from narrow to broad scopes.
 */
export declare class DataAnonymizer {
    /**
     * Anonymize data for broader scope sharing
     *
     * Removes:
     * - Personal identifiers (email, phone, etc.)
     * - Secrets (API keys, tokens, passwords)
     * - Internal project details
     *
     * @param data Raw data object
     * @returns Anonymized data suitable for sharing
     */
    static anonymize(data: any): any;
    /**
     * Strip sensitive fields from context object
     *
     * @param context Context object potentially containing sensitive data
     * @returns Cleaned context object
     */
    private static stripSensitiveContext;
    /**
     * Check if data can be safely shared at target scope level
     *
     * @param data Data to check
     * @param targetSensitivity Target sensitivity level
     * @returns True if safe to share
     */
    static canShare(data: any, targetSensitivity: SensitivityLevel): boolean;
}
//# sourceMappingURL=scope.d.ts.map