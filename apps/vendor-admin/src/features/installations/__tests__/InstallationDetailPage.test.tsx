import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, server } from "@pos-cloud-web/testing";
import {
  fakeInstallation,
  fakeInstallationHealth,
  mockAuthenticated,
  renderAt,
} from "./test-support";

const INSTALLATION_ID = "bbbbbbbb-2222-4bbb-8bbb-bbbbbbbbbbbb";
const DETAIL_URL = `/api/v1/control-plane/installations/${INSTALLATION_ID}`;
const HEALTH_URL = `${DETAIL_URL}/health`;
const STATUS_URL = `${DETAIL_URL}/status`;
const DETAIL_PATH = `/app/installations/${INSTALLATION_ID}`;

// Extra headroom under full-workspace parallel test load (many concurrent jsdom environments) - this
// page chains a detail GET *and* a health GET before its first meaningful render, so it's tighter
// than single-query pages under contention (same rationale as CustomersPage's/CustomerDetailPage's
// backend-error tests, WEB-01C's technical validation).
const LOAD_TIMEOUT = { timeout: 5000 };

function mockHealthOk() {
  server.use(http.get(HEALTH_URL, () => HttpResponse.json(fakeInstallationHealth())));
}

describe("InstallationDetailPage - detail", () => {
  it("renders the installation's fields on success", async () => {
    mockAuthenticated(["installations.read"]);
    server.use(http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation())));
    mockHealthOk();

    renderAt(DETAIL_PATH);

    await waitFor(
      () => expect(screen.getByRole("heading", { name: "POS-GST-00001" })).toBeInTheDocument(),
      LOAD_TIMEOUT,
    );
    expect(screen.getAllByText("Sucursal Principal").length).toBeGreaterThan(0);
    expect(screen.getByText("Windows")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
  });

  it("renders Customer and License as human identity Links, never raw ids (WEB-01E §4/§36)", async () => {
    mockAuthenticated(["installations.read"]);
    server.use(http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation())));
    mockHealthOk();

    renderAt(DETAIL_PATH);

    await waitFor(
      () => expect(screen.getByRole("heading", { name: "POS-GST-00001" })).toBeInTheDocument(),
      LOAD_TIMEOUT,
    );

    const customerLink = screen.getByRole("link", { name: "GST-MX — GS Trackme S.A. de C.V." });
    expect(customerLink).toHaveAttribute(
      "href",
      "/app/customers/11111111-1111-4111-8111-111111111111",
    );
    const licenseLink = screen.getByRole("link", { name: "LIC-GST-00001" });
    expect(licenseLink).toHaveAttribute(
      "href",
      "/app/licenses/aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa",
    );
    expect(screen.queryByText("11111111-1111-4111-8111-111111111111")).not.toBeInTheDocument();
    expect(screen.queryByText("aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa")).not.toBeInTheDocument();
  });

  it("falls back to 'Unavailable' - never raw ids - if a relation summary is unexpectedly missing (WEB-01E §37)", async () => {
    mockAuthenticated(["installations.read"]);
    server.use(
      http.get(DETAIL_URL, () =>
        HttpResponse.json({ ...fakeInstallation(), customer: undefined, license: undefined }),
      ),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);

    await waitFor(
      () => expect(screen.getByRole("heading", { name: "POS-GST-00001" })).toBeInTheDocument(),
      LOAD_TIMEOUT,
    );

    expect(screen.getAllByText("Unavailable")).toHaveLength(2);
  });

  it("shows the formatted registration date when registeredAt is present", async () => {
    mockAuthenticated(["installations.read"]);
    server.use(
      http.get(DETAIL_URL, () =>
        HttpResponse.json(fakeInstallation({ registeredAt: "2026-01-03T00:00:00.000Z" })),
      ),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);

    await waitFor(
      () => expect(screen.getByRole("heading", { name: "POS-GST-00001" })).toBeInTheDocument(),
      LOAD_TIMEOUT,
    );

    expect(screen.queryByText("Not yet registered")).not.toBeInTheDocument();
  });

  it("shows 'Not yet registered' when registeredAt is null, never inferred from status/health", async () => {
    mockAuthenticated(["installations.read"]);
    server.use(
      http.get(DETAIL_URL, () =>
        HttpResponse.json(fakeInstallation({ registeredAt: null, status: "ACTIVE" })),
      ),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);

    await waitFor(
      () => expect(screen.getByRole("heading", { name: "POS-GST-00001" })).toBeInTheDocument(),
      LOAD_TIMEOUT,
    );

    expect(screen.getByText("Not yet registered")).toBeInTheDocument();
  });

  it("renders a real 'Back to Installations' link targeting exactly /app/installations", async () => {
    mockAuthenticated(["installations.read"]);
    server.use(http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation())));
    mockHealthOk();

    renderAt(DETAIL_PATH);

    await waitFor(
      () => expect(screen.getByRole("heading", { name: "POS-GST-00001" })).toBeInTheDocument(),
      LOAD_TIMEOUT,
    );

    const backLink = screen.getByRole("link", { name: "Back to Installations" });
    expect(backLink.tagName).toBe("A");
    expect(backLink).toHaveAttribute("href", "/app/installations");

    const breadcrumbNav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(breadcrumbNav).getByText("POS-GST-00001")).toBeInTheDocument();
  });

  it("renders a dedicated not-found state (with a link back) on a 404", async () => {
    mockAuthenticated(["installations.read"]);
    server.use(
      http.get(DETAIL_URL, () =>
        HttpResponse.json(
          {
            statusCode: 404,
            code: "INSTALLATION_NOT_FOUND",
            message: "Installation not found",
            correlationId: "c1",
          },
          { status: 404 },
        ),
      ),
    );

    renderAt(DETAIL_PATH);

    await waitFor(
      () =>
        expect(screen.getByRole("heading", { name: "Installation not found" })).toBeInTheDocument(),
      LOAD_TIMEOUT,
    );
    expect(screen.getByRole("link", { name: "Back to Installations" })).toHaveAttribute(
      "href",
      "/app/installations",
    );
  });
});

describe("InstallationDetailPage - health", () => {
  it("shows a loading skeleton, then the health fields on success", async () => {
    mockAuthenticated(["installations.read"]);
    server.use(http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation())));
    mockHealthOk();

    renderAt(DETAIL_PATH);

    await waitFor(
      () => expect(screen.getByRole("heading", { name: "POS-GST-00001" })).toBeInTheDocument(),
      LOAD_TIMEOUT,
    );
    await waitFor(() => expect(screen.getByText("Online")).toBeInTheDocument(), LOAD_TIMEOUT);
    expect(screen.getByText("1.4.2")).toBeInTheDocument();
  });

  it("isolates a health-read failure from the rest of the detail page", async () => {
    mockAuthenticated(["installations.read"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation())),
      http.get(HEALTH_URL, () =>
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

    renderAt(DETAIL_PATH);

    // The rest of the page still renders even though health fails.
    await waitFor(
      () => expect(screen.getByRole("heading", { name: "POS-GST-00001" })).toBeInTheDocument(),
      LOAD_TIMEOUT,
    );
    await waitFor(
      () => expect(screen.getByText("An unexpected error occurred.")).toBeInTheDocument(),
      LOAD_TIMEOUT,
    );
  });

  it("never classifies health client-side - shows exactly the backend's healthStatus value", async () => {
    mockAuthenticated(["installations.read"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation())),
      http.get(HEALTH_URL, () =>
        HttpResponse.json(fakeInstallationHealth({ healthStatus: "STALE", lastSeenAt: null })),
      ),
    );

    renderAt(DETAIL_PATH);

    await waitFor(() => expect(screen.getByText("Stale")).toBeInTheDocument(), LOAD_TIMEOUT);
  });
});

describe("InstallationDetailPage - status actions", () => {
  it("offers only Decommission for a PENDING installation", async () => {
    mockAuthenticated(["installations.read", "installations.status.change"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation({ status: "PENDING" }))),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);

    await waitFor(
      () => expect(screen.getByRole("button", { name: "Decommission" })).toBeInTheDocument(),
      LOAD_TIMEOUT,
    );
    expect(screen.queryByRole("button", { name: "Suspend" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reactivate" })).not.toBeInTheDocument();
  });

  it("offers Suspend and Decommission for an ACTIVE installation", async () => {
    mockAuthenticated(["installations.read", "installations.status.change"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation({ status: "ACTIVE" }))),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);

    await waitFor(
      () => expect(screen.getByRole("button", { name: "Suspend" })).toBeInTheDocument(),
      LOAD_TIMEOUT,
    );
    expect(screen.getByRole("button", { name: "Decommission" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reactivate" })).not.toBeInTheDocument();
  });

  it("offers Reactivate and Decommission for a SUSPENDED installation", async () => {
    mockAuthenticated(["installations.read", "installations.status.change"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation({ status: "SUSPENDED" }))),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);

    await waitFor(
      () => expect(screen.getByRole("button", { name: "Reactivate" })).toBeInTheDocument(),
      LOAD_TIMEOUT,
    );
    expect(screen.getByRole("button", { name: "Decommission" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suspend" })).not.toBeInTheDocument();
  });

  it("offers no status action for a DECOMMISSIONED (terminal) installation", async () => {
    mockAuthenticated(["installations.read", "installations.status.change"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation({ status: "DECOMMISSIONED" }))),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);

    await waitFor(
      () => expect(screen.getByRole("heading", { name: "POS-GST-00001" })).toBeInTheDocument(),
      LOAD_TIMEOUT,
    );
    expect(screen.queryByRole("button", { name: "Reactivate" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suspend" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Decommission" })).not.toBeInTheDocument();
  });

  it("hides status actions entirely without installations.status.change", async () => {
    mockAuthenticated(["installations.read"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation({ status: "ACTIVE" }))),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);

    await waitFor(
      () => expect(screen.getByRole("heading", { name: "POS-GST-00001" })).toBeInTheDocument(),
      LOAD_TIMEOUT,
    );
    expect(screen.queryByRole("button", { name: "Suspend" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Decommission" })).not.toBeInTheDocument();
  });

  it("confirms, mutates, and closes on a successful status change", async () => {
    mockAuthenticated(["installations.read", "installations.status.change"]);
    let currentStatus: "PENDING" | "ACTIVE" | "SUSPENDED" | "DECOMMISSIONED" = "ACTIVE";
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation({ status: currentStatus }))),
      http.patch(STATUS_URL, () => {
        currentStatus = "SUSPENDED";
        return HttpResponse.json(fakeInstallation({ status: "SUSPENDED" }));
      }),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);

    await waitFor(
      () => expect(screen.getByRole("button", { name: "Suspend" })).toBeInTheDocument(),
      LOAD_TIMEOUT,
    );
    await userEvent.click(screen.getByRole("button", { name: "Suspend" }));

    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Suspend" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("SUSPENDED")).toBeInTheDocument());
  });

  it("keeps the confirm dialog open and shows the error on a rejected status change", async () => {
    mockAuthenticated(["installations.read", "installations.status.change"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation({ status: "ACTIVE" }))),
      http.patch(STATUS_URL, () =>
        HttpResponse.json(
          {
            statusCode: 400,
            code: "INVALID_INSTALLATION_STATUS_TRANSITION",
            message: "Cannot transition Installation status from ACTIVE to SUSPENDED.",
            correlationId: "corr-status-1",
          },
          { status: 400 },
        ),
      ),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);

    await waitFor(
      () => expect(screen.getByRole("button", { name: "Suspend" })).toBeInTheDocument(),
      LOAD_TIMEOUT,
    );
    await userEvent.click(screen.getByRole("button", { name: "Suspend" }));

    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Suspend" }));

    expect(
      await within(dialog).findByText(
        "Cannot transition Installation status from ACTIVE to SUSPENDED.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("InstallationDetailPage - credential/enrollment action visibility", () => {
  it("shows only 'Issue enrollment code' for a PENDING installation with enrollment.manage", async () => {
    mockAuthenticated(["installations.read", "installations.enrollment.manage"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation({ status: "PENDING" }))),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);

    await waitFor(
      () =>
        expect(screen.getByRole("button", { name: "Issue enrollment code" })).toBeInTheDocument(),
      LOAD_TIMEOUT,
    );
    expect(
      screen.queryByRole("button", { name: "Issue recovery code (rekey)" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Revoke credential" })).not.toBeInTheDocument();
  });

  it("shows rekey/revoke (not initial enrollment) for an ACTIVE installation with credentials.manage", async () => {
    mockAuthenticated(["installations.read", "installations.credentials.manage"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation({ status: "ACTIVE" }))),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);

    await waitFor(
      () =>
        expect(
          screen.getByRole("button", { name: "Issue recovery code (rekey)" }),
        ).toBeInTheDocument(),
      LOAD_TIMEOUT,
    );
    expect(screen.getByRole("button", { name: "Revoke credential" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Issue enrollment code" })).not.toBeInTheDocument();
  });

  it("shows no credential actions for a PENDING installation without enrollment.manage", async () => {
    mockAuthenticated(["installations.read"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation({ status: "PENDING" }))),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);

    await waitFor(
      () => expect(screen.getByRole("heading", { name: "POS-GST-00001" })).toBeInTheDocument(),
      LOAD_TIMEOUT,
    );
    expect(screen.queryByRole("button", { name: "Issue enrollment code" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Credential & enrollment" }),
    ).not.toBeInTheDocument();
  });

  it("shows no credential actions for a DECOMMISSIONED installation even with both permissions", async () => {
    mockAuthenticated([
      "installations.read",
      "installations.enrollment.manage",
      "installations.credentials.manage",
    ]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation({ status: "DECOMMISSIONED" }))),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);

    await waitFor(
      () =>
        expect(
          screen.getByText(
            "No credential actions are available for this installation's current status.",
          ),
        ).toBeInTheDocument(),
      LOAD_TIMEOUT,
    );
  });
});
