
'use client';

import { Download, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

type DocumentToolbarProps = {
    onSave?: () => void;
    formId?: string;
}

export function DocumentToolbar({ onSave, formId }: DocumentToolbarProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mb-4 flex justify-end gap-2 no-print">
      {onSave && formId && (
         <Button type="submit" form={formId}>
            <Save className="mr-2 h-4 w-4" />
            Save
        </Button>
      )}
      <Button onClick={handlePrint} variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Print
      </Button>
    </div>
  );
}
