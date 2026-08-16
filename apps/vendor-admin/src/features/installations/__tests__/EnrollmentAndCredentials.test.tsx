import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
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
const ENROLLMENT_URL = `${DETAIL_URL}/enrollment`;
const RECOVERY_URL = `${DETAIL_URL}/credentials/recovery-enrollment`;
const REVOKE_URL = `${DETAIL_URL}/credentials/revoke`;
const DETAIL_PATH = `/app/installations/${INSTALLATION_ID}`;
const SECRET_CODE = "3fa85f64-5717-4562-b3fc-2c963f66afa6.k3f9-super-secret-value";

function mockHealthOk() {
  server.use(http.get(HEALTH_URL, () => HttpResponse.json(fakeInstallationHealth())));
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("Initial enrollment", () => {
  it("issues a code for a PENDING installation and shows it once, with a Copy action and expiry", async () => {
    mockAuthenticated(["installations.read", "installations.enrollment.manage"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation({ status: "PENDING" }))),
      http.post(ENROLLMENT_URL, () =>
        HttpResponse.json(
          {
            installationId: INSTALLATION_ID,
            enrollmentCode: SECRET_CODE,
            expiresAt: "2026-01-01T00:15:00.000Z",
          },
          { status: 201 },
        ),
      ),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);

    await userEvent.click(
      await screen.findByRole("button", { name: "Issue enrollment code" }, { timeout: 5000 }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/one-time enrollment code/i)).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole("button", { name: "Issue code" }));

    expect(await within(dialog).findByText(SECRET_CODE)).toBeInTheDocument();
    expect(within(dialog).getByText(/shown only once/i)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("copies the code via navigator.clipboard when Copy is clicked", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    mockAuthenticated(["installations.read", "installations.enrollment.manage"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation({ status: "PENDING" }))),
      http.post(ENROLLMENT_URL, () =>
        HttpResponse.json(
          {
            installationId: INSTALLATION_ID,
            enrollmentCode: SECRET_CODE,
            expiresAt: "2026-01-01T00:15:00.000Z",
          },
          { status: 201 },
        ),
      ),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);
    await userEvent.click(
      await screen.findByRole("button", { name: "Issue enrollment code" }, { timeout: 5000 }),
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Issue code" }));
    await within(dialog).findByText(SECRET_CODE);

    await userEvent.click(within(dialog).getByRole("button", { name: "Copy" }));

    expect(writeText).toHaveBeenCalledWith(SECRET_CODE);
    expect(await within(dialog).findByRole("button", { name: "Copied" })).toBeInTheDocument();
  });

  it("clears the secret from the dialog on dismiss - reopening shows the confirm step again, not the old code", async () => {
    mockAuthenticated(["installations.read", "installations.enrollment.manage"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation({ status: "PENDING" }))),
      http.post(ENROLLMENT_URL, () =>
        HttpResponse.json(
          {
            installationId: INSTALLATION_ID,
            enrollmentCode: SECRET_CODE,
            expiresAt: "2026-01-01T00:15:00.000Z",
          },
          { status: 201 },
        ),
      ),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);
    await userEvent.click(
      await screen.findByRole("button", { name: "Issue enrollment code" }, { timeout: 5000 }),
    );
    let dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Issue code" }));
    await within(dialog).findByText(SECRET_CODE);

    await userEvent.click(within(dialog).getByRole("button", { name: "Done" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByText(SECRET_CODE)).not.toBeInTheDocument();

    await userEvent.click(
      await screen.findByRole("button", { name: "Issue enrollment code" }, { timeout: 5000 }),
    );
    dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByText(SECRET_CODE)).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Issue code" })).toBeInTheDocument();
  });

  it("never persists the secret to localStorage or sessionStorage", async () => {
    mockAuthenticated(["installations.read", "installations.enrollment.manage"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation({ status: "PENDING" }))),
      http.post(ENROLLMENT_URL, () =>
        HttpResponse.json(
          {
            installationId: INSTALLATION_ID,
            enrollmentCode: SECRET_CODE,
            expiresAt: "2026-01-01T00:15:00.000Z",
          },
          { status: 201 },
        ),
      ),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);
    await userEvent.click(
      await screen.findByRole("button", { name: "Issue enrollment code" }, { timeout: 5000 }),
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Issue code" }));
    await within(dialog).findByText(SECRET_CODE);

    const localStorageDump = JSON.stringify(localStorage);
    const sessionStorageDump = JSON.stringify(sessionStorage);
    expect(localStorageDump.includes(SECRET_CODE)).toBe(false);
    expect(sessionStorageDump.includes(SECRET_CODE)).toBe(false);
  });

  it("never logs the secret to the console", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    mockAuthenticated(["installations.read", "installations.enrollment.manage"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation({ status: "PENDING" }))),
      http.post(ENROLLMENT_URL, () =>
        HttpResponse.json(
          {
            installationId: INSTALLATION_ID,
            enrollmentCode: SECRET_CODE,
            expiresAt: "2026-01-01T00:15:00.000Z",
          },
          { status: 201 },
        ),
      ),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);
    await userEvent.click(
      await screen.findByRole("button", { name: "Issue enrollment code" }, { timeout: 5000 }),
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Issue code" }));
    await within(dialog).findByText(SECRET_CODE);

    for (const spy of [logSpy, errorSpy, warnSpy]) {
      for (const call of spy.mock.calls) {
        expect(call.join(" ")).not.toContain(SECRET_CODE);
      }
    }

    logSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("keeps the dialog open and shows the error when the installation is not eligible (409)", async () => {
    mockAuthenticated(["installations.read", "installations.enrollment.manage"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation({ status: "PENDING" }))),
      http.post(ENROLLMENT_URL, () =>
        HttpResponse.json(
          {
            statusCode: 409,
            code: "INSTALLATION_NOT_ELIGIBLE_FOR_ENROLLMENT",
            message: "Installation is not eligible for enrollment.",
            correlationId: "corr-1",
          },
          { status: 409 },
        ),
      ),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);
    await userEvent.click(
      await screen.findByRole("button", { name: "Issue enrollment code" }, { timeout: 5000 }),
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Issue code" }));

    expect(
      await within(dialog).findByText("Installation is not eligible for enrollment."),
    ).toBeInTheDocument();
    expect(screen.queryByText(SECRET_CODE)).not.toBeInTheDocument();
  });
});

describe("Recovery enrollment (rekey)", () => {
  it("is a visibly separate action from initial enrollment and warns the old credential is not revoked immediately", async () => {
    mockAuthenticated(["installations.read", "installations.credentials.manage"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation({ status: "ACTIVE" }))),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);

    await userEvent.click(
      await screen.findByRole("button", { name: "Issue recovery code (rekey)" }, { timeout: 5000 }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/not revoked immediately/i)).toBeInTheDocument();
  });

  it("issues a recovery code for a SUSPENDED installation and shows it once", async () => {
    mockAuthenticated(["installations.read", "installations.credentials.manage"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation({ status: "SUSPENDED" }))),
      http.post(RECOVERY_URL, () =>
        HttpResponse.json(
          {
            installationId: INSTALLATION_ID,
            enrollmentCode: SECRET_CODE,
            expiresAt: "2026-01-01T00:15:00.000Z",
          },
          { status: 201 },
        ),
      ),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);
    await userEvent.click(
      await screen.findByRole("button", { name: "Issue recovery code (rekey)" }, { timeout: 5000 }),
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Issue recovery code" }));

    expect(await within(dialog).findByText(SECRET_CODE)).toBeInTheDocument();
  });
});

describe("Revoke credential", () => {
  it("shows a danger confirmation and succeeds (no secret to reveal)", async () => {
    mockAuthenticated(["installations.read", "installations.credentials.manage"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation({ status: "ACTIVE" }))),
      http.post(REVOKE_URL, () => new HttpResponse(null, { status: 204 })),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);
    await userEvent.click(
      await screen.findByRole("button", { name: "Revoke credential" }, { timeout: 5000 }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/immediately invalidates/i)).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole("button", { name: "Revoke credential" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("is idempotent - succeeds even with no active credential", async () => {
    mockAuthenticated(["installations.read", "installations.credentials.manage"]);
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(fakeInstallation({ status: "SUSPENDED" }))),
      http.post(REVOKE_URL, () => new HttpResponse(null, { status: 204 })),
    );
    mockHealthOk();

    renderAt(DETAIL_PATH);
    await userEvent.click(
      await screen.findByRole("button", { name: "Revoke credential" }, { timeout: 5000 }),
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Revoke credential" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
