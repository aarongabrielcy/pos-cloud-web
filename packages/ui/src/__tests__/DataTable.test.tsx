import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable, type DataTableColumn } from "../DataTable";

interface Row {
  id: string;
  name: string;
}

const columns: DataTableColumn<Row>[] = [
  { key: "name", header: "Name", render: (row) => row.name },
];

describe("DataTable", () => {
  it("renders a row per item using the column's render function", () => {
    const rows: Row[] = [
      { id: "1", name: "ACME Corp" },
      { id: "2", name: "Globex" },
    ];
    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByText("ACME Corp")).toBeInTheDocument();
    expect(screen.getByText("Globex")).toBeInTheDocument();
  });

  it("renders skeleton loading rows instead of data when isLoading is true", () => {
    const rows: Row[] = [{ id: "1", name: "ACME Corp" }];
    render(
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        isLoading
        skeletonRows={3}
      />,
    );

    expect(screen.queryByText("ACME Corp")).not.toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(3);
  });

  it("renders the emptyState when there are no rows and not loading", () => {
    render(
      <DataTable
        columns={columns}
        rows={[]}
        rowKey={(row) => row.id}
        emptyState={<div>No customers yet</div>}
      />,
    );
    expect(screen.getByText("No customers yet")).toBeInTheDocument();
  });

  it("does not attach a click handler or button/link role to rows (no mouse-only interactivity)", () => {
    const rows: Row[] = [{ id: "1", name: "ACME Corp" }];
    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

    const row = screen.getByText("ACME Corp").closest("tr");
    expect(row).not.toBeNull();
    expect(row).not.toHaveAttribute("role", "button");
    expect(row).not.toHaveAttribute("role", "link");
    expect(row?.onclick).toBeNull();
  });

  it("supports row interactivity via a focusable element inside a cell instead of a row onClick", () => {
    const linkColumns: DataTableColumn<Row>[] = [
      {
        key: "name",
        header: "Name",
        render: (row) => <a href={`/customers/${row.id}`}>{row.name}</a>,
      },
    ];
    const rows: Row[] = [{ id: "1", name: "ACME Corp" }];
    render(<DataTable columns={linkColumns} rows={rows} rowKey={(row) => row.id} />);

    expect(screen.getByRole("link", { name: "ACME Corp" })).toHaveAttribute("href", "/customers/1");
  });
});
