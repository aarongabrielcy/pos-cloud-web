import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, server } from "@pos-cloud-web/testing";
import { fakeLicense, mockAuthenticated, renderAt } from "./test-support";

const LICENSE_ID = "aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa";
const DETAIL_URL = `/api/v1/control-plane/licenses/${LICENSE_ID}`;
const STATUS_URL = `${DETAIL_URL}/status`;
const DETAIL_PATH = `/app/licenses/${LICENSE_ID}`;

describe("LicenseDetailPage - detail", () => {
  it("renders the license's fields on success", async () => {
    mockAuthenticated(["licenses.read"]);
    server.use(http.get(DETAIL_URL, () => HttpResponse.json(fakeLicense())));

    renderAt(DETAIL_PATH);

    await waitFor(
      () => expect(screen.getByRole("heading", { name: "LIC-GST-00001" })).toBeInTheDocument(),
      { timeout: 5000 },
    );
    expect(screen.getAllByText("Basic").length).toBeGreaterThan(0);
    expect(screen.getByText("Perpetual")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Perpetual — no expiry")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
  });

  it("renders a real 'Back to Licenses' link targeting exactly /app/licenses", async () => {
    mockAuthenticated(["licenses.read"]);
    server.use(http.get(DETAIL_URL, () => HttpResponse.json(fakeLicense())));

    renderAt(DETAIL_PATH);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "LIC-GST-00001" })).toBeInTheDocument(),
    );

    const backLink = screen.getByRole("link", { name: "Back to Licenses" });
    expect(backLink.tagName).toBe("A");
    expect(backLink).toHaveAttribute("href", "/app/licenses");

    const breadcrumbNav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(breadcrumbNav).getByText("LIC-GST-00001")).toBeInTheDocument();
  });

  it("shows entitlements when present and a friendly empty message when there are none", async () => {
    mockAuthenticated(["licenses.read"]);
    server.use(
      http.get(DETAIL_URL, () =>
        HttpResponse.json(
          fakeLicense({
            entitlements: [
              {
                id: "ent-1",
                code: "integrated_payments",
                enabled: true,
                configuration: null,
                createdAt: "2026-01-01T00:00:00.000Z",
                updatedAt: "2026-01-01T00:00:00.000Z",
              },
            ],
          }),
        ),
      ),
    );

    renderAt(DETAIL_PATH);

    await waitFor(() => expect(screen.getByText("integrated_payments")).toBeInTheDocument());
    expect(screen.getByText("Enabled")).toBeInTheDocument();
  });

  it("shows a 'no entitlements' message when the array is empty", async () => {
    mockAuthenticated(["licenses.read"]);
    server.use(http.get(DETAIL_URL, () => HttpResponse.json(fakeLicense({ entitlements: [] }))));

    renderAt(DETAIL_PATH);

    await waitFor(() =>
      expect(screen.getByText("No entitlements configured.")).toBeInTheDocument(),
    );
  });

  it("renders a dedicated not-found state (with a link back) on a 404", async () => {
    mockAuthenticated(["licenses.read"]);
    server.use(
      http.get(DETAIL_URL, () =>
        HttpResponse.json(
          {
            statusCode: 404,
            code: "LICENSE_NOT_FOUND",
            message: "License not found",
            correlationId: "c1",
          },
          { status: 404 },
        ),
      ),
    );

    renderAt(DETAIL_PATH);

    await waitFor(
      () => expect(screen.getByRole("heading", { name: "License not found" })).toBeInTheDocument(),
      { timeout: 5000 },
    );
    expect(screen.getByRole("link", { name: "Back to Licenses" })).toHaveAttribute(
      "href",
      "/app/licenses",
    );
  });
});

describe("LicenseDetailPage - status actions", () => {
  it("offers Suspend, Mark Expired, and Revoke for an ACTIVE license", async () => {
    mockAuthenticated(["licenses.read", "licenses.status.change"]);
    server.use(http.get(DETAIL_URL, () => HttpResponse.json(fakeLicense({ status: "ACTIVE" }))));

    renderAt(DETAIL_PATH);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Suspend" })).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Mark Expired" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revoke" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reactivate" })).not.toBeInTheDocument();
  });

  it("offers Reactivate, Mark Expired, and Revoke for a SUSPENDED license", async () => {
    mockAuthenticated(["licenses.read", "licenses.status.change"]);
    server.use(http.get(DETAIL_URL, () => HttpResponse.json(fakeLicense({ status: "SUSPENDED" }))));

    renderAt(DETAIL_PATH);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Reactivate" })).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Mark Expired" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revoke" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suspend" })).not.toBeInTheDocument();
  });

  it("offers no status action for an EXPIRED (terminal) license", async () => {
    mockAuthenticated(["licenses.read", "licenses.status.change"]);
    server.use(http.get(DETAIL_URL, () => HttpResponse.json(fakeLicense({ status: "EXPIRED" }))));

    renderAt(DETAIL_PATH);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "LIC-GST-00001" })).toBeInTheDocument(),
    );
    expect(screen.queryByRole("button", { name: "Suspend" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reactivate" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Revoke" })).not.toBeInTheDocument();
  });

  it("offers no status action for a REVOKED (terminal) license", async () => {
    mockAuthenticated(["licenses.read", "licenses.status.change"]);
    server.use(http.get(DETAIL_URL, () => HttpResponse.json(fakeLicense({ status: "REVOKED" }))));

    renderAt(DETAIL_PATH);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "LIC-GST-00001" })).toBeInTheDocument(),
    );
    expect(screen.queryByRole("button", { name: "Reactivate" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark Expired" })).not.toBeInTheDocument();
  });

  it("hides status actions entirely without licenses.status.change", async () => {
    mockAuthenticated(["licenses.read"]);
    server.use(http.get(DETAIL_URL, () => HttpResponse.json(fakeLicense({ status: "ACTIVE" }))));

    renderAt(DETAIL_PATH);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "LIC-GST-00001" })).toBeInTheDocument(),
    );
    expect(screen.queryByRole("button", { name: "Suspend" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Revoke" })).not.toBeInTheDocument();
  });

  it("confirms, mutates, and closes on a successful status change", async () => {
    mockAuthenticated(["licenses.read", "licenses.status.change"]);
    let currentStatus: "ACTIVE" | "SUSPENDED" | "EXPIRED" | "REVOKED" = "ACTIVE";
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeLicense({ status: currentStatus }))),
      http.patch(STATUS_URL, () => {
        currentStatus = "SUSPENDED";
        return HttpResponse.json(fakeLicense({ status: "SUSPENDED" }));
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

  it("keeps the confirm dialog open and shows the error on a 400 invalid transition", async () => {
    // Confirmed against pos-cloud: InvalidLicenseStatusTransitionError extends ValidationError, which
    // AllExceptionsFilter maps to 400 (not 409) - unlike Customer status transitions. The UI itself
    // never offers a disallowed transition, but the backend remains the real authority (e.g. a
    // concurrent change elsewhere could race this request) - proving the dialog handles a rejected
    // mutation gracefully either way.
    mockAuthenticated(["licenses.read", "licenses.status.change"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeLicense({ status: "ACTIVE" }))),
      http.patch(STATUS_URL, () =>
        HttpResponse.json(
          {
            statusCode: 400,
            code: "INVALID_LICENSE_STATUS_TRANSITION",
            message: "Cannot transition License status from ACTIVE to SUSPENDED.",
            correlationId: "corr-status-1",
          },
          { status: 400 },
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
      await within(dialog).findByText("Cannot transition License status from ACTIVE to SUSPENDED."),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
