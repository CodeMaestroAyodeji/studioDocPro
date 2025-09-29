'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DocumentToolbar() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mb-4 flex justify-end gap-2 no-print">
      <Button onClick={handlePrint}>
        <Download className="mr-2 h-4 w-4" />
        Export to PDF
      </Button>
    </div>
  );
}
