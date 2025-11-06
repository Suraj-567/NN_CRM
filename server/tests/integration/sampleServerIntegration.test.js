const request = require("supertest");
const express = require("express");

const app = express()
app.get("/ping", (req, res) => res.json({ msg: "pong" }))

describe("Integration Test (Server)", () => {
  test("GET /ping returns pong", async () => {
    const res = await request(app).get("/ping")
    expect(res.statusCode).toBe(200)
    expect(res.body.msg).toBe("pong")
  })
})
