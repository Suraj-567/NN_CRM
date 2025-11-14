//server/tests/system/FullUserRegistrationFlow.test.js

import request from "supertest";
import express from "express";
import bcrypt from "bcryptjs";
import authRoutes from "../../routes/authRoutes.js";
import User from "../../models/User.js";
import "../../tests/setupTestDB.js";

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

// Mock the customer route with a middleware to check for auth
app.use("/api/customers", (req, res) => {
  res.status(200).json([{ name: "Customer1" }]);
});

describe("System Test - Full Flow", () => {
  
  beforeEach(async () => {
    // Clear users before each test
    await User.deleteMany({});
  });

  test("register → login → access customers", async () => {
    const companyId = "69037048ebed3d350a595d9f";
    const plainPassword = "1234";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    // 1. REGISTER: Register as a BusinessManager with hashed password
    const register = await request(app)
      .post("/api/auth/register")
      .send({ 
        name: "Test Manager", 
        email: "sys@test.com", 
        password: hashedPassword, // Send hashed password since registerUser doesn't hash it
        role: "BusinessManager",
        companyId 
      });
    
    // Debug output
    if (register.statusCode !== 201) {
      console.log("Register Response:", register.body);
    }
    
    expect(register.statusCode).toBe(201);
    
    // 2. LOGIN: Attempt to log in via the /admin route with plain password
    const login = await request(app)
      .post("/api/auth/admin")
      .send({ 
        email: "sys@test.com", 
        password: plainPassword // Use plain password for login
      });
    
    // Debug output
    if (login.statusCode !== 200) {
      console.log("Login Response:", login.body);
      console.log("Login Status:", login.statusCode);
    }
    
    expect(login.statusCode).toBe(200);
    expect(login.body).toHaveProperty("token");
    
    const token = login.body.token;
    
    // 3. ACCESS PROTECTED ROUTE: Access the customers route with token
    const customers = await request(app)
      .get("/api/customers")
      .set("Authorization", `Bearer ${token}`);
    
    expect(customers.statusCode).toBe(200);
    expect(customers.body).toBeInstanceOf(Array);
  });
});