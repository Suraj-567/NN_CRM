export default {
  testEnvironment: "jsdom",
  transform: {},
  roots: ["<rootDir>/tests"],
  moduleFileExtensions: ["js", "jsx"],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/main.jsx"
  ],
  coverageReporters: ["text", "html"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom"]
}
