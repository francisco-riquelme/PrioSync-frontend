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

      // Create an offscreen clone and force-show collapsed content (accordions) so the PDF
      // includes all section bodies even if they are collapsed in the UI.
      const originalEl = el as HTMLElement;
      const cloneWrapper = document.createElement('div');
      // Position offscreen so it won't flash on the page
      cloneWrapper.style.position = 'absolute';
      cloneWrapper.style.left = '-99999px';
      cloneWrapper.style.top = '0';
      // keep same width to get similar layout
      cloneWrapper.style.width = `${originalEl.offsetWidth}px`;
      const clone = originalEl.cloneNode(true) as HTMLElement;
      cloneWrapper.appendChild(clone);
      document.body.appendChild(cloneWrapper);

      // Force all nodes inside the clone to be visible, remove hidden attributes/styles that
      // collapse content (common in accordion implementations)
      const forceShowAll = (root: HTMLElement) => {
        const nodes = Array.from(root.querySelectorAll<HTMLElement>('*'));
        // Include root itself
        nodes.unshift(root);
        nodes.forEach((n) => {
          try {
            // remove HTML5 hidden
            if (n.hasAttribute('hidden')) n.removeAttribute('hidden');
            // remove aria-hidden
            if (n.getAttribute('aria-hidden') === 'true') n.setAttribute('aria-hidden', 'false');
            // remove inline display:none
            const s = n.style;
            if (s && s.display === 'none') s.display = '';
            // make sure collapsed panels with max-height or height 0 become visible
            if (s) {
              s.maxHeight = 'none';
              s.height = 'auto';
              s.overflow = 'visible';
              s.visibility = 'visible';
            }
            // set aria-expanded where relevant
            if (n.hasAttribute('aria-expanded') && n.getAttribute('aria-expanded') === 'false') {
              n.setAttribute('aria-expanded', 'true');
            }
          } catch {
            // ignore individual node errors
          }
        });
      };

      forceShowAll(clone);

      // Force text color to black for headings, paragraphs and typical typography elements
      const forceTextBlack = (root: HTMLElement) => {
        const textSelectors = ['h1','h2','h3','h4','h5','h6','p','span','li','a','div','section'];
        const nodes = Array.from(root.querySelectorAll<HTMLElement>(textSelectors.join(',')));
        // include root
        nodes.unshift(root);
        nodes.forEach((n) => {
          try {
            const txt = (n.textContent || '').trim();
            if (!txt) return;
            // avoid overriding elements that are likely non-text (images/svg wrappers) by checking for img/svg descendants
            if (n.querySelector('img, svg')) return;
            n.style.color = '#000000';
            // also remove low-opacity which can make text appear grey
            n.style.opacity = '1';
          } catch {
            // ignore
          }
        });
      };

      forceTextBlack(clone);

      // render the clone to a canvas (full height)
      const canvas = await html2canvas(clone as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });

      // cleanup clone
      document.body.removeChild(cloneWrapper);

      // create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Map canvas px to mm based on page width
      const pxFullWidth = canvas.width;
      const pxFullHeight = canvas.height;
      const mmFullWidth = pageWidth;
      const pxPerMm = pxFullWidth / mmFullWidth;
      const pageHeightPx = Math.floor(pageHeight * pxPerMm);

      // Slice the canvas into page-sized pieces and add each as an image
      let y = 0;
      while (y < pxFullHeight) {
        const sliceHeight = Math.min(pageHeightPx, pxFullHeight - y);

        // create a temporary canvas for the slice
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = pxFullWidth;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext('2d');
        if (!ctx) throw new Error('Cannot get canvas context');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(canvas, 0, y, pxFullWidth, sliceHeight, 0, 0, pxFullWidth, sliceHeight);

        const imgData = pageCanvas.toDataURL('image/png');

        const imgHeightMm = sliceHeight / pxPerMm;

        if (y > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, mmFullWidth, imgHeightMm);

        y += sliceHeight;
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
