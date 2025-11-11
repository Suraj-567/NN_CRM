import { verifyToken, verifyRole } from "../../middleware/authMiddleware.js";
import jwt from "jsonwebtoken";

// Mock the jsonwebtoken library
jest.mock("jsonwebtoken");

// Define a test role
const ADMIN_ROLE = "admin";
const USER_ROLE = "user";

describe("Auth Middleware", () => {
  // --- Tests for verifyToken ---
  describe("verifyToken", () => {
    test("returns 401 if no token is provided", () => {
      const req = { headers: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "No token provided" });
      expect(next).not.toHaveBeenCalled();
    });

    test("sets req.user and calls next() on valid token", () => {
      const decoded = { id: "1", role: ADMIN_ROLE, companyId: "comp1" };
      // Mock successful JWT verification
      jwt.verify.mockImplementation((token, secret, cb) => cb(null, decoded));
      const req = { headers: { authorization: "Bearer validtoken" } };
      const res = {}; // No need for status/json in success case
      const next = jest.fn();

      verifyToken(req, res, next);

      expect(req.user).toEqual(decoded);
      expect(next).toHaveBeenCalled();
    });

    test("returns 403 if token is invalid or expired", () => {
      // Mock failed JWT verification
      jwt.verify.mockImplementation((token, secret, cb) =>
        cb(new Error("Invalid signature"), null)
      );
      const req = { headers: { authorization: "Bearer invalidtoken" } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
      expect(next).not.toHaveBeenCalled();
    });
  });


  // --- Tests for verifyRole ---
  describe("verifyRole", () => {
    test("calls next() when req.user role matches the required role", () => {
      const middleware = verifyRole(ADMIN_ROLE);
      const req = { user: { id: "1", role: ADMIN_ROLE } }; // Matching role
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("returns 403 when req.user is not set", () => {
      const middleware = verifyRole(ADMIN_ROLE);
      const req = {}; // Missing req.user
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
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
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
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