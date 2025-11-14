import {
  registerCompany,
  getCompanyStats,
  getCompanyProfile,
  updateCompanyProfile,
} from "../../controllers/companyController.js";
import Company from "../../models/Company.js";
import Customer from "../../models/Customer.js";
import Employee from "../../models/Employee.js";
import Ticket from "../../models/Ticket.js";
import bcrypt from "bcryptjs";

// --- Mocking Dependencies ---
jest.mock("../../models/Company.js");
jest.mock("../../models/Customer.js");
jest.mock("../../models/Employee.js");
jest.mock("../../models/Ticket.js");
jest.mock("bcryptjs");

// --- Mock Helpers ---
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res;
};

// Test Data
const MOCK_COMPANY_ID = "comp_test_123";
const MOCK_USER = { id: "user_id_1", companyId: MOCK_COMPANY_ID, role: "Manager" };
const MOCK_COMPANY_DATA = {
  _id: MOCK_COMPANY_ID,
  companyName: "TestCorp",
  businessEmail: "test@corp.com",
  managerName: "Jane Doe",
};

describe("Company Controller Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =================================================================
  // registerCompany Tests
  // =================================================================
  describe("registerCompany", () => {
    const req = {
      body: {
        companyName: "NewCo",
        businessEmail: "new@co.com",
        password: "securepassword",
        smtpHost: "smtp.newco.net",
      },
    };
    const res = mockResponse();

    test("should successfully register a new company", async () => {
      Company.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed_password_123");
      const createdCompany = { ...MOCK_COMPANY_DATA, _id: "new_id" };
      Company.create.mockResolvedValue(createdCompany);

      await registerCompany(req, res);

      expect(Company.findOne).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(Company.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: "hashed_password_123",
          approved: false,
          smtp: expect.objectContaining({ host: "smtp.newco.net", fromName: "NewCo" }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Company registered. Awaiting admin approval." })
      );
    });

    test("should return 400 if company businessEmail already exists", async () => {
      Company.findOne.mockResolvedValue({ businessEmail: "new@co.com" });

      await registerCompany(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Company already registered.",
      });
    });

    test("should return 500 on internal server error", async () => {
      Company.findOne.mockRejectedValue(new Error("Database connection failed"));

      await registerCompany(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database connection failed" });
    });
  });

  // =================================================================
  // getCompanyStats Tests
  // =================================================================
  describe("getCompanyStats", () => {
    const req = { user: MOCK_USER };
    const res = mockResponse();

    test("should return correct company statistics", async () => {
      Customer.countDocuments.mockResolvedValue(100);
      Employee.countDocuments.mockResolvedValue(15);
      Ticket.countDocuments
        .mockResolvedValueOnce(150) // totalTickets
        .mockResolvedValueOnce(120); // resolvedTickets

      await getCompanyStats(req, res);

      expect(Customer.countDocuments).toHaveBeenCalledWith({ companyId: MOCK_COMPANY_ID });
      expect(res.json).toHaveBeenCalledWith({
        totalCustomers: 100,
        totalEmployees: 15,
        totalTickets: 150,
        resolvedTickets: 120,
        pendingTickets: 30,
      });
    });

    test("should return 500 on internal server error during stats fetching", async () => {
      Customer.countDocuments.mockRejectedValue(new Error("DB Query timeout"));

      await getCompanyStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error fetching stats" });
    });
  });

  // =================================================================
  // getCompanyProfile Tests
  // =================================================================
  describe("getCompanyProfile", () => {
    const req = { user: MOCK_USER };
    const res = mockResponse();

    test("should successfully return company profile excluding password", async () => {
      const companyWithoutPassword = { ...MOCK_COMPANY_DATA };
      
      // FIX: Explicitly mock the select function to capture the call history
      const selectMock = jest.fn().mockResolvedValue(companyWithoutPassword);
      const findByIdMock = { select: selectMock };
      Company.findById.mockReturnValue(findByIdMock);

      await getCompanyProfile(req, res);

      expect(Company.findById).toHaveBeenCalledWith(MOCK_COMPANY_ID);
      expect(selectMock).toHaveBeenCalledWith("-password");
      expect(res.json).toHaveBeenCalledWith(companyWithoutPassword);
    });

    test("should return 500 on internal server error when fetching profile", async () => {
      // Mock failure in the chained method
      Company.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error("Profile read error")),
      });

      await getCompanyProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error fetching company info" });
    });
  });

  // =================================================================
  // updateCompanyProfile Tests
  // =================================================================
  describe("updateCompanyProfile", () => {
    const updates = { address: "789 Tech Lane" };
    const req = { user: MOCK_USER, body: updates };
    const res = mockResponse();

    test("should successfully update company profile and return the new document", async () => {
      const updatedCompany = { ...MOCK_COMPANY_DATA, ...updates };
      
      // FIX: Explicitly mock the select function to capture the call history
      const selectMock = jest.fn().mockResolvedValue(updatedCompany);
      const findAndUpdateMock = { select: selectMock };
      Company.findByIdAndUpdate.mockReturnValue(findAndUpdateMock);

      await updateCompanyProfile(req, res);

      expect(Company.findByIdAndUpdate).toHaveBeenCalledWith(
        MOCK_COMPANY_ID,
        updates,
        { new: true }
      );
      expect(selectMock).toHaveBeenCalledWith("-password");
      expect(res.json).toHaveBeenCalledWith({
        message: "Company updated successfully",
        company: updatedCompany,
      });
    });

    test("should return 500 on internal server error when updating profile", async () => {
      // Mock failure in the chained method
      Company.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error("Update failure")),
      });

      await updateCompanyProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error updating company info" });
    });
  });
});