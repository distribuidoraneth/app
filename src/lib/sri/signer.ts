/**
 * Firmador Digital XAdES-BES para Comprobantes Electrónicos SRI Ecuador
 * Conforme a la Ficha Técnica del SRI (Esquema Offline v2.3.4)
 * Utiliza el estándar oficial XAdES-BES validado ante el SRI
 */

import * as fs from 'fs';
import * as path from 'path';
import { signXml } from 'osodreamer-sri-xml-signer';

export interface SigningOptions {
  p12Path?: string;
  p12Password?: string;
  p12Buffer?: Buffer;
}

export async function signXmlXadesBes(xmlString: string, options?: SigningOptions): Promise<string> {
  try {
    let p12Buffer: Buffer | null = options?.p12Buffer || null;
    const password = options?.p12Password || process.env.SRI_P12_PASSWORD || '1234';

    // 1. Cargar desde variable de entorno base64 si existe
    if (!p12Buffer && process.env.SRI_P12_BASE64) {
      try {
        p12Buffer = Buffer.from(process.env.SRI_P12_BASE64, 'base64');
      } catch (err) {
        console.error('Error al decodificar SRI_P12_BASE64:', err);
      }
    }

    // 2. Si no está en env, buscar en sistema de archivos local
    if (!p12Buffer) {
      const cwd = process.cwd();
      const possiblePaths = [
        options?.p12Path,
        path.join(cwd, 'facturacion', 'signer.p12'),
        path.join(cwd, 'facturacion', 'ANA ELIZABETH ANDRADE CONSTANTE 080323201818.p12'),
      ].filter(Boolean) as string[];

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          p12Buffer = fs.readFileSync(p);
          break;
        }
      }
    }

    if (!p12Buffer) {
      console.warn('Certificado .p12 no encontrado (facturacion/signer.p12 ni SRI_P12_BASE64). Se retorna XML sin firmar.');
      return xmlString;
    }

    const xmlBuffer = Buffer.from(xmlString.trim(), 'utf-8');

    const signedXml = await signXml({
      p12Buffer,
      password,
      xmlBuffer,
    });

    return signedXml;
  } catch (error) {
    console.error('Error al firmar XML con XAdES-BES:', error);
    throw error;
  }
}
