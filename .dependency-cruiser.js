/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // No circular dependencies
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: {
        circular: true
      }
    },

    // Components cannot import from pages
    {
      name: 'no-components-to-pages',
      severity: 'error',
      comment: 'Components should be reusable, not depend on specific pages',
      from: {
        path: '^src/components/'
      },
      to: {
        path: '^src/pages/'
      }
    },

    // Hooks cannot import components
    {
      name: 'no-hooks-to-components',
      severity: 'error',
      comment: 'Hooks should be pure logic, not import UI components',
      from: {
        path: '^src/hooks/'
      },
      to: {
        path: '^src/components/'
      }
    },

    // Utils cannot import anything except other utils and types
    {
      name: 'utils-isolation',
      severity: 'error',
      comment: 'Utils should be pure functions with no dependencies on app code',
      from: {
        path: '^src/utils/'
      },
      to: {
        path: '^src/(components|pages|hooks|contexts|services)/'
      }
    },

    // Services can only import utils and types
    {
      name: 'services-isolation',
      severity: 'error',
      comment: 'Services should not depend on React components or hooks',
      from: {
        path: '^src/services/'
      },
      to: {
        path: '^src/(components|pages|hooks|contexts)/'
      }
    },

    // No orphan files (files not imported by anything)
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'File is not imported by any other file - may be dead code',
      from: {
        orphan: true,
        pathNot: [
          '\\.test\\.(ts|tsx|js|jsx)$',
          '\\.spec\\.(ts|tsx|js|jsx)$',
          '^src/main\\.(ts|tsx|js|jsx)$',
          '^src/test/',
          'vite\\.config\\.',
          'vitest\\.config\\.',
          '\\.d\\.ts$'
        ]
      },
      to: {}
    },

    // No dev dependencies in production code
    {
      name: 'no-dev-deps-in-src',
      severity: 'error',
      comment: 'Production code should not import devDependencies',
      from: {
        path: '^src/',
        pathNot: [
          '\\.test\\.',
          '\\.spec\\.',
          '^src/test/'
        ]
      },
      to: {
        dependencyTypes: ['npm-dev']
      }
    },

    // Blocks cannot import other blocks directly
    {
      name: 'no-block-cross-imports',
      severity: 'warn',
      comment: 'Block components should not import each other directly',
      from: {
        path: '^src/components/blocks/[^/]+$'
      },
      to: {
        path: '^src/components/blocks/[^/]+$',
        pathNot: [
          // Allow shared utilities within blocks folder
          '^src/components/blocks/(index|shared|utils)'
        ]
      }
    }
  ],

  options: {
    doNotFollow: {
      path: 'node_modules'
    },

    tsPreCompilationDeps: true,

    tsConfig: {
      fileName: './tsconfig.json'
    },

    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default']
    },

    reporterOptions: {
      dot: {
        theme: {
          graph: { splines: 'ortho' }
        }
      }
    }
  }
}
