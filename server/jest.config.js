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
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: '../coverage',
};
