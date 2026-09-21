import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface GeneratePdfOptions {
  filename?: string;
  elementId?: string;
}

/**
 * Genera y descarga un archivo PDF de alta definición A4 a partir de un elemento HTML,
 * garantizando que en dispositivos móviles y de escritorio se renderice con la estructura
 * idéntica a una página A4 de escritorio (sin compresión estrecha de celular).
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

  // Capturar con html2canvas simulando ventana de escritorio (1024px)
  const canvas = await html2canvas(element, {
    scale: 2.2, // Resolución nítida Retina ~300 DPI
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1024,
    onclone: (clonedDoc) => {
      const clonedElement = clonedDoc.getElementById(elementId);
      if (clonedElement) {
        clonedElement.style.width = '794px'; // Proporción exacta A4 a 96 DPI
        clonedElement.style.maxWidth = '794px';
        clonedElement.style.margin = '0 auto';
        clonedElement.style.padding = '24px';
        clonedElement.style.boxShadow = 'none';
        clonedElement.style.borderRadius = '0';
        clonedElement.style.border = 'none';
      }
    },
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  // Instanciar jsPDF en A4 vertical
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = 210;
  const pdfHeight = 297;
  const marginX = 8;
  const marginY = 8;
  const contentWidth = pdfWidth - marginX * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;

  if (contentHeight <= pdfHeight - marginY * 2) {
    // Cabe perfectamente en 1 sola página
    pdf.addImage(imgData, 'JPEG', marginX, marginY, contentWidth, contentHeight, undefined, 'FAST');
  } else {
    // Si sobrepasa una página, distribuir ordenadamente
    let position = marginY;
    let heightLeft = contentHeight;

    pdf.addImage(imgData, 'JPEG', marginX, position, contentWidth, contentHeight, undefined, 'FAST');
    heightLeft -= (pdfHeight - marginY * 2);

    while (heightLeft > 0) {
      position = heightLeft - contentHeight + marginY;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', marginX, position, contentWidth, contentHeight, undefined, 'FAST');
      heightLeft -= (pdfHeight - marginY * 2);
    }
  }

  pdf.save(filename);
}
