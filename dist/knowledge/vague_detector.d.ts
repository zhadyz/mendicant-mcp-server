/**
 * VAGUE REQUEST DETECTOR
 *
 * Detects when objectives are too vague and need clarification.
 * Triggers the_librarian for requirements gathering.
 */
export interface VagueAnalysis {
    is_vague: boolean;
    confidence: number;
    vagueness_indicators: string[];
    missing_context: string[];
    suggested_clarifications: string[];
}
/**
 * Analyzes if an objective is too vague
 */
export declare function detectVagueRequest(objective: string): VagueAnalysis;
/**
 * Determines if the_librarian should be invoked for clarification
 */
export declare function shouldInvokeLibrarian(vagueAnalysis: VagueAnalysis): boolean;
//# sourceMappingURL=vague_detector.d.ts.map