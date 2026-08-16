import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse, server } from "@pos-cloud-web/testing";
import {
  fakeInstallationList,
  fakeInstallationListItem,
  mockAuthenticated,
  renderAt,
} from "./test-support";

const INSTALLATIONS_URL = "/api/v1/control-plane/installations";
const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

describe("InstallationsPage - list", () => {
  it("shows loading skeleton rows while the list request is in flight", async () => {
    mockAuthenticated();
    server.use(
      http.get(INSTALLATIONS_URL, async () => {
        await delay(50);
        return HttpResponse.json(fakeInstallationList());
      }),
    );

    renderAt("/app/installations");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Installations" })).toBeInTheDocument(),
    );
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);

    await waitFor(() => expect(screen.getByText("POS-GST-00001")).toBeInTheDocument());
  });

  it("renders installation rows on success, including health/platform and detail/customer/license Links", async () => {
    mockAuthenticated();
    server.use(http.get(INSTALLATIONS_URL, () => HttpResponse.json(fakeInstallationList())));

    renderAt("/app/installations");

    await waitFor(() => expect(screen.getByText("POS-GST-00001")).toBeInTheDocument());
    expect(screen.getByText("Sucursal Principal")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "POS-GST-00001" });
    expect(link).toHaveAttribute("href", "/app/installations/bbbbbbbb-2222-4bbb-8bbb-bbbbbbbbbbbb");
    // "Windows" also appears as an <option> in the platform filter Select, so scope to the row.
    const row = link.closest("tr");
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText("Windows")).toBeInTheDocument();
    expect(within(row as HTMLElement).getByText("ACTIVE")).toBeInTheDocument();

    const customerLink = screen.getByRole("link", {
      name: "GST-MX — GS Trackme S.A. de C.V.",
    });
    expect(customerLink).toHaveAttribute(
      "href",
      "/app/customers/11111111-1111-4111-8111-111111111111",
    );
    const licenseLink = screen.getByRole("link", { name: "LIC-GST-00001" });
    expect(licenseLink).toHaveAttribute(
      "href",
      "/app/licenses/aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa",
    );

    expect(
      within(row as HTMLElement).getByText(
        DATE_TIME_FORMAT.format(new Date("2026-01-03T00:00:00.000Z")),
      ),
    ).toBeInTheDocument();
  });

  it("shows 'Not yet registered' when registeredAt is null, never inferred from status/health", async () => {
    mockAuthenticated();
    server.use(
      http.get(INSTALLATIONS_URL, () =>
        HttpResponse.json(
          fakeInstallationList({
            items: [
              fakeInstallationListItem({
                registeredAt: null,
                status: "ACTIVE",
                healthStatus: "ONLINE",
              }),
            ],
          }),
        ),
      ),
    );

    renderAt("/app/installations");

    await waitFor(() => expect(screen.getByText("POS-GST-00001")).toBeInTheDocument());
    expect(screen.getByText("Not yet registered")).toBeInTheDocument();
  });

  it("renders an Alert on a backend list error", async () => {
    mockAuthenticated();
    server.use(
      http.get(INSTALLATIONS_URL, () =>
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

    renderAt("/app/installations");

    await waitFor(
      () => expect(screen.getByText("An unexpected error occurred.")).toBeInTheDocument(),
      { timeout: 5000 },
    );
  });

  it("shows the no-installations empty state (with a create action) when there are no filters and zero results", async () => {
    mockAuthenticated(["installations.read", "installations.create"]);
    server.use(
      http.get(INSTALLATIONS_URL, () =>
        HttpResponse.json(fakeInstallationList({ items: [], total: 0, totalPages: 0 })),
      ),
    );

    renderAt("/app/installations");

    await waitFor(() => expect(screen.getByText("No installations yet")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Create installation" })).toBeInTheDocument();
  });

  it("shows the filtered-empty state (with Clear filters, no create action) when a filter yields zero results", async () => {
    mockAuthenticated();
    server.use(
      http.get(INSTALLATIONS_URL, () =>
        HttpResponse.json(fakeInstallationList({ items: [], total: 0, totalPages: 0 })),
      ),
    );

    renderAt("/app/installations?search=nope");

    await waitFor(() =>
      expect(screen.getByText("No installations match your filters")).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create installation" })).not.toBeInTheDocument();
  });

  it("updates the URL when a pagination control is used", async () => {
    mockAuthenticated();
    server.use(
      http.get(INSTALLATIONS_URL, () =>
        HttpResponse.json(
          fakeInstallationList({ page: 1, pageSize: 25, total: 60, totalPages: 3 }),
        ),
      ),
    );

    const { router } = renderAt("/app/installations");
    await waitFor(() => expect(screen.getByText("POS-GST-00001")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Next page" }));

    await waitFor(() => expect(router.state.location.search).toContain("page=2"));
  });

  it("sends the selected status filter to the backend and reflects it in the URL", async () => {
    let lastStatus: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(INSTALLATIONS_URL, ({ request }) => {
        lastStatus = new URL(request.url).searchParams.get("status");
        return HttpResponse.json(fakeInstallationList());
      }),
    );

    const { router } = renderAt("/app/installations");
    await waitFor(() => expect(screen.getByText("POS-GST-00001")).toBeInTheDocument());

    await userEvent.selectOptions(screen.getByLabelText("Filter by status"), "SUSPENDED");

    await waitFor(() => expect(lastStatus).toBe("SUSPENDED"));
    expect(router.state.location.search).toContain("status=SUSPENDED");
  });

  it("sends the selected platform filter to the backend and reflects it in the URL", async () => {
    let lastPlatform: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(INSTALLATIONS_URL, ({ request }) => {
        lastPlatform = new URL(request.url).searchParams.get("platform");
        return HttpResponse.json(fakeInstallationList());
      }),
    );

    const { router } = renderAt("/app/installations");
    await waitFor(() => expect(screen.getByText("POS-GST-00001")).toBeInTheDocument());

    await userEvent.selectOptions(screen.getByLabelText("Filter by platform"), "ANDROID");

    await waitFor(() => expect(lastPlatform).toBe("ANDROID"));
    expect(router.state.location.search).toContain("platform=ANDROID");
  });

  it("debounces search input before sending it to the backend / URL", async () => {
    let lastSearch: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(INSTALLATIONS_URL, ({ request }) => {
        lastSearch = new URL(request.url).searchParams.get("search");
        return HttpResponse.json(fakeInstallationList());
      }),
    );

    const { router } = renderAt("/app/installations");
    await waitFor(() => expect(screen.getByText("POS-GST-00001")).toBeInTheDocument());

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Search installations"), "pos");

    expect(router.state.location.search).not.toContain("search=");

    await waitFor(() => expect(lastSearch).toBe("pos"), { timeout: 2000 });
    expect(router.state.location.search).toContain("search=pos");
  });

  it("never applies a 1-2 character search to the backend/URL, and shows a helper instead of an error", async () => {
    let lastSearch: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(INSTALLATIONS_URL, ({ request }) => {
        lastSearch = new URL(request.url).searchParams.get("search");
        return HttpResponse.json(fakeInstallationList());
      }),
    );

    const { router } = renderAt("/app/installations");
    await waitFor(() => expect(screen.getByText("POS-GST-00001")).toBeInTheDocument());

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Search installations"), "po");

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(lastSearch).toBeNull();
    expect(router.state.location.search).not.toContain("search=");
    expect(screen.getByText("Type at least 3 characters to search")).toBeInTheDocument();
  });

  it("applies deep-linked ?customerId= and ?licenseId= filters without requiring manual UUID entry", async () => {
    let lastCustomerId: string | null = null;
    let lastLicenseId: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(INSTALLATIONS_URL, ({ request }) => {
        const url = new URL(request.url);
        lastCustomerId = url.searchParams.get("customerId");
        lastLicenseId = url.searchParams.get("licenseId");
        return HttpResponse.json(fakeInstallationList());
      }),
    );

    renderAt(
      "/app/installations?customerId=11111111-1111-4111-8111-111111111111&licenseId=aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa",
    );
    await waitFor(() => expect(screen.getByText("POS-GST-00001")).toBeInTheDocument());

    expect(lastCustomerId).toBe("11111111-1111-4111-8111-111111111111");
    expect(lastLicenseId).toBe("aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa");
  });

  it("shows the New Installation action when the admin has installations.create", async () => {
    mockAuthenticated(["installations.read", "installations.create"]);
    server.use(http.get(INSTALLATIONS_URL, () => HttpResponse.json(fakeInstallationList())));

    renderAt("/app/installations");

    await waitFor(() => expect(screen.getByText("POS-GST-00001")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "New Installation" })).toBeInTheDocument();
  });

  it("hides the New Installation action when the admin lacks installations.create", async () => {
    mockAuthenticated(["installations.read"]);
    server.use(http.get(INSTALLATIONS_URL, () => HttpResponse.json(fakeInstallationList())));

    renderAt("/app/installations");

    await waitFor(() => expect(screen.getByText("POS-GST-00001")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "New Installation" })).not.toBeInTheDocument();
  });
});

describe("InstallationsPage - URL state", () => {
  it("does not reset a deep-linked page (e.g. ?page=3) back to 1 on mount", async () => {
    let lastPage: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(INSTALLATIONS_URL, ({ request }) => {
        lastPage = new URL(request.url).searchParams.get("page");
        return HttpResponse.json(fakeInstallationList({ page: 3, total: 60, totalPages: 3 }));
      }),
    );

    const { router } = renderAt("/app/installations?page=3");
    await waitFor(() => expect(screen.getByText("POS-GST-00001")).toBeInTheDocument());

    expect(lastPage).toBe("3");
    expect(router.state.location.search).toContain("page=3");
  });

  it("populates the search input from an existing ?search= in the URL", async () => {
    mockAuthenticated();
    server.use(http.get(INSTALLATIONS_URL, () => HttpResponse.json(fakeInstallationList())));

    renderAt("/app/installations?search=pos");
    await waitFor(() => expect(screen.getByText("POS-GST-00001")).toBeInTheDocument());

    expect(screen.getByLabelText("Search installations")).toHaveValue("pos");
  });

  it("clearing filters removes search/customerId/licenseId from the URL and resets page to 1", async () => {
    mockAuthenticated();
    server.use(
      http.get(INSTALLATIONS_URL, () =>
        HttpResponse.json(fakeInstallationList({ items: [], total: 0, totalPages: 0 })),
      ),
    );

    const { router } = renderAt(
      "/app/installations?search=nope&customerId=11111111-1111-4111-8111-111111111111&licenseId=aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa&page=2",
    );
    await waitFor(() =>
      expect(screen.getByText("No installations match your filters")).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    await waitFor(() => expect(router.state.location.search).not.toContain("search="));
    expect(router.state.location.search).not.toContain("customerId=");
    expect(router.state.location.search).not.toContain("licenseId=");
    expect(router.state.location.search).not.toContain("page=");
  });

  it("falls back safely for an invalid ?page= without crashing", async () => {
    let lastPage: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(INSTALLATIONS_URL, ({ request }) => {
        lastPage = new URL(request.url).searchParams.get("page");
        return HttpResponse.json(fakeInstallationList());
      }),
    );

    renderAt("/app/installations?page=abc");
    await waitFor(() => expect(screen.getByText("POS-GST-00001")).toBeInTheDocument());
    expect(lastPage).toBe("1");
  });

  it("clamps an oversized ?pageSize= to the backend's max (100)", async () => {
    let lastPageSize: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(INSTALLATIONS_URL, ({ request }) => {
        lastPageSize = new URL(request.url).searchParams.get("pageSize");
        return HttpResponse.json(fakeInstallationList({ pageSize: 100 }));
      }),
    );

    renderAt("/app/installations?pageSize=99999");
    await waitFor(() => expect(screen.getByText("POS-GST-00001")).toBeInTheDocument());
    expect(lastPageSize).toBe("100");
  });

  it("ignores an invalid ?status= instead of sending it to the backend", async () => {
    let lastStatus: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(INSTALLATIONS_URL, ({ request }) => {
        lastStatus = new URL(request.url).searchParams.get("status");
        return HttpResponse.json(fakeInstallationList());
      }),
    );

    renderAt("/app/installations?status=NOT_REAL");
    await waitFor(() => expect(screen.getByText("POS-GST-00001")).toBeInTheDocument());
    expect(lastStatus).toBeNull();
  });

  it("ignores an invalid ?platform= instead of sending it to the backend", async () => {
    let lastPlatform: string | null = null;
    mockAuthenticated();
    server.use(
      http.get(INSTALLATIONS_URL, ({ request }) => {
        lastPlatform = new URL(request.url).searchParams.get("platform");
        return HttpResponse.json(fakeInstallationList());
      }),
    );

    renderAt("/app/installations?platform=NOT_REAL");
    await waitFor(() => expect(screen.getByText("POS-GST-00001")).toBeInTheDocument());
    expect(lastPlatform).toBeNull();
  });
});

describe("InstallationsPage - RBAC regression", () => {
  it("renders NotAuthorized (not a crash/redirect) when the admin lacks installations.read", async () => {
    mockAuthenticated([]);

    renderAt("/app/installations");

    await waitFor(() =>
      expect(screen.getByText(/don't have permission to view this page/i)).toBeInTheDocument(),
    );
    expect(screen.queryByRole("heading", { name: "Installations" })).not.toBeInTheDocument();
  });
});
