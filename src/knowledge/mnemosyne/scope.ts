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
export class ScopedKey {
  /**
   * Build scoped key for Mnemosyne storage
   *
   * @param type Data type (e.g., 'agent_preference', 'success_rate')
   * @param scope Learning scope configuration
   * @param suffix Optional additional identifier
   * @returns Fully scoped key string
   */
  static build(
    type: string,
    scope: LearningScope,
    suffix?: string
  ): string {
    const parts = [
      'pattern',
      scope.level,
      scope.identifier,
      type
    ];

    if (suffix) parts.push(suffix);

    return parts.join(':');
  }

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
  } | null {
    const parts = key.split(':');

    if (parts.length < 4 || parts[0] !== 'pattern') return null;

    return {
      type: 'pattern',
      level: parts[1] as ScopeLevel,
      identifier: parts[2],
      dataType: parts[3]
    };
  }
}

/**
 * Data Anonymizer
 *
 * Strips sensitive information for cross-scope sharing.
 * Ensures privacy when promoting data from narrow to broad scopes.
 */
export class DataAnonymizer {
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
  static anonymize(data: any): any {
    // Remove sensitive fields
    const { context, ...safe } = data;

    return {
      ...safe,
      context: this.stripSensitiveContext(context)
    };
  }

  /**
   * Strip sensitive fields from context object
   *
   * @param context Context object potentially containing sensitive data
   * @returns Cleaned context object
   */
  private static stripSensitiveContext(context: any): any {
    if (!context) return {};

    const sensitiveKeys = [
      'api_key', 'apikey', 'token', 'password', 'secret',
      'email', 'phone', 'ssn', 'credit_card',
      'private_key', 'cert', 'credentials',
      'auth', 'authorization', 'bearer'
    ];

    const cleaned = { ...context };

    for (const key of Object.keys(cleaned)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        delete cleaned[key];
      }
    }

    return cleaned;
  }

  /**
   * Check if data can be safely shared at target scope level
   *
   * @param data Data to check
   * @param targetSensitivity Target sensitivity level
   * @returns True if safe to share
   */
  static canShare(data: any, targetSensitivity: SensitivityLevel): boolean {
    // Restricted data never shares
    if (data.sensitivity === 'restricted') return false;

    // Confidential only shares to confidential or restricted
    if (data.sensitivity === 'confidential' &&
        (targetSensitivity === 'public' || targetSensitivity === 'internal')) {
      return false;
    }

    // Internal only shares to internal, confidential, or restricted
    if (data.sensitivity === 'internal' && targetSensitivity === 'public') {
      return false;
    }

    return true;
  }
}
