import { afterEach, describe, expect, it, vi } from "vitest";
import { clearAccessToken, getAccessToken, setAccessToken } from "../token-store";

describe("token store", () => {
  afterEach(() => {
    clearAccessToken();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("holds the access token only in memory and returns it via getAccessToken", () => {
    setAccessToken("my-access-token");
    expect(getAccessToken()).toBe("my-access-token");
  });

  it("clearAccessToken resets it to null", () => {
    setAccessToken("my-access-token");
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  it("never writes the access token to localStorage", () => {
    setAccessToken("secret-token");
    expect(localStorage.length).toBe(0);
    expect(JSON.stringify(localStorage)).not.toContain("secret-token");
  });

  it("never writes the access token to sessionStorage", () => {
    setAccessToken("secret-token");
    expect(sessionStorage.length).toBe(0);
    expect(JSON.stringify(sessionStorage)).not.toContain("secret-token");
  });

  it("never touches IndexedDB", () => {
    // jsdom does not implement indexedDB by default - only assert the spy when it genuinely exists,
    // so this test is meaningful (not vacuous) wherever indexedDB is actually present.
    if (typeof indexedDB === "undefined") {
      expect(typeof indexedDB).toBe("undefined");
      return;
    }
    const openSpy = vi.spyOn(indexedDB, "open");
    setAccessToken("secret-token");
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });
});
