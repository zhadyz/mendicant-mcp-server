/**
 * VAGUE REQUEST DETECTOR
 *
 * Detects when objectives are too vague and need clarification.
 * Triggers the_librarian for requirements gathering.
 */
/**
 * Analyzes if an objective is too vague
 */
export function detectVagueRequest(objective) {
    const lower = objective.toLowerCase().trim();
    const words = lower.split(/\s+/);
    const vagueness_indicators = [];
    const missing_context = [];
    const suggested_clarifications = [];
    // ULTRA VAGUE - Almost no information
    const ultraVague = [
        'make it better',
        'improve it',
        'fix it',
        'update it',
        'change it',
        'make this work',
        'do something',
        'help me',
        'can you',
    ];
    for (const pattern of ultraVague) {
        if (lower === pattern || lower.startsWith(pattern + ' ') || lower.startsWith(pattern + '.')) {
            vagueness_indicators.push(`ultra_vague_phrase: "${pattern}"`);
        }
    }
    // Very short objectives (< 3 words) are usually vague
    if (words.length < 3 && !ultraVague.some(v => lower === v)) {
        vagueness_indicators.push('very_short_objective');
        suggested_clarifications.push('Please provide more details about what you want to accomplish');
    }
    // Ambiguous pronouns without context
    const pronouns = ['it', 'this', 'that', 'them', 'those'];
    if (pronouns.some(p => words.includes(p)) && words.length < 5) {
        vagueness_indicators.push('ambiguous_pronouns');
        missing_context.push('What does "it/this/that" refer to?');
    }
    // Generic verbs without specifics
    const genericVerbs = ['improve', 'enhance', 'optimize', 'fix', 'update', 'make'];
    const hasGenericVerb = genericVerbs.some(v => words.includes(v));
    const hasSpecifics = /\b(by|using|with|for|to|from)\b/.test(lower);
    if (hasGenericVerb && !hasSpecifics && words.length < 6) {
        vagueness_indicators.push('generic_verb_without_specifics');
        suggested_clarifications.push('How specifically do you want to improve/fix/optimize?');
    }
    // Missing critical context indicators
    if (hasGenericVerb || words.includes('create') || words.includes('build')) {
        // Check for missing "what"
        const hasWhat = /\b(feature|component|page|api|service|function|class|module)\b/.test(lower);
        if (!hasWhat) {
            missing_context.push('What exactly should be created/built?');
        }
        // Check for missing "how"
        if (words.includes('better') || words.includes('improve')) {
            missing_context.push('What makes it "better"? What criteria define improvement?');
        }
    }
    // No nouns (likely incomplete thought)
    const commonNouns = ['feature', 'bug', 'test', 'code', 'app', 'page', 'component', 'api',
        'database', 'auth', 'user', 'design', 'ui', 'backend', 'frontend'];
    const hasNoun = commonNouns.some(n => lower.includes(n));
    if (!hasNoun && words.length < 8) {
        vagueness_indicators.push('no_concrete_nouns');
        missing_context.push('What specific part of the system are you referring to?');
    }
    // Vague qualifiers
    const vagueQualifiers = ['somehow', 'some way', 'something', 'anything', 'whatever'];
    for (const qualifier of vagueQualifiers) {
        if (lower.includes(qualifier)) {
            vagueness_indicators.push(`vague_qualifier: "${qualifier}"`);
        }
    }
    // Calculate vagueness score
    let vagueScore = 0;
    // Ultra vague phrases = instant high score
    if (vagueness_indicators.some(i => i.startsWith('ultra_vague_phrase'))) {
        vagueScore = 0.95;
    }
    else {
        // Base scoring
        vagueScore += vagueness_indicators.length * 0.25;
        vagueScore += missing_context.length * 0.15;
        // Short objectives are likely vague
        if (words.length < 3)
            vagueScore += 0.3;
        else if (words.length < 5)
            vagueScore += 0.15;
        // Cap at 1.0
        vagueScore = Math.min(vagueScore, 1.0);
    }
    const is_vague = vagueScore >= 0.5;
    // Generate suggested clarifications if vague
    if (is_vague && suggested_clarifications.length === 0) {
        suggested_clarifications.push('Please provide more specific details about the objective');
        suggested_clarifications.push('What is the expected outcome?');
        suggested_clarifications.push('Are there any constraints or requirements?');
    }
    return {
        is_vague,
        confidence: vagueScore,
        vagueness_indicators,
        missing_context,
        suggested_clarifications
    };
}
/**
 * Determines if the_librarian should be invoked for clarification
 */
export function shouldInvokeLibrarian(vagueAnalysis) {
    return vagueAnalysis.is_vague && vagueAnalysis.confidence >= 0.6;
}
//# sourceMappingURL=vague_detector.js.map