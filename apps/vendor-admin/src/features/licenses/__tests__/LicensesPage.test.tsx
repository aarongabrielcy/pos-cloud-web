import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse, server } from "@pos-cloud-web/testing";
import { fakeLicenseList, mockAuthenticated, renderAt } from "./test-support";

const LICENSES_URL = "/api/v1/control-plane/licenses";

describe("LicensesPage - list", () => {
  it("shows loading skeleton rows while the list request is in flight", async () => {
    mockAuthenticated();
    server.use(
      http.get(LICENSES_URL, async () => {
        await delay(50);
        return HttpResponse.json(fakeLicenseList());
      }),
    );

    renderAt("/app/licenses");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Licenses" })).toBeInTheDocument(),
    );
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);

    await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument());
  });

  it("renders license rows on success, including a license number Link to the detail route", async () => {
    mockAuthenticated();
    server.use(http.get(LICENSES_URL, () => HttpResponse.json(fakeLicenseList())));

    renderAt("/app/licenses");

    await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument());
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "LIC-GST-00001" });
    expect(link).toHaveAttribute("href", "/app/licenses/aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa");
    // "Basic" also appears as an <option> in the edition filter Select, so scope to the row.
    const row = link.closest("tr");
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText("Basic")).toBeInTheDocument();

    const customerLink = screen.getByRole("link", {
      name: "GST-MX — GS Trackme S.A. de C.V.",
    });
    expect(customerLink).toHaveAttribute(
      "href",
      "/app/customers/11111111-1111-4111-8111-111111111111",
    );
  });

  it("renders an Alert on a backend list error", async () => {
    mockAuthenticated();
    server.use(
      http.get(LICENSES_URL, () =>
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

    renderAt("/app/licenses");

    await waitFor(
      () => expect(screen.getByText("An unexpected error occurred.")).toBeInTheDocument(),
      { timeout: 5000 },
    );
  });

  it("shows the no-licenses empty state (with a create action) when there are no filters and zero results", async () => {
    mockAuthenticated(["licenses.read", "licenses.create"]);
    server.use(
      http.get(LICENSES_URL, () =>
        HttpResponse.json(fakeLicenseList({ items: [], total: 0, totalPages: 0 })),
      ),
    );

    renderAt("/app/licenses");

    await waitFor(() => expect(screen.getByText("No licenses yet")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Create license" })).toBeInTheDocument();
  });

  it("shows the filtered-empty state (with Clear filters, no create action) when a filter yields zero results", async () => {
    mockAuthenticated();
    server.use(
      http.get(LICENSES_URL, () =>
        HttpResponse.json(fakeLicenseList({ items: [], total: 0, totalPages: 0 })),
      ),
    );

    renderAt("/app/licenses?search=nope");

    await waitFor(() =>
      expect(screen.getByText("No licenses match your filters")).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create license" })).not.toBeInTheDocument();
  });

  it("updates the URL when a pagination control is used", async () => {
    mockAuthenticated();
    server.use(
      http.get(LICENSES_URL, () =>
        HttpResponse.json(fakeLicenseList({ page: 1, pageSize: 25, total: 60, totalPages: 3 })),
      ),
    );

    const { router } = renderAt("/app/licenses");
    await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Next page" }));

    await waitFor(() => expect(router.state.location.search).toContain("page=2"));
  });

  it("sends the selected status filter to the backend and reflects it in the URL", async () => {
    let lastStatus: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(LICENSES_URL, ({ request }) => {
        lastStatus = new URL(request.url).searchParams.get("status");
        return HttpResponse.json(fakeLicenseList());
      }),
    );

    const { router } = renderAt("/app/licenses");
    await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument());

    await userEvent.selectOptions(screen.getByLabelText("Filter by status"), "SUSPENDED");

    await waitFor(() => expect(lastStatus).toBe("SUSPENDED"));
    expect(router.state.location.search).toContain("status=SUSPENDED");
  });

  it("sends the selected edition filter to the backend and reflects it in the URL", async () => {
    let lastEdition: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(LICENSES_URL, ({ request }) => {
        lastEdition = new URL(request.url).searchParams.get("edition");
        return HttpResponse.json(fakeLicenseList());
      }),
    );

    const { router } = renderAt("/app/licenses");
    await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument());

    await userEvent.selectOptions(screen.getByLabelText("Filter by edition"), "PREMIUM");

    await waitFor(() => expect(lastEdition).toBe("PREMIUM"));
    expect(router.state.location.search).toContain("edition=PREMIUM");
  });

  it("debounces search input before sending it to the backend / URL", async () => {
    let lastSearch: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(LICENSES_URL, ({ request }) => {
        lastSearch = new URL(request.url).searchParams.get("search");
        return HttpResponse.json(fakeLicenseList());
      }),
    );

    const { router } = renderAt("/app/licenses");
    await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument());

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Search licenses"), "gst");

    expect(router.state.location.search).not.toContain("search=");

    await waitFor(() => expect(lastSearch).toBe("gst"), { timeout: 2000 });
    expect(router.state.location.search).toContain("search=gst");
  });

  it("never applies a 1-2 character search to the backend/URL, and shows a helper instead of an error", async () => {
    let lastSearch: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(LICENSES_URL, ({ request }) => {
        lastSearch = new URL(request.url).searchParams.get("search");
        return HttpResponse.json(fakeLicenseList());
      }),
    );

    const { router } = renderAt("/app/licenses");
    await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument());

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Search licenses"), "gs");

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(lastSearch).toBeNull();
    expect(router.state.location.search).not.toContain("search=");
    expect(screen.getByText("Type at least 3 characters to search")).toBeInTheDocument();
  });

  it("applies a deep-linked ?customerId= filter without requiring manual UUID entry", async () => {
    let lastCustomerId: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(LICENSES_URL, ({ request }) => {
        lastCustomerId = new URL(request.url).searchParams.get("customerId");
        return HttpResponse.json(fakeLicenseList());
      }),
    );

    renderAt("/app/licenses?customerId=11111111-1111-4111-8111-111111111111");
    await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument());

    expect(lastCustomerId).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("shows the New License action when the admin has licenses.create", async () => {
    mockAuthenticated(["licenses.read", "licenses.create"]);
    server.use(http.get(LICENSES_URL, () => HttpResponse.json(fakeLicenseList())));

    renderAt("/app/licenses");

    await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "New License" })).toBeInTheDocument();
  });

  it("hides the New License action when the admin lacks licenses.create", async () => {
    mockAuthenticated(["licenses.read"]);
    server.use(http.get(LICENSES_URL, () => HttpResponse.json(fakeLicenseList())));

    renderAt("/app/licenses");

    await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "New License" })).not.toBeInTheDocument();
  });
});

describe("LicensesPage - URL state", () => {
  it("does not reset a deep-linked page (e.g. ?page=3) back to 1 on mount", async () => {
    let lastPage: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(LICENSES_URL, ({ request }) => {
        lastPage = new URL(request.url).searchParams.get("page");
        return HttpResponse.json(fakeLicenseList({ page: 3, total: 60, totalPages: 3 }));
      }),
    );

    const { router } = renderAt("/app/licenses?page=3");
    await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument());

    expect(lastPage).toBe("3");
    expect(router.state.location.search).toContain("page=3");
  });

  it("populates the search input from an existing ?search= in the URL", async () => {
    mockAuthenticated();
    server.use(http.get(LICENSES_URL, () => HttpResponse.json(fakeLicenseList())));

    renderAt("/app/licenses?search=gst");
    await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument());

    expect(screen.getByLabelText("Search licenses")).toHaveValue("gst");
  });

  it("clearing filters removes search/customerId from the URL and resets page to 1", async () => {
    mockAuthenticated();
    server.use(
      http.get(LICENSES_URL, () =>
        HttpResponse.json(fakeLicenseList({ items: [], total: 0, totalPages: 0 })),
      ),
    );

    const { router } = renderAt(
      "/app/licenses?search=nope&customerId=11111111-1111-4111-8111-111111111111&page=2",
    );
    await waitFor(() =>
      expect(screen.getByText("No licenses match your filters")).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    await waitFor(() => expect(router.state.location.search).not.toContain("search="));
    expect(router.state.location.search).not.toContain("customerId=");
    expect(router.state.location.search).not.toContain("page=");
  });

  it("falls back safely for an invalid ?page= without crashing", async () => {
    let lastPage: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(LICENSES_URL, ({ request }) => {
        lastPage = new URL(request.url).searchParams.get("page");
        return HttpResponse.json(fakeLicenseList());
      }),
    );

    renderAt("/app/licenses?page=abc");
    await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument());
    expect(lastPage).toBe("1");
  });

  it("clamps an oversized ?pageSize= to the backend's max (100)", async () => {
    let lastPageSize: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(LICENSES_URL, ({ request }) => {
        lastPageSize = new URL(request.url).searchParams.get("pageSize");
        return HttpResponse.json(fakeLicenseList({ pageSize: 100 }));
      }),
    );

    renderAt("/app/licenses?pageSize=99999");
    await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument());
    expect(lastPageSize).toBe("100");
  });

  it("ignores an invalid ?status= instead of sending it to the backend", async () => {
    let lastStatus: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(LICENSES_URL, ({ request }) => {
        lastStatus = new URL(request.url).searchParams.get("status");
        return HttpResponse.json(fakeLicenseList());
      }),
    );

    renderAt("/app/licenses?status=NOT_REAL");
    await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument());
    expect(lastStatus).toBeNull();
  });

  it("ignores an invalid ?edition= instead of sending it to the backend", async () => {
    let lastEdition: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(LICENSES_URL, ({ request }) => {
        lastEdition = new URL(request.url).searchParams.get("edition");
        return HttpResponse.json(fakeLicenseList());
      }),
    );

    renderAt("/app/licenses?edition=NOT_REAL");
    await waitFor(() => expect(screen.getByText("LIC-GST-00001")).toBeInTheDocument());
    expect(lastEdition).toBeNull();
  });
});

describe("LicensesPage - RBAC regression", () => {
  it("renders NotAuthorized (not a crash/redirect) when the admin lacks licenses.read", async () => {
    mockAuthenticated([]);

    renderAt("/app/licenses");

    await waitFor(() =>
      expect(screen.getByText(/don't have permission to view this page/i)).toBeInTheDocument(),
    );
    expect(screen.queryByRole("heading", { name: "Licenses" })).not.toBeInTheDocument();
  });
});
