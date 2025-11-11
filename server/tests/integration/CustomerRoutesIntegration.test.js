import request from "supertest";
import express from "express";
import customerRoutes from "../../routes/customerRoutes.js";

import "../../tests/setupTestDB.js";

jest.mock("../../middleware/authMiddleware.js", () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: "69037048ebed3d350a595d9f", companyId: "69037048ebed3d350a595d9f" };
    next();
  }
}));

const app = express();
app.use(express.json());
app.use("/api/customers", customerRoutes);

describe("Customer Routes Integration", () => {
  test("POST / creates a customer", async () => {
    const res = await request(app)
      .post("/api/customers")
      .send({ name: "Customer1" });
    expect(res.statusCode).toBe(201);
  });
});
