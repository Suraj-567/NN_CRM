import request from "supertest";
import express from "express";
import companyRoutes from "../../routes/companyRoutes.js";
import "../../tests/setupTestDB.js";

const app = express();
app.use(express.json());
app.use("/api/company", companyRoutes);

describe("Company Routes Integration", () => {
  test("POST /register registers a company", async () => {
    const res = await request(app)
      .post("/api/company/register")
      .send({
        companyName: "TechCorp",
        businessEmail: "b@test.com",
        managerName: "Boss",
        password: "1234",
        industry: "IT"
      });
    expect(res.statusCode).toBe(201);
  });
});
