import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import axios from "axios";
import CustomerTickets from "../src/pages/CustomerTickets";

// Mock the axios library
jest.mock("axios");

// Mock framer-motion to avoid animation issues in tests
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    tr: ({ children, ...props }) => <tr {...props}>{children}</tr>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe("CustomerTickets", () => {
  let mockApi;
  const mockCustomerSummary = [
    {
      customerId: "1",
      name: "Acme Corp",
      contactName: "John Doe",
      phone: "99999",
      totalRaised: 5,
      totalResolved: 3,
    },
    {
      customerId: "2",
      name: "Beta Inc",
      contactName: "Jane Smith",
      phone: "11111",
      totalRaised: 10,
      totalResolved: 10,
    },
  ];

  const mockCustomerTickets = [
    {
      _id: "t1",
      ticketId: "T-1",
      subject: "Issue 1",
      description: "Description 1",
      category: "Tech",
      priority: "High",
      status: "Open",
      createdAt: new Date("2024-01-15T10:00:00Z").toISOString(),
      assignedTo: [{ _id: "e1", name: "Dev 1" }],
      audit: [
        {
          at: new Date("2024-01-15T10:00:00Z").toISOString(),
          action: "created",
          byName: "System",
        },
      ],
    },
    {
      _id: "t2",
      ticketId: "T-2",
      subject: "Issue 2",
      description: "Description 2",
      category: "Billing",
      priority: "Low",
      status: "Closed",
      createdAt: new Date("2024-01-16T10:00:00Z").toISOString(),
      assignedTo: [],
      audit: [],
    },
  ];

  beforeEach(() => {
    localStorage.setItem("token", "mockToken");
    mockApi = {
      get: jest.fn().mockResolvedValue({
        data: mockCustomerSummary,
      }),
    };
    axios.create.mockReturnValue(mockApi);
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // --- Initial Load Tests ---
  test("1. renders customer ticket summary and checks totals", async () => {
    render(<CustomerTickets />);

    // Check if the table loads
    await waitFor(() => expect(screen.getByText("Acme Corp")).toBeInTheDocument());
    expect(screen.getByText("Beta Inc")).toBeInTheDocument();

    // Check overall summary stats
    const totalCustomers = mockCustomerSummary.length;
    const totalRaised = mockCustomerSummary.reduce((acc, c) => acc + c.totalRaised, 0);
    const totalResolved = mockCustomerSummary.reduce((acc, c) => acc + c.totalResolved, 0);

    // Find Total Customers card value
    const customerCards = screen.getAllByText(totalCustomers.toString());
    expect(customerCards.length).toBeGreaterThan(0);

    // Find Total Tickets
    expect(screen.getByText(totalRaised.toString())).toBeInTheDocument();

    // Find Resolved Tickets
    expect(screen.getByText(totalResolved.toString())).toBeInTheDocument();

    // Check Resolution Rate calculation
    expect(screen.getByText("60%")).toBeInTheDocument(); // Acme (3/5)
    expect(screen.getByText("100%")).toBeInTheDocument(); // Beta (10/10)
  });

  test("2. displays empty state when no summary data is returned", async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] });
    render(<CustomerTickets />);

    await waitFor(() => expect(screen.getByText("No customers found")).toBeInTheDocument());
    expect(screen.getByText("Customer data will appear here once available")).toBeInTheDocument();
  });

  test("3. handles fetchSummary API error gracefully", async () => {
    mockApi.get.mockRejectedValueOnce(new Error("API fail"));
    render(<CustomerTickets />);

    await waitFor(() => expect(screen.getByText("No customers found")).toBeInTheDocument());
    expect(console.error).toHaveBeenCalled();
  });

  // --- Modal Interaction Tests ---
  test("4. opens and closes customer ticket modal correctly", async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: mockCustomerSummary })
      .mockResolvedValueOnce({ data: mockCustomerTickets });

    render(<CustomerTickets />);
    await waitFor(() => screen.getByText("Acme Corp"));

    // Open Modal
    const viewButtons = screen.getAllByText("View History");
    fireEvent.click(viewButtons[0]);

    await waitFor(() => expect(screen.getByText("Ticket History")).toBeInTheDocument());
    expect(screen.getByText("Issue 1")).toBeInTheDocument();

    // Close Modal - find the close button by class or test the X icon
    const closeButtons = screen.getAllByRole("button");
    const closeButton = closeButtons.find((btn) => {
      const svg = btn.querySelector("svg");
      return svg !== null && btn.className.includes("text-gray-400");
    });

    if (closeButton) {
      fireEvent.click(closeButton);
    }

    await waitFor(() => expect(screen.queryByText("Ticket History")).not.toBeInTheDocument());
  });

  test("5. displays ticket details and modal stats correctly", async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: mockCustomerSummary })
      .mockResolvedValueOnce({ data: mockCustomerTickets });

    render(<CustomerTickets />);
    await waitFor(() => screen.getByText("Acme Corp"));

    fireEvent.click(screen.getAllByText("View History")[0]);
    await waitFor(() => expect(screen.getByText("Ticket History")).toBeInTheDocument());

    // Check Modal Summary Stats - use getAllByText since "Total Tickets" appears in both main page and modal
    const totalTicketsLabels = screen.getAllByText("Total Tickets");
    expect(totalTicketsLabels.length).toBeGreaterThanOrEqual(1);
    
    expect(screen.getByText("Open Tickets")).toBeInTheDocument();
    expect(screen.getByText("Closed Tickets")).toBeInTheDocument();

    // Verify ticket count - should show 2 in the modal
    const allTwoTexts = screen.getAllByText("2");
    const totalTicketsInModal = allTwoTexts.find((el) => {
      return el.className.includes("text-2xl") && el.className.includes("text-blue-400");
    });
    expect(totalTicketsInModal).toBeInTheDocument();

    // Check specific ticket details
    expect(screen.getByText("T-1")).toBeInTheDocument();
    expect(screen.getByText("Issue 1")).toBeInTheDocument();
    expect(screen.getByText("Description 1")).toBeInTheDocument();
    expect(screen.getByText("Dev 1")).toBeInTheDocument();

    // Check T-2 details
    expect(screen.getByText("T-2")).toBeInTheDocument();
    expect(screen.getByText("Issue 2")).toBeInTheDocument();
  });

  test("6. handles openCustomer API error gracefully", async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: mockCustomerSummary })
      .mockRejectedValueOnce(new Error("Customer tickets API fail"));

    render(<CustomerTickets />);
    await waitFor(() => screen.getByText("Acme Corp"));

    // Open Modal
    fireEvent.click(screen.getAllByText("View History")[0]);
    await waitFor(() => expect(screen.getByText("Ticket History")).toBeInTheDocument());

    // Check if the empty state message appears
    expect(screen.getByText("No Tickets Found")).toBeInTheDocument();
    // Use regex or partial match to handle apostrophe encoding
    expect(screen.getByText(/This customer.*raised any tickets yet/i)).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });

  test("7. displays 'No audit history available' when audit array is empty", async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: mockCustomerSummary })
      .mockResolvedValueOnce({ data: [mockCustomerTickets[1]] }); // T-2 with empty audit

    render(<CustomerTickets />);
    await waitFor(() => screen.getByText("Acme Corp"));

    fireEvent.click(screen.getAllByText("View History")[0]);
    await waitFor(() => expect(screen.getByText("T-2")).toBeInTheDocument());

    // Check if the 'No audit history available' message is present
    expect(screen.getByText("No audit history available")).toBeInTheDocument();
  });

  test("8. displays correct priority and status colors", async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: mockCustomerSummary })
      .mockResolvedValueOnce({ data: mockCustomerTickets });

    render(<CustomerTickets />);
    await waitFor(() => screen.getByText("Acme Corp"));

    fireEvent.click(screen.getAllByText("View History")[0]);
    await waitFor(() => expect(screen.getByText("T-1")).toBeInTheDocument());

    // Check for priority badges
    const highPriority = screen.getByText("High");
    expect(highPriority).toBeInTheDocument();
    expect(highPriority.className).toContain("text-orange-400");

    const lowPriority = screen.getByText("Low");
    expect(lowPriority).toBeInTheDocument();
    expect(lowPriority.className).toContain("text-green-400");

    // Check for status badges
    const openStatus = screen.getByText("Open");
    expect(openStatus).toBeInTheDocument();
    expect(openStatus.className).toContain("text-blue-400");

    const closedStatus = screen.getByText("Closed");
    expect(closedStatus).toBeInTheDocument();
    expect(closedStatus.className).toContain("text-gray-400");
  });

  test("9. displays unassigned message when no employees assigned", async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: mockCustomerSummary })
      .mockResolvedValueOnce({ data: [mockCustomerTickets[1]] }); // T-2 with no assignedTo

    render(<CustomerTickets />);
    await waitFor(() => screen.getByText("Acme Corp"));

    fireEvent.click(screen.getAllByText("View History")[0]);
    await waitFor(() => expect(screen.getByText("T-2")).toBeInTheDocument());

    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  test("10. renders audit trail with proper formatting", async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: mockCustomerSummary })
      .mockResolvedValueOnce({ data: [mockCustomerTickets[0]] }); // T-1 with audit

    render(<CustomerTickets />);
    await waitFor(() => screen.getByText("Acme Corp"));

    fireEvent.click(screen.getAllByText("View History")[0]);
    await waitFor(() => expect(screen.getByText("T-1")).toBeInTheDocument());

    // Check audit trail elements
    expect(screen.getByText("Audit Trail")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
    
    // Check for the "created" action badge
    const createdBadge = screen.getByText("created");
    expect(createdBadge).toBeInTheDocument();
    expect(createdBadge.className).toContain("text-purple-400");
  });

  test("11. displays audit trail with note when available", async () => {
    const ticketWithNote = {
      ...mockCustomerTickets[0],
      audit: [
        {
          at: new Date("2024-01-15T10:00:00Z").toISOString(),
          action: "updated",
          byName: "Admin User",
          note: "This is a test note",
        },
      ],
    };

    mockApi.get
      .mockResolvedValueOnce({ data: mockCustomerSummary })
      .mockResolvedValueOnce({ data: [ticketWithNote] });

    render(<CustomerTickets />);
    await waitFor(() => screen.getByText("Acme Corp"));

    fireEvent.click(screen.getAllByText("View History")[0]);
    await waitFor(() => expect(screen.getByText("T-1")).toBeInTheDocument());

    // Check if note is displayed
    expect(screen.getByText('"This is a test note"')).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
  });

  test("12. tests all priority color variants", async () => {
    const ticketsWithAllPriorities = [
      { ...mockCustomerTickets[0], priority: "Critical", ticketId: "T-C" },
      { ...mockCustomerTickets[0], priority: "High", ticketId: "T-H", _id: "t3" },
      { ...mockCustomerTickets[0], priority: "Medium", ticketId: "T-M", _id: "t4" },
      { ...mockCustomerTickets[0], priority: "Low", ticketId: "T-L", _id: "t5" },
    ];

    mockApi.get
      .mockResolvedValueOnce({ data: mockCustomerSummary })
      .mockResolvedValueOnce({ data: ticketsWithAllPriorities });

    render(<CustomerTickets />);
    await waitFor(() => screen.getByText("Acme Corp"));

    fireEvent.click(screen.getAllByText("View History")[0]);
    await waitFor(() => expect(screen.getByText("T-C")).toBeInTheDocument());

    // Check Critical priority
    const criticalBadge = screen.getByText("Critical");
    expect(criticalBadge.className).toContain("text-red-400");

    // Check High priority
    const highBadge = screen.getByText("High");
    expect(highBadge.className).toContain("text-orange-400");

    // Check Medium priority
    const mediumBadge = screen.getByText("Medium");
    expect(mediumBadge.className).toContain("text-yellow-400");

    // Check Low priority
    const lowBadge = screen.getByText("Low");
    expect(lowBadge.className).toContain("text-green-400");
  });

  test("13. tests default priority and status colors for unknown values", async () => {
    const ticketWithUnknownValues = {
      ...mockCustomerTickets[0],
      priority: "Unknown",
      status: "Pending",
      ticketId: "T-U",
    };

    mockApi.get
      .mockResolvedValueOnce({ data: mockCustomerSummary })
      .mockResolvedValueOnce({ data: [ticketWithUnknownValues] });

    render(<CustomerTickets />);
    await waitFor(() => screen.getByText("Acme Corp"));

    fireEvent.click(screen.getAllByText("View History")[0]);
    await waitFor(() => expect(screen.getByText("T-U")).toBeInTheDocument());

    // Check unknown priority gets default color
    const unknownPriorityBadge = screen.getByText("Unknown");
    expect(unknownPriorityBadge.className).toContain("text-gray-400");

    // Check unknown status gets default color (purple)
    const pendingStatusBadge = screen.getByText("Pending");
    expect(pendingStatusBadge.className).toContain("text-purple-400");
  });

  test("14. calculates resolution rate correctly for edge cases", async () => {
    const edgeCaseCustomers = [
      {
        customerId: "3",
        name: "Zero Corp",
        contactName: "Zero User",
        phone: "00000",
        totalRaised: 0,
        totalResolved: 0,
      },
      {
        customerId: "4",
        name: "Partial Corp",
        contactName: "Partial User",
        phone: "12345",
        totalRaised: 7,
        totalResolved: 2,
      },
    ];

    mockApi.get.mockResolvedValueOnce({ data: edgeCaseCustomers });
    render(<CustomerTickets />);

    await waitFor(() => screen.getByText("Zero Corp"));

    // Check 0% resolution rate (0/0)
    expect(screen.getByText("0%")).toBeInTheDocument();

    // Check 29% resolution rate (2/7 = 28.57% rounds to 29%)
    expect(screen.getByText("29%")).toBeInTheDocument();
  });

  test("15. displays ticket with missing description gracefully", async () => {
    const ticketWithoutDescription = {
      ...mockCustomerTickets[0],
      description: null,
      ticketId: "T-NO-DESC",
    };

    mockApi.get
      .mockResolvedValueOnce({ data: mockCustomerSummary })
      .mockResolvedValueOnce({ data: [ticketWithoutDescription] });

    render(<CustomerTickets />);
    await waitFor(() => screen.getByText("Acme Corp"));

    fireEvent.click(screen.getAllByText("View History")[0]);
    await waitFor(() => expect(screen.getByText("T-NO-DESC")).toBeInTheDocument());

    // Should show fallback text
    expect(screen.getByText("No description provided")).toBeInTheDocument();
  });
});