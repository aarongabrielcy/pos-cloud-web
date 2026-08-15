import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useSearchParams } from "react-router-dom";
import { useListQueryParams } from "../useListQueryParams";

const FILTER_KEYS = ["status", "search"] as const;

function Probe() {
  const { page, pageSize, filters, setFilter, setPage, clearFilters } = useListQueryParams({
    filterKeys: FILTER_KEYS,
  });
  const [searchParams] = useSearchParams();

  return (
    <div>
      <div data-testid="page">{page}</div>
      <div data-testid="pageSize">{pageSize}</div>
      <div data-testid="filters">{JSON.stringify(filters)}</div>
      <div data-testid="search">{searchParams.toString()}</div>
      <button onClick={() => setFilter("status", "ACTIVE")}>set-status</button>
      <button onClick={() => setPage(3)}>set-page-3</button>
      <button onClick={() => clearFilters()}>clear-filters</button>
    </div>
  );
}

function renderAt(initialEntry: string) {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Probe />
    </MemoryRouter>,
  );
}

describe("useListQueryParams", () => {
  it("defaults to page 1 and the given default pageSize with no filters", () => {
    renderAt("/app/customers");
    expect(screen.getByTestId("page").textContent).toBe("1");
    expect(screen.getByTestId("pageSize").textContent).toBe("25");
    expect(screen.getByTestId("filters").textContent).toBe("{}");
  });

  it("falls back to page 1 for a non-numeric or invalid page value in the URL", () => {
    renderAt("/app/customers?page=not-a-number");
    expect(screen.getByTestId("page").textContent).toBe("1");
  });

  it("falls back to page 1 for a page value below 1", () => {
    renderAt("/app/customers?page=0");
    expect(screen.getByTestId("page").textContent).toBe("1");
  });

  it("clamps a pageSize above the backend's 1-100 max down to 100", () => {
    renderAt("/app/customers?pageSize=99999");
    expect(screen.getByTestId("pageSize").textContent).toBe("100");
  });

  it("falls back to the default pageSize for a non-numeric or invalid pageSize value", () => {
    renderAt("/app/customers?pageSize=0");
    expect(screen.getByTestId("pageSize").textContent).toBe("25");
  });

  it("reads an existing filter value already present in the URL", () => {
    renderAt("/app/customers?status=ACTIVE");
    expect(screen.getByTestId("filters").textContent).toBe(JSON.stringify({ status: "ACTIVE" }));
  });

  it("setFilter writes the value into the URL", async () => {
    renderAt("/app/customers");
    await userEvent.click(screen.getByText("set-status"));
    expect(screen.getByTestId("search").textContent).toBe("status=ACTIVE");
    expect(screen.getByTestId("filters").textContent).toBe(JSON.stringify({ status: "ACTIVE" }));
  });

  it("setFilter resets the page back to 1", async () => {
    renderAt("/app/customers?page=3");
    expect(screen.getByTestId("page").textContent).toBe("3");

    await userEvent.click(screen.getByText("set-status"));

    expect(screen.getByTestId("page").textContent).toBe("1");
    expect(screen.getByTestId("search").textContent).not.toContain("page=");
  });

  it("setPage updates the URL", async () => {
    renderAt("/app/customers");
    await userEvent.click(screen.getByText("set-page-3"));
    expect(screen.getByTestId("page").textContent).toBe("3");
    expect(screen.getByTestId("search").textContent).toBe("page=3");
  });

  it("clearFilters removes every declared filter key and the page param", async () => {
    renderAt("/app/customers?status=ACTIVE&search=acme&page=2");
    await userEvent.click(screen.getByText("clear-filters"));

    expect(screen.getByTestId("filters").textContent).toBe("{}");
    expect(screen.getByTestId("page").textContent).toBe("1");
    expect(screen.getByTestId("search").textContent).toBe("");
  });
});
