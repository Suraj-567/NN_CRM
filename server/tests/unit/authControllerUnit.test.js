import { registerUser, loginUser, loginBusinessManager } from "../../controllers/authController.js";
import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

jest.mock("../../models/User.js");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("Auth Controller - Unit", () => {
  beforeEach(() => jest.clearAllMocks());

  // Existing test 1
  test("registerUser returns 400 if email already exists", async () => {
    const req = { body: { email: "test@test.com" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    User.findOne.mockResolvedValue({ email: "test@test.com" });

    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Email already in use" });
  });

  // Existing test 2
  test("loginUser returns token for valid user", async () => {
    const req = { body: { email: "user@test.com", password: "pass" } };
    const res = { json: jest.fn() };
    // Mocks User with the necessary fields for JWT signing
    const mockUser = { _id: "1", email: "user@test.com", password: "hash", role: "Admin", companyId: "c1" }; 

    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("token123");

    await loginUser(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: "token123" }));
  });

  // NEW TEST: User not found (404)
  test("loginUser returns 404 if user not found", async () => {
    const req = { body: { email: "nonexistent@test.com", password: "pass" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    
    User.findOne.mockResolvedValue(null);

    await loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });
  
  // NEW TEST: Invalid password (401)
  test("loginUser returns 401 for invalid password", async () => {
    const req = { body: { email: "user@test.com", password: "wrongpass" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const mockUser = { email: "user@test.com", password: "hash" }; 

    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false); // Password comparison fails

    await loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid password" });
  });

  test("registerUser returns 201 when new user created", async () => {
  const req = { body: { name: "N", email: "a@b.com", password: "123", role: "Admin", companyId: "c1" } };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  User.findOne.mockResolvedValue(null);
  User.create.mockResolvedValue({ name: "N" });
  await registerUser(req, res);
  expect(res.status).toHaveBeenCalledWith(201);
});

test("loginUser returns 404 when user not found", async () => {
  const req = { body: { email: "x@x.com", password: "123" } };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  User.findOne.mockResolvedValue(null);
  await loginUser(req, res);
  expect(res.status).toHaveBeenCalledWith(404);
});

test("loginUser returns 401 for wrong password", async () => {
  const req = { body: { email: "a@b.com", password: "wrong" } };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const user = { password: "hash" };
  User.findOne.mockResolvedValue(user);
  bcrypt.compare.mockResolvedValue(false);
  await loginUser(req, res);
  expect(res.status).toHaveBeenCalledWith(401);
});
// Add these to server/tests/unit/authControllerUnit.test.js

const MOCK_BM_USER = {
    _id: "bm_id",
    name: "BM User",
    email: "bm@test.com",
    password: "hashed_bm_pass",
    role: "BusinessManager",
    companyId: "c1",
    status: "active", // Default active status
};

describe("Auth Controller - loginBusinessManager", () => {
    
    // 1. Success Path (200)
    test("loginBusinessManager returns token for active Business Manager", async () => {
        // Arrange
        const req = { body: { email: "bm@test.com", password: "pass" } };
        const res = { json: jest.fn() };
        
        User.findOne.mockResolvedValue(MOCK_BM_USER);
        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue("bm_token123");
        
        // Act
        await loginBusinessManager(req, res);
        
        // Assert
        expect(User.findOne).toHaveBeenCalledWith({ email: "bm@test.com", role: "BusinessManager" });
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: "bm_token123" }));
    });
    
    // 2. User Not Found (404)
    test("loginBusinessManager returns 404 if Business Manager not found", async () => {
        // Arrange
        const req = { body: { email: "nonexistent@test.com", password: "pass" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        
        User.findOne.mockResolvedValue(null);
        
        // Act
        await loginBusinessManager(req, res);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "Business Manager not found" });
    });
    
    // 4. Inactive Status (403) - Covers line 31
    test("loginBusinessManager returns 403 if Business Manager account is inactive", async () => {
        // Arrange
        const req = { body: { email: "inactive@test.com", password: "pass" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        
        const inactiveUser = { ...MOCK_BM_USER, status: "pending" }; // Inactive status
        User.findOne.mockResolvedValue(inactiveUser);
        
        // Act
        await loginBusinessManager(req, res);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: "Account not active or not approved yet" });
        expect(bcrypt.compare).not.toHaveBeenCalled(); // Should short-circuit before password check
    });
    
    // 5. Invalid Password (401)
    test("loginBusinessManager returns 401 for invalid credentials", async () => {
        // Arrange
        const req = { body: { email: "bm@test.com", password: "wrong" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        
        User.findOne.mockResolvedValue(MOCK_BM_USER);
        bcrypt.compare.mockResolvedValue(false);
        
        // Act
        await loginBusinessManager(req, res);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
    });

    // 6. Error Path (500) - Covers lines 54-56
    test("loginBusinessManager handles server error during database lookup", async () => {
        // Arrange
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const req = { body: { email: "error@test.com", password: "pass" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        
        User.findOne.mockRejectedValue(new Error("DB Connection Failed"));
        
        // Act
        await loginBusinessManager(req, res);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
        errorSpy.mockRestore();
    });
});
// Add these to the existing 'Auth Controller - Unit' describe block

// Register User Error (Covers line 17)
test("registerUser handles server error during creation", async () => {
    // Arrange
    const req = { body: { email: "error@test.com", password: "pass" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    
    User.findOne.mockResolvedValue(null);
    User.create.mockRejectedValue(new Error("Validation Failed"));
    
    // Act
    await registerUser(req, res);
    
    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Validation Failed" }));
});

// Login User Error (Covers lines 83-84)
test("loginUser handles server error during database lookup", async () => {
    // Arrange
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const req = { body: { email: "error@test.com", password: "pass" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    
    User.findOne.mockRejectedValue(new Error("DB Timeout"));
    
    // Act
    await loginUser(req, res);
    
    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "DB Timeout" }));
    errorSpy.mockRestore();
});
});

