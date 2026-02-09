// jest.config.cjs
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/unit/**/*.test.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
        },
    },
    // Ignore e2e tests for unit test runs
    testPathIgnorePatterns: ['/node_modules/', '/tests/e2e/'],
};
