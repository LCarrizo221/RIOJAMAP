/**
 * Jest configuration for server-side TypeScript tests.
 */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
  testMatch: ['**/?(*.)+(test).ts'],
  moduleNameMapper: {
    // ESM-style relative imports ('./x.js') → extensionless, so Jest resolves .ts
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: '../coverage',
};
