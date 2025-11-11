import request from "supertest";
import express from "express";
import authRoutes from "../../routes/authRoutes.js";

import "../../tests/setupTestDB.js";

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

describe("Auth Routes Integration", () => {
  test("POST /register creates a user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "User", email: "test@a.com", password: "1234", role: "Employee", companyId: "69037048ebed3d350a595d9f" });
    expect(res.statusCode).toBe(201);
  });
});
