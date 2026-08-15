import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, server } from "@pos-cloud-web/testing";
import { fakeCustomer, mockAuthenticated, renderAt } from "./test-support";

const DETAIL_URL = "/api/v1/control-plane/customers/11111111-1111-4111-8111-111111111111";
const STATUS_URL = `${DETAIL_URL}/status`;
const DETAIL_PATH = "/app/customers/11111111-1111-4111-8111-111111111111";

describe("CustomerDetailPage - detail", () => {
  it("renders the customer's fields on success", async () => {
    mockAuthenticated(["customers.read"]);
    server.use(http.get(DETAIL_URL, () => HttpResponse.json(fakeCustomer())));

    renderAt(DETAIL_PATH);

    // Extra headroom under full-workspace parallel test load (many concurrent jsdom environments) -
    // this resolves near-instantly in isolation, the default 1000ms is just tight under contention.
    await waitFor(
      () =>
        expect(
          screen.getByRole("heading", { name: "GS Trackme S.A. de C.V." }),
        ).toBeInTheDocument(),
      { timeout: 5000 },
    );
    expect(screen.getAllByText("GST-MX").length).toBeGreaterThan(0);
    expect(screen.getByText("GS Trackme")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
  });

  it("renders a real 'Back to Customers' link targeting exactly /app/customers", async () => {
    mockAuthenticated(["customers.read"]);
    server.use(http.get(DETAIL_URL, () => HttpResponse.json(fakeCustomer())));

    renderAt(DETAIL_PATH);

    await waitFor(
      () =>
        expect(
          screen.getByRole("heading", { name: "GS Trackme S.A. de C.V." }),
        ).toBeInTheDocument(),
      { timeout: 5000 },
    );

    const backLink = screen.getByRole("link", { name: "Back to Customers" });
    expect(backLink.tagName).toBe("A");
    expect(backLink).toHaveAttribute("href", "/app/customers");

    // Still shows the customer code breadcrumb alongside the back link - neither replaces the other.
    const breadcrumbNav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(breadcrumbNav).getByText("GST-MX")).toBeInTheDocument();
  });

  it("shows the customer's code as the breadcrumb, replacing the static fallback", async () => {
    mockAuthenticated(["customers.read"]);
    server.use(http.get(DETAIL_URL, () => HttpResponse.json(fakeCustomer())));

    renderAt(DETAIL_PATH);

    const breadcrumbNav = await screen.findByRole("navigation", { name: "Breadcrumb" });
    await waitFor(() => expect(within(breadcrumbNav).getByText("GST-MX")).toBeInTheDocument());
    expect(within(breadcrumbNav).queryByText("Customer")).not.toBeInTheDocument();
  });

  it("renders a dedicated not-found state (with a link back) on a 404", async () => {
    mockAuthenticated(["customers.read"]);
    server.use(
      http.get(DETAIL_URL, () =>
        HttpResponse.json(
          {
            statusCode: 404,
            code: "CUSTOMER_NOT_FOUND",
            message: "Customer not found",
            correlationId: "c1",
          },
          { status: 404 },
        ),
      ),
    );

    renderAt(DETAIL_PATH);

    // Same retry-backoff timing note as CustomersPage's backend-error test.
    await waitFor(
      () => expect(screen.getByRole("heading", { name: "Customer not found" })).toBeInTheDocument(),
      { timeout: 5000 },
    );
    expect(screen.getByRole("link", { name: "Back to Customers" })).toHaveAttribute(
      "href",
      "/app/customers",
    );

    // No stale/previous code and no raw UUID leaked into the breadcrumb on a 404 - only the parent
    // "Customers" crumb and the static per-route "Customer" fallback should be present.
    const breadcrumbNav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(breadcrumbNav).getByText("Customer")).toBeInTheDocument();
    expect(
      within(breadcrumbNav).queryByText(DETAIL_PATH.split("/").pop() as string),
    ).not.toBeInTheDocument();
  });
});

describe("CustomerDetailPage - breadcrumb lifecycle", () => {
  const OTHER_ID = "22222222-2222-4222-8222-222222222222";
  const OTHER_DETAIL_URL = `/api/v1/control-plane/customers/${OTHER_ID}`;
  const OTHER_DETAIL_PATH = `/app/customers/${OTHER_ID}`;

  it("updates the breadcrumb when navigating from one customer to another", async () => {
    mockAuthenticated(["customers.read"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeCustomer())),
      http.get(OTHER_DETAIL_URL, () =>
        HttpResponse.json(fakeCustomer({ id: OTHER_ID, code: "OTHER-CO" })),
      ),
    );

    const { router } = renderAt(DETAIL_PATH);
    const breadcrumbNav = await screen.findByRole("navigation", { name: "Breadcrumb" });
    await waitFor(() => expect(within(breadcrumbNav).getByText("GST-MX")).toBeInTheDocument());

    await router.navigate(OTHER_DETAIL_PATH);

    await waitFor(() => expect(within(breadcrumbNav).getByText("OTHER-CO")).toBeInTheDocument());
    expect(within(breadcrumbNav).queryByText("GST-MX")).not.toBeInTheDocument();
  });

  it("clears the dynamic override when navigating away from the detail route", async () => {
    mockAuthenticated(["customers.read"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeCustomer())),
      http.get("/api/v1/control-plane/customers", () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 25, total: 0, totalPages: 0 }),
      ),
    );

    const { router } = renderAt(DETAIL_PATH);
    const breadcrumbNav = await screen.findByRole("navigation", { name: "Breadcrumb" });
    await waitFor(() => expect(within(breadcrumbNav).getByText("GST-MX")).toBeInTheDocument());

    await router.navigate("/app/customers");

    await waitFor(() => expect(within(breadcrumbNav).getByText("Customers")).toBeInTheDocument());
    expect(within(breadcrumbNav).queryByText("GST-MX")).not.toBeInTheDocument();
  });
});

describe("CustomerDetailPage - status actions", () => {
  it("offers Suspend and Deactivate for an ACTIVE customer", async () => {
    mockAuthenticated(["customers.read", "customers.status.change"]);
    server.use(http.get(DETAIL_URL, () => HttpResponse.json(fakeCustomer({ status: "ACTIVE" }))));

    renderAt(DETAIL_PATH);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Suspend" })).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Deactivate" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reactivate" })).not.toBeInTheDocument();
  });

  it("offers Reactivate and Deactivate for a SUSPENDED customer", async () => {
    mockAuthenticated(["customers.read", "customers.status.change"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeCustomer({ status: "SUSPENDED" }))),
    );

    renderAt(DETAIL_PATH);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Reactivate" })).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Deactivate" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suspend" })).not.toBeInTheDocument();
  });

  it("offers no status action for an INACTIVE (terminal) customer", async () => {
    mockAuthenticated(["customers.read", "customers.status.change"]);
    server.use(http.get(DETAIL_URL, () => HttpResponse.json(fakeCustomer({ status: "INACTIVE" }))));

    renderAt(DETAIL_PATH);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "GS Trackme S.A. de C.V." })).toBeInTheDocument(),
    );
    expect(screen.queryByRole("button", { name: "Suspend" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reactivate" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Deactivate" })).not.toBeInTheDocument();
  });

  it("hides status actions entirely without customers.status.change", async () => {
    mockAuthenticated(["customers.read"]);
    server.use(http.get(DETAIL_URL, () => HttpResponse.json(fakeCustomer({ status: "ACTIVE" }))));

    renderAt(DETAIL_PATH);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "GS Trackme S.A. de C.V." })).toBeInTheDocument(),
    );
    expect(screen.queryByRole("button", { name: "Suspend" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Deactivate" })).not.toBeInTheDocument();
  });

  it("confirms, mutates, and closes on a successful status change", async () => {
    mockAuthenticated(["customers.read", "customers.status.change"]);
    let currentStatus: "ACTIVE" | "SUSPENDED" | "INACTIVE" = "ACTIVE";
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeCustomer({ status: currentStatus }))),
      http.patch(STATUS_URL, () => {
        currentStatus = "SUSPENDED";
        return HttpResponse.json(fakeCustomer({ status: "SUSPENDED" }));
      }),
    );

    renderAt(DETAIL_PATH);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Suspend" })).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole("button", { name: "Suspend" }));

    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Suspend" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("SUSPENDED")).toBeInTheDocument());
  });

  it("keeps the confirm dialog open and shows the error on a 409 invalid transition", async () => {
    mockAuthenticated(["customers.read", "customers.status.change"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeCustomer({ status: "ACTIVE" }))),
      http.patch(STATUS_URL, () =>
        HttpResponse.json(
          {
            statusCode: 409,
            code: "INVALID_CUSTOMER_STATUS_TRANSITION",
            message: "Cannot transition Customer status from ACTIVE to ACTIVE.",
            correlationId: "corr-status-1",
          },
          { status: 409 },
        ),
      ),
    );

    renderAt(DETAIL_PATH);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Suspend" })).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole("button", { name: "Suspend" }));

    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Suspend" }));

    expect(
      await within(dialog).findByText("Cannot transition Customer status from ACTIVE to ACTIVE."),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
