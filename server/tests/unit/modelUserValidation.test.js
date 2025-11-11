
import User from "../../models/User.js";

describe("User Model Validation", () => {
  test("requires email and password", async () => {
    const user = new User({ name: "Test" });
    try {
      await user.validate();
    } catch (err) {
      expect(err.errors.email).toBeDefined();
      expect(err.errors.password).toBeDefined();
    }
  });
});
