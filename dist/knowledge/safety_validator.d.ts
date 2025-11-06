/**
 * SAFETY VALIDATOR
 *
 * Detects and prevents execution of dangerous/destructive objectives.
 * This is the CRITICAL safety layer that prevents Mendicant from
 * executing harmful commands.
 */
export interface SafetyAnalysis {
    is_safe: boolean;
    threat_level: 'none' | 'low' | 'medium' | 'high' | 'critical';
    detected_threats: SafetyThreat[];
    recommendations: string[];
}
export interface SafetyThreat {
    type: ThreatType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    evidence: string[];
}
export type ThreatType = 'data_destruction' | 'credential_exposure' | 'security_bypass' | 'system_harm' | 'malicious_code' | 'unauthorized_access' | 'privacy_violation' | 'financial_harm';
/**
 * Validates that an objective is safe to execute
 */
export declare function validateSafety(objective: string): SafetyAnalysis;
/**
 * Determines if safety validator should BLOCK execution
 */
export declare function shouldBlockExecution(safetyAnalysis: SafetyAnalysis): boolean;
//# sourceMappingURL=safety_validator.d.ts.map