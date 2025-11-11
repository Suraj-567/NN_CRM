import request from "supertest";
import express from "express";
import employeeRoutes from "../../routes/employeeRoutes.js";
import "../../tests/setupTestDB.js";

const app = express();
app.use(express.json());
app.use("/api/employee", employeeRoutes);

describe("Employee Routes Integration", () => {
  test("POST / returns 401 without token", async () => {
    const res = await request(app).post("/api/employee");
    expect(res.statusCode).toBe(401);
  });
});
