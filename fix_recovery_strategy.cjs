const fs = require('fs');
const file = 'C:/Users/eclip/Desktop/MENDICANT/mendicant-mcp-server/src/knowledge/error_classifier.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix: ECONNREFUSED and similar connection errors should use retry_backoff
const oldDetermineRecoveryNetwork = `  if (
    category === 'timeout' ||
    category === 'network_error' ||
    (category === 'api_rate_limit' && /transient/i.test(lower))
  ) {
    return 'retry';
  }

  if (category === 'api_rate_limit') {
    return 'retry_backoff';
  }`;

const newDetermineRecoveryNetwork = `  // Network errors with connection issues benefit from backoff
  if (category === 'network_error' && (/econnrefused|econnreset|connection.*refused/i.test(lower))) {
    return 'retry_backoff';
  }

  if (
    category === 'timeout' ||
    category === 'network_error' ||
    (category === 'api_rate_limit' && /transient/i.test(lower))
  ) {
    return 'retry';
  }

  if (category === 'api_rate_limit') {
    return 'retry_backoff';
  }`;

content = content.replace(oldDetermineRecoveryNetwork, newDetermineRecoveryNetwork);

fs.writeFileSync(file, content);
console.log('✅ Fixed network error recovery strategy:');
console.log('  - ECONNREFUSED errors now use retry_backoff strategy');
