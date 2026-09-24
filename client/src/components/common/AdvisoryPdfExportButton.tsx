import React, { useState } from 'react';
import { AdvisoryRecord } from '@shared/types';
import { Printer, Download, FileText, Check } from 'lucide-react';

interface AdvisoryPdfExportButtonProps {
  advisory: AdvisoryRecord;
}

export const AdvisoryPdfExportButton: React.FC<AdvisoryPdfExportButtonProps> = ({ advisory }) => {
  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => {
    setDownloading(true);
    setTimeout(() => {
      window.print();
      setDownloading(false);
    }, 250);
  };

  return (
    <button
      onClick={handlePrint}
      disabled={downloading}
      className="btn-secondary text-xs sm:text-sm py-2 px-3.5 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors"
      title="Print or Export Agronomic Dossier to PDF"
    >
      <Printer className="w-4 h-4 text-emerald-400" />
      <span>{downloading ? 'Preparing Dossier...' : 'Export Official PDF'}</span>
    </button>
  );
};
