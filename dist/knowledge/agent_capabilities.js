// Hardcoded default agents - used as baseline for registry
// This file has NO imports from agent_registry to avoid circular dependency
export const AGENT_CAPABILITIES = {
    hollowed_eyes: {
        name: "hollowed_eyes",
        specialization: "development_and_implementation",
        capabilities: [
            "semantic_code_search",
            "github_operations",
            "code_implementation",
            "refactoring",
            "bug_fixes"
        ],
        tools: ["mcp__github__*", "mcp__serena__*"],
        typical_use_cases: [
            "implement_feature",
            "scaffold_project",
            "refactor_code",
            "fix_bugs",
            "code_generation"
        ],
        avg_token_usage: 50000,
        success_rate: 0.85
    },
    loveless: {
        name: "loveless",
        specialization: "qa_testing_security",
        capabilities: [
            "cross_browser_testing",
            "security_validation",
            "test_execution",
            "debugging",
            "vulnerability_scanning"
        ],
        tools: ["mcp__playwright__*", "mcp__chrome-devtools__*"],
        typical_use_cases: [
            "verify_implementation",
            "security_audit",
            "test_execution",
            "debugging",
            "quality_assurance"
        ],
        avg_token_usage: 40000,
        success_rate: 0.92,
        mandatory_for: ["all_implementations"]
    },
    the_architect: {
        name: "the_architect",
        specialization: "system_architecture",
        capabilities: [
            "architecture_design",
            "technical_decisions",
            "scalability_planning",
            "design_patterns",
            "adr_creation"
        ],
        tools: ["mcp__mermaid__*"],
        typical_use_cases: [
            "design_system",
            "architecture_review",
            "technical_decisions",
            "create_adrs",
            "scalability_planning"
        ],
        avg_token_usage: 60000,
        success_rate: 0.88
    },
    the_didact: {
        name: "the_didact",
        specialization: "research_intelligence",
        capabilities: [
            "web_scraping",
            "documentation_research",
            "competitive_analysis",
            "investigation",
            "best_practices_research"
        ],
        tools: ["mcp__hf-mcp-server__*", "mcp__context7__*", "WebFetch", "WebSearch"],
        typical_use_cases: [
            "research_libraries",
            "investigate_approaches",
            "documentation_lookup",
            "competitive_analysis",
            "technology_research"
        ],
        avg_token_usage: 45000,
        success_rate: 0.90
    },
    the_scribe: {
        name: "the_scribe",
        specialization: "documentation",
        capabilities: [
            "technical_writing",
            "api_documentation",
            "readme_creation",
            "user_guides",
            "tutorial_creation"
        ],
        tools: ["mcp__pdf-tools__*", "mcp__mermaid__*"],
        typical_use_cases: [
            "create_documentation",
            "update_readme",
            "api_docs",
            "user_guides",
            "onboarding_docs"
        ],
        avg_token_usage: 35000,
        success_rate: 0.93
    },
    zhadyz: {
        name: "zhadyz",
        specialization: "devops_deployment",
        capabilities: [
            "github_workflows",
            "container_orchestration",
            "project_cleanup",
            "release_preparation",
            "deployment_automation"
        ],
        tools: ["mcp__github__*", "mcp__docker__*"],
        typical_use_cases: [
            "setup_cicd",
            "prepare_release",
            "cleanup_repo",
            "deployment",
            "github_actions"
        ],
        avg_token_usage: 40000,
        success_rate: 0.87
    },
    the_curator: {
        name: "the_curator",
        specialization: "code_maintenance",
        capabilities: [
            "dependency_updates",
            "dead_code_removal",
            "code_organization",
            "technical_debt",
            "refactoring"
        ],
        tools: ["mcp__github__*", "mcp__filesystem__*", "mcp__socket__*"],
        typical_use_cases: [
            "update_dependencies",
            "remove_dead_code",
            "organize_files",
            "reduce_technical_debt",
            "code_cleanup"
        ],
        avg_token_usage: 38000,
        success_rate: 0.89
    },
    the_sentinel: {
        name: "the_sentinel",
        specialization: "cicd_automation",
        capabilities: [
            "github_actions",
            "testing_automation",
            "deployment_workflows",
            "build_processes",
            "quality_gates"
        ],
        tools: ["mcp__github__*", "mcp__docker__*"],
        typical_use_cases: [
            "create_cicd_pipeline",
            "setup_tests",
            "automate_deployment",
            "quality_gates",
            "ci_optimization"
        ],
        avg_token_usage: 42000,
        success_rate: 0.86
    },
    the_oracle: {
        name: "the_oracle",
        specialization: "strategic_validation",
        capabilities: [
            "strategic_review",
            "decision_validation",
            "risk_assessment",
            "outcome_prediction",
            "pattern_recognition"
        ],
        tools: ["mcp__mnemosyne__*"],
        typical_use_cases: [
            "validate_major_decision",
            "post_completion_review",
            "strategic_planning",
            "risk_assessment",
            "pattern_analysis"
        ],
        avg_token_usage: 55000,
        success_rate: 0.94,
        mandatory_for: ["major_decisions", "post_completion"]
    },
    the_librarian: {
        name: "the_librarian",
        specialization: "requirements_clarification",
        capabilities: [
            "requirements_gathering",
            "prompt_engineering",
            "clarification",
            "specification_expansion",
            "user_intent_analysis"
        ],
        tools: ["mcp__mnemosyne__*"],
        typical_use_cases: [
            "clarify_vague_requests",
            "expand_requirements",
            "bridge_intent_and_execution",
            "specification_refinement",
            "requirement_analysis"
        ],
        avg_token_usage: 30000,
        success_rate: 0.91,
        mandatory_for: ["vague_requests"]
    },
    the_analyst: {
        name: "the_analyst",
        specialization: "data_analysis",
        capabilities: [
            "data_analysis",
            "metrics_visualization",
            "business_intelligence",
            "performance_analytics",
            "insight_extraction"
        ],
        tools: ["mcp__google-workspace__*", "mcp__stripe__*"],
        typical_use_cases: [
            "analyze_data",
            "create_visualizations",
            "extract_insights",
            "performance_metrics",
            "business_analytics"
        ],
        avg_token_usage: 48000,
        success_rate: 0.87
    },
    cinna: {
        name: "cinna",
        specialization: "design_systems_ui_ux",
        capabilities: [
            "visual_design",
            "ui_ux_design",
            "design_systems",
            "style_implementation",
            "aesthetic_refinement"
        ],
        tools: ["mcp__canva__*", "mcp__mermaid__*"],
        typical_use_cases: [
            "create_design_system",
            "visual_design",
            "ui_implementation",
            "style_guide",
            "aesthetic_design"
        ],
        avg_token_usage: 45000,
        success_rate: 0.89
    },
    the_cartographer: {
        name: "the_cartographer",
        specialization: "infrastructure_deployment",
        capabilities: [
            "vercel_deployment",
            "docker_orchestration",
            "domain_management",
            "ssl_configuration",
            "environment_config"
        ],
        tools: ["mcp__vercel__*", "mcp__docker__*"],
        typical_use_cases: [
            "deploy_to_vercel",
            "setup_infrastructure",
            "configure_domains",
            "environment_setup",
            "deployment_automation"
        ],
        avg_token_usage: 44000,
        success_rate: 0.88
    }
};
//# sourceMappingURL=agent_capabilities.js.map