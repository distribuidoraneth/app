/**
 * Cliente SOAP para WebServices del SRI Ecuador (Recepción y Autorización Offline)
 */

export interface SriRecepcionResult {
  estado: 'RECIBIDA' | 'DEVUELTA';
  comprobantes?: Array<{
    claveAcceso: string;
    mensajes?: Array<{
      identificador: string;
      mensaje: string;
      informacionAdicional?: string;
      tipo: string;
    }>;
  }>;
  rawResponse?: string;
  error?: string;
}

export interface SriAutorizacionResult {
  estado: 'AUTORIZADO' | 'NO AUTORIZADO' | 'EN PROCESO' | 'DEVUELTA';
  numeroAutorizacion?: string;
  fechaAutorizacion?: string;
  xmlAutorizado?: string;
  mensajes?: Array<{
    identificador: string;
    mensaje: string;
    informacionAdicional?: string;
    tipo: string;
  }>;
  rawResponse?: string;
  error?: string;
}

const SRI_ENDPOINTS = {
  pruebas: {
    recepcion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline',
    autorizacion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline',
  },
  produccion: {
    recepcion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline',
    autorizacion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline',
  },
};

/**
 * 1. Enviar XML firmado a Recepción de Comprobantes Offline del SRI
 */
export async function enviarRecepcionSRI(
  xmlFirmado: string,
  ambiente: '1' | '2' = '1'
): Promise<SriRecepcionResult> {
  const base64Xml = Buffer.from(xmlFirmado, 'utf8').toString('base64');
  const endpoint = ambiente === '2' ? SRI_ENDPOINTS.produccion.recepcion : SRI_ENDPOINTS.pruebas.recepcion;

  const soapEnvelope = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:validarComprobante>
      <xml>${base64Xml}</xml>
    </ec:validarComprobante>
  </soapenv:Body>
</soapenv:Envelope>`.trim();

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        SOAPAction: '',
      },
      body: soapEnvelope,
      signal: AbortSignal.timeout(12000),
    });

    const responseText = await response.text();

    if (responseText.includes('<estado>RECIBIDA</estado>')) {
      return { estado: 'RECIBIDA', rawResponse: responseText };
    } else {
      const msgMatch = responseText.match(/<mensaje>(.*?)<\/mensaje>/);
      const infoMatch = responseText.match(/<informacionAdicional>(.*?)<\/informacionAdicional>/);
      const idMatch = responseText.match(/<identificador>(.*?)<\/identificador>/);
      const errorMsg = [
        idMatch ? `Error ${idMatch[1]}` : '',
        msgMatch ? msgMatch[1] : '',
        infoMatch ? infoMatch[1] : ''
      ].filter(Boolean).join(': ') || responseText;

      return {
        estado: 'DEVUELTA',
        rawResponse: responseText,
        error: errorMsg,
      };
    }
  } catch (err: any) {
    console.error('Error al conectar con Recepción SRI SOAP:', err);
    return {
      estado: 'DEVUELTA',
      error: err?.message || 'Error de conexión con el SRI',
    };
  }
}

/**
 * 2. Consultar Autorización de Comprobantes Offline del SRI
 */
export async function consultarAutorizacionSRI(
  claveAcceso: string,
  ambiente: '1' | '2' = '1'
): Promise<SriAutorizacionResult> {
  const endpoint = ambiente === '2' ? SRI_ENDPOINTS.produccion.autorizacion : SRI_ENDPOINTS.pruebas.autorizacion;

  const soapEnvelope = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:autorizacionComprobante>
      <claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>
    </ec:autorizacionComprobante>
  </soapenv:Body>
</soapenv:Envelope>`.trim();

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        SOAPAction: '',
      },
      body: soapEnvelope,
      signal: AbortSignal.timeout(12000),
    });

    const responseText = await response.text();

    if (responseText.includes('<estado>AUTORIZADO</estado>')) {
      const numAutoMatch = responseText.match(/<numeroAutorizacion>(.*?)<\/numeroAutorizacion>/);
      const fechaAutoMatch = responseText.match(/<fechaAutorizacion>(.*?)<\/fechaAutorizacion>/);

      return {
        estado: 'AUTORIZADO',
        numeroAutorizacion: numAutoMatch ? numAutoMatch[1] : claveAcceso,
        fechaAutorizacion: fechaAutoMatch ? fechaAutoMatch[1] : new Date().toISOString(),
        xmlAutorizado: responseText,
        rawResponse: responseText,
      };
    } else if (
      responseText.includes('<estado>EN PROCESO</estado>') ||
      responseText.includes('<numeroComprobantes>0</numeroComprobantes>')
    ) {
      return {
        estado: 'EN PROCESO',
        rawResponse: responseText,
      };
    } else {
      const msgMatch = responseText.match(/<mensaje>(.*?)<\/mensaje>/);
      const infoMatch = responseText.match(/<informacionAdicional>(.*?)<\/informacionAdicional>/);
      const errorMsg = [msgMatch?.[1], infoMatch?.[1]].filter(Boolean).join(': ') || responseText;

      return {
        estado: 'NO AUTORIZADO',
        rawResponse: responseText,
        error: errorMsg,
      };
    }
  } catch (err: any) {
    console.error('Error al conectar con Autorización SRI SOAP:', err);
    return {
      estado: 'NO AUTORIZADO',
      error: err?.message || 'Error de conexión con el SRI',
    };
  }
}
