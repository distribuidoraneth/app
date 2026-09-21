import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface GeneratePdfOptions {
  filename?: string;
  elementId?: string;
}

/**
 * Genera y descarga un archivo PDF de alta definición A4 a partir de un elemento HTML.
 * Detecta automáticamente si el documento está paginado (.invoice-pdf-page) y renderiza
 * cada página de forma nativa e independiente, garantizando diseño 100% perfecto, sin cortes
 * ni repeticiones de filas.
 */
export async function downloadInvoicePdf(
  elementId: string = 'invoice-printable-area',
  filename: string = 'FACTURA_SRI.pdf'
): Promise<void> {
  const container = document.getElementById(elementId);
  if (!container) {
    console.error(`Elemento #${elementId} no encontrado para generar PDF`);
    return;
  }

  // Detectar páginas discretas .invoice-pdf-page
  const pageElements = Array.from(
    container.querySelectorAll('.invoice-pdf-page')
  ) as HTMLElement[];

  const targets = pageElements.length > 0 ? pageElements : [container];

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidthMm = 210;
  const marginX = 8;
  const marginY = 8;
  const contentWidthMm = pdfWidthMm - marginX * 2; // 194 mm

  for (let i = 0; i < targets.length; i++) {
    const pageEl = targets[i];

    const canvas = await html2canvas(pageEl, {
      scale: 2.2, // Retina HD ~300 DPI
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1024,
      onclone: (clonedDoc) => {
        const clonedContainer = clonedDoc.getElementById(elementId);
        if (clonedContainer) {
          clonedContainer.style.position = 'static';
          clonedContainer.style.left = '0';
          clonedContainer.style.top = '0';
          clonedContainer.style.display = 'block';
          clonedContainer.style.visibility = 'visible';
          clonedContainer.style.pointerEvents = 'auto';
          clonedContainer.style.zIndex = 'auto';
        }

        const clonedPage =
          (clonedDoc.querySelector(`[data-page-index="${i}"]`) as HTMLElement) ||
          clonedContainer;

        if (clonedPage) {
          clonedPage.style.position = 'static';
          clonedPage.style.left = '0';
          clonedPage.style.top = '0';
          clonedPage.style.display = 'block';
          clonedPage.style.width = '794px';
          clonedPage.style.maxWidth = '794px';
          clonedPage.style.margin = '0 auto';
          clonedPage.style.padding = '18px 20px';
          clonedPage.style.boxShadow = 'none';
          clonedPage.style.borderRadius = '0';
          clonedPage.style.border = 'none';
          clonedPage.style.fontFamily = 'Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        }

        // Asegurar que ninguna celda ni bloque corte las letras o desbordes verticales
        const tableCells = clonedDoc.querySelectorAll('td, th, span');
        tableCells.forEach((node) => {
          if (node instanceof HTMLElement) {
            node.style.overflow = 'visible';
            node.style.lineHeight = '1.35';
            node.style.verticalAlign = 'middle';
          }
        });

        // Eliminar enlaces generados automáticamente por iOS WebKit Data Detectors
        const links = clonedDoc.querySelectorAll('a');
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

        // Eliminar text-decorations
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach((node) => {
          if (node instanceof HTMLElement) {
            node.style.textDecoration = 'none';
            node.style.setProperty('-webkit-text-decoration', 'none', 'important');
            node.style.setProperty('-webkit-text-decoration-line', 'none', 'important');
            node.style.setProperty('text-decoration-line', 'none', 'important');
            node.style.setProperty('text-decoration', 'none', 'important');
          }
        });
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const contentHeightMm = (canvas.height / canvas.width) * contentWidthMm;

    if (i > 0) {
      pdf.addPage();
    }
    pdf.addImage(imgData, 'JPEG', marginX, marginY, contentWidthMm, contentHeightMm, undefined, 'FAST');
  }

  pdf.save(filename);
}
