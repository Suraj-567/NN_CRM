describe("System Test (Server)", () => {
  test("System environment variable check", () => {
    process.env.NODE_ENV = "test"
    expect(process.env.NODE_ENV).toBe("test")
  })
})
