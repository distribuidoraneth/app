/**
 * Firmador Digital XAdES-BES para Comprobantes Electrónicos SRI Ecuador
 * Conforme a la Ficha Técnica del SRI (Esquema Offline v2.3.4)
 * Motor oficial XAdES-BES adaptado para ESM / Vercel Serverless
 */

import * as fs from 'fs';
import * as path from 'path';
import { EMBEDDED_P12_BASE64, EMBEDDED_P12_PASSWORD } from './certData';
// @ts-ignore
import { signXml } from './osodreamerSigner.mjs';

export interface SigningOptions {
  p12Path?: string;
  p12Password?: string;
  p12Buffer?: Buffer;
}

export async function signXmlXadesBes(xmlString: string, options?: SigningOptions): Promise<string> {
  try {
    let p12Buffer: Buffer | null = options?.p12Buffer || null;
    let password = options?.p12Password || process.env.SRI_P12_PASSWORD || EMBEDDED_P12_PASSWORD;

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

    // 3. Si no está en archivos ni en variable de entorno (ej. Vercel Serverless), usar certificado embebido
    if (!p12Buffer && EMBEDDED_P12_BASE64) {
      try {
        p12Buffer = Buffer.from(EMBEDDED_P12_BASE64, 'base64');
        password = EMBEDDED_P12_PASSWORD;
      } catch (err) {
        console.error('Error al decodificar EMBEDDED_P12_BASE64:', err);
      }
    }

    if (!p12Buffer) {
      throw new Error('Certificado digital P12 no disponible para firmar');
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
