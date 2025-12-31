import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import boundaries from 'eslint-plugin-boundaries'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      boundaries,
    },
    settings: {
      // Define architectural layers
      'boundaries/elements': [
        { type: 'utils', mode: 'full', pattern: 'src/utils/**/*' },
        { type: 'services', mode: 'full', pattern: 'src/services/**/*' },
        { type: 'hooks', mode: 'full', pattern: 'src/hooks/**/*' },
        { type: 'contexts', mode: 'full', pattern: 'src/contexts/**/*' },
        { type: 'components', mode: 'full', pattern: 'src/components/**/*' },
        { type: 'pages', mode: 'full', pattern: 'src/pages/**/*' },
        { type: 'api', mode: 'full', pattern: 'src/api/**/*' },
      ],
      // Only analyze src files
      'boundaries/include': ['src/**/*'],
      // Analyze import statements
      'boundaries/dependency-nodes': ['import', 'dynamic-import'],
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // Boundary enforcement rules
      'boundaries/element-types': [
        'error',
        {
          // Whitelist approach: disallow all, then allow specific
          default: 'disallow',
          rules: [
            // Utils: can only import other utils (NO components, pages, hooks, contexts, services)
            {
              from: ['utils'],
              allow: ['utils'],
              message: 'Utils must be pure - cannot import from ${target.type}',
            },
            // Services: can only import utils (NO components, pages, hooks, contexts)
            {
              from: ['services'],
              allow: ['utils', 'services'],
              message: 'Services cannot import from ${target.type}',
            },
            // Hooks: can import utils, services, contexts (NO components, pages)
            {
              from: ['hooks'],
              allow: ['utils', 'services', 'hooks', 'contexts'],
              message: 'Hooks cannot import components - use composition instead',
            },
            // Contexts: can import utils, services, hooks (NO components, pages)
            {
              from: ['contexts'],
              allow: ['utils', 'services', 'hooks', 'contexts'],
              message: 'Contexts cannot import from ${target.type}',
            },
            // Components: can import utils, services, hooks, contexts, other components (NO pages)
            {
              from: ['components'],
              allow: ['utils', 'services', 'hooks', 'contexts', 'components'],
              message: 'Components cannot import from pages - pages compose components, not vice versa',
            },
            // Pages: can import anything (top of hierarchy)
            {
              from: ['pages'],
              allow: ['utils', 'services', 'hooks', 'contexts', 'components', 'pages', 'api'],
            },
            // API: can import utils only
            {
              from: ['api'],
              allow: ['utils', 'api'],
              message: 'API layer should only import utils',
            },
          ],
        },
      ],
    },
  },
]
