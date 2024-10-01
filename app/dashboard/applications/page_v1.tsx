'use client';

import React, { useEffect, useState } from 'react';
import '@/app/ui/dashboard/applications/applications.css';
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
  RowData,
} from '@tanstack/react-table';

type Application = {
  id: number;
  company: string;
  firstRound: boolean;
  finalRound: boolean;
  offer: boolean;
};

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

const defaultColumn: Partial<ColumnDef<Application>> = {
  cell: ({ getValue, row: { index }, column: { id }, table }) => {
    const initialValue = getValue();
    const [value, setValue] = React.useState(initialValue);
    const onBlur = () => {
      table.options.meta?.updateData(index, id, value);
    };
    React.useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);
    return (
      <input
        value={value as string}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
      />
    );
  },
};

function useSkipper() {
  const shouldSkipRef = React.useRef(true);
  const shouldSkip = shouldSkipRef.current;
  const skip = React.useCallback(() => {
    shouldSkipRef.current = false;
  }, []);
  React.useEffect(() => {
    shouldSkipRef.current = true;
  });
  return [shouldSkip, skip] as const;
}

function App() {
  const rerender = React.useReducer(() => ({}), {})[1];
  const columns = React.useMemo<ColumnDef<Application>[]>(
    () => [
      {
        header: 'ID',
        accessorKey: 'id',
        footer: (props) => props.column.id,
      },
      {
        header: 'Company',
        accessorKey: 'company',
        footer: (props) => props.column.id,
      },
      {
        header: 'First Round/Coding Challenge',
        accessorKey: 'firstRound',
        footer: (props) => props.column.id,
      },
      {
        header: 'Final Round',
        accessorKey: 'finalRound',
        footer: (props) => props.column.id,
      },
      {
        header: 'Offer',
        accessorKey: 'offer',
        footer: (props) => props.column.id,
      },
    ],
    []
  );

  const [data, setData] = React.useState<Application[]>([]);
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [newRow, setNewRow] = React.useState<Application>({
    id: 0,
    company: '',
    firstRound: false,
    finalRound: false,
    offer: false,
  });

  React.useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/applications');
        const applications = await response.json();
        setData(applications);
      } catch (error) {
        console.error('Failed to fetch applications:', error);
      }
    }
    fetchData();
  }, []);

  const updateData = (rowIndex: number, columnId: string, value: unknown) => {
    setData((old) =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...row,
            [columnId]: value,
          };
        }
        return row;
      })
    );
  };

  const addNewRow = () => {
    setData((old) => [...old, newRow]);
    setNewRow({
      id: 0,
      company: '',
      firstRound: false,
      finalRound: false,
      offer: false,
    });
  };

  const table = useReactTable({
    data,
    columns,
    defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData,
    },
    autoResetPageIndex,
  });

  return (
    <div className="p-2">
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          {table.getFooterGroups().map((footerGroup) => (
            <tr key={footerGroup.id}>
              {footerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.footer, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
      <div className="h-2" />
      <div className="flex items-center gap-2">
        <button
          className="border rounded p-1"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {'<<'}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {'<'}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {'>'}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {'>>'}
        </button>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          | Go to page:
          <input
            type="number"
            min="1"
            max={table.getPageCount()}
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(page);
            }}
            className="border p-1 rounded w-16"
          />
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
      <div>{table.getRowModel().rows.length} Rows</div>
      <div>
        <button onClick={() => rerender()}>Force Rerender</button>
      </div>
      <div>
        <button onClick={() => setData([])}>Refresh Data</button>
      </div>
      <div className="mt-4">
        <h3>Add New Row</h3>
        <input
          type="number"
          placeholder="ID"
          value={newRow.id}
          onChange={(e) => setNewRow({ ...newRow, id: Number(e.target.value) })}
          className="border p-1 rounded"
        />
        <input
          type="text"
          placeholder="Company"
          value={newRow.company}
          onChange={(e) => setNewRow({ ...newRow, company: e.target.value })}
          className="border p-1 rounded"
        />
        <input
          type="checkbox"
          checked={newRow.firstRound}
          onChange={(e) => setNewRow({ ...newRow, firstRound: e.target.checked })}
        /> First Round/Coding Challenge
        <input
          type="checkbox"
          checked={newRow.finalRound}
          onChange={(e) => setNewRow({ ...newRow, finalRound: e.target.checked })}
        /> Final Round
        <input
          type="checkbox"
          checked={newRow.offer}
          onChange={(e) => setNewRow({ ...newRow, offer: e.target.checked })}
        /> Offer
        <button onClick={addNewRow} className="border p-1 rounded">Add Row</button>
      </div>
    </div>
  );
}

export default App;