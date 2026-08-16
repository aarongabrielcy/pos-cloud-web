import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, server } from "@pos-cloud-web/testing";
import {
  fakeCustomerList,
  fakeLicense,
  fakeLicenseList,
  mockAuthenticated,
  renderAt,
} from "./test-support";

const LICENSES_URL = "/api/v1/control-plane/licenses";
const CUSTOMERS_URL = "/api/v1/control-plane/customers";
const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_LABEL = "GST-MX — GS Trackme S.A. de C.V.";

async function openCreateDialog() {
  // Extra headroom under full-workspace parallel test load (many concurrent jsdom environments) -
  // same rationale as CreateCustomerDialog's own openCreateDialog helper.
  await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument(), {
    timeout: 5000,
  });
  await userEvent.click(screen.getByRole("button", { name: "New License" }));
  return screen.getByRole("dialog");
}

/** CustomerPicker (WEB-01E) requires 3+ chars before it searches at all - types a search term long
 *  enough to trigger the request, waits for the option, then selects it via the combobox. */
async function pickCustomer(dialog: HTMLElement, user: ReturnType<typeof userEvent.setup>) {
  await user.type(within(dialog).getByLabelText("Customer"), "trackme");
  // The Combobox's listbox renders through a Radix Popover Portal - a sibling of the Dialog's own
  // portal content in the DOM, not a descendant of `dialog` - so it must be queried via `screen`.
  // Extra headroom under full-workspace parallel test load - same rationale as openCreateDialog.
  const option = await screen.findByRole("option", { name: CUSTOMER_LABEL }, { timeout: 5000 });
  await user.click(option);
}

async function fillValidBasicLicense(dialog: HTMLElement) {
  const user = userEvent.setup();
  await pickCustomer(dialog, user);
  await user.type(within(dialog).getByLabelText("License number"), "LIC-NEW-00099");
  fireEvent.change(within(dialog).getByLabelText("Valid from"), {
    target: { value: "2026-01-01" },
  });
  await user.type(within(dialog).getByLabelText("Max installations"), "5");
}

describe("CreateLicenseDialog", () => {
  it("opens showing the License number / Edition / Valid from / Max installations fields and a Customer picker", async () => {
    mockAuthenticated(["licenses.read", "licenses.create"]);
    server.use(
      http.get(LICENSES_URL, () => HttpResponse.json(fakeLicenseList())),
      http.get(CUSTOMERS_URL, () => HttpResponse.json(fakeCustomerList())),
    );
    renderAt("/app/licenses");

    const dialog = await openCreateDialog();
    expect(within(dialog).getByLabelText("License number")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Edition")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Valid from")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Max installations")).toBeInTheDocument();
    await waitFor(() => expect(within(dialog).getByLabelText("Customer")).toBeInTheDocument());
    // Basic (Perpetual) is the default edition - no "Valid until" field until Premium is picked.
    expect(within(dialog).queryByLabelText("Valid until")).not.toBeInTheDocument();
  });

  it("searches customers through the real Customers API (no separate/duplicate implementation)", async () => {
    let lastSearch: string | null = null;
    let lastStatus: string | null = null;
    mockAuthenticated(["licenses.read", "licenses.create"]);
    server.use(
      http.get(LICENSES_URL, () => HttpResponse.json(fakeLicenseList())),
      http.get(CUSTOMERS_URL, ({ request }) => {
        const url = new URL(request.url);
        lastSearch = url.searchParams.get("search");
        lastStatus = url.searchParams.get("status");
        return HttpResponse.json(fakeCustomerList());
      }),
    );
    renderAt("/app/licenses");

    const dialog = await openCreateDialog();

    const user = userEvent.setup();
    await user.type(within(dialog).getByLabelText("Customer"), "trackme");

    await waitFor(() => expect(lastSearch).toBe("trackme"), { timeout: 5000 });
    expect(lastStatus).toBe("ACTIVE");

    // The listbox renders through a Radix Popover Portal, a sibling of the Dialog's own portal
    // content - not a descendant of `dialog` - so it must be queried via `screen`.
    const option = await screen.findByRole("option", { name: CUSTOMER_LABEL }, { timeout: 5000 });
    expect(option).toBeInTheDocument();
  });

  it("shows validation errors instead of submitting when required fields are empty", async () => {
    mockAuthenticated(["licenses.read", "licenses.create"]);
    let createCalled = false;
    server.use(
      http.get(LICENSES_URL, () => HttpResponse.json(fakeLicenseList())),
      http.get(CUSTOMERS_URL, () => HttpResponse.json(fakeCustomerList())),
      http.post(LICENSES_URL, () => {
        createCalled = true;
        return HttpResponse.json(fakeLicense(), { status: 201 });
      }),
    );
    renderAt("/app/licenses");

    const dialog = await openCreateDialog();
    await userEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await within(dialog).findByText("Select a customer")).toBeInTheDocument();
    expect(within(dialog).getByText("License number is required")).toBeInTheDocument();
    expect(within(dialog).getByText("Valid from is required")).toBeInTheDocument();
    expect(createCalled).toBe(false);
  });

  it("rejects a license number that doesn't match the backend's pattern before ever submitting", async () => {
    mockAuthenticated(["licenses.read", "licenses.create"]);
    let createCalled = false;
    server.use(
      http.get(LICENSES_URL, () => HttpResponse.json(fakeLicenseList())),
      http.get(CUSTOMERS_URL, () => HttpResponse.json(fakeCustomerList())),
      http.post(LICENSES_URL, () => {
        createCalled = true;
        return HttpResponse.json(fakeLicense(), { status: 201 });
      }),
    );
    renderAt("/app/licenses");

    const dialog = await openCreateDialog();
    await userEvent.type(within(dialog).getByLabelText("License number"), "AB1");
    await userEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await within(dialog).findByText(/5-80 characters/)).toBeInTheDocument();
    expect(createCalled).toBe(false);
  });

  it("rejects a max installations below 1", async () => {
    mockAuthenticated(["licenses.read", "licenses.create"]);
    server.use(
      http.get(LICENSES_URL, () => HttpResponse.json(fakeLicenseList())),
      http.get(CUSTOMERS_URL, () => HttpResponse.json(fakeCustomerList())),
    );
    renderAt("/app/licenses");

    const dialog = await openCreateDialog();
    await userEvent.type(within(dialog).getByLabelText("Max installations"), "0");
    await userEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(
      await within(dialog).findByText("Max installations must be at least 1"),
    ).toBeInTheDocument();
  });

  it("shows a 'Valid until' field only for Premium, and requires it when shown", async () => {
    mockAuthenticated(["licenses.read", "licenses.create"]);
    server.use(
      http.get(LICENSES_URL, () => HttpResponse.json(fakeLicenseList())),
      http.get(CUSTOMERS_URL, () => HttpResponse.json(fakeCustomerList())),
    );
    renderAt("/app/licenses");

    const dialog = await openCreateDialog();
    await userEvent.selectOptions(within(dialog).getByLabelText("Edition"), "PREMIUM");

    expect(within(dialog).getByLabelText("Valid until")).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole("button", { name: "Create" }));
    expect(
      await within(dialog).findByText(
        "Valid until is required for Premium (subscription) licenses.",
      ),
    ).toBeInTheDocument();
  });

  it("closes and resets on success, and the list re-fetches (invalidated)", async () => {
    mockAuthenticated(["licenses.read", "licenses.create"]);
    let listCallCount = 0;
    server.use(
      http.get(LICENSES_URL, () => {
        listCallCount += 1;
        return HttpResponse.json(fakeLicenseList());
      }),
      http.get(CUSTOMERS_URL, () => HttpResponse.json(fakeCustomerList())),
      http.post(LICENSES_URL, () =>
        HttpResponse.json(fakeLicense({ licenseNumber: "LIC-NEW-00099" }), { status: 201 }),
      ),
    );
    renderAt("/app/licenses");

    const dialog = await openCreateDialog();
    const callsBeforeCreate = listCallCount;

    await fillValidBasicLicense(dialog);
    await userEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(listCallCount).toBeGreaterThan(callsBeforeCreate));
  });

  it("shows a 409 duplicate license number error inline and keeps the dialog open", async () => {
    mockAuthenticated(["licenses.read", "licenses.create"]);
    server.use(
      http.get(LICENSES_URL, () => HttpResponse.json(fakeLicenseList())),
      http.get(CUSTOMERS_URL, () => HttpResponse.json(fakeCustomerList())),
      http.post(LICENSES_URL, () =>
        HttpResponse.json(
          {
            statusCode: 409,
            code: "LICENSE_NUMBER_ALREADY_EXISTS",
            message: "License number already exists: LIC-GST-00001",
            correlationId: "corr-conflict-1",
          },
          { status: 409 },
        ),
      ),
    );
    renderAt("/app/licenses");

    const dialog = await openCreateDialog();
    await fillValidBasicLicense(dialog);
    await userEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(
      await within(dialog).findByText("License number already exists: LIC-GST-00001"),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(await within(dialog).findByText(/Reference: corr-conflict-1/)).toBeInTheDocument();
  });

  it("shows a 404 customer-not-found error inline", async () => {
    mockAuthenticated(["licenses.read", "licenses.create"]);
    server.use(
      http.get(LICENSES_URL, () => HttpResponse.json(fakeLicenseList())),
      http.get(CUSTOMERS_URL, () => HttpResponse.json(fakeCustomerList())),
      http.post(LICENSES_URL, () =>
        HttpResponse.json(
          {
            statusCode: 404,
            code: "CUSTOMER_NOT_FOUND",
            message: `Customer not found: ${CUSTOMER_ID}`,
            correlationId: "corr-404-1",
          },
          { status: 404 },
        ),
      ),
    );
    renderAt("/app/licenses");

    const dialog = await openCreateDialog();
    await fillValidBasicLicense(dialog);
    await userEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(
      await within(dialog).findByText(`Customer not found: ${CUSTOMER_ID}`),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
