import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, server } from "@pos-cloud-web/testing";
import { fakeCustomerList, fakeLicenseList, mockAuthenticated, renderAt } from "./test-support";

const LICENSES_URL = "/api/v1/control-plane/licenses";
const CUSTOMERS_URL = "/api/v1/control-plane/customers";
const CUSTOMER_LABEL = "GST-MX — GS Trackme S.A. de C.V.";

/** Renders the real CreateLicenseDialog (which mounts the real, single CustomerPicker
 *  implementation) through the full app/router/QueryClient stack, backed by MSW - not a mocked
 *  customers-api module - so these tests exercise the same request pipeline (auth headers, query
 *  params, error parsing) production traffic goes through (WEB-01E brief §38). */
async function openDialogWithCustomerPicker() {
  mockAuthenticated(["licenses.read", "licenses.create"]);
  server.use(
    http.get(LICENSES_URL, () => HttpResponse.json(fakeLicenseList())),
    http.get(CUSTOMERS_URL, () => HttpResponse.json(fakeCustomerList())),
  );
  renderAt("/app/licenses");

  await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument(), {
    timeout: 5000,
  });
  await userEvent.click(screen.getByRole("button", { name: "New License" }));
  return screen.getByRole("dialog");
}

describe("CustomerPicker", () => {
  it("makes no request and shows no options for 0, 1, or 2 characters", async () => {
    let requestCount = 0;
    mockAuthenticated(["licenses.read", "licenses.create"]);
    server.use(
      http.get(LICENSES_URL, () => HttpResponse.json(fakeLicenseList())),
      http.get(CUSTOMERS_URL, () => {
        requestCount += 1;
        return HttpResponse.json(fakeCustomerList());
      }),
    );
    renderAt("/app/licenses");
    await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument(), {
      timeout: 5000,
    });
    await userEvent.click(screen.getByRole("button", { name: "New License" }));
    const dialog = screen.getByRole("dialog");

    const input = within(dialog).getByLabelText("Customer");
    // The popover (and its helper text) only opens once the field is focused - matches 0 chars.
    const user = userEvent.setup();
    await user.click(input);
    expect(screen.getByText(/Type at least 3 characters/)).toBeInTheDocument();

    await user.type(input, "g");
    expect(screen.getByText(/Type at least 3 characters/)).toBeInTheDocument();

    await user.type(input, "s");
    expect(screen.getByText(/Type at least 3 characters/)).toBeInTheDocument();

    // Give any wrongly-fired debounce timer a chance to resolve before asserting nothing happened.
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(requestCount).toBe(0);
    // The listbox itself is open (showing the helper text), but must contain no option rows.
    expect(within(screen.getByRole("listbox")).queryAllByRole("option")).toHaveLength(0);
  });

  it("debounces and fires a real search request at 3 characters, rendering code + legal name", async () => {
    let lastSearch: string | null = null;
    mockAuthenticated(["licenses.read", "licenses.create"]);
    server.use(
      http.get(LICENSES_URL, () => HttpResponse.json(fakeLicenseList())),
      http.get(CUSTOMERS_URL, ({ request }) => {
        lastSearch = new URL(request.url).searchParams.get("search");
        return HttpResponse.json(fakeCustomerList());
      }),
    );
    renderAt("/app/licenses");
    await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument(), {
      timeout: 5000,
    });
    await userEvent.click(screen.getByRole("button", { name: "New License" }));
    const dialog = screen.getByRole("dialog");

    const user = userEvent.setup();
    await user.type(within(dialog).getByLabelText("Customer"), "gst");

    // Not sent immediately - still debouncing.
    expect(lastSearch).toBeNull();

    await waitFor(() => expect(lastSearch).toBe("gst"), { timeout: 2000 });

    const option = await screen.findByRole("option", { name: CUSTOMER_LABEL }, { timeout: 5000 });
    expect(option).toBeInTheDocument();
  });

  it("selects an option via the keyboard (ArrowDown + Enter)", async () => {
    const dialog = await openDialogWithCustomerPicker();
    const user = userEvent.setup();
    const input = within(dialog).getByLabelText("Customer");

    await user.type(input, "gst");
    await screen.findByRole("option", { name: CUSTOMER_LABEL }, { timeout: 5000 });

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(within(dialog).getByLabelText("Customer")).toHaveValue(CUSTOMER_LABEL);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("selects an option via the mouse", async () => {
    const dialog = await openDialogWithCustomerPicker();
    const user = userEvent.setup();

    await user.type(within(dialog).getByLabelText("Customer"), "gst");
    const option = await screen.findByRole("option", { name: CUSTOMER_LABEL }, { timeout: 5000 });
    await user.click(option);

    expect(within(dialog).getByLabelText("Customer")).toHaveValue(CUSTOMER_LABEL);
  });

  it("shows a no-results message when the search matches nothing", async () => {
    mockAuthenticated(["licenses.read", "licenses.create"]);
    server.use(
      http.get(LICENSES_URL, () => HttpResponse.json(fakeLicenseList())),
      http.get(CUSTOMERS_URL, () =>
        HttpResponse.json(fakeCustomerList({ items: [], total: 0, totalPages: 0 })),
      ),
    );
    renderAt("/app/licenses");
    await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument(), {
      timeout: 5000,
    });
    await userEvent.click(screen.getByRole("button", { name: "New License" }));
    const dialog = screen.getByRole("dialog");

    const user = userEvent.setup();
    await user.type(within(dialog).getByLabelText("Customer"), "zzz");

    expect(
      await screen.findByText("No matching customers", {}, { timeout: 5000 }),
    ).toBeInTheDocument();
  });

  it("shows an inline error and never a raw customer id when the search request fails", async () => {
    mockAuthenticated(["licenses.read", "licenses.create"]);
    server.use(
      http.get(LICENSES_URL, () => HttpResponse.json(fakeLicenseList())),
      http.get(CUSTOMERS_URL, () =>
        HttpResponse.json(
          {
            statusCode: 500,
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred.",
            correlationId: "corr-picker-1",
          },
          { status: 500 },
        ),
      ),
    );
    renderAt("/app/licenses");
    await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument(), {
      timeout: 5000,
    });
    await userEvent.click(screen.getByRole("button", { name: "New License" }));
    const dialog = screen.getByRole("dialog");

    const user = userEvent.setup();
    await user.type(within(dialog).getByLabelText("Customer"), "gst");

    expect(
      await screen.findByText("An unexpected error occurred.", {}, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: CUSTOMER_LABEL })).not.toBeInTheDocument();
  });

  it("lets the selection be changed without losing it on blur, and shows a real Change control", async () => {
    const dialog = await openDialogWithCustomerPicker();
    const user = userEvent.setup();

    await user.type(within(dialog).getByLabelText("Customer"), "gst");
    const option = await screen.findByRole("option", { name: CUSTOMER_LABEL }, { timeout: 5000 });
    await user.click(option);
    expect(within(dialog).getByLabelText("Customer")).toHaveValue(CUSTOMER_LABEL);

    // Moving focus elsewhere in the dialog must not clear the already-made selection.
    await user.click(within(dialog).getByLabelText("License number"));
    expect(within(dialog).getByLabelText("Customer")).toHaveValue(CUSTOMER_LABEL);

    await user.click(within(dialog).getByRole("button", { name: "Change" }));
    expect(within(dialog).getByLabelText("Customer")).toHaveValue("");
    // Change() refocuses the input via requestAnimationFrame, which re-opens the popover - allow
    // that extra tick before asserting the helper text is back.
    await waitFor(() => expect(screen.getByText(/Type at least 3 characters/)).toBeInTheDocument());
  });
});
