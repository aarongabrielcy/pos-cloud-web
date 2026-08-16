import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse, server } from "@pos-cloud-web/testing";
import { fakeCustomerList, mockAuthenticated, renderAt } from "./test-support";

const CUSTOMERS_URL = "/api/v1/control-plane/customers";

describe("CustomersPage - list", () => {
  it("shows loading skeleton rows while the list request is in flight", async () => {
    mockAuthenticated();
    server.use(
      http.get(CUSTOMERS_URL, async () => {
        await delay(50);
        return HttpResponse.json(fakeCustomerList());
      }),
    );

    renderAt("/app/customers");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Customers" })).toBeInTheDocument(),
    );
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);

    await waitFor(() => expect(screen.getByText("GST-MX")).toBeInTheDocument());
  });

  it("renders customer rows on success, including a code Link to the detail route", async () => {
    mockAuthenticated();
    server.use(http.get(CUSTOMERS_URL, () => HttpResponse.json(fakeCustomerList())));

    renderAt("/app/customers");

    await waitFor(() => expect(screen.getByText("GST-MX")).toBeInTheDocument());
    expect(screen.getByText("GS Trackme S.A. de C.V.")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "GST-MX" });
    expect(link).toHaveAttribute("href", "/app/customers/11111111-1111-4111-8111-111111111111");
  });

  it("renders an Alert on a backend list error", async () => {
    mockAuthenticated();
    server.use(
      http.get(CUSTOMERS_URL, () =>
        HttpResponse.json(
          {
            statusCode: 500,
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred.",
            correlationId: "c1",
          },
          { status: 500 },
        ),
      ),
    );

    renderAt("/app/customers");

    // The shared QueryClient retries non-401/403 errors twice with backoff (app/providers/
    // query-client.ts) before settling into isError - the default 1000ms waitFor isn't enough.
    await waitFor(
      () => expect(screen.getByText("An unexpected error occurred.")).toBeInTheDocument(),
      { timeout: 5000 },
    );
  });

  it("shows the no-customers empty state (with a create action) when there are no filters and zero results", async () => {
    mockAuthenticated(["customers.read", "customers.create"]);
    server.use(
      http.get(CUSTOMERS_URL, () =>
        HttpResponse.json(fakeCustomerList({ items: [], total: 0, totalPages: 0 })),
      ),
    );

    renderAt("/app/customers");

    await waitFor(() => expect(screen.getByText("No customers yet")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Create customer" })).toBeInTheDocument();
  });

  it("shows the filtered-empty state (with Clear filters, no create action) when a filter yields zero results", async () => {
    mockAuthenticated();
    server.use(
      http.get(CUSTOMERS_URL, () =>
        HttpResponse.json(fakeCustomerList({ items: [], total: 0, totalPages: 0 })),
      ),
    );

    renderAt("/app/customers?search=nope");

    await waitFor(() =>
      expect(screen.getByText("No customers match your filters")).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create customer" })).not.toBeInTheDocument();
  });

  it("updates the URL when a pagination control is used", async () => {
    mockAuthenticated();
    server.use(
      http.get(CUSTOMERS_URL, () =>
        HttpResponse.json(fakeCustomerList({ page: 1, pageSize: 25, total: 60, totalPages: 3 })),
      ),
    );

    const { router } = renderAt("/app/customers");
    await waitFor(() => expect(screen.getByText("GST-MX")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Next page" }));

    await waitFor(() => expect(router.state.location.search).toContain("page=2"));
  });

  it("sends the selected status filter to the backend and reflects it in the URL", async () => {
    let lastStatus: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(CUSTOMERS_URL, ({ request }) => {
        lastStatus = new URL(request.url).searchParams.get("status");
        return HttpResponse.json(fakeCustomerList());
      }),
    );

    const { router } = renderAt("/app/customers");
    await waitFor(() => expect(screen.getByText("GST-MX")).toBeInTheDocument());

    await userEvent.selectOptions(screen.getByLabelText("Filter by status"), "SUSPENDED");

    await waitFor(() => expect(lastStatus).toBe("SUSPENDED"));
    expect(router.state.location.search).toContain("status=SUSPENDED");
  });

  it("debounces search input before sending it to the backend / URL", async () => {
    let lastSearch: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(CUSTOMERS_URL, ({ request }) => {
        lastSearch = new URL(request.url).searchParams.get("search");
        return HttpResponse.json(fakeCustomerList());
      }),
    );

    const { router } = renderAt("/app/customers");
    await waitFor(() => expect(screen.getByText("GST-MX")).toBeInTheDocument());

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Search customers"), "trackme");

    // Not sent immediately - still debouncing.
    expect(router.state.location.search).not.toContain("search=");

    await waitFor(() => expect(lastSearch).toBe("trackme"), { timeout: 2000 });
    expect(router.state.location.search).toContain("search=trackme");
  });

  it("never applies a 1-2 character search to the backend/URL, and shows a helper instead of an error", async () => {
    let lastSearch: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(CUSTOMERS_URL, ({ request }) => {
        lastSearch = new URL(request.url).searchParams.get("search");
        return HttpResponse.json(fakeCustomerList());
      }),
    );

    const { router } = renderAt("/app/customers");
    await waitFor(() => expect(screen.getByText("GST-MX")).toBeInTheDocument());

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Search customers"), "gs");

    // Give the 300ms debounce a real chance to fire before asserting nothing was applied.
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(lastSearch).toBeNull();
    expect(router.state.location.search).not.toContain("search=");
    expect(screen.getByText("Type at least 3 characters to search")).toBeInTheDocument();
  });

  it("shows the New Customer action when the admin has customers.create", async () => {
    mockAuthenticated(["customers.read", "customers.create"]);
    server.use(http.get(CUSTOMERS_URL, () => HttpResponse.json(fakeCustomerList())));

    renderAt("/app/customers");

    await waitFor(() => expect(screen.getByText("GST-MX")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "New Customer" })).toBeInTheDocument();
  });

  it("hides the New Customer action when the admin lacks customers.create", async () => {
    mockAuthenticated(["customers.read"]);
    server.use(http.get(CUSTOMERS_URL, () => HttpResponse.json(fakeCustomerList())));

    renderAt("/app/customers");

    await waitFor(() => expect(screen.getByText("GST-MX")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "New Customer" })).not.toBeInTheDocument();
  });
});

describe("CustomersPage - URL state", () => {
  it("does not reset a deep-linked page (e.g. ?page=3) back to 1 on mount", async () => {
    let lastPage: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(CUSTOMERS_URL, ({ request }) => {
        lastPage = new URL(request.url).searchParams.get("page");
        return HttpResponse.json(fakeCustomerList({ page: 3, total: 60, totalPages: 3 }));
      }),
    );

    const { router } = renderAt("/app/customers?page=3");
    await waitFor(() => expect(screen.getByText("GST-MX")).toBeInTheDocument());

    expect(lastPage).toBe("3");
    expect(router.state.location.search).toContain("page=3");
  });

  it("populates the search input from an existing ?search= in the URL", async () => {
    mockAuthenticated();
    server.use(http.get(CUSTOMERS_URL, () => HttpResponse.json(fakeCustomerList())));

    renderAt("/app/customers?search=trackme");
    await waitFor(() => expect(screen.getByText("GST-MX")).toBeInTheDocument());

    expect(screen.getByLabelText("Search customers")).toHaveValue("trackme");
  });

  it("clearing filters removes search from the URL and resets page to 1", async () => {
    mockAuthenticated();
    server.use(
      http.get(CUSTOMERS_URL, () =>
        HttpResponse.json(fakeCustomerList({ items: [], total: 0, totalPages: 0 })),
      ),
    );

    const { router } = renderAt("/app/customers?search=nope&page=2");
    await waitFor(() =>
      expect(screen.getByText("No customers match your filters")).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    await waitFor(() => expect(router.state.location.search).not.toContain("search="));
    expect(router.state.location.search).not.toContain("page=");
  });

  it("falls back safely for an invalid ?page= without crashing", async () => {
    let lastPage: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(CUSTOMERS_URL, ({ request }) => {
        lastPage = new URL(request.url).searchParams.get("page");
        return HttpResponse.json(fakeCustomerList());
      }),
    );

    renderAt("/app/customers?page=abc");
    await waitFor(() => expect(screen.getByText("GST-MX")).toBeInTheDocument());
    expect(lastPage).toBe("1");
  });

  it("falls back safely for a zero/negative ?page= without crashing", async () => {
    let lastPage: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(CUSTOMERS_URL, ({ request }) => {
        lastPage = new URL(request.url).searchParams.get("page");
        return HttpResponse.json(fakeCustomerList());
      }),
    );

    renderAt("/app/customers?page=0");
    await waitFor(() => expect(screen.getByText("GST-MX")).toBeInTheDocument());
    expect(lastPage).toBe("1");
  });

  it("clamps an oversized ?pageSize= to the backend's max (100)", async () => {
    let lastPageSize: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(CUSTOMERS_URL, ({ request }) => {
        lastPageSize = new URL(request.url).searchParams.get("pageSize");
        return HttpResponse.json(fakeCustomerList({ pageSize: 100 }));
      }),
    );

    renderAt("/app/customers?pageSize=99999");
    await waitFor(() => expect(screen.getByText("GST-MX")).toBeInTheDocument());
    expect(lastPageSize).toBe("100");
  });

  it("ignores an invalid ?status= instead of sending it to the backend", async () => {
    let lastStatus: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(CUSTOMERS_URL, ({ request }) => {
        lastStatus = new URL(request.url).searchParams.get("status");
        return HttpResponse.json(fakeCustomerList());
      }),
    );

    renderAt("/app/customers?status=NOT_REAL");
    await waitFor(() => expect(screen.getByText("GST-MX")).toBeInTheDocument());
    expect(lastStatus).toBeNull();
  });
});

describe("CustomersPage - RBAC regression", () => {
  it("renders NotAuthorized (not a crash/redirect) when the admin lacks customers.read", async () => {
    mockAuthenticated([]);

    renderAt("/app/customers");

    await waitFor(() =>
      expect(screen.getByText(/don't have permission to view this page/i)).toBeInTheDocument(),
    );
    expect(screen.queryByRole("heading", { name: "Customers" })).not.toBeInTheDocument();
  });
});
