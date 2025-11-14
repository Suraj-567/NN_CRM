// server/tests/unit/middlewareAuth.test.js
import { verifyToken, verifyRole } from "../../middleware/authMiddleware.js";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import Employee from "../../models/Employee.js";

// --- Mocks Setup ---
// 1. Mock the jsonwebtoken library
jest.mock("jsonwebtoken");
// 2. Mock the Mongoose Models
jest.mock("../../models/User.js");
jest.mock("../../models/Employee.js");

// Define test constants
const ADMIN_ROLE = "admin";
const USER_ROLE = "user";
const EMPLOYEE_ROLE = "Employee";
const MOCK_JWT_SECRET = "test_secret";
process.env.JWT_SECRET = MOCK_JWT_SECRET; // Set mock environment variable

// Mock the select function on Mongoose query chain
// This must return 'this' (the query object) and then have a resolvable promise
const mockSelect = (returnValue) => ({
  select: jest.fn().mockResolvedValue(returnValue),
});

// Helper function to mock a successful JWT verification
const mockJwtVerifySuccess = (decodedPayload) => {
  // The actual implementation of jwt.verify in authMiddleware is synchronous (doesn't use callback),
  // so we mock it to return the decoded payload directly.
  jwt.verify.mockReturnValue(decodedPayload);
};

// Helper function to mock a failed JWT verification
const mockJwtVerifyFailure = (error) => {
  jwt.verify.mockImplementation(() => {
    throw error;
  });
};

// --- Test Suite ---
describe("Auth Middleware", () => {
  // Clear mock history before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set default mock behavior for Mongoose to return null (not found) for both models.
    // This makes the mocks explicit in each test case where a successful find is expected.
    Employee.findById.mockImplementation(() => mockSelect(null));
    User.findById.mockImplementation(() => mockSelect(null));
  });

  // --- Tests for verifyToken ---
  describe("verifyToken", () => {
    const mockRequest = (token) => ({
      headers: { authorization: `Bearer ${token}` },
    });
    const mockResponse = () => ({
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    });

    test("returns 401 if no token is provided", async () => {
      const req = { headers: {} };
      const res = mockResponse();
      const next = jest.fn();

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "No token provided" });
      expect(next).not.toHaveBeenCalled();
    });

    test("returns 403 if token is invalid or expired (jwt.verify fails)", async () => {
      const jwtError = new Error("Invalid signature");
      mockJwtVerifyFailure(jwtError);
      // Silence the console.error for this expected failure
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const req = mockRequest("invalidtoken");
      const res = mockResponse();
      const next = jest.fn();

      await verifyToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith("invalidtoken", MOCK_JWT_SECRET);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
      expect(next).not.toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore(); // Restore console.error
    });

    // --- Success Cases (Database Lookups) ---

    test("sets req.user (Employee) and calls next() on valid token", async () => {
      const decodedPayload = { id: "emp123" };
      mockJwtVerifySuccess(decodedPayload);
      const employeeAccount = {
        _id: "emp123",
        name: "Test Employee",
        email: "e@comp.com",
        companyId: "compA",
        role: "not_used_role", // Role is overridden to "Employee"
      };

      // Mock Employee lookup success
      Employee.findById.mockImplementation(() => mockSelect(employeeAccount));

      const req = mockRequest("validemployeetoken");
      const res = mockResponse();
      const next = jest.fn();

      await verifyToken(req, res, next);

      expect(Employee.findById).toHaveBeenCalledWith("emp123");
      expect(User.findById).not.toHaveBeenCalled(); // Should stop after finding Employee
      expect(req.user).toEqual({
        id: employeeAccount._id,
        name: employeeAccount.name,
        email: employeeAccount.email,
        companyId: employeeAccount.companyId,
        role: EMPLOYEE_ROLE, // Correct role attachment
      });
      expect(next).toHaveBeenCalled();
    });

    test("sets req.user (Admin/User) and calls next() on valid token when not an Employee", async () => {
      const decodedPayload = { id: "user456" };
      mockJwtVerifySuccess(decodedPayload);
      const userAccount = {
        _id: "user456",
        name: "Test Admin",
        email: "a@comp.com",
        companyId: "compA",
        role: ADMIN_ROLE,
      };

      // 1. Employee lookup will return null by default (set in beforeEach)
      // 2. Mock User lookup success
      User.findById.mockImplementation(() => mockSelect(userAccount));

      const req = mockRequest("validusertoken");
      const res = mockResponse();
      const next = jest.fn();

      await verifyToken(req, res, next);

      expect(Employee.findById).toHaveBeenCalledWith("user456"); // Check for Employee first
      expect(User.findById).toHaveBeenCalledWith("user456"); // Then check for User
      expect(req.user).toEqual({
        id: userAccount._id,
        name: userAccount.name,
        email: userAccount.email,
        companyId: userAccount.companyId,
        role: ADMIN_ROLE, // Correct role from the User model
      });
      expect(next).toHaveBeenCalled();
    });
    
    test("sets req.user with default 'user' role if User model doesn't have a role property", async () => {
      const decodedPayload = { id: "user789" };
      mockJwtVerifySuccess(decodedPayload);
      const userAccount = {
        _id: "user789",
        name: "No Role User",
        email: "u@comp.com",
        companyId: "compB",
        // No 'role' property
      };

      // 1. Employee lookup will return null by default
      // 2. Mock User lookup success with an object missing 'role'
      User.findById.mockImplementation(() => mockSelect(userAccount));

      const req = mockRequest("validusertoken_no_role");
      const res = mockResponse();
      const next = jest.fn();

      await verifyToken(req, res, next);

      expect(req.user.role).toBe(USER_ROLE); // Should default to "user"
      expect(next).toHaveBeenCalled();
    });

    test("returns 401 if token is valid but no account (Employee or User) is found", async () => {
      const decodedPayload = { id: "nonexistent" };
      mockJwtVerifySuccess(decodedPayload);

      // Both Employee and User will return null by default (set in beforeEach)
      
      const req = mockRequest("validtoken_no_account");
      const res = mockResponse();
      const next = jest.fn();

      await verifyToken(req, res, next);

      expect(Employee.findById).toHaveBeenCalledWith("nonexistent");
      expect(User.findById).toHaveBeenCalledWith("nonexistent");
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid or removed user" });
      expect(next).not.toHaveBeenCalled();
    });
  });


  // --- Tests for verifyRole ---
  describe("verifyRole", () => {
    const mockResponse = () => ({
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    });

    test("calls next() when req.user role matches the required role", () => {
      const middleware = verifyRole(ADMIN_ROLE);
      const req = { user: { id: "1", role: ADMIN_ROLE } }; // Matching role
      const res = mockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("returns 403 when req.user is not set", () => {
      const middleware = verifyRole(ADMIN_ROLE);
      const req = {}; // Missing req.user
      const res = mockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Forbidden: insufficient role",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("returns 403 when req.user role does not match the required role", () => {
      const middleware = verifyRole(ADMIN_ROLE);
      const req = { user: { id: "2", role: USER_ROLE } }; // Non-matching role
      const res = mockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Forbidden: insufficient role",
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    test("returns 403 when req.user role is 'Employee' but 'admin' is required", () => {
      const middleware = verifyRole(ADMIN_ROLE);
      const req = { user: { id: "3", role: EMPLOYEE_ROLE } }; // Non-matching role
      const res = mockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Forbidden: insufficient role",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});