const fs = require('fs');
const file = 'C:/Users/eclip/Desktop/MENDICANT/mendicant-mcp-server/src/knowledge/error_classifier.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: Add version_mismatch case to detectSubType
const oldDetectSubType = `function detectSubType(category: ErrorCategory, errorMessage: string): ErrorSubType {
  const lower = errorMessage.toLowerCase();

  switch (category) {
    case 'missing_dependency':`;

const newDetectSubType = `function detectSubType(category: ErrorCategory, errorMessage: string): ErrorSubType {
  const lower = errorMessage.toLowerCase();

  switch (category) {
    case 'version_mismatch':
      if (/using.*v\\d+.*expects.*v\\d+/i.test(lower) || /version.*conflict/i.test(lower)) return 'version_conflict';
      if (/incompatible.*version/i.test(lower)) return 'version_conflict';
      if (/deprecated/i.test(lower)) return 'api_deprecated';
      return 'version_conflict';

    case 'missing_dependency':`;

content = content.replace(oldDetectSubType, newDetectSubType);

// Fix 2: Add version_mismatch to high severity check in assessSeverity
const oldAssessSeverity = `  if (
    category === 'compilation_error' ||
    category === 'syntax_error' ||
    category === 'authentication_error' ||
    category === 'missing_dependency' ||
    /blocker|severe/i.test(lower)
  ) {
    return 'high';
  }`;

const newAssessSeverity = `  if (
    category === 'compilation_error' ||
    category === 'syntax_error' ||
    category === 'authentication_error' ||
    category === 'missing_dependency' ||
    category === 'version_mismatch' ||
    /blocker|severe/i.test(lower)
  ) {
    return 'high';
  }`;

content = content.replace(oldAssessSeverity, newAssessSeverity);

// Fix 3: Make configuration_error recoverable by using 'fallback' strategy instead of 'manual'
const oldDetermineRecovery = `  if (severity === 'critical' || category === 'syntax_error' || category === 'compilation_error') {
    return 'abort';
  }

  return 'manual';
}`;

const newDetermineRecovery = `  if (
    category === 'configuration_error' ||
    category === 'missing_dependency'
  ) {
    return 'fallback';
  }

  if (severity === 'critical' || category === 'syntax_error' || category === 'compilation_error') {
    return 'abort';
  }

  return 'manual';
}`;

content = content.replace(oldDetermineRecovery, newDetermineRecovery);

fs.writeFileSync(file, content);
console.log('✅ Fixed error_classifier.ts:');
console.log('  - Added version_mismatch case to detectSubType');
console.log('  - Added version_mismatch to high severity check');
console.log('  - Made configuration_error recoverable with fallback strategy');
