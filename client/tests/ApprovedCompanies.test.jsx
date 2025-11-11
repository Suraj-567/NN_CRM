import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import ApprovedCompanies from "../src/pages/ApprovedCompanies";

jest.mock("axios");

describe("ApprovedCompanies", () => {
  test("shows no companies message", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    render(<ApprovedCompanies />);
    await waitFor(() =>
      expect(
        screen.getByText("No companies have been approved yet.")
      ).toBeInTheDocument()
    );
  });

  test("displays approved companies table", async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        {
          _id: "1",
          companyName: "TechCorp",
          businessEmail: "t@c.com",
          managerName: "John",
          industry: "IT",
          createdAt: new Date(),
          updatedAt: new Date(),
          employeeCount: 12,
        },
      ],
    });
    render(<ApprovedCompanies />);
    await waitFor(() =>
      expect(screen.getByText("TechCorp")).toBeInTheDocument()
    );
  });
});
