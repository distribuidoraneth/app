/**
 * Firmador Digital XAdES-BES para Comprobantes Electrónicos SRI Ecuador
 * Conforme a la Ficha Técnica del SRI (Esquema Offline v2.3.4)
 * Motor criptográfico nativo Node.js con certificados Security Data
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { EMBEDDED_CERT_PEM, EMBEDDED_KEY_PEM } from './certData';

export interface SigningOptions {
  keyPemPath?: string;
  certPemPath?: string;
}

export async function signXmlXadesBes(xmlString: string, options?: SigningOptions): Promise<string> {
  try {
    const cwd = process.cwd();
    const keyPath = options?.keyPemPath || path.join(cwd, 'facturacion', 'key.pem');
    const certPath = options?.certPemPath || path.join(cwd, 'facturacion', 'cert.pem');

    let keyPem = process.env.SRI_KEY_PEM || process.env.SRI_PRIVATE_KEY || '';
    if (keyPem && !keyPem.includes('-----BEGIN')) {
      try {
        keyPem = Buffer.from(keyPem, 'base64').toString('utf8');
      } catch (_) {}
    }

    let certPem = process.env.SRI_CERT_PEM || process.env.SRI_CERTIFICATE || '';
    if (certPem && !certPem.includes('-----BEGIN')) {
      try {
        certPem = Buffer.from(certPem, 'base64').toString('utf8');
      } catch (_) {}
    }

    if (!keyPem && fs.existsSync(keyPath)) {
      try {
        keyPem = fs.readFileSync(keyPath, 'utf8');
      } catch (_) {}
    }

    if (!certPem && fs.existsSync(certPath)) {
      try {
        certPem = fs.readFileSync(certPath, 'utf8');
      } catch (_) {}
    }

    // Si no se encuentra en disco ni en variables de entorno, usar el certificado embebido (Vercel Serverless)
    if (!keyPem && EMBEDDED_KEY_PEM) {
      keyPem = EMBEDDED_KEY_PEM;
    }
    if (!certPem && EMBEDDED_CERT_PEM) {
      certPem = EMBEDDED_CERT_PEM;
    }

    if (!keyPem || !certPem) {
      throw new Error('Certificado o clave privada no disponibles para la firma electrónica');
    }

    const cert = new crypto.X509Certificate(certPem);
    const certDerDigest = crypto.createHash('sha1').update(cert.raw).digest('base64');
    const serialNumber = BigInt('0x' + cert.serialNumber).toString();
    const issuerName = 'CN=AUTORIDAD DE CERTIFICACION SUBCA-2 SECURITY DATA,OU=ENTIDAD DE CERTIFICACION DE INFORMACION,O=SECURITY DATA S.A. 2,C=EC';

    const certB64 = cert.raw.toString('base64');
    const jwk = cert.publicKey.export({ format: 'jwk' });
    const modulus = Buffer.from(jwk.n!, 'base64url').toString('base64');
    const exponent = Buffer.from(jwk.e!, 'base64url').toString('base64');

    // IDs aleatorios para los nodos de firma
    const rnd = () => Math.floor(1000000 + Math.random() * 9000000);
    const sigId = rnd();
    const propId = rnd();
    const certId = rnd();
    const signedInfoId = rnd();
    const refId = rnd();
    const sigValId = rnd();
    const objId = rnd();
    const signedPropId = rnd();

    // Fecha en hora local de Ecuador (UTC-5)
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const signTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}-05:00`;

    const XMLNS = 'xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#"';

    // 1. Digest del documento comprobante
    const cleanDocXml = xmlString.replace(/<\?xml[^>]*\?>/g, '').trim();
    const sha1_doc = crypto.createHash('sha1').update(cleanDocXml, 'utf8').digest('base64');

    // 2. SignedProperties
    const signedPropertiesXml = `<etsi:SignedProperties ${XMLNS} Id="Signature${sigId}-SignedProperties${propId}"><etsi:SignedSignatureProperties><etsi:SigningTime>${signTime}</etsi:SigningTime><etsi:SigningCertificate><etsi:Cert><etsi:CertDigest><ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><ds:DigestValue>${certDerDigest}</ds:DigestValue></etsi:CertDigest><etsi:IssuerSerial><ds:X509IssuerName>${issuerName}</ds:X509IssuerName><ds:X509SerialNumber>${serialNumber}</ds:X509SerialNumber></etsi:IssuerSerial></etsi:Cert></etsi:SigningCertificate></etsi:SignedSignatureProperties><etsi:SignedDataObjectProperties><etsi:DataObjectFormat ObjectReference="#Reference-ID-${refId}"><etsi:Description>contenido comprobante</etsi:Description><etsi:MimeType>text/xml</etsi:MimeType></etsi:DataObjectFormat></etsi:SignedDataObjectProperties></etsi:SignedProperties>`;

    const sha1_props = crypto.createHash('sha1').update(signedPropertiesXml, 'utf8').digest('base64');

    // Formateador base64 a 76 columnas
    const formatB64 = (s: string) => s.match(/.{1,76}/g)?.join('\n') || s;

    // 3. KeyInfo
    const keyInfoXml = `<ds:KeyInfo ${XMLNS} Id="Certificate${certId}">\n<ds:X509Data>\n<ds:X509Certificate>\n${formatB64(certB64)}\n</ds:X509Certificate>\n</ds:X509Data>\n<ds:KeyValue>\n<ds:RSAKeyValue>\n<ds:Modulus>\n${formatB64(modulus)}\n</ds:Modulus>\n<ds:Exponent>${exponent}</ds:Exponent>\n</ds:RSAKeyValue>\n</ds:KeyValue>\n</ds:KeyInfo>`;

    const sha1_keyInfo = crypto.createHash('sha1').update(keyInfoXml, 'utf8').digest('base64');

    // 4. SignedInfo
    const signedInfoXml = `<ds:SignedInfo ${XMLNS} Id="Signature-SignedInfo${signedInfoId}">\n<ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315">\n</ds:CanonicalizationMethod>\n<ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1">\n</ds:SignatureMethod>\n<ds:Reference Id="SignedPropertiesID${signedPropId}" Type="http://uri.etsi.org/01903#SignedProperties" URI="#Signature${sigId}-SignedProperties${propId}">\n<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">\n</ds:DigestMethod>\n<ds:DigestValue>${sha1_props}</ds:DigestValue>\n</ds:Reference>\n<ds:Reference URI="#Certificate${certId}">\n<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">\n</ds:DigestMethod>\n<ds:DigestValue>${sha1_keyInfo}</ds:DigestValue>\n</ds:Reference>\n<ds:Reference Id="Reference-ID-${refId}" URI="#comprobante">\n<ds:Transforms>\n<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature">\n</ds:Transform>\n</ds:Transforms>\n<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">\n</ds:DigestMethod>\n<ds:DigestValue>${sha1_doc}</ds:DigestValue>\n</ds:Reference>\n</ds:SignedInfo>`;

    // 5. Firma RSA-SHA1
    const signer = crypto.createSign('RSA-SHA1');
    signer.update(signedInfoXml, 'utf8');
    const signatureValue = signer.sign(keyPem, 'base64');

    // 6. Ensamblaje completo
    const fullSig = `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#" Id="Signature${sigId}">\n${signedInfoXml}\n<ds:SignatureValue Id="SignatureValue${sigValId}">\n${formatB64(signatureValue)}\n</ds:SignatureValue>\n${keyInfoXml}\n<ds:Object Id="Signature${sigId}-Object${objId}"><etsi:QualifyingProperties Target="#Signature${sigId}">${signedPropertiesXml}</etsi:QualifyingProperties></ds:Object></ds:Signature>`;

    const closingTag = cleanDocXml.includes('</notaCredito>') ? '</notaCredito>' : '</factura>';
    const signedXml = cleanDocXml.replace(closingTag, `${fullSig}${closingTag}`);

    return `<?xml version="1.0" encoding="UTF-8"?>\n${signedXml}`;
  } catch (error) {
    console.error('Error al firmar XML con XAdES-BES:', error);
    throw error;
  }
}
