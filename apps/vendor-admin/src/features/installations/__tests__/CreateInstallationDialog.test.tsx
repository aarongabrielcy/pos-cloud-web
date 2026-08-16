import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, server } from "@pos-cloud-web/testing";
import {
  fakeCustomerList,
  fakeInstallation,
  fakeInstallationList,
  fakeLicenseList,
  mockAuthenticated,
  renderAt,
} from "./test-support";

const INSTALLATIONS_URL = "/api/v1/control-plane/installations";
const CUSTOMERS_URL = "/api/v1/control-plane/customers";
const LICENSES_URL = "/api/v1/control-plane/licenses";
const CUSTOMER_LABEL = "GST-MX — GS Trackme S.A. de C.V.";
const LICENSE_LABEL = "LIC-GST-00001 (Basic)";

function mockPickers() {
  server.use(
    http.get(CUSTOMERS_URL, () => HttpResponse.json(fakeCustomerList())),
    http.get(LICENSES_URL, () => HttpResponse.json(fakeLicenseList())),
  );
}

async function openCreateDialog() {
  await waitFor(() => expect(screen.getByText("POS-GST-00001")).toBeInTheDocument(), {
    timeout: 5000,
  });
  await userEvent.click(screen.getByRole("button", { name: "New Installation" }));
  return screen.getByRole("dialog");
}

/** CustomerPicker/LicensePicker (WEB-01E) are real remote-searchable Comboboxes, each requiring
 *  3+ chars before searching at all - and each renders its listbox through a Radix Popover Portal,
 *  a sibling of the Dialog's own portal content in the DOM (not a descendant of `dialog`), so
 *  options must be queried via `screen`, not `within(dialog)`. */
async function pickCustomer(dialog: HTMLElement, user: ReturnType<typeof userEvent.setup>) {
  await user.type(within(dialog).getByLabelText("Customer"), "trackme");
  // Extra headroom under full-workspace parallel test load - same rationale as openCreateDialog's
  // own timeout above.
  const option = await screen.findByRole("option", { name: CUSTOMER_LABEL }, { timeout: 5000 });
  await user.click(option);
}

async function pickLicense(dialog: HTMLElement, user: ReturnType<typeof userEvent.setup>) {
  await user.type(within(dialog).getByLabelText("License"), "LIC-GST");
  const option = await screen.findByRole("option", { name: LICENSE_LABEL }, { timeout: 5000 });
  await user.click(option);
}

async function fillValidInstallation(dialog: HTMLElement) {
  const user = userEvent.setup();
  await pickCustomer(dialog, user);
  await waitFor(() => expect(within(dialog).getByLabelText("License")).not.toBeDisabled());
  await pickLicense(dialog, user);
  await user.type(within(dialog).getByLabelText("Installation code"), "POS-NEW-00099");
  await user.type(within(dialog).getByLabelText("Name"), "Sucursal Norte");
}

describe("CreateInstallationDialog", () => {
  it("opens showing all fields, with the License picker disabled until a customer is chosen", async () => {
    mockAuthenticated(["installations.read", "installations.create"]);
    server.use(http.get(INSTALLATIONS_URL, () => HttpResponse.json(fakeInstallationList())));
    mockPickers();
    renderAt("/app/installations");

    const dialog = await openCreateDialog();
    expect(within(dialog).getByLabelText("Installation code")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Name")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Platform")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("License")).toBeDisabled();

    const user = userEvent.setup();
    await pickCustomer(dialog, user);
    await waitFor(() => expect(within(dialog).getByLabelText("License")).not.toBeDisabled());
  });

  it("resets the selected license when the customer changes", async () => {
    mockAuthenticated(["installations.read", "installations.create"]);
    server.use(http.get(INSTALLATIONS_URL, () => HttpResponse.json(fakeInstallationList())));
    mockPickers();
    renderAt("/app/installations");

    const dialog = await openCreateDialog();
    const user = userEvent.setup();
    await pickCustomer(dialog, user);
    await waitFor(() => expect(within(dialog).getByLabelText("License")).not.toBeDisabled());
    await pickLicense(dialog, user);
    expect(within(dialog).getByLabelText("License")).toHaveValue(LICENSE_LABEL);

    // Changing the Customer selection resets the License selection - the picker goes back to
    // disabled/empty regardless of which layer (LicensePicker's own effect, or the parent form's
    // setValue) drives the reset (WEB-01E brief §19). The Customer's own "Change" button is the
    // first one in the DOM (Customer field precedes License field).
    await user.click(within(dialog).getAllByRole("button", { name: "Change" })[0]!);
    expect(within(dialog).getByLabelText("License")).toBeDisabled();
  });

  it("shows validation errors instead of submitting when required fields are empty", async () => {
    mockAuthenticated(["installations.read", "installations.create"]);
    let createCalled = false;
    server.use(
      http.get(INSTALLATIONS_URL, () => HttpResponse.json(fakeInstallationList())),
      http.post(INSTALLATIONS_URL, () => {
        createCalled = true;
        return HttpResponse.json(fakeInstallation(), { status: 201 });
      }),
    );
    mockPickers();
    renderAt("/app/installations");

    const dialog = await openCreateDialog();
    await userEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await within(dialog).findByText("Select a customer")).toBeInTheDocument();
    expect(within(dialog).getByText("Select a license")).toBeInTheDocument();
    expect(within(dialog).getByText("Installation code is required")).toBeInTheDocument();
    expect(within(dialog).getByText("Name is required")).toBeInTheDocument();
    expect(createCalled).toBe(false);
  });

  it("rejects an installation code that doesn't match the backend's pattern", async () => {
    mockAuthenticated(["installations.read", "installations.create"]);
    server.use(http.get(INSTALLATIONS_URL, () => HttpResponse.json(fakeInstallationList())));
    mockPickers();
    renderAt("/app/installations");

    const dialog = await openCreateDialog();
    await userEvent.type(within(dialog).getByLabelText("Installation code"), "AB1");
    await userEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await within(dialog).findByText(/5-80 characters/)).toBeInTheDocument();
  });

  it("closes and resets on success, and the list re-fetches (invalidated)", async () => {
    // fillValidInstallation drives two sequential debounced Combobox searches (Customer, then
    // License) - under full-workspace parallel test load this can exceed vitest's 5000ms default.
    mockAuthenticated(["installations.read", "installations.create"]);
    let listCallCount = 0;
    server.use(
      http.get(INSTALLATIONS_URL, () => {
        listCallCount += 1;
        return HttpResponse.json(fakeInstallationList());
      }),
      http.post(INSTALLATIONS_URL, () =>
        HttpResponse.json(fakeInstallation({ installationCode: "POS-NEW-00099" }), {
          status: 201,
        }),
      ),
    );
    mockPickers();
    renderAt("/app/installations");

    const dialog = await openCreateDialog();
    const callsBeforeCreate = listCallCount;
    await fillValidInstallation(dialog);
    await userEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(listCallCount).toBeGreaterThan(callsBeforeCreate));
  }, 15000);

  it("surfaces a 409 LICENSE_CAPACITY_EXCEEDED error inline and keeps the dialog open", async () => {
    mockAuthenticated(["installations.read", "installations.create"]);
    server.use(
      http.get(INSTALLATIONS_URL, () => HttpResponse.json(fakeInstallationList())),
      http.post(INSTALLATIONS_URL, () =>
        HttpResponse.json(
          {
            statusCode: 409,
            code: "LICENSE_CAPACITY_EXCEEDED",
            message: "This license has reached its maximum number of installations.",
            correlationId: "corr-cap-1",
          },
          { status: 409 },
        ),
      ),
    );
    mockPickers();
    renderAt("/app/installations");

    const dialog = await openCreateDialog();
    await fillValidInstallation(dialog);
    await userEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(
      await within(dialog).findByText(
        "This license has reached its maximum number of installations.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  }, 15000);

  it("surfaces a 409 LICENSE_NOT_USABLE error inline", async () => {
    mockAuthenticated(["installations.read", "installations.create"]);
    server.use(
      http.get(INSTALLATIONS_URL, () => HttpResponse.json(fakeInstallationList())),
      http.post(INSTALLATIONS_URL, () =>
        HttpResponse.json(
          {
            statusCode: 409,
            code: "LICENSE_NOT_USABLE",
            message: "License is not currently usable.",
            correlationId: "corr-usable-1",
          },
          { status: 409 },
        ),
      ),
    );
    mockPickers();
    renderAt("/app/installations");

    const dialog = await openCreateDialog();
    await fillValidInstallation(dialog);
    await userEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await within(dialog).findByText("License is not currently usable.")).toBeInTheDocument();
  }, 15000);
});
