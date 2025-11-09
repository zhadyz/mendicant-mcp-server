/**
 * Delegation Enforcer Tests
 * 
 * Test that enforcement blocks large operations and tracks context correctly.
 */

import { DelegationEnforcer } from '../enforcement/delegation-enforcer.js';

describe('DelegationEnforcer', () => {
  let enforcer: DelegationEnforcer;
  
  beforeEach(() => {
    enforcer = new DelegationEnforcer(true);
  });
  
  describe('Large Write Block', () => {
    it('should block writes >200 lines', () => {
      const largeContent = Array(201).fill('line').join('\n');
      const args = { 
        file_path: '/test/file.ts',
        content: largeContent 
      };
      
      expect(() => {
        enforcer.checkToolCall('Write', args);
      }).toThrow('DELEGATION_REQUIRED: spawn the_scribe');
    });
    
    it('should allow writes ≤200 lines', () => {
      const okContent = Array(200).fill('line').join('\n');
      const args = { 
        file_path: '/test/file.ts',
        content: okContent 
      };
      
      const warning = enforcer.checkToolCall('Write', args);
      expect(warning).toMatch(/TIP: Consider delegating/);
    });
  });
  
  describe('Multiple Large Reads Block', () => {
    it('should block 3rd large read in 60s window', () => {
      // Simulate 2 large reads
      const largeContent = Array(501).fill('line').join('\n');
      
      enforcer.recordToolCall('Read', 
        { file_path: '/test/file1.ts' },
        { content: largeContent }
      );
      
      enforcer.recordToolCall('Read',
        { file_path: '/test/file2.ts' },
        { content: largeContent }
      );
      
      // 3rd read should block
      expect(() => {
        enforcer.checkToolCall('Read', { file_path: '/test/file3.ts' });
      }).toThrow('DELEGATION_REQUIRED: spawn the_architect');
    });
    
    it('should warn after 1st large read, not block', () => {
      // Record 1 large read
      const largeContent = Array(501).fill('line').join('\n');
      
      enforcer.recordToolCall('Read',
        { file_path: '/test/file1.ts' },
        { content: largeContent }
      );
      
      // 2nd read check should just warn
      const warning = enforcer.checkToolCall('Read', { file_path: '/test/file2.ts' });
      expect(warning).toBeNull(); // No warning yet, only 1 read recorded
    });
  });
  
  describe('Context Overflow Block', () => {
    it('should block when session exceeds 25k tokens', () => {
      // Simulate heavy context accumulation
      const massiveContent = 'x'.repeat(100000); // ~25k tokens
      
      enforcer.recordToolCall('Read',
        { file_path: '/test/huge.ts' },
        { content: massiveContent }
      );
      
      // Next call should block
      expect(() => {
        enforcer.checkToolCall('Read', { file_path: '/test/another.ts' });
      }).toThrow('DELEGATION_REQUIRED: delegate current task');
    });
    
    it('should warn when approaching 25k token limit', () => {
      // Simulate ~20k tokens
      const largeContent = 'x'.repeat(80000); // ~20k tokens
      
      enforcer.recordToolCall('Read',
        { file_path: '/test/large.ts' },
        { content: largeContent }
      );
      
      const warning = enforcer.checkToolCall('Read', { file_path: '/test/another.ts' });
      expect(warning).toMatch(/WARNING: Approaching context limit/);
    });
  });
  
  describe('Session Reset', () => {
    it('should reset context after delegation', () => {
      const largeContent = 'x'.repeat(100000);
      
      enforcer.recordToolCall('Read',
        { file_path: '/test/huge.ts' },
        { content: largeContent }
      );
      
      const stats = enforcer.getStats();
      expect(stats.sessionTokens).toBeGreaterThan(20000);
      
      enforcer.resetSession();
      
      const resetStats = enforcer.getStats();
      expect(resetStats.sessionTokens).toBe(0);
    });
  });
  
  describe('Disabled Enforcement', () => {
    it('should not enforce when disabled', () => {
      enforcer.setEnabled(false);
      
      const largeContent = Array(300).fill('line').join('\n');
      const args = { 
        file_path: '/test/file.ts',
        content: largeContent 
      };
      
      expect(() => {
        enforcer.checkToolCall('Write', args);
      }).not.toThrow();
    });
  });
});
