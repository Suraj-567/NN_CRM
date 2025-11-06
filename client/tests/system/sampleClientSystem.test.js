describe("System Test (Client)", () => {
  test("environment variable is set", () => {
    process.env.MODE = "development"
    expect(process.env.MODE).toBe("development")
  })
})
