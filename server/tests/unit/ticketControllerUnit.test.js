//server/tests/unit/ticketControllerUnit.test.js

import { 
    createTicket, 
    listTickets, 
    getTicket, 
    updateTicket, 
    assignTicket, 
    customerTicketsSummary, 
    getCustomerTickets 
} from "../../controllers/ticketController.js";
import Ticket from "../../models/Ticket.js";
import Customer from "../../models/Customer.js";
import Employee from "../../models/Employee.js";
import mongoose from "mongoose";

// Mock Data
const MOCK_COMPANY_ID = "69037048ebed3d350a595d9f";
const MOCK_USER_ID = "69037048ebed3d350a595d9e";
const MOCK_CUSTOMER_ID = "6905d7c0c2e3fbe27a14dcd3";
const MOCK_EMPLOYEE_ID = "6905d7c0c2e3fbe27a14dca1";
const MOCK_TICKET_DB_ID = "6905d7c0c2e3fbe27a14dcd1";
const MOCK_TICKET_ID_STRING = "TKT-2025-0001";
const MOCK_OTHER_COMPANY_ID = "69037048ebed3d350a595d99";

// --- Mongoose Mock Helpers ---

// Return a promise that resolves to the query result
const mockChainableQuery = (resolvedValue) => {
    const query = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        // Make it thenable so await works
        then: jest.fn((resolve) => {
            resolve(resolvedValue);
            return Promise.resolve(resolvedValue);
        }),
        catch: jest.fn(() => Promise.resolve(resolvedValue)),
    };
    return query;
};

// Mock for populated findById - must be chainable
const mockPopulatedResult = { 
    companyId: MOCK_COMPANY_ID,
    _id: MOCK_TICKET_DB_ID,
    subject: "Populated Ticket",
    ticketId: MOCK_TICKET_ID_STRING,
};

// --- Global Mocks ---

// Create a factory function for ticket instances
let mockTicketInstance;

jest.mock("../../models/Ticket.js", () => {
    const TicketMock = jest.fn();
    
    TicketMock.findById = jest.fn(); 
    TicketMock.find = jest.fn(); 
    TicketMock.findOne = jest.fn();
    TicketMock.countDocuments = jest.fn();
    return TicketMock;
});

jest.mock("../../models/Customer.js", () => ({
    findById: jest.fn(),
    find: jest.fn(),
}));

jest.mock("../../models/Employee.js", () => ({
    find: jest.fn(),
}));

jest.mock("mongoose", () => ({
    isValidObjectId: jest.fn().mockReturnValue(true),
    Schema: Object.assign(jest.fn(() => ({
        methods: {},
        statics: {},
        pre: jest.fn(),
    })), {
        Types: {
            ObjectId: "ObjectId",
        },
    }),
    model: jest.fn(() => ({})),
}));

// --- Test Suite ---

describe("Ticket Controller", () => {
    
    const mockEmployeeQueryHelper = (resolvedValue) => ({
        select: jest.fn().mockResolvedValue(resolvedValue),
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        
        // Create a fresh ticket instance for each test
        mockTicketInstance = {
            _id: MOCK_TICKET_DB_ID,
            audit: [],
            save: jest.fn().mockResolvedValue(true),
        };
        
        // Set the Ticket constructor to return our mock instance
        Ticket.mockImplementation(() => mockTicketInstance);
        
        mongoose.isValidObjectId.mockReturnValue(true);
        Customer.findById.mockResolvedValue({ companyId: MOCK_COMPANY_ID });
        Employee.find.mockImplementation(() => mockEmployeeQueryHelper([{ _id: MOCK_EMPLOYEE_ID, name: "Agent Smith" }]));
        
        // Reset Ticket mocks to default state
        Ticket.findById.mockReset();
        Ticket.find.mockReset();
        Ticket.findOne.mockReset();
        Ticket.countDocuments.mockReset();
    });

    // --- createTicket Tests ---

    test("returns 400 if no companyId in token", async () => {
        const req = { body: {}, user: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        await createTicket(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test("returns 404 if customer not found", async () => {
        const req = { body: { customerId: MOCK_CUSTOMER_ID, subject: "Bug" }, user: { companyId: MOCK_COMPANY_ID } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        Customer.findById.mockResolvedValue(null);
        await createTicket(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test("createTicket returns 400 if subject or customerId are missing", async () => {
        const req = { user: { companyId: MOCK_COMPANY_ID }, body: { customerId: MOCK_CUSTOMER_ID } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        await createTicket(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "customerId and subject required" });
    });

    test("createTicket returns 400 if customerId is invalid format", async () => {
        const req = { user: { companyId: MOCK_COMPANY_ID }, body: { customerId: "bad-id", subject: "Test" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        mongoose.isValidObjectId.mockReturnValue(false); 
        await createTicket(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid customerId" });
    });

    test("createTicket returns 403 if customer belongs to a different company", async () => {
        const req = { user: { companyId: MOCK_OTHER_COMPANY_ID }, body: { customerId: MOCK_CUSTOMER_ID, subject: "Test" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        Customer.findById.mockResolvedValue({ companyId: MOCK_COMPANY_ID }); 
        await createTicket(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: "Customer does not belong to your company" });
    });

    test("createTicket successfully creates a ticket with assigned user and returns 201", async () => {
        const req = {
            user: { companyId: MOCK_COMPANY_ID, id: MOCK_USER_ID, name: "Manager" },
            body: {
                customerId: MOCK_CUSTOMER_ID,
                subject: "New Bug Report",
                assignedTo: MOCK_EMPLOYEE_ID,
                slaDeadline: "2025-12-31T23:59:59.000Z",
            }
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        // Mock the final findById for population
        Ticket.findById.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            then: jest.fn((resolve) => {
                resolve(mockPopulatedResult);
                return Promise.resolve(mockPopulatedResult);
            }),
        });

        await createTicket(req, res);
        
        expect(Ticket).toHaveBeenCalledTimes(1);
        expect(Ticket.mock.calls[0][0].assignedTo).toEqual([MOCK_EMPLOYEE_ID]); 
        expect(mockTicketInstance.audit.length).toBe(1);
        expect(mockTicketInstance.audit[0].action).toBe("created");
        expect(mockTicketInstance.audit[0].note).toContain("assigned to Agent Smith");
        expect(mockTicketInstance.save).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test("createTicket handles server error during save", async () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const req = { user: { companyId: MOCK_COMPANY_ID }, body: { customerId: MOCK_CUSTOMER_ID, subject: "Error" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        mockTicketInstance.save = jest.fn().mockRejectedValue(new Error("Save Failed"));

        await createTicket(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Server error creating ticket" });
        errorSpy.mockRestore();
    });

    test("createTicket creates ticket without assigned employees", async () => {
        const req = {
            user: { companyId: MOCK_COMPANY_ID, id: MOCK_USER_ID, name: "Manager" },
            body: {
                customerId: MOCK_CUSTOMER_ID,
                subject: "Unassigned Ticket",
                // Don't include assignedTo at all
            }
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        // Mock empty employee result
        Employee.find.mockReset();
        Employee.find.mockImplementation(() => mockEmployeeQueryHelper([]));

        Ticket.findById.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            then: jest.fn((resolve) => {
                resolve(mockPopulatedResult);
                return Promise.resolve(mockPopulatedResult);
            }),
        });

        await createTicket(req, res);
        
        expect(mockTicketInstance.audit[0].note).toBe("Ticket created");
        expect(mockTicketInstance.audit[0].note).not.toContain("assigned to");
        expect(res.status).toHaveBeenCalledWith(201);
    });

    // --- listTickets Tests ---

    test("listTickets returns tickets when no filters are applied", async () => {
        const req = { user: { companyId: MOCK_COMPANY_ID }, query: {} };
        const res = { json: jest.fn() };
        const mockTickets = [{ id: "t1" }, { id: "t2" }];

        Ticket.find.mockReturnValue(mockChainableQuery(mockTickets)); 
        
        await listTickets(req, res);

        expect(Ticket.find).toHaveBeenCalledWith({ companyId: MOCK_COMPANY_ID });
        expect(res.json).toHaveBeenCalledWith(mockTickets); 
    });

    test("listTickets applies filters and search query correctly", async () => {
        const req = { 
            user: { companyId: MOCK_COMPANY_ID }, 
            query: { status: "Open", search: "TKT-2025" } 
        };
        const res = { json: jest.fn() };
        
        Ticket.find.mockReturnValue(mockChainableQuery([]));
        
        await listTickets(req, res);

        expect(Ticket.find).toHaveBeenCalledWith(
            expect.objectContaining({
                companyId: MOCK_COMPANY_ID,
                status: "Open",
                $or: expect.arrayContaining([
                    expect.objectContaining({ ticketId: expect.any(RegExp) }),
                ]),
            })
        );
    });

    test("listTickets applies priority and category filters", async () => {
        const req = { 
            user: { companyId: MOCK_COMPANY_ID }, 
            query: { priority: "High", category: "Bug" } 
        };
        const res = { json: jest.fn() };
        
        Ticket.find.mockReturnValue(mockChainableQuery([]));
        
        await listTickets(req, res);

        expect(Ticket.find).toHaveBeenCalledWith(
            expect.objectContaining({
                companyId: MOCK_COMPANY_ID,
                priority: "High",
                category: "Bug",
            })
        );
    });

    test("listTickets handles server error during listing", async () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const req = { user: { companyId: MOCK_COMPANY_ID }, query: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }; 
        
        // Mock find to throw error immediately
        Ticket.find.mockImplementation(() => {
            throw new Error("DB Read Failed");
        });
        
        await listTickets(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        errorSpy.mockRestore();
    });

    test("listTickets returns 400 if companyId missing", async () => {
        const req = { user: {}, query: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        await listTickets(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    // --- getTicket Tests ---
    
    test("getTicket returns 400 if companyId missing", async () => {
        const req = { user: {}, params: { id: MOCK_TICKET_DB_ID } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        await getTicket(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test("getTicket successfully finds and returns ticket by Mongoose ID", async () => {
        const req = { user: { companyId: MOCK_COMPANY_ID }, params: { id: MOCK_TICKET_DB_ID } };
        const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }; 
        
        mongoose.isValidObjectId.mockReturnValue(true);
        
        // First findById call returns the ticket (no populate)
        Ticket.findById
            .mockResolvedValueOnce({ _id: MOCK_TICKET_DB_ID, companyId: MOCK_COMPANY_ID })
            // Second findById call (for population) returns chainable
            .mockReturnValueOnce({
                populate: jest.fn().mockReturnThis(),
                then: jest.fn((resolve) => {
                    resolve(mockPopulatedResult);
                    return Promise.resolve(mockPopulatedResult);
                }),
            });
        
        await getTicket(req, res);

        expect(Ticket.findById).toHaveBeenCalledWith(MOCK_TICKET_DB_ID); 
        expect(res.json).toHaveBeenCalledWith(mockPopulatedResult); 
    });

    test("getTicket successfully finds and returns ticket by custom ticketId string", async () => {
        const req = { user: { companyId: MOCK_COMPANY_ID }, params: { id: MOCK_TICKET_ID_STRING } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }; 
        
        mongoose.isValidObjectId.mockReturnValue(false);
        
        const mockTicket = { _id: MOCK_TICKET_DB_ID, companyId: MOCK_COMPANY_ID, ticketId: MOCK_TICKET_ID_STRING };

        // When isValidObjectId is false, findById is not called for the first check
        // findOne finds by ticketId
        Ticket.findOne.mockResolvedValueOnce(mockTicket); 
        // Final findById for population
        Ticket.findById.mockReturnValueOnce({
            populate: jest.fn().mockReturnThis(),
            then: jest.fn((resolve) => {
                resolve(mockPopulatedResult);
                return Promise.resolve(mockPopulatedResult);
            }),
        });

        await getTicket(req, res);

        expect(Ticket.findOne).toHaveBeenCalledWith({ ticketId: MOCK_TICKET_ID_STRING });
        expect(res.json).toHaveBeenCalledWith(mockPopulatedResult);
    });

    test("getTicket returns 404 if ticket is not found by either ID or ticketId", async () => {
        const req = { user: { companyId: MOCK_COMPANY_ID }, params: { id: MOCK_TICKET_ID_STRING } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        mongoose.isValidObjectId.mockReturnValue(false);
        
        Ticket.findById.mockResolvedValue(null);
        Ticket.findOne.mockResolvedValue(null);

        await getTicket(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test("getTicket returns 403 if ticket belongs to a different company", async () => {
        const req = { user: { companyId: MOCK_COMPANY_ID }, params: { id: MOCK_TICKET_DB_ID } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        
        mongoose.isValidObjectId.mockReturnValue(true);
        
        // First findById returns ticket with wrong company (and stops there)
        Ticket.findById.mockResolvedValueOnce({ 
            _id: MOCK_TICKET_DB_ID,
            companyId: MOCK_OTHER_COMPANY_ID 
        }); 

        await getTicket(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
    });

    test("getTicket handles server error during database lookup", async () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const req = { user: { companyId: MOCK_COMPANY_ID }, params: { id: MOCK_TICKET_DB_ID } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        mongoose.isValidObjectId.mockReturnValue(true);
        
        Ticket.findById.mockRejectedValue(new Error("DB Error"));

        await getTicket(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        errorSpy.mockRestore();
    });

    // --- updateTicket Tests ---

    test("updateTicket returns 400 if companyId missing", async () => {
        const req = { user: {}, params: { id: MOCK_TICKET_DB_ID }, body: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        await updateTicket(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test("updateTicket returns 400 if ticket id is invalid", async () => {
        const req = { user: { companyId: MOCK_COMPANY_ID }, params: { id: "bad-id" }, body: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        mongoose.isValidObjectId.mockReturnValue(false);
        await updateTicket(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test("updateTicket returns 404 if ticket not found", async () => {
        const req = { user: { companyId: MOCK_COMPANY_ID }, params: { id: MOCK_TICKET_DB_ID }, body: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        Ticket.findById.mockResolvedValue(null);
        await updateTicket(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test("updateTicket returns 403 if ticket belongs to different company", async () => {
        const req = { user: { companyId: MOCK_COMPANY_ID }, params: { id: MOCK_TICKET_DB_ID }, body: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        Ticket.findById.mockResolvedValue({ companyId: MOCK_OTHER_COMPANY_ID });
        await updateTicket(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test("updateTicket successfully updates ticket status", async () => {
        const req = {
            user: { companyId: MOCK_COMPANY_ID, id: MOCK_USER_ID, name: "Manager" },
            params: { id: MOCK_TICKET_DB_ID },
            body: { status: "Resolved" }
        };
        const res = { json: jest.fn() };

        const mockTicket = {
            _id: MOCK_TICKET_DB_ID,
            companyId: MOCK_COMPANY_ID,
            status: "Open",
            assignedTo: [],
            audit: [],
            save: jest.fn().mockResolvedValue(true),
        };

        Ticket.findById
            .mockResolvedValueOnce(mockTicket)
            .mockReturnValueOnce({
                populate: jest.fn().mockReturnThis(),
                then: jest.fn((resolve) => {
                    resolve(mockPopulatedResult);
                    return Promise.resolve(mockPopulatedResult);
                }),
            });

        await updateTicket(req, res);

        expect(mockTicket.status).toBe("Resolved");
        expect(mockTicket.audit.length).toBe(1);
        expect(mockTicket.audit[0].action).toBe("updated");
        expect(mockTicket.save).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Ticket updated" }));
    });

    test("updateTicket updates assignedTo and tracks changes", async () => {
        const req = {
            user: { companyId: MOCK_COMPANY_ID, id: MOCK_USER_ID, name: "Manager" },
            params: { id: MOCK_TICKET_DB_ID },
            body: { assignedTo: [MOCK_EMPLOYEE_ID] }
        };
        const res = { json: jest.fn() };

        const mockTicket = {
            _id: MOCK_TICKET_DB_ID,
            companyId: MOCK_COMPANY_ID,
            assignedTo: [],
            audit: [],
            save: jest.fn().mockResolvedValue(true),
        };

        Ticket.findById
            .mockResolvedValueOnce(mockTicket)
            .mockReturnValueOnce({
                populate: jest.fn().mockReturnThis(),
                then: jest.fn((resolve) => {
                    resolve(mockPopulatedResult);
                    return Promise.resolve(mockPopulatedResult);
                }),
            });

        Employee.find.mockImplementation(() => {
            const helper = mockEmployeeQueryHelper([{ _id: MOCK_EMPLOYEE_ID, name: "Agent Smith" }]);
            return helper;
        });

        await updateTicket(req, res);

        expect(mockTicket.assignedTo).toEqual([MOCK_EMPLOYEE_ID]);
        expect(mockTicket.audit[0].diff.assignedTo).toBeDefined();
        expect(res.json).toHaveBeenCalled();
    });

    test("updateTicket handles server error", async () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const req = {
            user: { companyId: MOCK_COMPANY_ID },
            params: { id: MOCK_TICKET_DB_ID },
            body: { status: "Resolved" }
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        Ticket.findById.mockRejectedValue(new Error("DB Error"));

        await updateTicket(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        errorSpy.mockRestore();
    });

    test("updateTicket updates multiple fields including slaDeadline", async () => {
        const req = {
            user: { companyId: MOCK_COMPANY_ID, id: MOCK_USER_ID, name: "Manager" },
            params: { id: MOCK_TICKET_DB_ID },
            body: { 
                subject: "Updated Subject",
                priority: "High",
                slaDeadline: "2025-12-31T23:59:59.000Z"
            }
        };
        const res = { json: jest.fn() };

        const mockTicket = {
            _id: MOCK_TICKET_DB_ID,
            companyId: MOCK_COMPANY_ID,
            subject: "Old Subject",
            priority: "Low",
            slaDeadline: null,
            assignedTo: [],
            audit: [],
            save: jest.fn().mockResolvedValue(true),
        };

        Ticket.findById
            .mockResolvedValueOnce(mockTicket)
            .mockReturnValueOnce({
                populate: jest.fn().mockReturnThis(),
                then: jest.fn((resolve) => {
                    resolve(mockPopulatedResult);
                    return Promise.resolve(mockPopulatedResult);
                }),
            });

        await updateTicket(req, res);

        expect(mockTicket.subject).toBe("Updated Subject");
        expect(mockTicket.priority).toBe("High");
        expect(mockTicket.audit[0].diff.subject).toBeDefined();
        expect(mockTicket.audit[0].diff.priority).toBeDefined();
        expect(mockTicket.audit[0].diff.slaDeadline).toBeDefined();
        expect(res.json).toHaveBeenCalled();
    });

    // --- assignTicket Tests ---

    test("assignTicket delegates to updateTicket", async () => {
        const req = {
            user: { companyId: MOCK_COMPANY_ID, id: MOCK_USER_ID, name: "Manager" },
            params: { id: MOCK_TICKET_DB_ID },
            body: { assignedTo: [MOCK_EMPLOYEE_ID] }
        };
        const res = { json: jest.fn() };

        const mockTicket = {
            _id: MOCK_TICKET_DB_ID,
            companyId: MOCK_COMPANY_ID,
            assignedTo: [],
            audit: [],
            save: jest.fn().mockResolvedValue(true),
        };

        Ticket.findById
            .mockResolvedValueOnce(mockTicket)
            .mockReturnValueOnce({
                populate: jest.fn().mockReturnThis(),
                then: jest.fn((resolve) => {
                    resolve(mockPopulatedResult);
                    return Promise.resolve(mockPopulatedResult);
                }),
            });

        await assignTicket(req, res);

        expect(mockTicket.assignedTo).toEqual([MOCK_EMPLOYEE_ID]);
        expect(res.json).toHaveBeenCalled();
    });

    // --- customerTicketsSummary Tests ---

    test("customerTicketsSummary returns summary for all customers", async () => {
        const req = { user: { companyId: MOCK_COMPANY_ID } };
        const res = { json: jest.fn() };

        const mockCustomers = [
            { _id: MOCK_CUSTOMER_ID, name: "Acme Corp", contactName: "John", email: "john@acme.com", phone: "123" }
        ];

        Customer.find.mockImplementation(() => ({
            select: jest.fn().mockResolvedValue(mockCustomers)
        }));

        Ticket.countDocuments.mockResolvedValueOnce(10); // totalRaised
        Ticket.countDocuments.mockResolvedValueOnce(5);  // totalResolved

        await customerTicketsSummary(req, res);

        expect(Customer.find).toHaveBeenCalledWith({ companyId: MOCK_COMPANY_ID });
        expect(res.json).toHaveBeenCalledWith([
            expect.objectContaining({
                customerId: MOCK_CUSTOMER_ID,
                totalRaised: 10,
                totalResolved: 5,
            })
        ]);
    });

    test("customerTicketsSummary returns 400 if companyId missing", async () => {
        const req = { user: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        await customerTicketsSummary(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test("customerTicketsSummary handles server error", async () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const req = { user: { companyId: MOCK_COMPANY_ID } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        Customer.find.mockImplementation(() => {
            throw new Error("DB Error");
        });

        await customerTicketsSummary(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        errorSpy.mockRestore();
    });

    // --- getCustomerTickets Tests ---

    test("getCustomerTickets returns tickets for a specific customer", async () => {
        const req = {
            user: { companyId: MOCK_COMPANY_ID },
            params: { customerId: MOCK_CUSTOMER_ID }
        };
        const res = { json: jest.fn() };

        const mockTickets = [{ _id: "t1", subject: "Issue 1" }];
        Ticket.find.mockReturnValue(mockChainableQuery(mockTickets));

        await getCustomerTickets(req, res);

        expect(Ticket.find).toHaveBeenCalledWith({ companyId: MOCK_COMPANY_ID, customerId: MOCK_CUSTOMER_ID });
        expect(res.json).toHaveBeenCalledWith(mockTickets);
    });

    test("getCustomerTickets returns 400 if companyId missing", async () => {
        const req = { user: {}, params: { customerId: MOCK_CUSTOMER_ID } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        await getCustomerTickets(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test("getCustomerTickets returns 400 if customerId invalid", async () => {
        const req = { user: { companyId: MOCK_COMPANY_ID }, params: { customerId: "bad-id" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        mongoose.isValidObjectId.mockReturnValue(false);
        await getCustomerTickets(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test("getCustomerTickets handles server error", async () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const req = {
            user: { companyId: MOCK_COMPANY_ID },
            params: { customerId: MOCK_CUSTOMER_ID }
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        Ticket.find.mockImplementation(() => {
            throw new Error("DB Error");
        });

        await getCustomerTickets(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        errorSpy.mockRestore();
    });
});