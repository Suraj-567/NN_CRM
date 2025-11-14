//server/tests/integration/CompanyRoutesIntegration.test.js

import request from "supertest";
import express from "express";
import companyRoutes from "../../routes/companyRoutes.js";
import Company from "../../models/Company.js";
import User from "../../models/User.js";
import "../../tests/setupTestDB.js";

const app = express();
app.use(express.json());
app.use("/api/company", companyRoutes);

describe("Company Routes Integration", () => {
  
  beforeEach(async () => {
    // Clear database before each test
    await Company.deleteMany({});
    await User.deleteMany({});
  });

  test("POST /register registers a company", async () => {
    const res = await request(app)
      .post("/api/company/register")
      .send({
        companyName: "TechCorp",
        businessEmail: "boss@techcorp.com",
        managerName: "Boss Manager",
        password: "SecurePass123",
        industry: "IT",
        smtpHost: "smtp.gmail.com",
        smtpPort: 587,
        smtpUser: "test@gmail.com",
        smtpPass: "testpassword123"
      });
    
    // Debug output if test fails
    if (res.statusCode !== 201) {
      console.log("Response body:", res.body);
      console.log("Response status:", res.statusCode);
    }
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message", "Company registered. Awaiting admin approval.");
    expect(res.body).toHaveProperty("company");
    expect(res.body.company).toHaveProperty("companyName", "TechCorp");
    expect(res.body.company).toHaveProperty("businessEmail", "boss@techcorp.com");
  });
});