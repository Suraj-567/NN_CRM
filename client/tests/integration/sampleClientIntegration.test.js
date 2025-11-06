import { render, screen } from "@testing-library/react"
import React from "react"

function Greeting() {
  return <h1>Hello CRM!</h1>
}

test("renders greeting message", () => {
  render(<Greeting />)
  expect(screen.getByText("Hello CRM!")).toBeInTheDocument()
})
