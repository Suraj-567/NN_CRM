import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import AdminDashboard from "../src/pages/AdminDashboard";

jest.mock("axios");

describe("AdminDashboard", () => {
  test("fetches and displays stats", async () => {
    axios.get.mockResolvedValueOnce({
      data: { totalCompanies: 5, approvedCompanies: 3, totalEmployees: 10 },
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Total CRMs")).toBeInTheDocument();
      expect(screen.getByText("Approved Companies")).toBeInTheDocument();
      expect(screen.getByText("Total Employees")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  });
});
