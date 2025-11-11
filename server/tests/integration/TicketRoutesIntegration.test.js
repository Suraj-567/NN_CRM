import request from "supertest";
import express from "express";
import ticketRoutes from "../../routes/ticketRoutes.js";
import "../../tests/setupTestDB.js";


jest.mock("../../middleware/authMiddleware.js", () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: "69037048ebed3d350a595d9f", companyId: "69037048ebed3d350a595d9f", name: "Manager" };
    next();
  }
}));

const app = express();
app.use(express.json());
app.use("/api/tickets", ticketRoutes);

describe("Ticket Routes Integration", () => {
  test("GET / returns empty array initially", async () => {
    const res = await request(app).get("/api/tickets");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });
});
