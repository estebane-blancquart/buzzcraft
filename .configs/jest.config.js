export default {
  testEnvironment: "node",
  testMatch: [
    "**/.tests/**/*.test.js",
    "**/__tests__/**/*.test.js"
  ],
  collectCoverageFrom: [
    "app-server/**/*.js",
    "app-client/**/*.js", 
    "api/**/*.js",
    "!**/node_modules/**",
    "!**/.tests/**",
    "!**/coverage/**"
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: [".tests/setup.js"],
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
