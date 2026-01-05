/**
 * @module components/DataTable
 * Reusable data table component using TanStack Table and shadcn/ui.
 * Supports sorting, filtering, and pagination.
 */
'use no memo';

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchColumn?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Number of rows to display per page (default: 10) */
  pageSize?: number;
  /** Optional: handle double-click on row */
  onRowDoubleClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchColumn,
  searchValue,
  pageSize = 10,
  onRowDoubleClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    initialState: {
      pagination: {
        pageSize,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  // Sync external search with table filter using useEffect
  useEffect(() => {
    if (searchColumn && searchValue !== undefined) {
      const column = table.getColumn(searchColumn);
      column?.setFilterValue(searchValue);
    }
  }, [searchColumn, searchValue, table]);

  return (
    <div className='space-y-4'>
      <div className='overflow-hidden rounded-md border'>
        <Table className='table-fixed w-full'>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const width = header.column.columnDef.meta?.width as string | undefined;
                  return (
                    <TableHead key={header.id} style={width ? { width } : undefined}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(row.original) : undefined}
                  className={onRowDoubleClick ? 'cursor-pointer select-none' : undefined}>
                  {row.getVisibleCells().map((cell) => {
                    const width = cell.column.columnDef.meta?.width as string | undefined;
                    return (
                      <TableCell key={cell.id} style={width ? { width } : undefined}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className='flex items-center justify-between'>
        <div className='text-sm text-muted-foreground'>
          {table.getFilteredRowModel().rows.length} {table.getFilteredRowModel().rows.length === 1 ? 'row' : 'rows'}{' '}
          total
        </div>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <div className='text-sm font-medium'>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <Button variant='outline' size='sm' onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
