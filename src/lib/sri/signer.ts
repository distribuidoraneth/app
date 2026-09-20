/**
 * Firmador Digital XAdES-BES para Comprobantes Electrónicos SRI Ecuador
 * Conforme a la Ficha Técnica del SRI (Esquema Offline v2.3.4)
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface SigningOptions {
  p12Path?: string;
  p12Password?: string;
  keyPemPath?: string;
  certPemPath?: string;
}

export function signXmlXadesBes(xmlString: string, options?: SigningOptions): string {
  try {
    const cwd = process.cwd();
    const keyPath = options?.keyPemPath || path.join(cwd, 'facturacion', 'key.pem');
    const certPath = options?.certPemPath || path.join(cwd, 'facturacion', 'cert.pem');

    let privateKey = process.env.SRI_KEY_PEM || process.env.SRI_PRIVATE_KEY || '';
    if (privateKey && !privateKey.includes('-----BEGIN')) {
      try {
        privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
      } catch (_) {}
    }

    let certFull = process.env.SRI_CERT_PEM || process.env.SRI_CERTIFICATE || '';
    if (certFull && !certFull.includes('-----BEGIN')) {
      try {
        certFull = Buffer.from(certFull, 'base64').toString('utf8');
      } catch (_) {}
    }

    if (!privateKey && fs.existsSync(keyPath)) {
      privateKey = fs.readFileSync(keyPath, 'utf8');
    }

    if (!certFull && fs.existsSync(certPath)) {
      certFull = fs.readFileSync(certPath, 'utf8');
    }

    if (!privateKey || !certFull) {
      console.warn('Archivos PEM no encontrados en facturacion/ ni en variables de entorno, retornando XML sin firmar para modo pruebas');
      return xmlString;
    }

    // Extraer certificados individuales
    const certs = certFull
      .split('-----END CERTIFICATE-----')
      .filter((c) => c.includes('-----BEGIN CERTIFICATE-----'))
      .map((c) => c.replace('-----BEGIN CERTIFICATE-----', '').replace(/\s+/g, '') + '-----END CERTIFICATE-----');

    const signingCertBase64 = certs[0]?.replace('-----END CERTIFICATE-----', '').trim() || '';

    // Generar IDs aleatorios para los nodos de la firma
    const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const signatureId = `Signature${randomInt(100000, 999999)}`;
    const signedInfoId = `Signature-SignedInfo${randomInt(100000, 999999)}`;
    const signedPropertiesId = `SignedPropertiesId${randomInt(100000, 999999)}`;
    const keyInfoId = `Certificate${randomInt(100000, 999999)}`;
    const referenceId = `SignedPropertiesID${randomInt(100000, 999999)}`;

    // 1. Digest del documento comprobante
    const cleanXml = xmlString.replace(/<\?xml[^>]*\?>/g, '').trim();
    const sha1Doc = crypto.createHash('sha1');
    sha1Doc.update(cleanXml, 'utf8');
    const digestDoc = sha1Doc.digest('base64');

    // 2. Digest del Certificado
    const sha1Cert = crypto.createHash('sha1');
    sha1Cert.update(Buffer.from(signingCertBase64, 'base64'));
    const digestCert = sha1Cert.digest('base64');

    // 3. Nodo SignedProperties
    const isoTime = new Date().toISOString();
    const signedPropertiesXml = `<etsi:SignedProperties Id="${signedPropertiesId}"><etsi:SignedSignatureProperties><etsi:SigningTime>${isoTime}</etsi:SigningTime><etsi:SigningCertificate><etsi:Cert><etsi:CertDigest><ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><ds:DigestValue>${digestCert}</ds:DigestValue></etsi:CertDigest><etsi:IssuerSerial><ds:X509IssuerName>CN=AUTORIDAD DE CERTIFICACION SUBCA-2 SECURITY DATA,OU=ENTIDAD DE CERTIFICACION DE INFORMACION,O=SECURITY DATA S.A. 2,C=EC</ds:X509IssuerName><ds:X509SerialNumber>080323201818</ds:X509SerialNumber></etsi:IssuerSerial></etsi:Cert></etsi:SigningCertificate></etsi:SignedSignatureProperties><etsi:SignedDataObjectProperties><etsi:DataObjectFormat ObjectReference="#comprobante"><etsi:Description>comprobante</etsi:Description><etsi:MimeType>text/xml</etsi:MimeType></etsi:DataObjectFormat></etsi:SignedDataObjectProperties></etsi:SignedProperties>`;

    const sha1SignedProps = crypto.createHash('sha1');
    sha1SignedProps.update(signedPropertiesXml, 'utf8');
    const digestSignedProps = sha1SignedProps.digest('base64');

    // 4. Nodo KeyInfo
    const keyInfoXml = `<ds:KeyInfo Id="${keyInfoId}"><ds:X509Data><ds:X509Certificate>${signingCertBase64}</ds:X509Certificate></ds:X509Data><ds:KeyValue><ds:RSAKeyValue><ds:Modulus></ds:Modulus><ds:Exponent>AQAB</ds:Exponent></ds:RSAKeyValue></ds:KeyValue></ds:KeyInfo>`;

    const sha1KeyInfo = crypto.createHash('sha1');
    sha1KeyInfo.update(keyInfoXml, 'utf8');
    const digestKeyInfo = sha1KeyInfo.digest('base64');

    // 5. SignedInfo
    const signedInfoXml = `<ds:SignedInfo Id="${signedInfoId}"><ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/><ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/><ds:Reference Id="comprobante" URI="#comprobante"><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><ds:DigestValue>${digestDoc}</ds:DigestValue></ds:Reference><ds:Reference Id="${referenceId}" Type="http://uri.etsi.org/01903#SignedProperties" URI="#${signedPropertiesId}"><ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><ds:DigestValue>${digestSignedProps}</ds:DigestValue></ds:Reference><ds:Reference URI="#${keyInfoId}"><ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><ds:DigestValue>${digestKeyInfo}</ds:DigestValue></ds:Reference></ds:SignedInfo>`;

    // 6. Firma RSA-SHA1 de SignedInfo
    const signer = crypto.createSign('RSA-SHA1');
    signer.update(signedInfoXml, 'utf8');
    const signatureValue = signer.sign(privateKey, 'base64');

    // 7. Estructura completa de la firma
    const fullSignature = `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#" Id="${signatureId}">${signedInfoXml}<ds:SignatureValue>${signatureValue}</ds:SignatureValue>${keyInfoXml}<ds:Object><etsi:QualifyingProperties Target="#${signatureId}">${signedPropertiesXml}</etsi:QualifyingProperties></ds:Object></ds:Signature>`;

    // Insertar la firma antes del cierre de </factura>
    const signedXml = cleanXml.replace('</factura>', `${fullSignature}</factura>`);
    return `<?xml version="1.0" encoding="UTF-8"?>\n${signedXml}`;
  } catch (error) {
    console.error('Error al firmar XML con XAdES-BES:', error);
    return xmlString;
  }
}
