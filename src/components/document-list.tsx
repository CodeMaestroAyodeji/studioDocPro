
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, getMonth, getYear, parse } from 'date-fns';
import { Eye, Trash2, Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';

type Column = {
  accessor: string;
  header: string;
  cell?: (value: any) => React.ReactNode;
};

type DocumentListProps<T extends { id?: string; date: Date }> = {
  columns: Column[];
  dataFetcher: () => T[];
  searchFields: (keyof T)[];
  storageKeyPrefix: string;
  viewUrlPrefix: string;
  itemIdentifier?: keyof T;
};

export function DocumentList<T extends { id?: string; date: Date, poNumber?: string, voucherNumber?: string, invoiceNumber?: string }>({
  columns,
  dataFetcher,
  searchFields,
  storageKeyPrefix,
  viewUrlPrefix,
  itemIdentifier = "id",
}: DocumentListProps<T>) {
  const router = useRouter();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<T[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  
  useEffect(() => {
    setDocuments(dataFetcher());
  }, [dataFetcher]);

  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        searchFields.some(field =>
          String(doc[field]).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (selectedMonth !== 'all') {
      const [month, year] = selectedMonth.split('-').map(Number);
      filtered = filtered.filter(doc => {
        const docDate = new Date(doc.date);
        return getMonth(docDate) === month && getYear(docDate) === year;
      });
    }

    return filtered;
  }, [documents, searchTerm, selectedMonth, searchFields]);
  
  const monthOptions = useMemo(() => {
    const options = new Map<string, string>();
    documents.forEach(doc => {
      const docDate = new Date(doc.date);
      const monthYearKey = `${getMonth(docDate)}-${getYear(docDate)}`;
      const monthYearLabel = format(docDate, 'MMMM yyyy');
      if (!options.has(monthYearKey)) {
        options.set(monthYearKey, monthYearLabel);
      }
    });
    return Array.from(options.entries()).map(([key, label]) => ({ value: key, label }));
  }, [documents]);

  const handleDelete = (doc: T) => {
    const docId = doc[itemIdentifier as keyof T] || doc.poNumber || doc.voucherNumber || doc.invoiceNumber;
    if (docId) {
      localStorage.removeItem(`${storageKeyPrefix}${docId}`);
      setDocuments(dataFetcher());
      toast({
        title: 'Document Deleted',
        description: `The document has been successfully deleted.`,
      });
    }
  };
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedMonth('all');
  }

  const renderCell = (item: T, column: Column) => {
    const value = item[column.accessor as keyof T];
    if (column.cell) {
      return column.cell(value);
    }
    return <>{value}</>;
  };

  const getDocId = (doc: T) => {
    return doc[itemIdentifier as keyof T] || doc.poNumber || doc.voucherNumber || doc.invoiceNumber;
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
                 <Button variant="ghost" onClick={handleClearFilters} className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Clear
                </Button>
            </div>
        </CardContent>
       </Card>

      <Card>
         <CardContent className="p-0">
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
                    filteredDocuments.map((doc, index) => (
                    <TableRow key={getDocId(doc) || index}>
                        {columns.map((col) => (
                        <TableCell key={col.accessor}>{renderCell(doc, col)}</TableCell>
                        ))}
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => router.push(`${viewUrlPrefix}${getDocId(doc)}`)}>
                                <Eye className="h-4 w-4" />
                            </Button>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
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
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                        No documents found.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
         </CardContent>
      </Card>
    </div>
  );
}
