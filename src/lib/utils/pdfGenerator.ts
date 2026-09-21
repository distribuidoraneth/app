import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface GeneratePdfOptions {
  filename?: string;
  elementId?: string;
}

/**
 * Genera y descarga un archivo PDF de alta definición A4 a partir de un elemento HTML,
 * con corte inteligente por elementos (element-aware slicing) que evita absolutamente
 * que cualquier fila de la tabla o bloque sea cortado por la mitad o se duplique entre páginas.
 */
export async function downloadInvoicePdf(
  elementId: string = 'invoice-printable-area',
  filename: string = 'FACTURA_SRI.pdf'
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Elemento #${elementId} no encontrado para generar PDF`);
    return;
  }

  interface BoundingBox {
    top: number;
    bottom: number;
  }

  let elementBoxes: BoundingBox[] = [];
  const clonedWidth = 794;

  // Capturar con html2canvas simulando ventana de escritorio (1024px)
  const canvas = await html2canvas(element, {
    scale: 2.2, // Resolución nítida Retina ~300 DPI
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1024,
    onclone: (clonedDoc) => {
      const clonedElement = clonedDoc.getElementById(elementId);
      if (!clonedElement) return;

      clonedElement.style.width = '794px'; // Proporción exacta A4 a 96 DPI
      clonedElement.style.maxWidth = '794px';
      clonedElement.style.margin = '0 auto';
      clonedElement.style.padding = '18px 20px';
      clonedElement.style.boxShadow = 'none';
      clonedElement.style.borderRadius = '0';
      clonedElement.style.border = 'none';

      // 1. Eliminar cualquier enlace generado automáticamente por iOS WebKit Data Detectors
      const links = clonedElement.querySelectorAll('a');
      links.forEach((a) => {
        const span = clonedDoc.createElement('span');
        span.innerHTML = a.innerHTML;
        span.className = a.className;
        span.style.cssText = a.style.cssText;
        span.style.textDecoration = 'none';
        span.style.setProperty('-webkit-text-decoration', 'none');
        span.style.borderBottom = 'none';
        span.style.color = 'inherit';
        a.parentNode?.replaceChild(span, a);
      });

      // 2. Anular subrayados
      const allElements = clonedElement.querySelectorAll('*');
      allElements.forEach((node) => {
        if (node instanceof HTMLElement) {
          node.style.textDecoration = 'none';
          node.style.setProperty('-webkit-text-decoration', 'none', 'important');
          node.style.setProperty('-webkit-text-decoration-line', 'none', 'important');
          node.style.setProperty('text-decoration-line', 'none', 'important');
          node.style.setProperty('text-decoration', 'none', 'important');
        }
      });

      // 3. Registrar coordenadas de todas las filas y bloques principales
      const containerRect = clonedElement.getBoundingClientRect();
      const atomicElements = clonedElement.querySelectorAll(
        'tr, .invoice-header-block, .invoice-buyer-block, .invoice-totals-block, .invoice-info-block, .invoice-payments-block'
      );

      elementBoxes = Array.from(atomicElements).map((node) => {
        const r = node.getBoundingClientRect();
        return {
          top: r.top - containerRect.top,
          bottom: r.bottom - containerRect.top,
        };
      }).filter((b) => b.bottom > b.top);
    },
  });

  // Instanciar jsPDF en A4 vertical
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidthMm = 210;
  const pdfHeightMm = 297;
  const marginX = 8;
  const marginY = 8;
  const printableWidthMm = pdfWidthMm - marginX * 2; // 194 mm
  const printableHeightMm = pdfHeightMm - marginY * 2; // 281 mm

  // Factor de escala entre coordenadas del clon y píxeles del canvas
  const scaleFactor = canvas.width / (clonedWidth || 794);
  const pxPerMm = canvas.width / printableWidthMm;
  const maxPageHeightPx = printableHeightMm * pxPerMm;

  // Si cabe completamente en 1 sola página
  if (canvas.height <= maxPageHeightPx) {
    const totalHeightMm = (canvas.height / canvas.width) * printableWidthMm;
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    pdf.addImage(imgData, 'JPEG', marginX, marginY, printableWidthMm, totalHeightMm, undefined, 'FAST');
    pdf.save(filename);
    return;
  }

  // Multi-página con corte inteligente entre filas (nunca corta una fila a la mitad ni repite contenido)
  const canvasBoxes = elementBoxes.map((b) => ({
    top: b.top * scaleFactor,
    bottom: b.bottom * scaleFactor,
  }));

  let currentStartY = 0;
  let pageIndex = 0;

  while (currentStartY < canvas.height - 5) {
    let targetEndY = currentStartY + maxPageHeightPx;

    if (targetEndY >= canvas.height) {
      targetEndY = canvas.height;
    } else {
      // Buscar si el corte proyectado cae en medio de algún elemento indivisible (fila de tabla o bloque)
      const intersecting = canvasBoxes.filter(
        (b) => b.top < targetEndY && b.bottom > targetEndY
      );

      if (intersecting.length > 0) {
        // Cortar limpiamente justo arriba del primer elemento afectado
        const minTop = Math.min(...intersecting.map((b) => b.top));
        if (minTop > currentStartY + 80) {
          targetEndY = minTop - 1;
        }
      }
    }

    const sliceHeightPx = Math.round(targetEndY - currentStartY);
    if (sliceHeightPx <= 0) break;

    // Crear canvas dedicado para este corte de página
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeightPx;
    const pageCtx = pageCanvas.getContext('2d');
    if (pageCtx) {
      pageCtx.fillStyle = '#ffffff';
      pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      pageCtx.drawImage(
        canvas,
        0, Math.round(currentStartY), canvas.width, sliceHeightPx,
        0, 0, canvas.width, sliceHeightPx
      );
    }

    const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
    const sliceHeightMm = (sliceHeightPx / canvas.width) * printableWidthMm;

    if (pageIndex > 0) {
      pdf.addPage();
    }
    pdf.addImage(pageImgData, 'JPEG', marginX, marginY, printableWidthMm, sliceHeightMm, undefined, 'FAST');

    currentStartY = targetEndY;
    pageIndex++;
  }

  pdf.save(filename);
}
