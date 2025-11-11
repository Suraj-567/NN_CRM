import { getStats, getPendingCompanies, approveCompany, getApprovedCompanies } from "../../controllers/adminController.js";
import Company from "../../models/Company.js";
import User from "../../models/User.js";

jest.mock("../../models/Company.js");
jest.mock("../../models/User.js");

describe("Admin Controller - getStats", () => {
    test("returns counts for companies and users", async () => {
        // Clear mocks just for safety, even if it's in beforeEach
        jest.clearAllMocks(); 
        
        Company.countDocuments.mockResolvedValue(5);
        User.countDocuments
            .mockResolvedValueOnce(3) // BusinessManager
            .mockResolvedValueOnce(10); // Employee

        const req = {};
        const res = { json: jest.fn() };

        await getStats(req, res);

        expect(res.json).toHaveBeenCalledWith({
            totalCompanies: 5,
            approvedCompanies: 3,
            totalEmployees: 10,
        });
        
        // Assertions for call count and arguments are also good for isolation
        expect(User.countDocuments).toHaveBeenCalledTimes(2); 
    });
  describe("Admin Controller - getPendingCompanies", () => {
    test("returns a list of unapproved companies", async () => {
        // 1. Arrange
        const mockPending = [
            { _id: "id1", name: "Pending Co A" },
            { _id: "id2", name: "Pending Co B" }
        ];
        Company.find.mockResolvedValue(mockPending);

        const req = {};
        const res = { json: jest.fn() };

        // 2. Act
        await getPendingCompanies(req, res);

        // 3. Assert
        expect(Company.find).toHaveBeenCalledWith({ approved: false });
        expect(res.json).toHaveBeenCalledWith(mockPending);
    });
});

describe("Admin Controller - approveCompany", () => {
    const MOCK_COMPANY_ID = "69037048ebed3d350a595d9f";

    test("returns 404 if company is not found", async () => {
        // 1. Arrange
        Company.findById.mockResolvedValue(null);
        const req = { params: { id: MOCK_COMPANY_ID }, body: { status: "approved" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        // 2. Act
        await approveCompany(req, res);

        // 3. Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "Company not found" });
    });

    test("approves company, saves and creates Business Manager user", async () => {
        // 1. Arrange
        const mockCompany = {
            _id: MOCK_COMPANY_ID,
            approved: false,
            save: jest.fn().mockResolvedValue(true),
            managerName: "Test Manager",
            businessEmail: "manager@testco.com",
            password: "hashedpassword123", // Assuming password is set by registration logic
        };
        
        Company.findById.mockResolvedValue(mockCompany);
        User.create = jest.fn().mockResolvedValue({}); // Mock User.create

        const req = { params: { id: MOCK_COMPANY_ID }, body: { status: "approved" } };
        const res = { json: jest.fn() };

        // 2. Act
        await approveCompany(req, res);

        // 3. Assert
        expect(mockCompany.approved).toBe(true);
        expect(mockCompany.save).toHaveBeenCalledTimes(1);
        expect(User.create).toHaveBeenCalledTimes(1);
        expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
            email: "manager@testco.com",
            role: "BusinessManager",
            companyId: MOCK_COMPANY_ID,
        }));
        expect(res.json).toHaveBeenCalledWith({ message: "Company approved and Business Manager created." });
    });

    test("rejects company and removes it from the database", async () => {
        // 1. Arrange
        const mockCompany = {
            _id: MOCK_COMPANY_ID,
            approved: false,
            deleteOne: jest.fn().mockResolvedValue(true), // Mongoose delete method
            // Note: deleteOne is often used for model instances, depending on Mongoose version
        };
        
        Company.findById.mockResolvedValue(mockCompany);

        const req = { params: { id: MOCK_COMPANY_ID }, body: { status: "rejected" } };
        const res = { json: jest.fn() };

        // 2. Act
        await approveCompany(req, res);

        // 3. Assert
        expect(mockCompany.deleteOne).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledWith({ message: "Company rejected and removed." });
    });
});
// Add these to server/tests/unit/adminControllerUnit.test.js

describe("Admin Controller - getApprovedCompanies", () => {
    
    test("successfully returns a list of approved companies with employee counts (Success Path)", async () => {
        // 1. Arrange
        jest.clearAllMocks(); // Defensive clear, in case beforeEach is missing or bypassed.
        const MOCK_COMPANY_A_ID = "69037048ebed3d350a595d91";
        const MOCK_COMPANY_B_ID = "69037048ebed3d350a595d92";
        
        const mockCompanies = [
            { _id: MOCK_COMPANY_A_ID, name: "Approved Co A" },
            { _id: MOCK_COMPANY_B_ID, name: "Approved Co B" },
        ];

        // Mock Company.find().select().lean() chain
        Company.find.mockImplementation(() => ({
            select: jest.fn().mockImplementation(() => ({
                lean: jest.fn().mockResolvedValue(mockCompanies),
            })),
        }));

        // Mock User.countDocuments for the employee count (Line 59)
        User.countDocuments
            .mockResolvedValueOnce(5) // Co A has 5 employees
            .mockResolvedValueOnce(1); // Co B has 1 employee

        const req = {};
        const res = { json: jest.fn() };

        // 2. Act
        await getApprovedCompanies(req, res);

        // 3. Assert
        expect(Company.find).toHaveBeenCalledWith({ approved: true });
        // This assertion should now pass:
        expect(User.countDocuments).toHaveBeenCalledTimes(2); 
        expect(res.json).toHaveBeenCalledWith([
            { _id: MOCK_COMPANY_A_ID, name: "Approved Co A", employeeCount: 5 },
            { _id: MOCK_COMPANY_B_ID, name: "Approved Co B", employeeCount: 1 },
        ]);
    });

    test("handles server error when fetching approved companies (Error Path)", async () => {
        // 1. Arrange
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const mockError = new Error("DB Fetch Failed");

        // Mock the find chain to throw an error
        Company.find.mockImplementation(() => ({
            select: jest.fn().mockImplementation(() => ({
                lean: jest.fn().mockRejectedValue(mockError),
            })),
        }));

        const req = {};
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        // 2. Act
        await getApprovedCompanies(req, res);

        // 3. Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Error fetching approved companies" });
        errorSpy.mockRestore(); // Clean up the spy
    });
});
});
