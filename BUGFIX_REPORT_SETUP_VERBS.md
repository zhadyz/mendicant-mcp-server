# Bug Fix Report: Setup/Configure Verb Recognition

**Bug ID:** Cycle 1 QA - Intent Detection Bugs
**Reporter:** LOVELESS
**Fixed By:** HOLLOWED_EYES
**Date:** 2025-11-06

---

## Problem Summary

Common DevOps/deployment verbs (setup, configure, install, provision, establish, initialize) were not recognized in intent detection, causing infrastructure tasks to be incorrectly classified as `investigate` intent instead of `deploy` or `create_new`.

### Example Failing Cases (Pre-Fix)
- "Setup AWS cloud orchestration cluster" → `investigate` (should be `deploy`)
- "Configure Kubernetes deployment" → `investigate` (should be `deploy`)
- "Install production infrastructure" → `investigate` (should be `deploy`)
- "Provision cloud resources" → `investigate` (should be `deploy`)

---

## Root Cause

**File:** `src/knowledge/semantic_selector.ts`

The `detectIntent()` function only recognized limited verb sets:
- CREATE_NEW: `create|build|generate|make|develop|implement|add`
- DEPLOY: `deploy|release|publish|ship|launch`

Missing: `setup|configure|install|provision|establish|initialize`

---

## Solution Implemented

### Fix 1: Enhanced CREATE_NEW Intent (Lines 101-107)

**Added verbs:** `setup|configure|install|provision|establish|initialize`

```typescript
// CREATE_NEW - Building from scratch
if (
  /\b(create|build|generate|make|develop|implement|add|setup|configure|install|provision|establish|initialize)\s+(a|an|new)/.test(objective) ||
  /^(create|build|generate|make|setup|configure|install|provision)\s+\w+/.test(objective)
) {
  return 'create_new';
}
```

### Fix 2: Enhanced DEPLOY Intent (Lines 87-99)

**Critical change:** Moved DEPLOY detection BEFORE CREATE_NEW to catch infrastructure setup tasks first.

```typescript
// DEPLOY - Check this FIRST before CREATE_NEW to catch infrastructure setup
if (
  // Traditional deployment verbs (don't need infrastructure keywords)
  /\b(deploy|release|publish|ship|launch)\b/.test(objective) ||
  // Setup verbs WITH infrastructure keywords
  (
    /\b(provision|configure|setup|install|establish|initialize)\b/.test(objective) &&
    /\b(infrastructure|cloud|production|server|cluster|environment|deployment|resources)\b/.test(objective)
  )
) {
  return 'deploy';
}
```

### Fix 3: Enhanced Domain Detection (Lines 207-218)

**Added:** AWS/Azure/GCP trigger infrastructure domain when combined with deploy intent.

```typescript
// INFRASTRUCTURE - DevOps, CI/CD, deployment
if (
  /\b(docker|kubernetes|k8s|ci\/cd|pipeline|github actions|vercel|infrastructure)\b/.test(objective) ||
  /\b(aws|azure|gcp|cloud)\b/.test(objective) && intent === 'deploy' ||
  (
    /\b(container|cloud|aws|azure|gcp|cluster)\b/.test(objective) &&
    /\b(orchestration)\b/.test(objective)
  )
) {
  return 'infrastructure';
}
```

### Fix 4: Improved UI_UX Detection (Lines 228-239)

**Refined:** React/Vue/Svelte only trigger UI_UX when combined with design/visual keywords.

```typescript
// UI_UX - Design systems and user interfaces
// BUT: "React component" without design/UI context should be code domain
if (
  /\b(ui|ux|design system|component library|interface|frontend)\b/.test(objective) ||
  (
    /\b(react|vue|svelte)\b/.test(objective) &&
    /\b(design|interface|layout|styling|visual|dashboard)\b/.test(objective)
  )
) {
  return 'ui_ux';
}
```

---

## Test Coverage

**File:** `src/__tests__/semantic_selector.test.ts`

### New Test Suite: `deployment and setup verb recognition`

Added 8 comprehensive test cases:

```typescript
describe('deployment and setup verb recognition', () => {
  test('recognizes setup for infrastructure', () => {
    const result = analyzeObjectiveSemantic('Setup AWS cloud orchestration cluster');
    expect(result.intent).toBe('deploy');
    expect(result.domain).toBe('infrastructure');
    expect(result.recommended_agents).toContain('the_sentinel');
  });

  test('recognizes configure for deployment', () => {
    const result = analyzeObjectiveSemantic('Configure Kubernetes deployment pipeline');
    expect(result.intent).toBe('deploy');
    expect(result.domain).toBe('infrastructure');
  });

  test('recognizes install for infrastructure', () => {
    const result = analyzeObjectiveSemantic('Install production infrastructure components');
    expect(result.intent).toBe('deploy');
  });

  test('recognizes provision for cloud resources', () => {
    const result = analyzeObjectiveSemantic('Provision cloud resources for the application');
    expect(result.intent).toBe('deploy');
    expect(result.domain).toBe('infrastructure');
  });

  test('recognizes establish for infrastructure', () => {
    const result = analyzeObjectiveSemantic('Establish production environment on AWS');
    expect(result.intent).toBe('deploy');
    expect(result.domain).toBe('infrastructure');
  });

  test('setup without infrastructure context uses create_new', () => {
    const result = analyzeObjectiveSemantic('Setup a new React component');
    expect(result.intent).toBe('create_new');
    expect(result.domain).toBe('code');
  });

  test('configure without infrastructure context uses create_new', () => {
    const result = analyzeObjectiveSemantic('Configure a new feature toggle system');
    expect(result.intent).toBe('create_new');
  });

  test('install without infrastructure context uses create_new', () => {
    const result = analyzeObjectiveSemantic('Install a new payment handler');
    expect(result.intent).toBe('create_new');
  });
});
```

---

## Verification Results

### Build Status
```bash
npm run build
✓ Build successful (no TypeScript errors)
```

### Test Results
```bash
npm test
✓ All 36 tests passing
  - 24 existing tests (cinna agent selection)
  - 4 regression tests
  - 8 new deployment/setup verb tests
```

### Manual Verification (Example Cases)

| Input | Intent | Domain | Agents |
|-------|--------|--------|--------|
| "Setup AWS cloud orchestration cluster" | `deploy` ✓ | `infrastructure` ✓ | `the_sentinel` ✓ |
| "Configure Kubernetes deployment" | `deploy` ✓ | `infrastructure` ✓ | `the_sentinel` ✓ |
| "Install production infrastructure" | `deploy` ✓ | `infrastructure` ✓ | `the_sentinel` ✓ |
| "Provision cloud resources" | `deploy` ✓ | `infrastructure` ✓ | `the_sentinel` ✓ |
| "Setup a new React component" | `create_new` ✓ | `code` ✓ | `hollowed_eyes` ✓ |

---

## Behavioral Changes

### Intent Detection
- **Setup/Configure/Install/Provision/Establish/Initialize** now recognized in both CREATE_NEW and DEPLOY contexts
- **Context-aware routing:** Infrastructure keywords trigger DEPLOY, otherwise CREATE_NEW
- **Order matters:** DEPLOY check now happens BEFORE CREATE_NEW to catch infrastructure tasks

### Domain Detection
- **AWS/Azure/GCP** keywords now trigger `infrastructure` domain when combined with `deploy` intent
- **React/Vue/Svelte** only trigger `ui_ux` domain when combined with design/visual keywords
- **"React component"** without design context now correctly routes to `code` domain

### Agent Recommendations
- Infrastructure setup tasks now correctly recommend `the_sentinel` (DevOps specialist)
- Non-infrastructure setup tasks correctly recommend `hollowed_eyes` (implementation specialist)

---

## Files Modified

1. `src/knowledge/semantic_selector.ts` - Intent and domain detection logic
2. `src/__tests__/semantic_selector.test.ts` - Comprehensive test coverage

---

## Status

**✓ COMPLETE** - All bugs fixed, tests passing, comprehensive verification complete.

**Test Coverage:** 36/36 tests passing (100%)
