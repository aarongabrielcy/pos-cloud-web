import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, server } from "@pos-cloud-web/testing";
import { fakeCustomer, fakeCustomerList, mockAuthenticated, renderAt } from "./test-support";

const CUSTOMERS_URL = "/api/v1/control-plane/customers";

async function openCreateDialog() {
  await waitFor(() => expect(screen.getByText("GST-MX")).toBeInTheDocument());
  await userEvent.click(screen.getByRole("button", { name: "New Customer" }));
  return screen.getByRole("dialog");
}

describe("CreateCustomerDialog", () => {
  it("opens showing the Code / Legal name / Trade name fields", async () => {
    mockAuthenticated(["customers.read", "customers.create"]);
    server.use(http.get(CUSTOMERS_URL, () => HttpResponse.json(fakeCustomerList())));
    renderAt("/app/customers");

    const dialog = await openCreateDialog();
    expect(within(dialog).getByLabelText("Code")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Legal name")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Trade name")).toBeInTheDocument();
  });

  it("shows validation errors instead of submitting when required fields are empty", async () => {
    mockAuthenticated(["customers.read", "customers.create"]);
    let createCalled = false;
    server.use(
      http.get(CUSTOMERS_URL, () => HttpResponse.json(fakeCustomerList())),
      http.post(CUSTOMERS_URL, () => {
        createCalled = true;
        return HttpResponse.json(fakeCustomer(), { status: 201 });
      }),
    );
    renderAt("/app/customers");

    const dialog = await openCreateDialog();
    await userEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await within(dialog).findByText("Code is required")).toBeInTheDocument();
    expect(createCalled).toBe(false);
  });

  it("rejects a code that doesn't match the backend's pattern before ever submitting", async () => {
    mockAuthenticated(["customers.read", "customers.create"]);
    let createCalled = false;
    server.use(
      http.get(CUSTOMERS_URL, () => HttpResponse.json(fakeCustomerList())),
      http.post(CUSTOMERS_URL, () => {
        createCalled = true;
        return HttpResponse.json(fakeCustomer(), { status: 201 });
      }),
    );
    renderAt("/app/customers");

    const dialog = await openCreateDialog();
    await userEvent.type(within(dialog).getByLabelText("Code"), "AB");
    await userEvent.type(within(dialog).getByLabelText("Legal name"), "GS Trackme S.A. de C.V.");
    await userEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await within(dialog).findByText(/3-50 characters/)).toBeInTheDocument();
    expect(createCalled).toBe(false);
  });

  it("closes and resets on success, and the list re-fetches (invalidated)", async () => {
    mockAuthenticated(["customers.read", "customers.create"]);
    let listCallCount = 0;
    server.use(
      http.get(CUSTOMERS_URL, () => {
        listCallCount += 1;
        return HttpResponse.json(fakeCustomerList());
      }),
      http.post(CUSTOMERS_URL, () =>
        HttpResponse.json(fakeCustomer({ code: "NEW-CO" }), { status: 201 }),
      ),
    );
    renderAt("/app/customers");

    const dialog = await openCreateDialog();
    const callsBeforeCreate = listCallCount;

    await userEvent.type(within(dialog).getByLabelText("Code"), "new-co");
    await userEvent.type(within(dialog).getByLabelText("Legal name"), "New Co Legal Name");
    await userEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(listCallCount).toBeGreaterThan(callsBeforeCreate));
  });

  it("shows a 409 conflict error inline and keeps the dialog open", async () => {
    mockAuthenticated(["customers.read", "customers.create"]);
    server.use(
      http.get(CUSTOMERS_URL, () => HttpResponse.json(fakeCustomerList())),
      http.post(CUSTOMERS_URL, () =>
        HttpResponse.json(
          {
            statusCode: 409,
            code: "CUSTOMER_CODE_ALREADY_EXISTS",
            message: "Customer code already exists: GST-MX",
            correlationId: "corr-conflict-1",
          },
          { status: 409 },
        ),
      ),
    );
    renderAt("/app/customers");

    const dialog = await openCreateDialog();
    await userEvent.type(within(dialog).getByLabelText("Code"), "GST-MX");
    await userEvent.type(within(dialog).getByLabelText("Legal name"), "GS Trackme S.A. de C.V.");
    await userEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(
      await within(dialog).findByText("Customer code already exists: GST-MX"),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows the error's correlationId as secondary text", async () => {
    mockAuthenticated(["customers.read", "customers.create"]);
    server.use(
      http.get(CUSTOMERS_URL, () => HttpResponse.json(fakeCustomerList())),
      http.post(CUSTOMERS_URL, () =>
        HttpResponse.json(
          {
            statusCode: 409,
            code: "CUSTOMER_CODE_ALREADY_EXISTS",
            message: "Customer code already exists: GST-MX",
            correlationId: "corr-conflict-2",
          },
          { status: 409 },
        ),
      ),
    );
    renderAt("/app/customers");

    const dialog = await openCreateDialog();
    await userEvent.type(within(dialog).getByLabelText("Code"), "GST-MX");
    await userEvent.type(within(dialog).getByLabelText("Legal name"), "GS Trackme S.A. de C.V.");
    await userEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await within(dialog).findByText(/Reference: corr-conflict-2/)).toBeInTheDocument();
  });
});
