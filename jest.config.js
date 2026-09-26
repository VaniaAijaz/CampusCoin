module.exports = {
  testEnvironment: "node",
  testMatch: [
    "**/tests/**/*.test.[jt]s?(x)",
    "**/tests/**/*.spec.[jt]s?(x)"
  ],
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.js"],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 30000,
};
