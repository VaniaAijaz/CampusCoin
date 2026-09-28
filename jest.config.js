module.exports = {
  testEnvironment: "node",
  testMatch: [
    "**/tests/**/*.test.[jt]s?(x)",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/tests/e2e/",
    "/tests/cypress/"
  ],
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.js"],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 30000,
};
