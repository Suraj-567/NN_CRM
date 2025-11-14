import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import BusinessLogin from "../src/pages/BusinessLogin";

// Mock axios
jest.mock("axios");

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Briefcase: () => <div data-testid="briefcase-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
  AlertTriangle: () => <div data-testid="alert-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
}));

// Helper function to render with router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("BusinessLogin", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    // Only restore mocks that we created in this test file
    mockNavigate.mockClear();
  });

  // --- Rendering Tests ---
  test("1. renders login form with all elements", () => {
    renderWithRouter(<BusinessLogin />);

    // Check title
    expect(screen.getByText("Business Manager Login")).toBeInTheDocument();

    // Check icons are rendered
    expect(screen.getByTestId("briefcase-icon")).toBeInTheDocument();
    expect(screen.getByTestId("mail-icon")).toBeInTheDocument();
    expect(screen.getByTestId("lock-icon")).toBeInTheDocument();

    // Check form inputs
    expect(screen.getByPlaceholderText("Email Address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();

    // Check login button
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();

    // Check links
    expect(screen.getByText("Don`'t have an account?")).toBeInTheDocument();
    expect(screen.getByText("Register your company")).toBeInTheDocument();
    expect(screen.getByText("Are you an employee?")).toBeInTheDocument();
  });

  test("2. has correct links with proper href attributes", () => {
    renderWithRouter(<BusinessLogin />);

    const registerLink = screen.getByText("Register your company");
    expect(registerLink.closest("a")).toHaveAttribute("href", "/register");

    const employeeLink = screen.getByText("Are you an employee?");
    expect(employeeLink.closest("a")).toHaveAttribute("href", "/employee");
  });

  // --- Input Handling Tests ---
  test("3. updates email input on change", () => {
    renderWithRouter(<BusinessLogin />);

    const emailInput = screen.getByPlaceholderText("Email Address");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    expect(emailInput.value).toBe("test@example.com");
  });

  test("4. updates password input on change", () => {
    renderWithRouter(<BusinessLogin />);

    const passwordInput = screen.getByPlaceholderText("Password");
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(passwordInput.value).toBe("password123");
  });

  // --- Successful Login Tests ---
  test("5. handles successful login and navigates to dashboard", async () => {
    const mockToken = "mock-jwt-token-12345";
    axios.post.mockResolvedValueOnce({
      data: { token: mockToken },
    });

    renderWithRouter(<BusinessLogin />);

    // Fill in form
    const emailInput = screen.getByPlaceholderText("Email Address");
    const passwordInput = screen.getByPlaceholderText("Password");
    const loginButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(emailInput, { target: { value: "manager@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    // Submit form
    fireEvent.click(loginButton);

    // Wait for async operations
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:5001/api/auth/login",
        {
          email: "manager@test.com",
          password: "password123",
        }
      );
    });

    // Check token stored in localStorage
    expect(localStorage.getItem("token")).toBe(mockToken);

    // Check navigation
    expect(mockNavigate).toHaveBeenCalledWith("/manager/dashboard");
  });

  test("6. shows loading state during login request", async () => {
    // Mock a delayed response
    axios.post.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { token: "test-token" } }), 100)
        )
    );

    renderWithRouter(<BusinessLogin />);

    const emailInput = screen.getByPlaceholderText("Email Address");
    const passwordInput = screen.getByPlaceholderText("Password");
    const loginButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(emailInput, { target: { value: "test@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "password" } });

    // Submit form
    fireEvent.click(loginButton);

    // Check loading state is shown
    await waitFor(() => {
      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    });

    // Check button is disabled during loading
    expect(loginButton).toBeDisabled();

    // Check inputs are disabled during loading
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();

    // Wait for completion
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  // --- Error Handling Tests ---
  test("7. displays error message on login failure with response message", async () => {
    const errorMessage = "Invalid credentials";
    axios.post.mockRejectedValueOnce({
      response: {
        data: { message: errorMessage },
      },
    });

    renderWithRouter(<BusinessLogin />);

    const emailInput = screen.getByPlaceholderText("Email Address");
    const passwordInput = screen.getByPlaceholderText("Password");
    const loginButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(emailInput, { target: { value: "wrong@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpass" } });

    fireEvent.click(loginButton);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Check error icon is displayed
    expect(screen.getByTestId("alert-icon")).toBeInTheDocument();

    // Verify navigation did not occur
    expect(mockNavigate).not.toHaveBeenCalled();

    // Verify token was not stored
    expect(localStorage.getItem("token")).toBeNull();
  });

  test("8. displays generic error message when no response message available", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network error"));

    renderWithRouter(<BusinessLogin />);

    const emailInput = screen.getByPlaceholderText("Email Address");
    const passwordInput = screen.getByPlaceholderText("Password");
    const loginButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(emailInput, { target: { value: "test@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "password" } });

    fireEvent.click(loginButton);

    // Wait for generic error message
    await waitFor(() => {
      expect(screen.getByText("Login failed")).toBeInTheDocument();
    });
  });

  test("9. clears previous error when submitting again", async () => {
    // First request fails
    axios.post.mockRejectedValueOnce({
      response: { data: { message: "First error" } },
    });

    renderWithRouter(<BusinessLogin />);

    const emailInput = screen.getByPlaceholderText("Email Address");
    const passwordInput = screen.getByPlaceholderText("Password");
    const loginButton = screen.getByRole("button", { name: /login/i });

    // First attempt
    fireEvent.change(emailInput, { target: { value: "test@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrong" } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText("First error")).toBeInTheDocument();
    });

    // Second request succeeds
    axios.post.mockResolvedValueOnce({ data: { token: "success-token" } });

    // Second attempt
    fireEvent.change(passwordInput, { target: { value: "correct" } });
    fireEvent.click(loginButton);

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText("First error")).not.toBeInTheDocument();
    });

    // Should navigate on success
    expect(mockNavigate).toHaveBeenCalledWith("/manager/dashboard");
  });

  test("10. re-enables inputs and button after failed login", async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { message: "Login failed" } },
    });

    renderWithRouter(<BusinessLogin />);

    const emailInput = screen.getByPlaceholderText("Email Address");
    const passwordInput = screen.getByPlaceholderText("Password");
    const loginButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(emailInput, { target: { value: "test@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "password" } });
    fireEvent.click(loginButton);

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText("Login failed")).toBeInTheDocument();
    });

    // Check that inputs and button are re-enabled
    expect(emailInput).not.toBeDisabled();
    expect(passwordInput).not.toBeDisabled();
    expect(loginButton).not.toBeDisabled();
  });

  // --- Form Submission Tests ---
  test("11. prevents default form submission behavior", async () => {
    axios.post.mockResolvedValueOnce({ data: { token: "test-token" } });

    renderWithRouter(<BusinessLogin />);

    const form = screen.getByRole("button", { name: /login/i }).closest("form");
    const mockPreventDefault = jest.fn();

    const emailInput = screen.getByPlaceholderText("Email Address");
    const passwordInput = screen.getByPlaceholderText("Password");

    fireEvent.change(emailInput, { target: { value: "test@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "password" } });

    fireEvent.submit(form, { preventDefault: mockPreventDefault });

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });

  test("12. handles form submission via Enter key", async () => {
    axios.post.mockResolvedValueOnce({ data: { token: "test-token" } });

    renderWithRouter(<BusinessLogin />);

    const emailInput = screen.getByPlaceholderText("Email Address");
    const passwordInput = screen.getByPlaceholderText("Password");

    fireEvent.change(emailInput, { target: { value: "test@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    // Simulate Enter key press in password field
    fireEvent.submit(passwordInput.closest("form"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/manager/dashboard");
    });
  });

  // --- Edge Cases ---
  test("13. handles empty form submission", async () => {
    axios.post.mockResolvedValueOnce({ data: { token: "test-token" } });

    renderWithRouter(<BusinessLogin />);

    const loginButton = screen.getByRole("button", { name: /login/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:5001/api/auth/login",
        {
          email: "",
          password: "",
        }
      );
    });
  });

  test("14. does not show error message initially", () => {
    renderWithRouter(<BusinessLogin />);

    // Error message should not be visible
    expect(screen.queryByTestId("alert-icon")).not.toBeInTheDocument();
  });

  test("15. maintains input values after failed login attempt", async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { message: "Invalid credentials" } },
    });

    renderWithRouter(<BusinessLogin />);

    const emailInput = screen.getByPlaceholderText("Email Address");
    const passwordInput = screen.getByPlaceholderText("Password");
    const loginButton = screen.getByRole("button", { name: /login/i });

    const testEmail = "test@example.com";
    const testPassword = "password123";

    fireEvent.change(emailInput, { target: { value: testEmail } });
    fireEvent.change(passwordInput, { target: { value: testPassword } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });

    // Check that input values are maintained
    expect(emailInput.value).toBe(testEmail);
    expect(passwordInput.value).toBe(testPassword);
  });
});