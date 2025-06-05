module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import', 'node', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:node/recommended',
    'plugin:prettier/recommended'
  ],
  env: {
    node: true,
    es2020: true,
    jest: true
  },
  rules: {
    'prettier/prettier': 'error',
    'node/no-unsupported-features/es-syntax': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { 'argsIgnorePattern': '^_' }
    ],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'import/order': [
      'warn',
      { 'newlines-between': 'always' }
    ]
  },
  settings: {
    'import/resolver': {
      typescript: {}
    }
  }
};
