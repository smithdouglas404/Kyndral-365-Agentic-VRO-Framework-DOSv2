import { useState, useMemo } from 'react';
import {
  Card,
  Title,
  Text,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TextInput,
  Select,
  SelectItem,
  Badge,
  Flex,
  type Color,
} from '@tremor/react';
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: string[];
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableConfig<T> {
  title: string;
  subtitle?: string;
  columns: ColumnDef<T>[];
  data: T[];
  keyField: keyof T;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  showPagination?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

interface TremorDataTableProps<T> {
  config: TableConfig<T>;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

// ============================================================================
// Helper Components
// ============================================================================

interface StatusBadgeProps {
  status: string;
  color?: Color;
}

export function StatusBadge({ status, color }: StatusBadgeProps) {
  const getColor = (): Color => {
    if (color) return color;
    const lowerStatus = status.toLowerCase();
    if (['completed', 'success', 'active', 'approved'].includes(lowerStatus)) {
      return 'emerald';
    }
    if (['in progress', 'pending', 'review'].includes(lowerStatus)) {
      return 'amber';
    }
    if (['failed', 'error', 'rejected', 'overdue'].includes(lowerStatus)) {
      return 'rose';
    }
    if (['draft', 'inactive', 'paused'].includes(lowerStatus)) {
      return 'gray';
    }
    return 'blue';
  };

  return <Badge color={getColor()}>{status}</Badge>;
}

// ============================================================================
// Main Data Table Component
// ============================================================================

export function TremorDataTable<T extends Record<string, unknown>>({
  config,
  className,
}: TremorDataTableProps<T>) {
  const {
    title,
    subtitle,
    columns,
    data,
    keyField,
    searchable = true,
    searchPlaceholder = 'Search...',
    pageSize = 10,
    showPagination = true,
    onRowClick,
    emptyMessage = 'No data available',
  } = config;

  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const value = row[col.key];
          return String(value).toLowerCase().includes(query);
        })
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        result = result.filter((row) => String(row[key]) === value);
      }
    });

    return result;
  }, [data, searchQuery, filters, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, showPagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="h-4 w-4 text-tremor-content-subtle" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const filterableColumns = columns.filter((col) => col.filterable && col.filterOptions);

  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      <div className="mb-4">
        <Title>{title}</Title>
        {subtitle && (
          <Text className="text-tremor-content-subtle mt-1">{subtitle}</Text>
        )}
      </div>

      {/* Search and Filters */}
      <Flex className="gap-4 mb-4 flex-wrap">
        {searchable && (
          <TextInput
            icon={Search}
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-xs"
          />
        )}

        {filterableColumns.map((col) => (
          <Select
            key={col.key}
            value={filters[col.key] || 'all'}
            onValueChange={(value) => {
              setFilters((prev) => ({ ...prev, [col.key]: value }));
              setCurrentPage(1);
            }}
            icon={Filter}
            className="max-w-[160px]"
          >
            <SelectItem value="all">All {col.header}</SelectItem>
            {col.filterOptions?.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </Select>
        ))}

        <Text className="text-tremor-content-subtle ml-auto">
          {sortedData.length} items
        </Text>
      </Flex>

      {/* Table */}
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableHeaderCell
                key={col.key}
                className={cn(
                  col.sortable && 'cursor-pointer select-none hover:bg-tremor-background-subtle',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right'
                )}
                style={{ width: col.width }}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <Flex
                  justifyContent={
                    col.align === 'center'
                      ? 'center'
                      : col.align === 'right'
                      ? 'end'
                      : 'start'
                  }
                  className="gap-1"
                >
                  {col.header}
                  {col.sortable && <SortIcon column={col.key} />}
                </Flex>
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8">
                <Text className="text-tremor-content-subtle">{emptyMessage}</Text>
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((row) => (
              <TableRow
                key={String(row[keyField])}
                className={cn(
                  onRowClick && 'cursor-pointer hover:bg-tremor-background-subtle'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right'
                    )}
                  >
                    {col.accessor(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <Flex justifyContent="between" alignItems="center" className="mt-4">
          <Text className="text-sm text-tremor-content-subtle">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of{' '}
            {sortedData.length}
          </Text>
          <Flex className="gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Flex className="gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </Flex>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </Flex>
        </Flex>
      )}
    </Card>
  );
}

// ============================================================================
// Simple List Table
// ============================================================================

interface SimpleListItem {
  id: string;
  primary: string;
  secondary?: string;
  value?: string | number;
  badge?: { label: string; color?: Color };
  onClick?: () => void;
}

interface TremorSimpleListProps {
  title: string;
  items: SimpleListItem[];
  showDividers?: boolean;
  className?: string;
}

export function TremorSimpleList({
  title,
  items,
  showDividers = true,
  className,
}: TremorSimpleListProps) {
  return (
    <Card className={cn('p-6', className)}>
      <Title className="mb-4">{title}</Title>
      <div className={cn(showDividers && 'divide-y divide-tremor-border')}>
        {items.map((item) => (
          <Flex
            key={item.id}
            justifyContent="between"
            alignItems="center"
            className={cn(
              'py-3',
              item.onClick && 'cursor-pointer hover:bg-tremor-background-subtle -mx-2 px-2 rounded'
            )}
            onClick={item.onClick}
          >
            <div>
              <Text className="font-medium">{item.primary}</Text>
              {item.secondary && (
                <Text className="text-sm text-tremor-content-subtle">
                  {item.secondary}
                </Text>
              )}
            </div>
            <Flex className="gap-2" alignItems="center">
              {item.value !== undefined && (
                <Text className="font-semibold">{item.value}</Text>
              )}
              {item.badge && (
                <Badge color={item.badge.color || 'blue'} size="sm">
                  {item.badge.label}
                </Badge>
              )}
            </Flex>
          </Flex>
        ))}
      </div>
    </Card>
  );
}

// ============================================================================
// Comparison Table
// ============================================================================

interface ComparisonRow {
  metric: string;
  values: (string | number | React.ReactNode)[];
  highlight?: number; // Index of the best value
}

interface TremorComparisonTableProps {
  title: string;
  headers: string[];
  rows: ComparisonRow[];
  className?: string;
}

export function TremorComparisonTable({
  title,
  headers,
  rows,
  className,
}: TremorComparisonTableProps) {
  return (
    <Card className={cn('p-6', className)}>
      <Title className="mb-4">{title}</Title>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Metric</TableHeaderCell>
            {headers.map((header) => (
              <TableHeaderCell key={header} className="text-center">
                {header}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.metric}>
              <TableCell className="font-medium">{row.metric}</TableCell>
              {row.values.map((value, idx) => (
                <TableCell
                  key={idx}
                  className={cn(
                    'text-center',
                    row.highlight === idx && 'bg-emerald-50 dark:bg-emerald-900/20 font-semibold'
                  )}
                >
                  {value}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export default TremorDataTable;
