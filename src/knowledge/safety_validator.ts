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

export type ThreatType =
  | 'data_destruction'      // Deleting, dropping, truncating data
  | 'credential_exposure'   // Exposing API keys, secrets, passwords
  | 'security_bypass'       // Disabling security, removing auth
  | 'system_harm'           // Shutting down, crashing, DOS
  | 'malicious_code'        // Backdoors, malware, exploits
  | 'unauthorized_access'   // Accessing systems without permission
  | 'privacy_violation'     // Exposing PII, user data
  | 'financial_harm';       // Unauthorized transactions, payment manipulation

/**
 * Validates that an objective is safe to execute
 */
export function validateSafety(objective: string): SafetyAnalysis {
  const lower = objective.toLowerCase().trim();
  const detected_threats: SafetyThreat[] = [];

  // DATA DESTRUCTION - Critical threat
  const destructionPatterns = [
    { pattern: /\b(delete|drop|truncate|remove)\s+(all|entire|whole|every)?\s*(database|table|collection|data)/i,
      description: 'Deleting entire databases or tables',
      evidence: [] as string[] },
    { pattern: /\b(wipe|erase|clear|purge)\s+(all|entire|whole)?\s*(data|records|files)/i,
      description: 'Wiping or clearing all data',
      evidence: [] as string[] },
    { pattern: /\bdelete\s+\*/i,
      description: 'Delete wildcard operation',
      evidence: [] as string[] },
    { pattern: /\bdrop\s+(database|schema|table)/i,
      description: 'Dropping database objects',
      evidence: [] as string[] },
    { pattern: /\btruncate\s+table/i,
      description: 'Truncating tables (permanent deletion)',
      evidence: [] as string[] }
  ];

  for (const { pattern, description, evidence } of destructionPatterns) {
    const match = lower.match(pattern);
    if (match) {
      evidence.push(`Matched pattern: "${match[0]}"`);
      detected_threats.push({
        type: 'data_destruction',
        severity: 'critical',
        description,
        evidence
      });
    }
  }

  // CREDENTIAL EXPOSURE - Critical threat
  const credentialPatterns = [
    { pattern: /\b(expose|leak|reveal|display|show|print)\s+(.*?)?\s*(api\s*key|secret|password|credential|token)/i,
      description: 'Exposing API keys or credentials',
      evidence: [] as string[] },
    { pattern: /\b(publish|commit|push|upload)\s+(.*?)?\s*(secret|api\s*key|password|credential)/i,
      description: 'Publishing secrets to public locations',
      evidence: [] as string[] },
    { pattern: /\blog\s+(secret|api\s*key|password|credential)/i,
      description: 'Logging sensitive credentials',
      evidence: [] as string[] },
    { pattern: /\bpublicly/i,
      description: 'Making something public (potential credential leak)',
      evidence: [] as string[] }
  ];

  for (const { pattern, description, evidence } of credentialPatterns) {
    const match = lower.match(pattern);
    if (match) {
      evidence.push(`Matched pattern: "${match[0]}"`);
      detected_threats.push({
        type: 'credential_exposure',
        severity: 'critical',
        description,
        evidence
      });
    }
  }

  // SECURITY BYPASS - High threat
  const securityBypassPatterns = [
    { pattern: /\b(disable|remove|bypass|skip|turn\s*off)\s+(.*?)?\s*(auth|authentication|security|validation|check)/i,
      description: 'Disabling security or authentication',
      evidence: [] as string[] },
    { pattern: /\bno\s+(auth|authentication|security|validation)/i,
      description: 'Removing authentication requirements',
      evidence: [] as string[] },
    { pattern: /\b(allow|permit)\s+(anonymous|public|anyone)\s+(access|read|write)/i,
      description: 'Allowing unrestricted access',
      evidence: [] as string[] }
  ];

  for (const { pattern, description, evidence } of securityBypassPatterns) {
    const match = lower.match(pattern);
    if (match) {
      evidence.push(`Matched pattern: "${match[0]}"`);
      detected_threats.push({
        type: 'security_bypass',
        severity: 'high',
        description,
        evidence
      });
    }
  }

  // SYSTEM HARM - High threat
  const systemHarmPatterns = [
    { pattern: /\b(shut\s*down|crash|kill|terminate)\s+(.*?)?\s*(server|service|system|process|production)/i,
      description: 'Shutting down or crashing systems',
      evidence: [] as string[] },
    { pattern: /\bdos\s+(attack)?/i,
      description: 'Denial of service attack',
      evidence: [] as string[] },
    { pattern: /\boverload\s+(server|system|production)/i,
      description: 'Intentionally overloading systems',
      evidence: [] as string[] }
  ];

  for (const { pattern, description, evidence } of systemHarmPatterns) {
    const match = lower.match(pattern);
    if (match) {
      evidence.push(`Matched pattern: "${match[0]}"`);
      detected_threats.push({
        type: 'system_harm',
        severity: 'high',
        description,
        evidence
      });
    }
  }

  // MALICIOUS CODE - Critical threat
  const maliciousCodePatterns = [
    { pattern: /\b(backdoor|trojan|malware|virus|exploit|payload)/i,
      description: 'Creating malicious code',
      evidence: [] as string[] },
    { pattern: /\b(inject|injection)\s+(sql|code|script|command)/i,
      description: 'Code injection attack',
      evidence: [] as string[] },
    { pattern: /\b(exfiltrate|steal)\s+(data|credentials|secrets)/i,
      description: 'Data exfiltration',
      evidence: [] as string[] }
  ];

  for (const { pattern, description, evidence } of maliciousCodePatterns) {
    const match = lower.match(pattern);
    if (match) {
      evidence.push(`Matched pattern: "${match[0]}"`);
      detected_threats.push({
        type: 'malicious_code',
        severity: 'critical',
        description,
        evidence
      });
    }
  }

  // UNAUTHORIZED ACCESS - High threat
  const unauthorizedAccessPatterns = [
    { pattern: /\b(hack|crack|break\s*into|penetrate)\s+(.*?)?\s*(system|server|database|account)/i,
      description: 'Unauthorized system access',
      evidence: [] as string[] },
    { pattern: /\bbrute\s*force\s+(password|auth|login)/i,
      description: 'Brute force attack',
      evidence: [] as string[] }
  ];

  for (const { pattern, description, evidence } of unauthorizedAccessPatterns) {
    const match = lower.match(pattern);
    if (match) {
      evidence.push(`Matched pattern: "${match[0]}"`);
      detected_threats.push({
        type: 'unauthorized_access',
        severity: 'high',
        description,
        evidence
      });
    }
  }

  // PRIVACY VIOLATION - High threat
  const privacyViolationPatterns = [
    { pattern: /\b(expose|leak|reveal)\s+(.*?)?\s*(pii|personal\s*information|user\s*data|customer\s*data)/i,
      description: 'Exposing personally identifiable information',
      evidence: [] as string[] },
    { pattern: /\b(scrape|harvest|collect)\s+(.*?)?\s*(email|phone|address|personal\s*data)/i,
      description: 'Harvesting personal data without consent',
      evidence: [] as string[] }
  ];

  for (const { pattern, description, evidence } of privacyViolationPatterns) {
    const match = lower.match(pattern);
    if (match) {
      evidence.push(`Matched pattern: "${match[0]}"`);
      detected_threats.push({
        type: 'privacy_violation',
        severity: 'high',
        description,
        evidence
      });
    }
  }

  // FINANCIAL HARM - Critical threat
  const financialHarmPatterns = [
    { pattern: /\b(transfer|send|pay)\s+(all|entire)?\s*(money|funds|payment)/i,
      description: 'Unauthorized financial transactions',
      evidence: [] as string[] },
    { pattern: /\b(charge|bill)\s+(.*?)?\s*(without\s+consent|unauthorized)/i,
      description: 'Unauthorized billing',
      evidence: [] as string[] }
  ];

  for (const { pattern, description, evidence } of financialHarmPatterns) {
    const match = lower.match(pattern);
    if (match) {
      evidence.push(`Matched pattern: "${match[0]}"`);
      detected_threats.push({
        type: 'financial_harm',
        severity: 'critical',
        description,
        evidence
      });
    }
  }

  // Determine overall threat level
  const threat_level = calculateThreatLevel(detected_threats);

  // Is it safe to execute?
  const is_safe = threat_level === 'none' || threat_level === 'low';

  // Generate recommendations
  const recommendations = generateSafetyRecommendations(detected_threats);

  return {
    is_safe,
    threat_level,
    detected_threats,
    recommendations
  };
}

/**
 * Calculates overall threat level from detected threats
 */
function calculateThreatLevel(threats: SafetyThreat[]): 'none' | 'low' | 'medium' | 'high' | 'critical' {
  if (threats.length === 0) {
    return 'none';
  }

  // If ANY threat is critical, overall is critical
  if (threats.some(t => t.severity === 'critical')) {
    return 'critical';
  }

  // If ANY threat is high, overall is high
  if (threats.some(t => t.severity === 'high')) {
    return 'high';
  }

  // If ANY threat is medium, overall is medium
  if (threats.some(t => t.severity === 'medium')) {
    return 'medium';
  }

  // All threats are low severity
  return 'low';
}

/**
 * Generates safety recommendations based on detected threats
 */
function generateSafetyRecommendations(threats: SafetyThreat[]): string[] {
  const recommendations: string[] = [];

  if (threats.length === 0) {
    return recommendations;
  }

  // Group threats by type
  const threatTypes = new Set(threats.map(t => t.type));

  if (threatTypes.has('data_destruction')) {
    recommendations.push('CRITICAL: Data destruction detected. Ensure backups exist and user authorization is explicit.');
    recommendations.push('Consider using a dry-run mode or staging environment.');
  }

  if (threatTypes.has('credential_exposure')) {
    recommendations.push('CRITICAL: Credential exposure detected. Never log, display, or transmit credentials in plain text.');
    recommendations.push('Use environment variables and secret management systems.');
  }

  if (threatTypes.has('security_bypass')) {
    recommendations.push('HIGH: Security bypass detected. Disabling auth/security should only occur in controlled dev environments.');
    recommendations.push('Ensure proper access controls remain in place.');
  }

  if (threatTypes.has('system_harm')) {
    recommendations.push('HIGH: System harm detected. Operations affecting production systems require explicit authorization.');
  }

  if (threatTypes.has('malicious_code')) {
    recommendations.push('CRITICAL: Malicious code detected. This objective appears to involve creating harmful code.');
    recommendations.push('Ensure this is for authorized security research or defensive purposes only.');
  }

  if (threatTypes.has('unauthorized_access')) {
    recommendations.push('HIGH: Unauthorized access detected. Ensure proper authorization and consent.');
  }

  if (threatTypes.has('privacy_violation')) {
    recommendations.push('HIGH: Privacy violation detected. Ensure compliance with GDPR, CCPA, and user consent.');
  }

  if (threatTypes.has('financial_harm')) {
    recommendations.push('CRITICAL: Financial harm detected. Financial operations require explicit user authorization.');
  }

  // Generic safety recommendation
  recommendations.push('Verify that this objective is authorized and has proper safeguards.');

  return recommendations;
}

/**
 * Determines if safety validator should BLOCK execution
 */
export function shouldBlockExecution(safetyAnalysis: SafetyAnalysis): boolean {
  // Block if threat level is high or critical
  if (safetyAnalysis.threat_level === 'high' || safetyAnalysis.threat_level === 'critical') {
    return true;
  }

  // Block if we detected multiple medium threats (stacked risk)
  if (safetyAnalysis.threat_level === 'medium' && safetyAnalysis.detected_threats.length >= 2) {
    return true;
  }

  return false;
}
