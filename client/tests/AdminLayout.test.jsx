import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminLayout from "../src/components/AdminLayout";

describe("AdminLayout", () => {
  test("renders navigation links and logout button", () => {
    render(
      <MemoryRouter initialEntries={["/admin-layout/dashboard"]}>
        <AdminLayout />
      </MemoryRouter>
    );

    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("CRM Approvals")).toBeInTheDocument();
    expect(screen.getByText("Approved Companies")).toBeInTheDocument();

    const logout = screen.getByText("Logout");
    expect(logout).toBeInTheDocument();

    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });

    fireEvent.click(logout);
    expect(window.location.href).toBe("/admin");
  });
});
