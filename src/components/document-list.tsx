'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, getMonth, getYear, parse } from 'date-fns';
import { Eye, Trash2, Search, X, Info } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';
import { useAuth } from '@/contexts/auth-context';

type Column<T> = {
  accessor: string;
  header: string;
  cell?: (value: any, item: T) => React.ReactNode;
};

type DocumentListProps<T extends { id?: string; date?: Date }> = {
  columns: Column<T>[];
  data?: T[];
  dataFetcher?: () => Promise<T[]>;
  searchFields: (keyof T | string)[];
  storageKeyPrefix: string;
  viewUrlPrefix: string;
  deleteUrlPrefix?: string;
  itemIdentifier?: keyof T;
  enableDateFilter?: boolean;
  isDeletableCheck?: (itemId: string) => boolean;
  deleteDisabledMessage?: string;
  itemKey?: (item: T) => string;
};

const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

export function DocumentList<T extends { id?: string; date?: Date, poNumber?: string, voucherNumber?: string, invoiceNumber?: string, receiptNumber?: string }>({
  columns,
  data,
  dataFetcher,
  searchFields,
  storageKeyPrefix,
  viewUrlPrefix,
  deleteUrlPrefix,
  itemIdentifier = "id",
  enableDateFilter = true,
  isDeletableCheck,
  deleteDisabledMessage = "This item cannot be deleted.",
  itemKey,
}: DocumentListProps<T>) {
  const router = useRouter();
  const { toast } = useToast();
  const { firebaseUser } = useAuth();
  const [documents, setDocuments] = useState<T[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  
  useEffect(() => {
    if (data) {
      setDocuments(data);
    } else if (typeof dataFetcher === 'function') {
        dataFetcher().then(setDocuments);
    }
  }, [data, dataFetcher]);

  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        searchFields.some(field =>
          String(getNestedValue(doc, field as string)).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (enableDateFilter && selectedMonth !== 'all' && documents.every(d => d.date)) {
      const [month, year] = selectedMonth.split('-').map(Number);
      filtered = filtered.filter(doc => {
        if (!doc.date) return false;
        try {
            const docDate = new Date(doc.date);
            if (isNaN(docDate.getTime())) return false;
            return getMonth(docDate) === month && getYear(docDate) === year;
        } catch (e) {
            return false;
        }
      });
    }

    return filtered;
  }, [documents, searchTerm, selectedMonth, searchFields, enableDateFilter]);
  
  const monthOptions = useMemo(() => {
    if (!enableDateFilter || !documents.every(d => d.date)) return [];
    const options = new Map<string, string>();
    documents.forEach(doc => {
      if (doc.date) {
        try {
            const docDate = new Date(doc.date);
            if (!isNaN(docDate.getTime())) {
            const monthYearKey = `${getMonth(docDate)}-${getYear(docDate)}`;
            const monthYearLabel = format(docDate, 'MMMM yyyy');
            if (!options.has(monthYearKey)) {
                options.set(monthYearKey, monthYearLabel);
            }
            }
        } catch (e) {
            // ignore invalid dates
        }
      }
    });
    return Array.from(options.entries()).map(([key, label]) => ({ value: key, label }));
  }, [documents, enableDateFilter]);

  const handleDelete = async (doc: T) => {
    const docId = getDocId(doc);
    if (!docId || !deleteUrlPrefix || !firebaseUser) return;

    const token = await firebaseUser.getIdToken();

    try {
      const response = await fetch(`${deleteUrlPrefix}${docId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        if (typeof dataFetcher === 'function') {
            dataFetcher().then(setDocuments);
        }
        toast({
          title: 'Document Deleted',
          description: 'The document has been successfully deleted.',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error Deleting Document',
          description: errorData.error || 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error Deleting Document',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedMonth('all');
  }

  const renderCell = (item: T, column: Column<T>) => {
    const value = getNestedValue(item, column.accessor);
    if (column.cell) {
      return column.cell(value, item);
    }
    return <>{String(value || '')}</>;
  };

  const getDocId = (doc: T): string => {
    return String(doc[itemIdentifier as keyof T] || doc.poNumber || doc.voucherNumber || doc.invoiceNumber || doc.receiptNumber || '');
  }
  
  return (
    <div className="space-y-4">
       <Card>
        <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="pl-8 sm:w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {enableDateFilter && monthOptions.length > 0 && (
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by month" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Months</SelectItem>
                            {monthOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
                 <Button variant="ghost" onClick={handleClearFilters} className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Clear
                </Button>
            </div>
        </CardContent>
       </Card>

      <Card>
         <CardContent className="p-0">
         <TooltipProvider>
            <Table>
                <TableHeader>
                <TableRow>
                    {columns.map((col) => (
                    <TableHead key={col.accessor}>{col.header}</TableHead>
                    ))}
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredDocuments.length > 0 ? (
                    filteredDocuments.map((doc, index) => {
                        const docId = getDocId(doc);
                        const isDeletionDisabled = isDeletableCheck ? isDeletableCheck(docId) : false;

                        return (
                            <TableRow key={itemKey ? itemKey(doc) : (docId || index)} onClick={() => router.push(`${viewUrlPrefix}${getDocId(doc)}`)} className="cursor-pointer">
                                {columns.map((col) => (
                                <TableCell key={col.accessor}>{renderCell(doc, col)}</TableCell>
                                ))}
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    
                                    {isDeletionDisabled ? (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span tabIndex={0}>
                                                    <Button variant="ghost" size="icon" disabled>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{deleteDisabledMessage}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    ) : (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the document.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(doc)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })
                ) : (
                    <TableRow>
                    <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                        No documents found.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </TooltipProvider>
         </CardContent>
      </Card>
    </div>
  );
}