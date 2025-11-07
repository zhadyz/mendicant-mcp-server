/**
 * Tests for cinna agent selection in semantic_selector
 */

import { analyzeObjectiveSemantic } from '../knowledge/semantic_selector.js';

describe('cinna agent selection', () => {
  describe('dashboard creation', () => {
    test('selects cinna for dashboard creation', () => {
      const result = analyzeObjectiveSemantic('Create a fun interactive demo dashboard');
      expect(result.recommended_agents).toContain('cinna');
      expect(result.domain).toBe('ui_ux');
    });

    test('selects cinna for dashboard with visual keyword', () => {
      const result = analyzeObjectiveSemantic('Build a visual dashboard for analytics');
      expect(result.recommended_agents).toContain('cinna');
    });
  });

  describe('visualization tasks', () => {
    test('selects cinna for visualization component', () => {
      const result = analyzeObjectiveSemantic('Build a data visualization component');
      expect(result.recommended_agents).toContain('cinna');
    });

    test('selects cinna for chart creation', () => {
      const result = analyzeObjectiveSemantic('Create visual charts for the dashboard');
      expect(result.recommended_agents).toContain('cinna');
    });
  });

  describe('design system work', () => {
    test('selects cinna for design system', () => {
      const result = analyzeObjectiveSemantic('Design a component library');
      expect(result.recommended_agents).toContain('cinna');
      expect(result.domain).toBe('ui_ux');
    });

    test('selects cinna for UI design', () => {
      const result = analyzeObjectiveSemantic('Design a modern UI interface');
      expect(result.recommended_agents).toContain('cinna');
      expect(result.domain).toBe('ui_ux');
    });

    test('selects cinna for style guide', () => {
      const result = analyzeObjectiveSemantic('Create a style guide for the application');
      expect(result.recommended_agents).toContain('cinna');
    });
  });

  describe('creative visual content', () => {
    test('selects cinna for artwork', () => {
      const result = analyzeObjectiveSemantic('Create artwork for the landing page');
      expect(result.recommended_agents).toContain('cinna');
      expect(result.task_type).toBe('creative');
    });

    test('selects cinna for visual design', () => {
      const result = analyzeObjectiveSemantic('Design visual assets for marketing');
      expect(result.recommended_agents).toContain('cinna');
    });
  });

  describe('UI/UX implementation', () => {
    test('selects cinna for responsive layout', () => {
      const result = analyzeObjectiveSemantic('Build a responsive layout for mobile');
      expect(result.recommended_agents).toContain('cinna');
      expect(result.domain).toBe('ui_ux');
    });

    test('selects cinna for component styling', () => {
      const result = analyzeObjectiveSemantic('Style the navigation component');
      expect(result.recommended_agents).toContain('cinna');
      expect(result.domain).toBe('ui_ux');
    });

    test('selects cinna for interface design', () => {
      const result = analyzeObjectiveSemantic('Create an interface for user settings');
      expect(result.recommended_agents).toContain('cinna');
    });
  });

  describe('combined with other agents', () => {
    test('selects both cinna and hollowed_eyes for UI implementation', () => {
      const result = analyzeObjectiveSemantic('Build a visual dashboard interface');
      expect(result.recommended_agents).toContain('cinna');
      expect(result.recommended_agents).toContain('hollowed_eyes');
    });

    test('selects cinna with the_architect for complex design', () => {
      const result = analyzeObjectiveSemantic('Create a comprehensive design system');
      expect(result.recommended_agents).toContain('cinna');
      expect(result.recommended_agents).toContain('the_architect');
    });

    test('selects cinna with the_scribe for creative work', () => {
      const result = analyzeObjectiveSemantic('Create artwork and poetry for the site');
      expect(result.recommended_agents).toContain('cinna');
      expect(result.recommended_agents).toContain('the_scribe');
      expect(result.task_type).toBe('creative');
    });
  });

  describe('domain detection improvements', () => {
    test('detects ui_ux domain with OR logic', () => {
      const result1 = analyzeObjectiveSemantic('Create a frontend interface');
      expect(result1.domain).toBe('ui_ux');

      const result2 = analyzeObjectiveSemantic('Build a visual component');
      expect(result2.domain).toBe('ui_ux');

      const result3 = analyzeObjectiveSemantic('Design a dashboard');
      expect(result3.domain).toBe('ui_ux');
    });

    test('ui_ux domain triggers cinna selection', () => {
      const objectives = [
        'Create a React component library',
        'Build a Vue.js interface',
        'Design a Svelte dashboard',
        'Create a visualization tool'
      ];

      objectives.forEach(objective => {
        const result = analyzeObjectiveSemantic(objective);
        expect(result.domain).toBe('ui_ux');
        expect(result.recommended_agents).toContain('cinna');
      });
    });
  });

  describe('orchestration keyword disambiguation', () => {
    test('selects cinna for dashboard visualizing orchestration patterns', () => {
      const result = analyzeObjectiveSemantic(
        'Create a fun interactive demo web dashboard that visualizes MENDICANT orchestration patterns'
      );
      expect(result.domain).toBe('ui_ux');
      expect(result.recommended_agents).toContain('cinna');
      expect(result.recommended_agents).not.toContain('the_sentinel');
    });

    test('selects the_sentinel for container orchestration', () => {
      const result = analyzeObjectiveSemantic('Deploy containers with Kubernetes orchestration');
      expect(result.domain).toBe('infrastructure');
      expect(result.recommended_agents).toContain('the_sentinel');
    });

    test('selects the_sentinel for cloud orchestration', () => {
      const result = analyzeObjectiveSemantic('Setup container orchestration cluster');
      expect(result.domain).toBe('infrastructure');
    });

    test('selects ui_ux for workflow orchestration visualization', () => {
      const result = analyzeObjectiveSemantic('Create orchestration workflow dashboard');
      expect(result.domain).toBe('ui_ux');
    });
  });

  describe('does not select cinna inappropriately', () => {
    test('does not select cinna for pure backend work', () => {
      const result = analyzeObjectiveSemantic('Create a REST API endpoint');
      expect(result.recommended_agents).not.toContain('cinna');
    });

    test('does not select cinna for database work', () => {
      const result = analyzeObjectiveSemantic('Design a database schema');
      expect(result.recommended_agents).not.toContain('cinna');
    });

    test('does not select cinna for deployment tasks', () => {
      const result = analyzeObjectiveSemantic('Deploy the application to production');
      expect(result.recommended_agents).not.toContain('cinna');
    });
  });
});

describe('semantic_selector regression tests', () => {
  test('still selects hollowed_eyes for code implementation', () => {
    const result = analyzeObjectiveSemantic('Implement user authentication');
    expect(result.recommended_agents).toContain('hollowed_eyes');
  });

  test('still selects the_scribe for documentation', () => {
    const result = analyzeObjectiveSemantic('Write API documentation');
    expect(result.recommended_agents).toContain('the_scribe');
  });

  test('still selects the_didact for research', () => {
    const result = analyzeObjectiveSemantic('Research best practices for caching');
    expect(result.recommended_agents).toContain('the_didact');
  });

  test('still selects the_sentinel for deployment', () => {
    const result = analyzeObjectiveSemantic('Deploy to Vercel');
    expect(result.recommended_agents).toContain('the_sentinel');
  });
});

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
