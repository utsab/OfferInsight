'use client'

import React from 'react'
import '@/app/ui/dashboard/linkedin_outreach/linkedin_outreach.css'

//
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  RowData,
} from '@tanstack/react-table'

type InPersonEvents = {
    id: number;
    event: string;
    date: string;
    numPeopleSpokenTo: number;
    numLinkedInRequests: number;
  };

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void
  }
}

// Give our default column cell renderer editing superpowers!
const defaultColumn: Partial<ColumnDef<InPersonEvents>> = {
  cell: ({ getValue, row: { index }, column: { id }, table }) => {

    if (id === 'id') {
      return <span>{getValue() as string}</span>;
    }

    const initialValue = getValue();
    // We need to keep and update the state of the cell normally
    const [value, setValue] = React.useState(initialValue);

    // When the input is blurred, we'll call our table meta's updateData function
    const onBlur = () => {
      table.options.meta?.updateData(index, id, value);
    };

    // If the initialValue is changed external, sync it up with our state
    React.useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    return (
      <input
        value={value as string}
        onChange={e => setValue(e.target.value)}
        onBlur={onBlur}
      />
    );
  },
};

function useSkipper() {
  const shouldSkipRef = React.useRef(true)
  const shouldSkip = shouldSkipRef.current

  // Wrap a function with this to skip a pagination reset temporarily
  const skip = React.useCallback(() => {
    shouldSkipRef.current = false
  }, [])

  React.useEffect(() => {
    shouldSkipRef.current = true
  })

  return [shouldSkip, skip] as const
}

function App() {
  const rerender = React.useReducer(() => ({}), {})[1]

  const columns = React.useMemo<ColumnDef<InPersonEvents>[]>(
    () => [
      {
        header: 'No.',
        cell: ({ row }) => row.index + 1,
        footer: () => 'No.',
      },
      {
        header: 'Event',
        accessorKey: 'event',
        footer: () => 'Event',
      },
      {
        header: 'Date',
        accessorKey: 'date',
        footer: () => 'Date',
      },
      {
        header: 'Number of People Spoken To',
        accessorKey: 'numPeopleSpokenTo',
        footer: () => 'Number of People Spoken To',
      },
      {
        header: 'Number of LinkedIn Requests',
        accessorKey: 'numLinkedInRequests',
        footer: () => 'Number of LinkedIn Requests',
      },
      {
        header: 'Actions',
        cell: ({ row }) => (
          <button
            onClick={() => handleDelete(row.original.id)}
            className="border rounded p-1"
          >
            Delete
          </button>
        ),
        footer: () => 'Actions',
      },
    ],
    []
  );

//   const [data, setData] = React.useState(() => makeData(1000))
  const [data, setData] = React.useState<InPersonEvents[]>([]);
//   const refreshData = () => setData(() => makeData(1000))
  const refreshData = () => setData(data)

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const [newRow, setNewRow] = React.useState<Omit<InPersonEvents, 'id'>>({
    event: '',
    date: '',
    numPeopleSpokenTo: 0,
    numLinkedInRequests: 0,
  });

  React.useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/in_person_events');
        const inPersonEvents = await response.json();
        setData(inPersonEvents);
      } catch (error) {
        console.error('Failed to fetch In Person Events entries:', error);
      }
    }
    fetchData();
  }, []);

  const updateData = async (rowIndex: number, columnId: string, value: unknown) => {
    // Skip page index reset until after next rerender
    skipAutoResetPageIndex();
    setData((old) =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...old[rowIndex]!,
            [columnId]: value,
          };
        }
        return row;
      })
    );
    const row = data[rowIndex];
    const updatedRow = { ...row, [columnId]: value };
    try {
      const response = await fetch('/api/in_person_events/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'in_person_events/json',
        },
        body: JSON.stringify(updatedRow),
      });

      if (!response.ok) {
        throw new Error('Failed to update the database');
      }
    } catch (error) {
      console.error('Error updating the database:', error);
    }
  };

  const addNewRow = async () => {
    try {
      const response = await fetch('/api/in_person_events', {
        method: 'POST',
        headers: {
          'Content-Type': 'in_person_events/json',
        },
        body: JSON.stringify(newRow),
      });
  
      if (!response.ok) {
        throw new Error('Failed to add new In Person Events entry');
      }
  
      const addedInPersonEvent = await response.json();
      setData((old) => [...old, addedInPersonEvent]);
      setNewRow({
        event: '',
        date: '',
        numPeopleSpokenTo: 0,
        numLinkedInRequests: 0,
      });
    } catch (error) {
      console.error('Error adding new In Person Events entry:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/in_person_events`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'in_person_events/json',
        },
        body: JSON.stringify({ id }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to delete the LinkedIn outreach entry');
      }
  
      setData((old) => old.filter((row) => row.id !== id));
    } catch (error) {
      console.error('Error deleting the In Person Events entry:', error);
    }
  };

  const table = useReactTable({
    data,
    columns,
    defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex,
    meta: {
      updateData,
    },
    debugTable: true,
  })

  return (
    <div className="p-2">
      <div className="h-2" />
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder ? null : (
                    <div>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </div>
                  )}
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
          {/* New row for adding entries */}
          <tr>
            <td></td> {/* No. column left blank */}
            <td>
              <input
                type="text"
                placeholder="Event"
                value={newRow.event}
                onChange={(e) => setNewRow({ ...newRow, event: e.target.value })}
                className="border p-1 rounded"
              />
            </td>
            <td>
              <input
                type="text"
                placeholder="Date"
                value={newRow.date}
                onChange={(e) => setNewRow({ ...newRow, date: e.target.value })}
                className="border p-1 rounded"
              />
            </td>
            <td>
              <input
                type="number"
                placeholder="Number of People Spoken To"
                value={newRow.numPeopleSpokenTo}
                onChange={(e) => setNewRow({ ...newRow, numPeopleSpokenTo: parseInt(e.target.value, 10) || 0 })}
                className="border p-1 rounded"
              />
            </td>
            <td>
              <input
                type="number"
                placeholder="Number of LinkedIn Requests"
                value={newRow.numLinkedInRequests}
                onChange={(e) => setNewRow({ ...newRow, numLinkedInRequests: parseInt(e.target.value, 10) || 0 })}
                className="border p-1 rounded"
              />
            </td>
            <td>
              <button onClick={addNewRow} className="border p-1 rounded">Add</button>
            </td>
          </tr>
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
        <button onClick={() => refreshData()}>Refresh Data</button>
      </div>
    </div>
  );
}

export default App;

// const rootElement = document.getElementById('root')
// if (!rootElement) throw new Error('Failed to find the root element')

// ReactDOM.createRoot(rootElement).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// )