//server/tests/unit/employeeControllerUnit.test.js

import { 
    addEmployee, 
    getEmployees, 
    updateEmployee, 
    toggleEmployeeStatus 
} from "../../controllers/employeeController.js";
import Employee from "../../models/Employee.js";
import User from "../../models/User.js";
import Customer from "../../models/Customer.js";
import bcrypt from "bcryptjs";

// Mock all dependencies
jest.mock("../../models/Employee.js");
jest.mock("../../models/User.js");
jest.mock("../../models/Customer.js");
jest.mock("bcryptjs");

// Mock data constants
const MOCK_COMPANY_ID = "company123";
const MOCK_EMPLOYEE_ID = "emp123";
const MOCK_USER_ID = "user123";
const MOCK_MANAGER_ID = "manager123";
const MOCK_EMAIL = "john@test.com";
const MOCK_HASHED_PASSWORD = "hashed_password_123";

describe("Employee Controller", () => {
    
    let mockEmployeeInstance;
    let mockUserInstance;
    
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        
        // Create fresh mock instances
        mockEmployeeInstance = {
            _id: MOCK_EMPLOYEE_ID,
            name: "John Doe",
            email: MOCK_EMAIL,
            password: MOCK_HASHED_PASSWORD,
            department: "Support",
            companyId: MOCK_COMPANY_ID,
            role: "Employee",
            status: "Active",
            ticketsHandled: 0,
            save: jest.fn().mockResolvedValue(true),
        };
        
        mockUserInstance = {
            _id: MOCK_USER_ID,
            name: "John Doe",
            email: MOCK_EMAIL,
            password: MOCK_HASHED_PASSWORD,
            department: "Support",
            companyId: MOCK_COMPANY_ID,
            role: "Employee",
            status: "Active",
            save: jest.fn().mockResolvedValue(true),
        };
        
        // Set up constructor mocks
        Employee.mockImplementation(() => mockEmployeeInstance);
        User.mockImplementation(() => mockUserInstance);
        
        // Default bcrypt mock
        bcrypt.hash.mockResolvedValue(MOCK_HASHED_PASSWORD);
    });
    
    // --- addEmployee Tests ---
    
    describe("addEmployee", () => {
        
        test("returns 400 if name is missing", async () => {
            const req = { 
                body: { email: MOCK_EMAIL, password: "123", department: "Support" }, 
                user: { companyId: MOCK_COMPANY_ID } 
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            await addEmployee(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "All fields are required" });
        });
        
        test("returns 400 if email is missing", async () => {
            const req = { 
                body: { name: "John", password: "123", department: "Support" }, 
                user: { companyId: MOCK_COMPANY_ID } 
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            await addEmployee(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "All fields are required" });
        });
        
        test("returns 400 if password is missing", async () => {
            const req = { 
                body: { name: "John", email: MOCK_EMAIL, department: "Support" }, 
                user: { companyId: MOCK_COMPANY_ID } 
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            await addEmployee(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "All fields are required" });
        });
        
        test("returns 400 if department is missing", async () => {
            const req = { 
                body: { name: "John", email: MOCK_EMAIL, password: "123" }, 
                user: { companyId: MOCK_COMPANY_ID } 
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            await addEmployee(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "All fields are required" });
        });
        
        test("returns 400 if companyId is missing in token", async () => {
            const req = { 
                body: { name: "John", email: MOCK_EMAIL, password: "123", department: "Support" }, 
                user: {} 
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            await addEmployee(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Company ID missing in token" });
        });
        
        test("returns 400 if employee already exists", async () => {
            const req = { 
                body: { name: "John", email: MOCK_EMAIL, password: "123", department: "Support" }, 
                user: { companyId: MOCK_COMPANY_ID } 
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            Employee.findOne.mockResolvedValue({ email: MOCK_EMAIL });
            
            await addEmployee(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Employee already exists" });
        });
        
        test("returns 400 if user with email already exists", async () => {
            const req = { 
                body: { name: "John", email: MOCK_EMAIL, password: "123", department: "Support" }, 
                user: { companyId: MOCK_COMPANY_ID } 
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            Employee.findOne.mockResolvedValue(null);
            User.findOne.mockResolvedValue({ email: MOCK_EMAIL });
            
            await addEmployee(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Employee already exists" });
        });
        
        test("successfully creates employee and user with status 201", async () => {
            const req = { 
                body: { name: "John Doe", email: MOCK_EMAIL, password: "password123", department: "Support" },
                user: { companyId: MOCK_COMPANY_ID }
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            Employee.findOne.mockResolvedValue(null);
            User.findOne.mockResolvedValue(null);
            
            await addEmployee(req, res);
            
            expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
            expect(Employee).toHaveBeenCalledWith(expect.objectContaining({
                name: "John Doe",
                email: MOCK_EMAIL,
                password: MOCK_HASHED_PASSWORD,
                department: "Support",
                companyId: MOCK_COMPANY_ID,
                role: "Employee",
                status: "Active",
            }));
            expect(User).toHaveBeenCalledWith(expect.objectContaining({
                name: "John Doe",
                email: MOCK_EMAIL,
                password: MOCK_HASHED_PASSWORD,
            }));
            expect(mockEmployeeInstance.save).toHaveBeenCalled();
            expect(mockUserInstance.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: "Employee added successfully",
                employee: mockEmployeeInstance,
            });
        });
        
        test("handles server error during employee creation", async () => {
            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            const req = { 
                body: { name: "John", email: MOCK_EMAIL, password: "123", department: "Support" },
                user: { companyId: MOCK_COMPANY_ID }
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            Employee.findOne.mockResolvedValue(null);
            User.findOne.mockResolvedValue(null);
            mockEmployeeInstance.save.mockRejectedValue(new Error("DB Error"));
            
            await addEmployee(req, res);
            
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
            errorSpy.mockRestore();
        });
    });
    
    // --- getEmployees Tests ---
    
    describe("getEmployees", () => {
        
        test("returns 400 if companyId is missing", async () => {
            const req = { user: {} };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            await getEmployees(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Company ID missing in token" });
        });
        
        test("successfully returns all employees for a company", async () => {
            const req = { user: { companyId: MOCK_COMPANY_ID } };
            const res = { json: jest.fn() };
            
            const mockEmployees = [
                { _id: "emp1", name: "John", email: "john@test.com" },
                { _id: "emp2", name: "Jane", email: "jane@test.com" }
            ];
            
            Employee.find.mockResolvedValue(mockEmployees);
            
            await getEmployees(req, res);
            
            expect(Employee.find).toHaveBeenCalledWith({ companyId: MOCK_COMPANY_ID });
            expect(res.json).toHaveBeenCalledWith(mockEmployees);
        });
        
        test("returns empty array when no employees exist", async () => {
            const req = { user: { companyId: MOCK_COMPANY_ID } };
            const res = { json: jest.fn() };
            
            Employee.find.mockResolvedValue([]);
            
            await getEmployees(req, res);
            
            expect(res.json).toHaveBeenCalledWith([]);
        });
        
        test("handles server error during fetching employees", async () => {
            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            const req = { user: { companyId: MOCK_COMPANY_ID } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            Employee.find.mockRejectedValue(new Error("DB Error"));
            
            await getEmployees(req, res);
            
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
            errorSpy.mockRestore();
        });
    });
    
    // --- updateEmployee Tests ---
    
    describe("updateEmployee", () => {
        
        test("returns 404 if employee not found", async () => {
            const req = { 
                params: { id: MOCK_EMPLOYEE_ID },
                body: { name: "John Updated", email: MOCK_EMAIL, department: "Sales" }
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            Employee.findById.mockResolvedValue(null);
            
            await updateEmployee(req, res);
            
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Employee not found" });
        });
        
        test("returns 400 if email conflicts with another employee", async () => {
            const req = { 
                params: { id: MOCK_EMPLOYEE_ID },
                body: { name: "John", email: "conflicting@test.com", department: "Sales" }
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            const existingEmployee = {
                _id: MOCK_EMPLOYEE_ID,
                email: MOCK_EMAIL,
                name: "John",
                password: MOCK_HASHED_PASSWORD,
                save: jest.fn(),
            };
            
            Employee.findById.mockResolvedValue(existingEmployee);
            Employee.findOne.mockResolvedValue({ _id: "different_id", email: "conflicting@test.com" });
            
            await updateEmployee(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Another employee already uses this email" });
        });
        
        test("successfully updates employee without changing password", async () => {
            const req = { 
                params: { id: MOCK_EMPLOYEE_ID },
                body: { name: "John Updated", email: "john.new@test.com", password: "", department: "Sales" }
            };
            const res = { json: jest.fn() };
            
            const existingEmployee = {
                _id: MOCK_EMPLOYEE_ID,
                email: MOCK_EMAIL,
                name: "John",
                password: MOCK_HASHED_PASSWORD,
                department: "Support",
                save: jest.fn().mockResolvedValue(true),
            };
            
            const existingUser = {
                email: MOCK_EMAIL,
                name: "John",
                password: MOCK_HASHED_PASSWORD,
                save: jest.fn().mockResolvedValue(true),
            };
            
            Employee.findById.mockResolvedValue(existingEmployee);
            Employee.findOne.mockResolvedValue(null); // No conflict
            User.findOne.mockResolvedValue(existingUser);
            
            await updateEmployee(req, res);
            
            expect(existingEmployee.name).toBe("John Updated");
            expect(existingEmployee.email).toBe("john.new@test.com");
            expect(existingEmployee.department).toBe("Sales");
            expect(existingEmployee.password).toBe(MOCK_HASHED_PASSWORD); // Password unchanged
            expect(existingEmployee.save).toHaveBeenCalled();
            expect(existingUser.save).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                message: "Employee updated successfully",
                employee: existingEmployee,
            });
        });
        
        test("successfully updates employee with new password", async () => {
            const req = { 
                params: { id: MOCK_EMPLOYEE_ID },
                body: { name: "John", email: MOCK_EMAIL, password: "newpassword123", department: "Support" }
            };
            const res = { json: jest.fn() };
            
            const existingEmployee = {
                _id: MOCK_EMPLOYEE_ID,
                email: MOCK_EMAIL,
                name: "John",
                password: "old_hashed_password",
                department: "Support",
                save: jest.fn().mockResolvedValue(true),
            };
            
            const existingUser = {
                email: MOCK_EMAIL,
                save: jest.fn().mockResolvedValue(true),
            };
            
            Employee.findById.mockResolvedValue(existingEmployee);
            Employee.findOne.mockResolvedValue(null);
            User.findOne.mockResolvedValue(existingUser);
            bcrypt.hash.mockResolvedValue("new_hashed_password");
            
            await updateEmployee(req, res);
            
            expect(bcrypt.hash).toHaveBeenCalledWith("newpassword123", 10);
            expect(existingEmployee.password).toBe("new_hashed_password");
            expect(existingUser.password).toBe("new_hashed_password");
            expect(res.json).toHaveBeenCalledWith({
                message: "Employee updated successfully",
                employee: existingEmployee,
            });
        });
        
        test("updates employee even if corresponding user is not found", async () => {
            const req = { 
                params: { id: MOCK_EMPLOYEE_ID },
                body: { name: "John", email: MOCK_EMAIL, password: "", department: "Support" }
            };
            const res = { json: jest.fn() };
            
            const existingEmployee = {
                _id: MOCK_EMPLOYEE_ID,
                email: MOCK_EMAIL,
                name: "John",
                password: MOCK_HASHED_PASSWORD,
                save: jest.fn().mockResolvedValue(true),
            };
            
            Employee.findById.mockResolvedValue(existingEmployee);
            Employee.findOne.mockResolvedValue(null);
            User.findOne.mockResolvedValue(null); // User not found
            
            await updateEmployee(req, res);
            
            expect(existingEmployee.save).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                message: "Employee updated successfully",
                employee: existingEmployee,
            });
        });
        
        test("handles server error during employee update", async () => {
            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            const req = { 
                params: { id: MOCK_EMPLOYEE_ID },
                body: { name: "John", email: MOCK_EMAIL, department: "Support" }
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            Employee.findById.mockRejectedValue(new Error("DB Error"));
            
            await updateEmployee(req, res);
            
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
            errorSpy.mockRestore();
        });
    });
    
    // --- toggleEmployeeStatus Tests ---
    
    describe("toggleEmployeeStatus", () => {
        
        test("returns 404 if employee not found", async () => {
            const req = { 
                params: { id: MOCK_EMPLOYEE_ID },
                user: { id: MOCK_MANAGER_ID, name: "Manager" }
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            Employee.findById.mockResolvedValue(null);
            
            await toggleEmployeeStatus(req, res);
            
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Employee not found" });
        });
        
        test("successfully toggles employee from Active to Inactive", async () => {
            const req = { 
                params: { id: MOCK_EMPLOYEE_ID },
                user: { id: MOCK_MANAGER_ID, name: "Manager" }
            };
            const res = { json: jest.fn() };
            
            const activeEmployee = {
                _id: MOCK_EMPLOYEE_ID,
                email: MOCK_EMAIL,
                name: "John Doe",
                status: "Active",
                save: jest.fn().mockResolvedValue(true),
            };
            
            const correspondingUser = {
                email: MOCK_EMAIL,
                status: "Active",
                save: jest.fn().mockResolvedValue(true),
            };
            
            Employee.findById.mockResolvedValue(activeEmployee);
            User.findOne.mockResolvedValue(correspondingUser);
            Customer.find.mockResolvedValue([]); // No affected customers
            
            await toggleEmployeeStatus(req, res);
            
            expect(activeEmployee.status).toBe("Inactive");
            expect(correspondingUser.status).toBe("Inactive");
            expect(activeEmployee.save).toHaveBeenCalled();
            expect(correspondingUser.save).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "Inactive",
            }));
        });
        
        test("successfully toggles employee from Inactive to Active", async () => {
            const req = { 
                params: { id: MOCK_EMPLOYEE_ID },
                user: { id: MOCK_MANAGER_ID, name: "Manager" }
            };
            const res = { json: jest.fn() };
            
            const inactiveEmployee = {
                _id: MOCK_EMPLOYEE_ID,
                email: MOCK_EMAIL,
                name: "John Doe",
                status: "Inactive",
                save: jest.fn().mockResolvedValue(true),
            };
            
            const correspondingUser = {
                email: MOCK_EMAIL,
                status: "Inactive",
                save: jest.fn().mockResolvedValue(true),
            };
            
            Employee.findById.mockResolvedValue(inactiveEmployee);
            User.findOne.mockResolvedValue(correspondingUser);
            
            await toggleEmployeeStatus(req, res);
            
            expect(inactiveEmployee.status).toBe("Active");
            expect(correspondingUser.status).toBe("Active");
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "Active",
                message: expect.stringContaining("activated"),
            }));
        });
        
        test("removes employee from customer assignments when deactivated", async () => {
            const req = { 
                params: { id: MOCK_EMPLOYEE_ID },
                user: { id: MOCK_MANAGER_ID, name: "Manager" }
            };
            const res = { json: jest.fn() };
            
            const activeEmployee = {
                _id: MOCK_EMPLOYEE_ID,
                email: MOCK_EMAIL,
                name: "John Doe",
                status: "Active",
                save: jest.fn().mockResolvedValue(true),
            };
            
            const customer1 = {
                _id: "cust1",
                assignedTo: [MOCK_EMPLOYEE_ID, "other_emp"],
                audit: [],
                save: jest.fn().mockResolvedValue(true),
            };
            
            const customer2 = {
                _id: "cust2",
                assignedTo: [MOCK_EMPLOYEE_ID],
                audit: [],
                save: jest.fn().mockResolvedValue(true),
            };
            
            Employee.findById.mockResolvedValue(activeEmployee);
            User.findOne.mockResolvedValue({ email: MOCK_EMAIL, save: jest.fn() });
            Customer.find.mockResolvedValue([customer1, customer2]);
            
            await toggleEmployeeStatus(req, res);
            
            expect(Customer.find).toHaveBeenCalledWith({
                assignedTo: MOCK_EMPLOYEE_ID,
                deletedAt: null,
            });
            expect(customer1.assignedTo).toEqual(["other_emp"]);
            expect(customer2.assignedTo).toEqual([]);
            expect(customer1.audit.length).toBe(1);
            expect(customer2.audit.length).toBe(1);
            expect(customer1.audit[0].action).toBe("assignment_removed");
            expect(customer1.save).toHaveBeenCalled();
            expect(customer2.save).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining("Removed from 2 customer assignments"),
            }));
        });
        
        test("toggles status even if corresponding user is not found", async () => {
            const req = { 
                params: { id: MOCK_EMPLOYEE_ID },
                user: { id: MOCK_MANAGER_ID, name: "Manager" }
            };
            const res = { json: jest.fn() };
            
            const activeEmployee = {
                _id: MOCK_EMPLOYEE_ID,
                email: MOCK_EMAIL,
                name: "John Doe",
                status: "Active",
                save: jest.fn().mockResolvedValue(true),
            };
            
            Employee.findById.mockResolvedValue(activeEmployee);
            User.findOne.mockResolvedValue(null); // User not found
            Customer.find.mockResolvedValue([]);
            
            await toggleEmployeeStatus(req, res);
            
            expect(activeEmployee.status).toBe("Inactive");
            expect(activeEmployee.save).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalled();
        });
        
        test("handles server error during status toggle", async () => {
            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            const req = { 
                params: { id: MOCK_EMPLOYEE_ID },
                user: { id: MOCK_MANAGER_ID, name: "Manager" }
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            Employee.findById.mockRejectedValue(new Error("DB Error"));
            
            await toggleEmployeeStatus(req, res);
            
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
            errorSpy.mockRestore();
        });
    });
});