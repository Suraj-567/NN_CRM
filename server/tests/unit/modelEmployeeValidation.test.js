// server/tests/unit/modelEmployeeValidation.test.js (RECTIFIED)
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Employee from "../../models/Employee.js";
// import bcrypt from "bcryptjs"; // Removed: 'bcryptjs' is defined but never used (Fixes Line 5 warning)

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Employee.deleteMany({});
});

describe("Employee Model Validation", () => {
  // Fix: Use Jest's built-in rejects assertion to remove 'fail' dependency (Fixes 'fail' is not defined errors)
  test("requires name field", async () => {
    const emp = new Employee({
      email: "emp@test.com",
      password: "123",
      department: "Sales",
    });
    
    // Assert that validation throws an error
    await expect(emp.validate()).rejects.toThrow();
    
    try {
        await emp.validate();
    } catch (err) {
        // Assert that the error is specifically due to the missing 'name' field
        expect(err.errors.name).toBeDefined();
    }
  });

  test("requires email field", async () => {
    const emp = new Employee({
      name: "Emp",
      password: "123",
      department: "Sales",
    });
    
    await expect(emp.validate()).rejects.toThrow();
    
    try {
        await emp.validate();
    } catch (err) {
        expect(err.errors.email).toBeDefined();
    }
  });

  test("requires password field", async () => {
    const emp = new Employee({
      name: "Emp",
      email: "emp@test.com",
      department: "Sales",
    });
    
    await expect(emp.validate()).rejects.toThrow();
    
    try {
        await emp.validate();
    } catch (err) {
        expect(err.errors.password).toBeDefined();
    }
  });

  test("requires department field", async () => {
    const emp = new Employee({
      name: "Emp",
      email: "emp@test.com",
      password: "123",
    });
    
    await expect(emp.validate()).rejects.toThrow();
    
    try {
        await emp.validate();
    } catch (err) {
        expect(err.errors.department).toBeDefined();
    }
  });

  test("validates department enum", async () => {
    const emp = new Employee({
      name: "Emp",
      email: "emp@test.com",
      password: "123",
      department: "InvalidDept",
    });
    
    await expect(emp.validate()).rejects.toThrow();

    try {
        await emp.validate();
    } catch (err) {
        expect(err.errors.department).toBeDefined();
    }
  });

  test("validates status enum", async () => {
    const emp = new Employee({
      name: "Emp",
      email: "emp@test.com",
      password: "123",
      department: "Sales",
      status: "InvalidStatus",
    });
    
    await expect(emp.validate()).rejects.toThrow();

    try {
        await emp.validate();
    } catch (err) {
        expect(err.errors.status).toBeDefined();
    }
  });

  test("sets default role to Employee", () => {
    const emp = new Employee({
      name: "Emp",
      email: "emp@test.com",
      password: "123",
      department: "Sales",
    });
    expect(emp.role).toBe("Employee");
  });

  test("sets default status to Active", () => {
    const emp = new Employee({
      name: "Emp",
      email: "emp@test.com",
      password: "123",
      department: "Sales",
    });
    expect(emp.status).toBe("Active");
  });

  test("sets default ticketsHandled to 0", () => {
    const emp = new Employee({
      name: "Emp",
      email: "emp@test.com",
      password: "123",
      department: "Sales",
    });
    expect(emp.ticketsHandled).toBe(0);
  });

  test("hashes password before save", async () => {
    const emp = new Employee({
      name: "Employee",
      email: "emp@test.com",
      password: "plainPassword123",
      department: "Sales",
    });

    await emp.save();
    
    expect(emp.password).not.toBe("plainPassword123");
    expect(emp.password).toBeDefined();
  });

  test("does not rehash password if not modified", async () => {
    const emp = new Employee({
      name: "Employee",
      email: "emp2@test.com",
      password: "plainPassword123",
      department: "Sales",
    });

    await emp.save();
    const hashedPassword = emp.password;

    emp.name = "Updated Name";
    await emp.save();
    
    expect(emp.password).toBe(hashedPassword);
  });
});