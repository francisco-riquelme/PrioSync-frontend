"use client";

import React, { useState } from 'react';
import { Button, Tooltip } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

interface GeneratePdfButtonProps {
  contentElementId?: string; // id of the element to capture
  fileName?: string;
  className?: string;
}

export default function GeneratePdfButton({
  contentElementId = 'material-pdf-content',
  fileName = 'material.pdf',
  className,
}: GeneratePdfButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const el = typeof document !== 'undefined' ? document.getElementById(contentElementId) : null;
      if (!el) {
        console.warn('Elemento para generar PDF no encontrado:', contentElementId);
        setLoading(false);
        return;
      }

      // cargar librerías dinámicamente para evitar problemas con SSR
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        // html2canvas default export
        import('html2canvas'),
        // jspdf named export
        import('jspdf'),
      ]);

      // render the element to a canvas
      const canvas = await html2canvas(el as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');

      // create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // calculate image dimensions to fit page width
      const imgProps = { width: canvas.width, height: canvas.height };
      const imgWidth = pageWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > -1) {
        position = heightLeft - imgHeight;
        if (heightLeft > 0) {
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        }
        heightLeft -= pageHeight;
      }

      pdf.save(fileName);
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title="Exportar material a PDF">
      <span>
        <Button
          variant="outlined"
          size="small"
          startIcon={<PictureAsPdfIcon />}
          onClick={handleGenerate}
          disabled={loading}
          className={className}
        >
          {loading ? 'Generando...' : 'Exportar PDF'}
        </Button>
      </span>
    </Tooltip>
  );
}
