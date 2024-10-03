'use client'

import React from 'react'
import '@/app/ui/dashboard/applications/applications.css'

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

type Application = {
    id: number;
    company: string;
    firstRound: boolean;
    finalRound: boolean;
    offer: boolean;
  };

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void
  }
}

// Give our default column cell renderer editing superpowers!
const defaultColumn: Partial<ColumnDef<Application>> = {
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

    if (typeof value === 'boolean') {
      return (
        <div className="center-checkbox">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => {
              setValue(e.target.checked);
              table.options.meta?.updateData(index, id, e.target.checked);
            }}
          />
        </div>
      );
    }

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

  const columns = React.useMemo<ColumnDef<Application>[]>(
    () => [
      {
        header: 'ID',
        accessorKey: 'id',
        footer: props => props.column.id,
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
  )

//   const [data, setData] = React.useState(() => makeData(1000))
  const [data, setData] = React.useState<Application[]>([]);
//   const refreshData = () => setData(() => makeData(1000))
  const refreshData = () => setData(data)

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const [newRow, setNewRow] = React.useState<Omit<Application, 'id'>>({
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
      const response = await fetch('/api/applications/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRow),
      });
  
      if (!response.ok) {
        throw new Error('Failed to add new application');
      }
  
      const addedApplication = await response.json();
      setData((old) => [...old, addedApplication]);
      setNewRow({
        company: '',
        firstRound: false,
        finalRound: false,
        offer: false,
      });
    } catch (error) {
      console.error('Error adding new application:', error);
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
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                return (
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
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => {
            return (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => {
                  return (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
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
            {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          | Go to page:
          <input
            type="number"
            min="1"
            max={table.getPageCount()}
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              table.setPageIndex(page)
            }}
            className="border p-1 rounded w-16"
          />
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={e => {
            table.setPageSize(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
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
      <div className="mt-4">
        <h3>Add New Row</h3>
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
  )
}

export default App;

// const rootElement = document.getElementById('root')
// if (!rootElement) throw new Error('Failed to find the root element')

// ReactDOM.createRoot(rootElement).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// )