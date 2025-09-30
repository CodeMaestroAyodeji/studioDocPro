
'use client';

import { FormField, FormControl } from '../ui/form';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { EditableTemplateFieldsProps } from './types';
import { useFieldArray } from 'react-hook-form';


export function EditableTemplateFields({ form, formatCurrency }: EditableTemplateFieldsProps) {
  if (!form) return null;

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  
  const watchedItems = form.watch('items');

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[35%] min-w-[200px]">Description</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Tax</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, index) => (
            <TableRow key={field.id}>
              <TableCell>
                <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => <Input {...field} />} />
              </TableCell>
              <TableCell>
                <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => <Input type="number" {...field} className="min-w-[60px]" />} />
              </TableCell>
              <TableCell>
                <FormField control={form.control} name={`items.${index}.rate`} render={({ field }) => <Input type="number" {...field} className="min-w-[80px]" />} />
              </TableCell>
              <TableCell>
                <FormField control={form.control} name={`items.${index}.discount`} render={({ field }) => <Input type="number" {...field} className="min-w-[80px]" />} />
              </TableCell>
              <TableCell className="text-center">
                <FormField control={form.control} name={`items.${index}.tax`} render={({ field }) => <Checkbox checked={field.value} onCheckedChange={field.onChange} />} />
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(((watchedItems && watchedItems[index]?.quantity) || 0) * ((watchedItems && watchedItems[index]?.rate) || 0))}
              </TableCell>
              <TableCell>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ id: crypto.randomUUID(), description: '', quantity: 1, rate: 0, discount: 0, tax: true })}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>
    </>
  );
}
