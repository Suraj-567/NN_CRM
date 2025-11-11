import { createCustomer, listCustomers, getCustomer, updateCustomer, convertLead, softDeleteCustomer, restoreCustomer } from "../../controllers/customerController.js";
import Customer from "../../models/Customer.js";
import User from "../../models/User.js";
import Employee from "../../models/Employee.js";
import mongoose from "mongoose"; // 👈 1. Import mongoose

// Mock Data
const MOCK_COMPANY_ID = "69037048ebed3d350a595d9f";
const MOCK_USER_ID = "69037048ebed3d350a595d9e";
const MOCK_EMPLOYEE_ID = "6905d7c0c2e3fbe27a14dcd3";
const MOCK_OTHER_COMPANY_ID = "69037048ebed3d350a595d99"; 
const MOCK_CUSTOMER_ID = "69037048ebed3d350a595d9c";
const MOCK_OLD_EMP_ID = "6905d7c0c2e3fbe27a14dcd4";
const MOCK_NEW_EMP_ID = "6905d7c0c2e3fbe27a14dcd5";
const MOCK_LEAD_ID = "6905d7c0c2e3fbe27a14dcd6";

// --- Custom Mocks for Mongoose Functionality ---

// Mock mongoose for isValidObjectId
jest.mock("mongoose", () => ({
    isValidObjectId: jest.fn(),
}));

// Mock Customer to be a Jest constructor and mock its static methods
jest.mock("../../models/Customer.js", () => {
    // We define the needed constants here or use the literal strings.
    // Using literal strings is safer, but we'll use a local constant for clarity.
    const LOCAL_MOCK_COMPANY_ID = "69037048ebed3d350a595d9f";
    const LOCAL_MOCK_EMPLOYEE_ID = "6905d7c0c2e3fbe27a14dcd3";
    
    // Create a mock instance object for the customer
    const mockCustomerInstance = {
        audit: [],
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockImplementation(() => ({
            _id: "new_cust_id",
            companyId: LOCAL_MOCK_COMPANY_ID,
            name: "New Customer Inc.",
            status: "Lead",
            assignedTo: [LOCAL_MOCK_EMPLOYEE_ID],
        })),
        // FIX: Replaced MOCK_COMPANY_ID with the literal string or local constant
        companyId: LOCAL_MOCK_COMPANY_ID, 
        name: "New Customer Inc.",
        status: "Lead",
        assignedTo: [LOCAL_MOCK_EMPLOYEE_ID], 
    };

    // Customer constructor mock
    const CustomerMock = jest.fn().mockImplementation(() => mockCustomerInstance);

    // Attach static methods needed for controller logic
    CustomerMock.find = jest.fn();
    CustomerMock.findById = jest.fn();
    
    // Attach dummy schema path for updateCustomer logic
    CustomerMock.schema = { paths: { name: {}, status: {}, assignedTo: {} } };

    return CustomerMock;
});

// Mock User methods
jest.mock("../../models/User.js", () => ({
    findById: jest.fn(),
}));

// Mock Employee methods
jest.mock("../../models/Employee.js", () => ({
    find: jest.fn(),
}));

// Mock Employee.find to return a chainable query object for simplicity
const mockEmployeeQuery = (resolvedValue) => ({
    select: jest.fn().mockResolvedValue(resolvedValue),
});

describe("Customer Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Set up default User mock
        User.findById.mockResolvedValue({ _id: MOCK_USER_ID, name: "Manager John" });

        // Set up default Employee mock (for assigned employees fetch)
        Employee.find.mockImplementation(() => mockEmployeeQuery([
            { name: "Emp A", email: "a@test.com" },
        ]));
    });

    // --- createCustomer Tests (Your Existing Tests) ---
    
    test("createCustomer returns 400 if companyId missing", async () => {
        const req = { user: {}, body: { name: "Cust" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        await createCustomer(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test("createCustomer returns 400 if name missing", async () => {
        const req = { user: { companyId: MOCK_COMPANY_ID }, body: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        await createCustomer(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Customer name is required" });
    });

    test("createCustomer successfully creates and returns customer with assignment (Full Path)", async () => {
        const req = {
            user: { companyId: MOCK_COMPANY_ID, id: MOCK_USER_ID },
            body: {
                name: "Test Customer",
                assignedTo: MOCK_EMPLOYEE_ID,
                status: "Contact",
            }
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        
        const assignedEmployeeNames = [{ name: "Emp A" }];
        const populatedEmployees = [{ name: "Emp A", email: "a@test.com", role: "Agent" }];
        
        Employee.find
            .mockImplementationOnce(() => mockEmployeeQuery(assignedEmployeeNames))
            .mockImplementationOnce(() => mockEmployeeQuery(populatedEmployees));

        await createCustomer(req, res);
        
        expect(Customer).toHaveBeenCalledTimes(1);
        expect(Customer.mock.results[0].value.save).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(201);
        
        const customerInstance = Customer.mock.results[0].value;
        expect(customerInstance.audit.length).toBe(1);
        expect(customerInstance.audit[0].note).toContain("assigned to Emp A");
        expect(customerInstance.audit[0].note).toContain("status: Contact");
    });
    
    test("createCustomer handles server errors during save", async () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const req = {
            user: { companyId: MOCK_COMPANY_ID, id: MOCK_USER_ID },
            body: { name: "Test Fail" },
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        const failedCustomerInstance = {
            audit: [],
            save: jest.fn().mockRejectedValue(new Error("Save failed")),
            toObject: jest.fn().mockImplementation(() => ({})),
        };
        Customer.mockImplementationOnce(() => failedCustomerInstance);

        await createCustomer(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        errorSpy.mockRestore();
    });

    // --- listCustomers Tests (Your Existing Tests) ---

    test("listCustomers returns empty array if no data", async () => {
        const req = { user: { companyId: MOCK_COMPANY_ID } };
        const res = { json: jest.fn() };

        const mockSort = {
            sort: jest.fn().mockResolvedValue([]),
        };
        Customer.find.mockReturnValue(mockSort);

        await listCustomers(req, res);
        expect(res.json).toHaveBeenCalledWith([]);
        expect(mockSort.sort).toHaveBeenCalled();
    });
    
    test("listCustomers handles database error", async () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const req = { user: { companyId: MOCK_COMPANY_ID } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const mockError = new Error("DB fail");

        const mockSort = {
            sort: jest.fn().mockRejectedValue(mockError),
        };
        Customer.find.mockReturnValue(mockSort);

        await listCustomers(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        errorSpy.mockRestore();
    });
    
    // --- NEW getCustomer Tests (Lines 134-152) ---
    
    test("getCustomer returns 400 for invalid ID", async () => {
        const req = { params: { id: "invalid_id" }, user: { companyId: MOCK_COMPANY_ID } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        mongoose.isValidObjectId.mockReturnValue(false);

        await getCustomer(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid customer ID" });
    });

    test("getCustomer returns 404 if customer not found", async () => {
        const req = { params: { id: MOCK_USER_ID }, user: { companyId: MOCK_COMPANY_ID } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        mongoose.isValidObjectId.mockReturnValue(true);
        Customer.findById.mockResolvedValue(null);

        await getCustomer(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test("getCustomer returns 403 if companyId mismatch (Forbidden)", async () => {
        const req = { params: { id: MOCK_USER_ID }, user: { companyId: MOCK_OTHER_COMPANY_ID } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        mongoose.isValidObjectId.mockReturnValue(true);
        Customer.findById.mockResolvedValue({ 
            companyId: MOCK_COMPANY_ID,
            toObject: () => ({}),
        });

        await getCustomer(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test("getCustomer successfully returns customer with assigned employees", async () => {
        const req = { params: { id: MOCK_USER_ID }, user: { companyId: MOCK_COMPANY_ID } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        mongoose.isValidObjectId.mockReturnValue(true);
        
        const mockCustomer = {
            companyId: MOCK_COMPANY_ID,
            assignedTo: [MOCK_EMPLOYEE_ID],
            toObject: () => ({ id: MOCK_USER_ID, assignedTo: [MOCK_EMPLOYEE_ID] }),
        };
        const mockEmployees = [{ name: "Emp B", email: "b@test.com" }];

        Customer.findById.mockResolvedValue(mockCustomer);
        Employee.find.mockImplementation(() => ({
            select: jest.fn().mockResolvedValue(mockEmployees),
        }));

        await getCustomer(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ assignedTo: mockEmployees })
        );
    });
    
    // --- NEW updateCustomer Pre-Check Tests (Lines 160-169) ---

    test("updateCustomer returns 400 for invalid ID", async () => {
        const req = { params: { id: "invalid_id" }, user: { companyId: MOCK_COMPANY_ID }, body: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        mongoose.isValidObjectId.mockReturnValue(false);

        await updateCustomer(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid ID" });
    });

    test("updateCustomer returns 404 if customer not found", async () => {
        const req = { params: { id: MOCK_USER_ID }, user: { companyId: MOCK_COMPANY_ID }, body: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        mongoose.isValidObjectId.mockReturnValue(true);
        Customer.findById.mockResolvedValue(null);

        await updateCustomer(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test("updateCustomer returns 403 if companyId mismatch (Forbidden)", async () => {
        const req = { params: { id: MOCK_USER_ID }, user: { companyId: MOCK_OTHER_COMPANY_ID }, body: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        mongoose.isValidObjectId.mockReturnValue(true);
        Customer.findById.mockResolvedValue({ 
            companyId: MOCK_COMPANY_ID
        });

        await updateCustomer(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
    });
    test("updateCustomer successfully updates a basic field (e.g., name)", async () => {
    // 1. Arrange
    const req = {
        params: { id: MOCK_CUSTOMER_ID },
        user: { companyId: MOCK_COMPANY_ID, id: MOCK_USER_ID },
        body: { name: "Updated Customer Name" },
    };
    const res = { json: jest.fn() };
    mongoose.isValidObjectId.mockReturnValue(true);

    const mockCustomer = {
        companyId: MOCK_COMPANY_ID,
        name: "Old Customer Name",
        assignedTo: [], // Important: must be an array for logic
        audit: [],
        save: jest.fn().mockResolvedValue(true),
        // Mock schema paths for the update loop to work
        schema: { paths: { name: {}, status: {}, assignedTo: {} } },
        toObject: jest.fn().mockImplementation(() => ({
            id: MOCK_CUSTOMER_ID,
            name: "Updated Customer Name",
        })),
    };
    Customer.findById.mockResolvedValue(mockCustomer);
    
    // Employee.find will be called once for final response population (mocked in beforeEach is sufficient)

    // 2. Act
    await updateCustomer(req, res);

    // 3. Assert
    expect(mockCustomer.name).toBe("Updated Customer Name");
    expect(mockCustomer.audit.length).toBe(1);
    expect(mockCustomer.audit[0].action).toBe("updated");
    expect(mockCustomer.audit[0].diff.name).toEqual({
        from: "Old Customer Name",
        to: "Updated Customer Name",
    });
    expect(mockCustomer.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalled();
});


test("updateCustomer successfully updates assignedTo and logs audit", async () => {
    // 1. Arrange
    const req = {
        params: { id: MOCK_CUSTOMER_ID },
        user: { companyId: MOCK_COMPANY_ID, id: MOCK_USER_ID },
        body: { assignedTo: [MOCK_NEW_EMP_ID] },
    };
    const res = { json: jest.fn() };
    mongoose.isValidObjectId.mockReturnValue(true);

    const mockCustomer = {
        companyId: MOCK_COMPANY_ID,
        name: "Customer A",
        assignedTo: [MOCK_OLD_EMP_ID], // Old assignment
        audit: [],
        save: jest.fn().mockResolvedValue(true),
        schema: { paths: { name: {}, status: {}, assignedTo: {} } },
        toObject: jest.fn().mockImplementation(() => ({ id: MOCK_CUSTOMER_ID })),
    };
    Customer.findById.mockResolvedValue(mockCustomer);

    // Mock employees for the three Employee.find calls:
    // 1. Old employee names (for audit 'from')
    // 2. New employee names (for audit 'to')
    // 3. Final populated employees (for response)
    const oldEmployees = [{ name: "Old Employee" }];
    const newEmployees = [{ name: "New Employee" }];

    Employee.find
        .mockImplementationOnce(() => mockEmployeeQuery(newEmployees)) // 1. newIds fetch (Line 202)
        .mockImplementationOnce(() => mockEmployeeQuery(oldEmployees)) // 2. oldIds fetch (Line 206)
        .mockImplementationOnce(() => mockEmployeeQuery(newEmployees)); // 3. Final response population (Line 236)


    // 2. Act
    await updateCustomer(req, res);

    // 3. Assert
    expect(mockCustomer.assignedTo).toEqual([MOCK_NEW_EMP_ID]);
    expect(mockCustomer.audit.length).toBe(1);
    expect(mockCustomer.audit[0].diff.assignedTo).toEqual({
        from: "Old Employee",
        to: "New Employee",
    });
    expect(mockCustomer.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalled();
});
test("convertLead returns 400 for invalid ID", async () => {
    const req = { params: { id: "invalid_id" }, user: { companyId: MOCK_COMPANY_ID } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mongoose.isValidObjectId.mockReturnValue(false);

    await convertLead(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
});

test("convertLead returns 400 if customer is already 'Converted'", async () => {
    const req = { params: { id: MOCK_LEAD_ID }, user: { companyId: MOCK_COMPANY_ID } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mongoose.isValidObjectId.mockReturnValue(true);

    Customer.findById.mockImplementationOnce(id => {
        if (id === MOCK_LEAD_ID) {
            return { companyId: MOCK_COMPANY_ID, status: "Converted" };
        }
        // Mock the second findById for the populate line (282) to return something
        return { status: "Converted", populate: jest.fn().mockResolvedValue({}) }; 
    });

    await convertLead(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Customer already converted" });
});

test("convertLead successfully converts a Lead to Customer", async () => {
    // 1. Arrange
    const req = { 
        params: { id: MOCK_LEAD_ID }, 
        user: { companyId: MOCK_COMPANY_ID, id: MOCK_USER_ID } 
    };
    const res = { json: jest.fn() };
    mongoose.isValidObjectId.mockReturnValue(true);

    const mockLead = {
        _id: MOCK_LEAD_ID,
        companyId: MOCK_COMPANY_ID,
        status: "Lead",
        leadSource: "Web",
        audit: [],
        save: jest.fn().mockResolvedValue(true),
    };
    
    // Mock for initial findById
    Customer.findById.mockResolvedValueOnce(mockLead); 
    
    // Mock for final population call (line 282)
    const mockPopulatedCustomer = { name: "Converted", assignedTo: [{ name: "Emp" }] };
    Customer.findById.mockImplementationOnce(() => ({
        populate: jest.fn().mockResolvedValue(mockPopulatedCustomer),
    }));

    // 2. Act
    await convertLead(req, res);

    // 3. Assert
    expect(mockLead.status).toBe("Converted");
    expect(mockLead.audit.length).toBe(1);
    expect(mockLead.audit[0].action).toBe("converted");
    expect(mockLead.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Lead converted successfully",
        customer: mockPopulatedCustomer,
    }));
});

// Add these to your 'Customer Controller' describe block in customerControllerUnit.test.js

test("softDeleteCustomer successfully deactivates a customer", async () => {
    // 1. Arrange
    const MOCK_DELETE_ID = "6905d7c0c2e3fbe27a14dcd7";
    const req = { 
        params: { id: MOCK_DELETE_ID }, 
        user: { id: MOCK_USER_ID } 
    };
    const res = { json: jest.fn() };

    const mockCustomer = {
        _id: MOCK_DELETE_ID,
        audit: [],
        save: jest.fn().mockResolvedValue(true),
    };
    Customer.findById.mockResolvedValue(mockCustomer);

    // 2. Act
    await softDeleteCustomer(req, res);

    // 3. Assert
    expect(mockCustomer.state).toBe("deactive");
    expect(mockCustomer.deletedBy).toBe(MOCK_USER_ID);
    expect(mockCustomer.deletedAt).toBeInstanceOf(Date);
    expect(mockCustomer.audit[0].action).toBe("deleted");
    expect(mockCustomer.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalled();
});

// Add these to your 'Customer Controller' describe block in customerControllerUnit.test.js

test("restoreCustomer successfully restores a soft-deleted customer", async () => {
    // 1. Arrange
    const MOCK_RESTORE_ID = "6905d7c0c2e3fbe27a14dcd8";
    const req = { 
        params: { id: MOCK_RESTORE_ID }, 
        user: { id: MOCK_USER_ID } 
    };
    const res = { json: jest.fn() };

    const mockCustomer = {
        _id: MOCK_RESTORE_ID,
        deletedAt: new Date(), // Simulate a deleted customer
        deletedBy: MOCK_USER_ID,
        state: "deactive",
        audit: [],
        save: jest.fn().mockResolvedValue(true),
    };
    Customer.findById.mockResolvedValue(mockCustomer);

    // 2. Act
    await restoreCustomer(req, res);

    // 3. Assert
    expect(mockCustomer.state).toBe("active");
    expect(mockCustomer.deletedBy).toBeNull();
    expect(mockCustomer.deletedAt).toBeNull();
    expect(mockCustomer.audit[0].action).toBe("restored");
    expect(mockCustomer.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalled();
});
});