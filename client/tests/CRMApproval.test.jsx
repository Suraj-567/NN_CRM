import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import axios from "axios";
import CRMApproval from "../src/pages/CRMApproval";

jest.mock("axios");

describe("CRMApproval", () => {
  test("renders no pending companies", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    render(<CRMApproval />);
    await waitFor(() =>
      expect(
        screen.getByText("No pending companies for approval.")
      ).toBeInTheDocument()
    );
  });
  

  test("renders companies and handles approval/rejection", async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        {
          _id: "123",
          companyName: "FutureTech",
          businessEmail: "a@b.com",
          managerName: "Alice",
          industry: "AI",
          approved: false,
        },
      ],
    });
    

    axios.post.mockResolvedValueOnce({});
    render(<CRMApproval />);
    await waitFor(() => screen.getByText("FutureTech"));

    fireEvent.click(screen.getByText("Approve"));
    fireEvent.click(screen.getByText("Reject"));
  });

  test("handles API error on fetch", async () => {
  axios.get.mockRejectedValueOnce(new Error("API error"));
  render(<CRMApproval />);
  await waitFor(() =>
    expect(
      screen.getByText("No pending companies for approval.")
    ).toBeInTheDocument()
  );
});

});
