import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import axios from "axios";
import CustomerTickets from "../src/pages/CustomerTickets";

jest.mock("axios");

describe("CustomerTickets", () => {
  beforeEach(() => localStorage.setItem("token", "mockToken"));

  test("renders customer ticket summary", async () => {
    axios.create.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        data: [
          {
            customerId: "1",
            name: "Acme Corp",
            contactName: "John Doe",
            phone: "99999",
            totalRaised: 5,
            totalResolved: 3,
          },
        ],
      }),
    });

    render(<CustomerTickets />);
    await waitFor(() => screen.getByText("Acme Corp"));
  });

  test("opens customer ticket modal", async () => {
    const mockApi = {
      get: jest.fn()
        .mockResolvedValueOnce({
          data: [
            {
              customerId: "1",
              name: "Acme Corp",
              contactName: "John",
              phone: "12345",
              totalRaised: 2,
              totalResolved: 1,
            },
          ],
        })
        .mockResolvedValueOnce({
          data: [
            {
              _id: "t1",
              ticketId: "T-1",
              subject: "Issue",
              category: "Tech",
              priority: "High",
              status: "Open",
              createdAt: new Date(),
              assignedTo: [{ name: "Dev" }],
              audit: [],
            },
          ],
        }),
    };
    axios.create.mockReturnValue(mockApi);

    render(<CustomerTickets />);
    await waitFor(() => screen.getByText("Acme Corp"));

    fireEvent.click(screen.getByText("View"));
    await waitFor(() => screen.getByText("Tickets for Acme Corp"));
  });

  test("handles error during ticket fetch", async () => {
  const mockApi = {
    get: jest.fn().mockRejectedValue(new Error("API fail")),
  };
  axios.create.mockReturnValue(mockApi);
  render(<CustomerTickets />);
  await waitFor(() =>
    expect(screen.getByText("No customers found.")).toBeInTheDocument()
  );
});

});
