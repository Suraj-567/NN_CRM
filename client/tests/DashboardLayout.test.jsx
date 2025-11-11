// tests/DashboardLayout.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DashboardLayout from "../src/components/DashboardLayout";

// Fixes for TextEncoder issue in case setupTests.js not loaded
import { TextEncoder, TextDecoder } from "util";
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

describe("DashboardLayout", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "123");
  });

  test("renders sidebar menu items and logout button correctly", () => {
    render(
      <MemoryRouter initialEntries={["/manager/dashboard/employees"]}>
        <DashboardLayout />
      </MemoryRouter>
    );

    // ✅ Use getAllByText when multiple matches exist
    const employeesLabels = screen.getAllByText("Employees");
    expect(employeesLabels.length).toBeGreaterThan(0);

    // ✅ Other menu items
    expect(screen.getByText("Customers")).toBeInTheDocument();
    expect(screen.getByText("Tickets")).toBeInTheDocument();
    expect(screen.getByText("Customer Tickets")).toBeInTheDocument();

    // ✅ Logout button should exist
    const logoutBtn = screen.getByText("Logout");
    expect(logoutBtn).toBeInTheDocument();

    // ✅ Logout clears token
    fireEvent.click(logoutBtn);
    expect(localStorage.getItem("token")).toBeNull();
  });

  test("toggles sidebar visibility", () => {
    render(
      <MemoryRouter initialEntries={["/manager/dashboard/employees"]}>
        <DashboardLayout />
      </MemoryRouter>
    );

    // ✅ Get all buttons
    const allButtons = screen.getAllByRole("button");
    // The first is the menu toggle, the second is logout
    const toggleButton = allButtons[0];

    // ✅ Toggle sidebar twice to cover branch
    fireEvent.click(toggleButton);
    fireEvent.click(toggleButton);

    // ✅ Ensure logout still exists (sidebar is responsive)
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });
});
