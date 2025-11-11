export default {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  roots: ["<rootDir>/tests"],
  moduleFileExtensions: ["js", "jsx"],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/components/AdminLayout.jsx",
    "src/components/DashboardLayout.jsx",
    "src/pages/AdminDashboard.jsx",
    "src/pages/ApprovedCompanies.jsx",
    "src/pages/CRMApproval.jsx",
    "src/pages/CustomerTickets.jsx",
  ],
  coverageReporters: ["text", "html"],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  setupFilesAfterEnv: [
    "@testing-library/jest-dom",
    "<rootDir>/tests/setupTests.js",
  ],
};
