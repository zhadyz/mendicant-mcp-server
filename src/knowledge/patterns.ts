import type { Pattern, OrchestrationPlan, ProjectContext } from '../types.js';

export const COMMON_PATTERNS: Record<string, Pattern> = {
  
  SCAFFOLD: {
    name: "Project Scaffolding",
    description: "Set up a new project with proper structure, architecture, and documentation",
    generatePlan: (context?: ProjectContext): OrchestrationPlan => ({
      agents: [
        {
          agent_id: "the_architect",
          task_description: "Design system architecture",
          prompt: `Design the architecture for this ${context?.project_type || 'project'}. Create:
- Component hierarchy and structure
- State management patterns
- Data flow architecture
- Technology stack recommendations
- Architecture diagrams using Mermaid

Focus on scalability, maintainability, and best practices.`,
          dependencies: [],
          priority: "high"
        },
        {
          agent_id: "hollowed_eyes",
          task_description: "Scaffold project structure",
          prompt: `Create project scaffold based on the architecture design. Implement:
- Project directory structure
- Configuration files (tsconfig, eslint, etc.)
- Package.json with proper dependencies
- Basic routing/navigation setup
- Initial component structure
- Build configuration

Ensure everything follows the architecture design and best practices.`,
          dependencies: ["the_architect"],
          priority: "critical"
        },
        {
          agent_id: "the_scribe",
          task_description: "Create documentation",
          prompt: `Create comprehensive project documentation:
- README.md with setup instructions and overview
- ARCHITECTURE.md explaining system design
- CONTRIBUTING.md with development guidelines
- API_DOCS.md for future API endpoints

Make documentation clear, concise, and helpful for developers.`,
          dependencies: [],
          priority: "high"
        },
        {
          agent_id: "loveless",
          task_description: "Verify scaffold",
          prompt: `Verify the project scaffold:
- Check that project builds successfully
- Verify all dependencies install correctly
- Test that development server starts
- Check configuration files are valid
- Verify no security vulnerabilities in dependencies

Report any issues found and suggest fixes.`,
          dependencies: ["hollowed_eyes"],
          priority: "critical"
        }
      ],
      execution_strategy: "phased",
      phases: [
        { 
          phase_name: "Design", 
          agents: ["the_architect", "the_scribe"], 
          can_run_parallel: true 
        },
        { 
          phase_name: "Implementation", 
          agents: ["hollowed_eyes"], 
          can_run_parallel: false 
        },
        { 
          phase_name: "Verification", 
          agents: ["loveless"], 
          can_run_parallel: false 
        }
      ],
      success_criteria: "Project builds successfully, tests pass, documentation complete",
      estimated_tokens: 185000,
      reasoning: "Scaffold pattern requires architecture design first, then implementation, then verification"
    })
  },
  
  FIX_TESTS: {
    name: "Fix Failing Tests",
    description: "Investigate and fix failing tests",
    generatePlan: (context?: ProjectContext): OrchestrationPlan => ({
      agents: [
        {
          agent_id: "loveless",
          task_description: "Investigate test failures",
          prompt: `Run the test suite and investigate all failures:
- Execute tests and capture failure output
- Analyze error messages and stack traces
- Identify root causes for each failure
- Categorize failures (test issues vs code issues)
- Provide detailed failure report with recommendations

Focus on understanding WHY tests are failing, not just WHAT is failing.`,
          dependencies: [],
          priority: "critical"
        },
        {
          agent_id: "hollowed_eyes",
          task_description: "Fix test failures",
          prompt: `Fix the test failures identified by loveless:
- Address each root cause identified
- Implement proper fixes (not workarounds)
- Ensure fixes don't break other functionality
- Update tests if they were incorrectly written
- Follow best practices for the codebase

Do NOT simply skip or disable failing tests.`,
          dependencies: ["loveless"],
          priority: "critical"
        },
        {
          agent_id: "loveless",
          task_description: "Verify fixes",
          prompt: `Re-run all tests to verify fixes:
- Execute complete test suite
- Confirm all previously failing tests now pass
- Check for any regressions introduced by fixes
- Verify code coverage hasn't decreased
- Run tests multiple times to check for flakiness

Report final test status and any remaining concerns.`,
          dependencies: ["hollowed_eyes"],
          priority: "critical"
        }
      ],
      execution_strategy: "sequential",
      success_criteria: "All tests pass, no regressions introduced",
      estimated_tokens: 130000,
      reasoning: "Test fixes require investigation first, then implementation, then re-verification"
    })
  },
  
  SECURITY_FIX: {
    name: "Security Vulnerability Fix",
    description: "Identify and fix security vulnerabilities",
    generatePlan: (context?: ProjectContext): OrchestrationPlan => ({
      agents: [
        {
          agent_id: "loveless",
          task_description: "Security audit and vulnerability identification",
          prompt: `Perform comprehensive security audit:
- Run security scanning tools (npm audit, etc.)
- Check for common vulnerabilities (XSS, SQL injection, CSRF, etc.)
- Review authentication and authorization flows
- Check for exposed secrets or credentials
- Assess severity of each vulnerability
- Prioritize fixes by risk level

Provide detailed vulnerability report with severity ratings.`,
          dependencies: [],
          priority: "critical"
        },
        {
          agent_id: "the_didact",
          task_description: "Research security best practices",
          prompt: `Research security best practices for the identified vulnerabilities:
- Look up CVEs and security advisories
- Find proven mitigation strategies
- Research industry standards (OWASP, etc.)
- Identify secure libraries/packages
- Document recommended fixes with examples

Provide actionable guidance for implementing fixes.`,
          dependencies: ["loveless"],
          priority: "high"
        },
        {
          agent_id: "hollowed_eyes",
          task_description: "Implement security fixes",
          prompt: `Implement security fixes following best practices:
- Address each vulnerability systematically
- Follow the_didact's recommendations
- Use secure coding practices
- Update dependencies to patched versions
- Implement proper input validation and sanitization
- Add security headers where needed

NO shortcuts on security. Implement properly or not at all.`,
          dependencies: ["the_didact"],
          priority: "critical"
        },
        {
          agent_id: "loveless",
          task_description: "Verify security fixes",
          prompt: `Re-run security audit to verify fixes:
- Run all security scanning tools again
- Test that vulnerabilities are actually fixed
- Verify no new vulnerabilities introduced
- Test authentication/authorization flows
- Check for any remaining security concerns

Report final security status and any remaining risks.`,
          dependencies: ["hollowed_eyes"],
          priority: "critical"
        }
      ],
      execution_strategy: "sequential",
      success_criteria: "All critical vulnerabilities fixed, security audit passes",
      estimated_tokens: 175000,
      reasoning: "Security fixes require audit, research, implementation, and re-verification in sequence"
    })
  },
  
  DEPLOYMENT: {
    name: "Deployment and Release",
    description: "Prepare and execute a deployment/release",
    generatePlan: (context?: ProjectContext): OrchestrationPlan => ({
      agents: [
        {
          agent_id: "the_curator",
          task_description: "Pre-deployment cleanup",
          prompt: `Clean up repository before deployment:
- Remove dead code and unused imports
- Update outdated dependencies (check for security issues)
- Organize file structure
- Check for TODO comments that should be addressed
- Verify all files are properly formatted

Prepare the codebase for release.`,
          dependencies: [],
          priority: "high"
        },
        {
          agent_id: "loveless",
          task_description: "Pre-deployment verification",
          prompt: `Verify everything is ready for deployment:
- Run complete test suite
- Run security audit
- Verify build succeeds
- Check for any console errors or warnings
- Verify all environment variables are documented
- Run smoke tests

Report any blockers that must be fixed before deployment.`,
          dependencies: ["the_curator"],
          priority: "critical"
        },
        {
          agent_id: "zhadyz",
          task_description: "Prepare and execute release",
          prompt: `Prepare and execute the release:
- Update version number (semantic versioning)
- Generate changelog from commits
- Create git tag
- Push to repository
- Create GitHub release with notes
- Trigger deployment pipeline

Ensure release follows project conventions and is properly documented.`,
          dependencies: ["loveless"],
          priority: "critical"
        }
      ],
      execution_strategy: "sequential",
      success_criteria: "Release deployed successfully, all verification checks pass",
      estimated_tokens: 118000,
      reasoning: "Deployment requires cleanup, verification, then release in strict sequence"
    })
  },
  
  FEATURE_IMPLEMENTATION: {
    name: "Feature Implementation",
    description: "Implement a new feature from scratch",
    generatePlan: (context?: ProjectContext): OrchestrationPlan => ({
      agents: [
        {
          agent_id: "the_architect",
          task_description: "Design feature architecture",
          prompt: `Design the architecture for this feature:
- Component structure and hierarchy
- Data models and state management
- API endpoints (if needed)
- Integration points with existing code
- Performance considerations
- Architecture diagrams

Ensure design integrates cleanly with existing architecture.`,
          dependencies: [],
          priority: "high"
        },
        {
          agent_id: "the_didact",
          task_description: "Research implementation approaches",
          prompt: `Research best practices for implementing this feature:
- Look up similar implementations
- Research relevant libraries/frameworks
- Find code examples and patterns
- Document potential pitfalls
- Recommend implementation approach

Provide guidance to ensure quality implementation.`,
          dependencies: [],
          priority: "medium"
        },
        {
          agent_id: "hollowed_eyes",
          task_description: "Implement feature",
          prompt: `Implement the feature following the architecture design:
- Create all necessary components/modules
- Implement business logic
- Add proper error handling
- Write unit tests for new code
- Integrate with existing codebase
- Follow coding standards

Ensure implementation is clean, tested, and maintainable.`,
          dependencies: ["the_architect", "the_didact"],
          priority: "critical"
        },
        {
          agent_id: "the_scribe",
          task_description: "Document feature",
          prompt: `Document the new feature:
- Update README with feature description
- Create usage examples
- Document API endpoints (if applicable)
- Update relevant documentation
- Add inline code comments where needed

Make documentation clear and helpful for users and developers.`,
          dependencies: ["hollowed_eyes"],
          priority: "high"
        },
        {
          agent_id: "loveless",
          task_description: "Test and verify feature",
          prompt: `Thoroughly test the new feature:
- Run unit tests
- Perform integration testing
- Test edge cases and error scenarios
- Verify performance is acceptable
- Check security implications
- Test cross-browser (if web app)

Report any issues found and verify feature works as expected.`,
          dependencies: ["hollowed_eyes"],
          priority: "critical"
        }
      ],
      execution_strategy: "phased",
      phases: [
        { 
          phase_name: "Research & Design", 
          agents: ["the_architect", "the_didact"], 
          can_run_parallel: true 
        },
        { 
          phase_name: "Implementation", 
          agents: ["hollowed_eyes"], 
          can_run_parallel: false 
        },
        { 
          phase_name: "Documentation & Testing", 
          agents: ["the_scribe", "loveless"], 
          can_run_parallel: true 
        }
      ],
      success_criteria: "Feature implemented, tested, and documented successfully",
      estimated_tokens: 233000,
      reasoning: "Feature implementation requires design and research, then implementation, then parallel documentation and testing"
    })
  },
  
  BUG_FIX: {
    name: "Bug Fix",
    description: "Investigate and fix a bug",
    generatePlan: (context?: ProjectContext): OrchestrationPlan => ({
      agents: [
        {
          agent_id: "loveless",
          task_description: "Reproduce and investigate bug",
          prompt: `Investigate the bug thoroughly:
- Reproduce the bug consistently
- Identify exact conditions that trigger it
- Analyze error messages and logs
- Trace through code to find root cause
- Determine scope of impact
- Document findings

Provide clear explanation of what's wrong and why.`,
          dependencies: [],
          priority: "critical"
        },
        {
          agent_id: "hollowed_eyes",
          task_description: "Fix bug",
          prompt: `Fix the bug based on loveless's investigation:
- Implement fix that addresses root cause
- Ensure fix doesn't break other functionality
- Add test case to prevent regression
- Handle edge cases
- Follow coding standards

Implement a proper fix, not a workaround.`,
          dependencies: ["loveless"],
          priority: "critical"
        },
        {
          agent_id: "loveless",
          task_description: "Verify bug fix",
          prompt: `Verify the bug is fixed:
- Confirm bug no longer reproduces
- Run full test suite for regressions
- Test edge cases
- Verify the fix handles all scenarios
- Check for any side effects

Report final status and confirm bug is resolved.`,
          dependencies: ["hollowed_eyes"],
          priority: "critical"
        }
      ],
      execution_strategy: "sequential",
      success_criteria: "Bug fixed, verified, regression test added",
      estimated_tokens: 130000,
      reasoning: "Bug fixes require investigation, implementation, then verification in sequence"
    })
  }
};

export function matchPattern(objective: string): Pattern | null {
  const lower = objective.toLowerCase();
  
  // Pattern matching with keywords
  if (lower.includes("scaffold") || lower.includes("setup") || lower.includes("initialize")) {
    return COMMON_PATTERNS.SCAFFOLD;
  }
  
  if ((lower.includes("fix") || lower.includes("repair")) && lower.includes("test")) {
    return COMMON_PATTERNS.FIX_TESTS;
  }
  
  if (lower.includes("security") || lower.includes("vulnerability") || lower.includes("exploit")) {
    return COMMON_PATTERNS.SECURITY_FIX;
  }
  
  if (lower.includes("deploy") || lower.includes("release") || lower.includes("publish")) {
    return COMMON_PATTERNS.DEPLOYMENT;
  }
  
  if ((lower.includes("implement") || lower.includes("add") || lower.includes("create")) && 
      (lower.includes("feature") || lower.includes("functionality"))) {
    return COMMON_PATTERNS.FEATURE_IMPLEMENTATION;
  }
  
  if ((lower.includes("fix") || lower.includes("bug") || lower.includes("error")) && 
      !lower.includes("test")) {
    return COMMON_PATTERNS.BUG_FIX;
  }
  
  return null;
}
