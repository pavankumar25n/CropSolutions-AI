import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App.jsx";

describe("CropSolution AI workflow", () => {
  beforeEach(() => {
    window.localStorage.setItem("cs-harvests", "[]");
    window.localStorage.setItem("cs-buyer-requests", "[]");
  });

  it("lets a farmer add a harvest and shows a success message", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Harvests/ }));
    await user.type(screen.getByLabelText("Farmer name"), "Meera Deshmukh");
    await user.type(screen.getByLabelText("Village"), "Deola");
    await user.type(screen.getByLabelText("Crop name"), "Onion");
    await user.type(screen.getByLabelText("Quantity (kg)"), "600");
    await user.type(screen.getByLabelText("Expected price / kg"), "18");
    await user.type(screen.getByLabelText("Harvest date"), "2026-10-26");
    await user.click(screen.getByRole("button", { name: /Add harvest to collective/ }));

    expect(screen.getByRole("status").textContent).toContain(
      "Harvest added to your collective.",
    );
    expect(screen.getByText("Meera Deshmukh")).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem("cs-harvests"))).toHaveLength(1);
  });

  it("blocks a negative harvest quantity and keeps the list unchanged", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Harvests/ }));
    await user.type(screen.getByLabelText("Farmer name"), "Meera");
    await user.type(screen.getByLabelText("Village"), "Deola");
    await user.type(screen.getByLabelText("Crop name"), "Onion");
    await user.type(screen.getByLabelText("Quantity (kg)"), "-5");
    await user.type(screen.getByLabelText("Expected price / kg"), "18");
    await user.type(screen.getByLabelText("Harvest date"), "2026-10-26");
    fireEvent.submit(screen.getByRole("form", { name: "Add a harvest" }));

    expect(screen.getByRole("alert").textContent).toContain(
      "Harvest quantity must be greater than zero.",
    );
    expect(JSON.parse(window.localStorage.getItem("cs-harvests"))).toEqual([]);
  });

  it("saves a buyer request and surfaces it as a potential match", async () => {
    window.localStorage.setItem(
      "cs-harvests",
      JSON.stringify([
        {
          id: 1,
          name: "Demo: Farmer",
          village: "Deola",
          crop: "Onion",
          qty: 900,
          price: 18,
          date: "2026-10-26",
        },
      ]),
    );
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Buyer requests/ }));
    await user.type(
      screen.getByLabelText("Buyer or organization name"),
      "Valley Produce Market",
    );
    await user.type(screen.getByLabelText("Crop wanted"), "Onion");
    await user.type(screen.getByLabelText("Quantity required (kg)"), "500");
    await user.selectOptions(
      screen.getByLabelText("Preferred region"),
      "Nashik region",
    );
    await user.type(screen.getByLabelText("Offered price per kg (₹)"), "22");
    await user.click(screen.getByRole("button", { name: /Save buyer request/ }));

    expect(screen.getByRole("status").textContent).toContain(
      "Buyer request saved in this browser",
    );
    expect(JSON.parse(window.localStorage.getItem("cs-buyer-requests"))).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: /Matching/ }));
    expect(screen.getByText("Valley Produce Market")).toBeTruthy();
    expect(screen.getByText("BUYER REQUEST")).toBeTruthy();
  });

  it("shows a clear shortfall and no buyer match when pooled harvest is insufficient", async () => {
    window.localStorage.setItem(
      "cs-harvests",
      JSON.stringify([
        {
          id: 1,
          name: "Demo: Farmer",
          village: "Deola",
          crop: "Onion",
          qty: 300,
          price: 18,
          date: "2026-10-26",
        },
      ]),
    );
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Matching/ }));

    expect(screen.getByText("! More harvest needed")).toBeTruthy();
    expect(document.querySelector(".metrics").textContent).toContain("300 kg");
    expect(screen.getByText("No buyer requests match these filters")).toBeTruthy();
  });

  it("updates the earnings estimate when quantity changes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Earnings/ }));
    const quantity = screen.getByLabelText(/Harvest quantity/);
    await user.clear(quantity);
    await user.type(quantity, "1000");

    const summary = document.querySelector(".summary");
    expect(within(summary).getAllByText("₹13,000")).toHaveLength(2);
  });
});
