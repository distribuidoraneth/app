import forgePkg from "node-forge";
const forge = forgePkg.default || forgePkg;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __knownSymbol = (name, symbol) => (symbol = Symbol[name]) ? symbol : /* @__PURE__ */ Symbol.for("Symbol." + name);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __decoratorStart = (base) => {
  var _a;
  return [, , , __create((_a = base == null ? void 0 : base[__knownSymbol("metadata")]) != null ? _a : null)];
};
var __decoratorStrings = ["class", "method", "getter", "setter", "accessor", "field", "value", "get", "set"];
var __expectFn = (fn) => fn !== void 0 && typeof fn !== "function" ? __typeError("Function expected") : fn;
var __decoratorContext = (kind, name, done, metadata, fns) => ({ kind: __decoratorStrings[kind], name, metadata, addInitializer: (fn) => done._ ? __typeError("Already initialized") : fns.push(__expectFn(fn || null)) });
var __decoratorMetadata = (array, target) => __defNormalProp(target, __knownSymbol("metadata"), array[3]);
var __runInitializers = (array, flags, self, value) => {
  for (var i = 0, fns = array[flags >> 1], n = fns && fns.length; i < n; i++) flags & 1 ? fns[i].call(self) : value = fns[i].call(self, value);
  return value;
};
var __decorateElement = (array, flags, name, decorators, target, extra) => {
  var fn, it, done, ctx, access, k = flags & 7, s = !!(flags & 8), p = !!(flags & 16);
  var j = k > 3 ? array.length + 1 : k ? s ? 1 : 2 : 0, key = __decoratorStrings[k + 5];
  var initializers = k > 3 && (array[j - 1] = []), extraInitializers = array[j] || (array[j] = []);
  var desc = k && (!p && !s && (target = target.prototype), k < 5 && (k > 3 || !p) && __getOwnPropDesc(k < 4 ? target : { get [name]() {
    return __privateGet(this, extra);
  }, set [name](x) {
    return __privateSet(this, extra, x);
  } }, name));
  k ? p && k < 4 && __name(extra, (k > 2 ? "set " : k > 1 ? "get " : "") + name) : __name(target, name);
  for (var i = decorators.length - 1; i >= 0; i--) {
    ctx = __decoratorContext(k, name, done = {}, array[3], extraInitializers);
    if (k) {
      ctx.static = s, ctx.private = p, access = ctx.access = { has: p ? (x) => __privateIn(target, x) : (x) => name in x };
      if (k ^ 3) access.get = p ? (x) => (k ^ 1 ? __privateGet : __privateMethod)(x, target, k ^ 4 ? extra : desc.get) : (x) => x[name];
      if (k > 2) access.set = p ? (x, y) => __privateSet(x, target, y, k ^ 4 ? extra : desc.set) : (x, y) => x[name] = y;
    }
    it = (0, decorators[i])(k ? k < 4 ? p ? extra : desc[key] : k > 4 ? void 0 : { get: desc.get, set: desc.set } : target, ctx), done._ = 1;
    if (k ^ 4 || it === void 0) __expectFn(it) && (k > 4 ? initializers.unshift(it) : k ? p ? extra = it : desc[key] = it : target = it);
    else if (typeof it !== "object" || it === null) __typeError("Object expected");
    else __expectFn(fn = it.get) && (desc.get = fn), __expectFn(fn = it.set) && (desc.set = fn), __expectFn(fn = it.init) && initializers.unshift(fn);
  }
  return k || __decoratorMetadata(array, target), desc && __defProp(target, name, desc), p ? k ^ 4 ? extra : desc : target;
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateIn = (member, obj) => Object(obj) !== obj ? __typeError('Cannot use the "in" operator on this value') : member.has(obj);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

// src/utils/forge-loader.ts
var forgeInstance = forge;
async function loadForge() { return forge; }
async function getForge() { return forge; }

// src/sign-xml/common/utils/crypto.util.ts
var CryptoUtils = class {
  async hexToBase64(str) {
    const forge3 = await getForge();
    let hex = ("00" + str).slice(0 - str.length - str.length % 2);
    const binary = hex.replace(/\r|\n/g, "").replace(
      /([\da-fA-F]{2}) ?/g,
      (match) => String.fromCharCode(parseInt(match, 16))
    );
    return forge3.util.encode64(binary);
  }
  async bigint3base64(bigint) {
    const forge3 = await getForge();
    const hex = bigint.toString(16).padStart(2, "0");
    const binary = hex.match(/\w{2}/g).map((a) => String.fromCharCode(parseInt(a, 16))).join("");
    const base64 = forge3.util.encode64(binary);
    return base64.match(/.{1,76}/g).join("\n");
  }
  p_obtener_aleatorio() {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return 1e5 + arr[0] % 99e5;
  }
};

// src/sign-xml/infrastructure/errors/infrastructure.error.ts
var InfrastructureError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "InfrastructureError";
  }
};
var UnknownSignStrategyError = class extends InfrastructureError {
  constructor(friendlyName) {
    super(`No existe estrategia para el certificado: ${friendlyName}`);
    this.name = "UnknownSignStrategyError";
  }
};
var SignStrategyError = class extends InfrastructureError {
  constructor(message) {
    super(message);
    this.name = "SignStrategyError";
  }
};
var SigningKeyNotFoundError = class extends SignStrategyError {
  constructor(friendlyName) {
    super(
      `No se encontr\xF3 la clave de firma para el certificado: ${friendlyName}`
    );
    this.name = "SigningKeyNotFoundError";
  }
};
var PrivateKeyExtractionError = class extends SignStrategyError {
  constructor(sourceLabel = "archivo P12") {
    super(`No se pudo extraer la clave privada desde ${sourceLabel}.`);
    this.name = "PrivateKeyExtractionError";
  }
};
var UanatacaCertificateNotFoundError = class extends SignStrategyError {
  constructor() {
    super("No se encontr\xF3 el certificado para UANATACA.");
    this.name = "UanatacaCertificateNotFoundError";
  }
};
var InvalidP12StructureError = class extends Error {
  constructor() {
    super("El archivo no es un archivo PKCS#12 (P12) v\xE1lido.");
    this.name = "InvalidP12StructureError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
};
var InvalidP12PasswordError = class extends Error {
  constructor() {
    super("El archivo P12 es v\xE1lido, pero la contrase\xF1a es incorrecta.");
    this.name = "InvalidP12PasswordError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
};
var InvalidXmlStructureError = class extends Error {
  constructor(message = "El archivo proporcionado no es un XML v\xE1lido.") {
    super(message);
    this.name = "InvalidXmlStructureError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
};

// src/sign-xml/infrastructure/certificate/strategies/anfac.strategy.ts
var OID_TO_RFC4514 = {
  "2.5.4.6": "C",
  "2.5.4.10": "O",
  "2.5.4.11": "OU",
  "2.5.4.3": "CN",
  "2.5.4.7": "L",
  "2.5.4.8": "ST",
  "2.5.4.9": "STREET",
  "2.5.4.5": "SERIALNUMBER",
  "1.2.840.113549.1.9.1": "E"
  // emailAddress
};
function escapeRfc4514(value) {
  let v = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/,/g, "\\,").replace(/\+/g, "\\+").replace(/;/g, "\\;").replace(/</g, "\\<").replace(/>/g, "\\>").replace(/#/g, "\\#").replace(/=/g, "\\=");
  if (v.startsWith(" ")) v = "\\" + v;
  if (v.endsWith(" ")) v = v.slice(0, -1) + "\\ ";
  return v;
}
function attrName(a) {
  return OID_TO_RFC4514[a.type] || (a.shortName ? a.shortName.toUpperCase() : "") || (a.name ? a.name.toUpperCase() : "") || a.type;
}
var AnfacStrategy = class {
  supports(friendlyName) {
    return /ANFAC/i.test(friendlyName);
  }
  async getPrivateKey(bags) {
    const forge3 = await getForge();
    const item = bags[0];
    if (!item) throw new SigningKeyNotFoundError("ANFAC");
    if (item == null ? void 0 : item.key) return item.key;
    if (item == null ? void 0 : item.asn1) return forge3.pki.privateKeyFromAsn1(item.asn1);
    throw new PrivateKeyExtractionError();
  }
  async overrideIssuerName(certBags) {
    const forge3 = await getForge();
    const cert = certBags[forge3.pki.oids.certBag][0].cert;
    return cert.issuer.attributes.slice().reverse().map((a) => `${attrName(a)}=${escapeRfc4514(String(a.value))}`).join(",");
  }
};

// src/sign-xml/infrastructure/certificate/strategies/banco-central.strategy.ts
var BancoCentralStrategy = class {
  supports(friendlyName) {
    return /BANCO CENTRAL/i.test(friendlyName);
  }
  async getPrivateKey(bags) {
    const forge3 = await getForge();
    const item = bags.find(
      (bag) => {
        var _a, _b;
        return /Signing Key/i.test((_b = (_a = bag.attributes) == null ? void 0 : _a.friendlyName) == null ? void 0 : _b[0]);
      }
    );
    if (!item) throw new SigningKeyNotFoundError("BANCO CENTRAL");
    if (item == null ? void 0 : item.key) {
      return item.key;
    } else if (item == null ? void 0 : item.asn1) {
      return forge3.pki.privateKeyFromAsn1(item.asn1);
    } else {
      throw new PrivateKeyExtractionError();
    }
  }
  async overrideIssuerName(certBags) {
    const forge3 = await getForge();
    const cert = certBags[forge3.pki.oids.certBag][0].cert;
    return cert.issuer.attributes.reverse().map((attr) => `${attr.shortName}=${attr.value}`).join(",");
  }
};

// src/sign-xml/infrastructure/certificate/strategies/security-data.strategy.ts
var SecurityDataStrategy = class {
  supports(friendlyName) {
    return /SECURITY DATA/i.test(friendlyName);
  }
  async getPrivateKey(bags) {
    const forge3 = await getForge();
    const item = bags[0];
    if (!item) throw new SigningKeyNotFoundError("SECURITY DATAL");
    if (item == null ? void 0 : item.key) {
      return item.key;
    } else if (item == null ? void 0 : item.asn1) {
      return forge3.pki.privateKeyFromAsn1(item.asn1);
    } else {
      throw new PrivateKeyExtractionError();
    }
  }
  async overrideIssuerName(certBags) {
    const forge3 = await getForge();
    const cert = certBags[forge3.pki.oids.certBag][0].cert;
    return cert.issuer.attributes.reverse().map((attr) => `${attr.shortName}=${attr.value}`).join(",");
  }
};

// src/sign-xml/infrastructure/certificate/strategies/uanataca.strategy.ts
var UanatacaStrategy = class {
  supports(friendlyName) {
    return /UANATACA/i.test(friendlyName);
  }
  async getPrivateKey(bags) {
    const forge3 = await getForge();
    const item = bags[0];
    if (!item) throw new SigningKeyNotFoundError("UANATACA");
    if (item == null ? void 0 : item.key) {
      return item.key;
    } else if (item == null ? void 0 : item.asn1) {
      return forge3.pki.privateKeyFromAsn1(item.asn1);
    } else {
      throw new PrivateKeyExtractionError();
    }
  }
  async overrideIssuerName(certBags) {
    const forge3 = await getForge();
    const certItems = certBags[forge3.pki.oids.certBag];
    if (!certItems || !certItems.length) {
      throw new UanatacaCertificateNotFoundError();
    }
    const cert = certItems[0].cert;
    return await this.getX509IssuerName(cert);
  }
  async getX509IssuerName(cert) {
    const forge3 = await getForge();
    const issuerName = cert.issuer.attributes.reverse().filter((attr) => attr.shortName || attr.type).map((attr) => {
      if (attr.shortName) {
        return `${attr.shortName}=${attr.value}`;
      } else {
        return `${attr.type}=${this.hexEncodeUtf8(attr.value, forge3)}`;
      }
    }).join(",");
    return issuerName;
  }
  hexEncodeUtf8(value, forge3) {
    const utf8Bytes = forge3.util.encodeUtf8(value);
    const hex = forge3.util.bytesToHex(utf8Bytes);
    return `#0c${utf8Bytes.length.toString(16).padStart(2, "0")}${hex}`;
  }
};

// src/sign-xml/infrastructure/certificate/factories/sign-strategy.factory.ts
var SignStrategyFactory = class {
  constructor() {
    this.strategies = [
      new BancoCentralStrategy(),
      new SecurityDataStrategy(),
      new UanatacaStrategy(),
      new AnfacStrategy()
    ];
  }
  getStrategy(friendlyName) {
    const strategy = this.strategies.find((s) => s.supports(friendlyName));
    if (!strategy) {
      throw new UnknownSignStrategyError(friendlyName);
    }
    return strategy;
  }
};

// src/sign-xml/infrastructure/certificate/certificate-provider.implement.ts
var CertificateProviderImplement = class {
  constructor(p12Buffer, password, strategyFactory, crypto2) {
    this.p12Buffer = p12Buffer;
    this.password = password;
    this.strategyFactory = strategyFactory;
    this.crypto = crypto2;
  }
  async getCertificateData() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const forge3 = await getForge();
    const uint8Array = new Uint8Array(this.p12Buffer);
    const p12Base64 = forge3.util.binary.base64.encode(uint8Array);
    const p12Decoded = forge3.util.decode64(p12Base64);
    const p12Asn1 = forge3.asn1.fromDer(p12Decoded);
    const p12 = forge3.pkcs12.pkcs12FromAsn1(p12Asn1, this.password);
    const keyBags = p12.getBags({
      bagType: forge3.pki.oids.pkcs8ShroudedKeyBag
    });
    const certBags = p12.getBags({ bagType: forge3.pki.oids.certBag });
    const certificates = certBags[forge3.oids.certBag];
    const friendlyName = (_i = (_c = (_b = (_a = certificates == null ? void 0 : certificates[1]) == null ? void 0 : _a.attributes) == null ? void 0 : _b.friendlyName) == null ? void 0 : _c[0]) != null ? _i : (_h = (_g = (_f = (_e = (_d = certificates == null ? void 0 : certificates[0]) == null ? void 0 : _d.cert) == null ? void 0 : _e.issuer) == null ? void 0 : _f.attributes) == null ? void 0 : _g[2]) == null ? void 0 : _h.value;
    const strategy = this.strategyFactory.getStrategy(friendlyName);
    const privateKey = await strategy.getPrivateKey(
      keyBags[forge3.oids.pkcs8ShroudedKeyBag]
    );
    const byKey = certificates.find((bag) => {
      var _a2, _b2, _c2;
      try {
        return ((_c2 = (_b2 = (_a2 = bag.cert) == null ? void 0 : _a2.publicKey) == null ? void 0 : _b2.n) == null ? void 0 : _c2.toString(16)) === privateKey.n.toString(16);
      } catch (_) {
        return false;
      }
    });
    const mainCertificate = byKey != null ? byKey : certificates.reduce((prev, current) => {
      return current.cert.extensions.length > prev.cert.extensions.length ? current : prev;
    });
    const issuerName = mainCertificate.cert.issuer.attributes.slice().reverse().map((attr) => `${attr.shortName || attr.type}=${attr.value}`).join(",");
    const certificate = mainCertificate.cert;
    const certificateX509_asn1 = forge3.pki.certificateToAsn1(certificate);
    const certificateX509_der = forge3.asn1.toDer(certificateX509_asn1);
    const certificateX509_der_hash = forge3.util.encode64(
      forge3.sha1.create().update(certificateX509_der.bytes()).digest().bytes()
    );
    const X509SerialNumber = new forge3.jsbn.BigInteger(
      Array.from(Buffer.from(certificate.serialNumber, "hex"))
    ).toString();
    const certificateX509 = forge3.util.encode64(certificateX509_der.bytes());
    const exponent = await this.crypto.hexToBase64(
      privateKey.e.data[0].toString(16)
    );
    const modulus = await this.crypto.bigint3base64(privateKey.n);
    return {
      certificate,
      certificateX509,
      privateKey,
      issuerName,
      serialNumber: X509SerialNumber,
      base64Der: certificateX509_der_hash,
      publicKey: {
        modulus,
        exponent
      }
    };
  }
};

// src/sign-xml/infrastructure/certificate/certificate-cache.ts
var CERTIFICATE_CACHE_MAX_ENTRIES = 64;
function certificateCacheMaxEntries() {
  var _a;
  const raw = typeof process !== "undefined" ? (_a = process.env) == null ? void 0 : _a.OSODREAMER_CERT_CACHE_MAX : void 0;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : CERTIFICATE_CACHE_MAX_ENTRIES;
}
var cache = /* @__PURE__ */ new Map();
async function certificateCacheKey(p12Buffer, password) {
  const forge3 = await getForge();
  const md3 = forge3.md.sha256.create();
  md3.update(forge3.util.binary.raw.encode(new Uint8Array(p12Buffer)));
  md3.update(":" + password, "utf8");
  return md3.digest().toHex();
}
function getCachedCertificate(key) {
  const entry = cache.get(key);
  if (!entry) return void 0;
  cache.delete(key);
  cache.set(key, entry);
  return entry;
}
function setCachedCertificate(key, entry) {
  cache.set(key, entry);
  const max = certificateCacheMaxEntries();
  while (cache.size > max) {
    cache.delete(cache.keys().next().value);
  }
}
function clearCertificateCache() {
  cache.clear();
}
function certificateCacheSize() {
  return cache.size;
}

// src/sign-xml/application/use-cases.ts
var SignXmlUseCase = class {
  constructor(signerService, injector) {
    this.signerService = signerService;
    this.injector = injector;
  }
  async execute(input) {
    const { xmlToSign, certData } = input;
    const signatureXml = await this.signerService.sign({
      xmlToSign,
      certData
    });
    const finalXml = this.injector.insertSignature(signatureXml.xadesBes);
    return finalXml;
  }
};

// src/sign-xml/domain/enums/xml-namespaces.enum.ts
var XMLNS_ATTRIBUTE = `xmlns:ds="${"http://www.w3.org/2000/09/xmldsig#" /* DS */}" xmlns:etsi="${"http://uri.etsi.org/01903/v1.3.2#" /* ETSI */}"`;

// src/sign-xml/domain/builders/keyInfo.builder.ts
var KeyInfoBuilder = class {
  build(params) {
    const { certificateNumber, certificateX509, modulus, exponent } = params;
    return [
      `<ds:KeyInfo ${XMLNS_ATTRIBUTE} Id="Certificate${certificateNumber}">`,
      "\n<ds:X509Data>",
      "\n<ds:X509Certificate>\n",
      certificateX509,
      "\n</ds:X509Certificate>",
      "\n</ds:X509Data>",
      "\n<ds:KeyValue>",
      "\n<ds:RSAKeyValue>",
      "\n<ds:Modulus>\n",
      modulus,
      "\n</ds:Modulus>",
      "\n<ds:Exponent>",
      exponent,
      "</ds:Exponent>",
      "\n</ds:RSAKeyValue>",
      "\n</ds:KeyValue>",
      "\n</ds:KeyInfo>"
    ].join("");
  }
};

// src/sign-xml/domain/builders/signed-info.builder.ts
var SignedInfoBuilder = class {
  build(params) {
    const { ids, sha1_SignedProperties, sha1_certificado, sha1_comprobante } = params;
    return [
      `<ds:SignedInfo ${XMLNS_ATTRIBUTE} Id="Signature-SignedInfo${ids.signedInfoNumber}">`,
      `
<ds:CanonicalizationMethod Algorithm="${"http://www.w3.org/TR/2001/REC-xml-c14n-20010315" /* XML_C14N_20010315 */}">`,
      "</ds:CanonicalizationMethod>",
      `
<ds:SignatureMethod Algorithm="${"http://www.w3.org/2000/09/xmldsig#rsa-sha1" /* RSA_SHA1 */}">`,
      "</ds:SignatureMethod>",
      `
<ds:Reference Id="SignedPropertiesID${ids.signedPropertiesIdNumber}" Type="${"http://uri.etsi.org/01903#SignedProperties" /* SIGNED_PROPERTIES */}" URI="#Signature${ids.signatureNumber}-SignedProperties${ids.signedPropertiesNumber}">`,
      `
<ds:DigestMethod Algorithm="${"http://www.w3.org/2000/09/xmldsig#sha1" /* SHA1 */}">`,
      "</ds:DigestMethod>",
      "\n<ds:DigestValue>",
      sha1_SignedProperties,
      "</ds:DigestValue>",
      "\n</ds:Reference>",
      `
<ds:Reference URI="#Certificate${ids.certificateNumber}">`,
      `
<ds:DigestMethod Algorithm="${"http://www.w3.org/2000/09/xmldsig#sha1" /* SHA1 */}">`,
      "</ds:DigestMethod>",
      "\n<ds:DigestValue>",
      sha1_certificado,
      "</ds:DigestValue>",
      "\n</ds:Reference>",
      `
<ds:Reference Id="Reference-ID-${ids.referenceIdNumber}" URI="#comprobante">`,
      "\n<ds:Transforms>",
      `
<ds:Transform Algorithm="${"http://www.w3.org/2000/09/xmldsig#enveloped-signature" /* ENVELOPED_SIGNATURE */}">`,
      "</ds:Transform>",
      "\n</ds:Transforms>",
      `
<ds:DigestMethod Algorithm="${"http://www.w3.org/2000/09/xmldsig#sha1" /* SHA1 */}">`,
      "</ds:DigestMethod>",
      "\n<ds:DigestValue>",
      sha1_comprobante,
      "</ds:DigestValue>",
      "\n</ds:Reference>",
      "\n</ds:SignedInfo>"
    ].join("");
  }
};

// src/sign-xml/domain/builders/signed-properties.builder.ts
var SignedPropertiesBuilder = class {
  constructor(clock) {
    this.clock = clock;
  }
  build(params) {
    const {
      signatureNumber,
      signedPropertiesNumber,
      certificateX509_der_hash,
      issuerName,
      X509SerialNumber,
      referenceIdNumber
    } = params;
    const timestamp = this.clock.nowISO();
    return [
      `<etsi:SignedProperties ${XMLNS_ATTRIBUTE} Id="Signature${signatureNumber}-SignedProperties${signedPropertiesNumber}">`,
      "<etsi:SignedSignatureProperties>",
      "<etsi:SigningTime>",
      timestamp,
      "</etsi:SigningTime>",
      "<etsi:SigningCertificate>",
      "<etsi:Cert>",
      "<etsi:CertDigest>",
      `<ds:DigestMethod Algorithm="${"http://www.w3.org/2000/09/xmldsig#sha1" /* SHA1 */}">`,
      "</ds:DigestMethod>",
      "<ds:DigestValue>",
      certificateX509_der_hash,
      "</ds:DigestValue>",
      "</etsi:CertDigest>",
      "<etsi:IssuerSerial>",
      "<ds:X509IssuerName>",
      issuerName,
      "</ds:X509IssuerName>",
      "<ds:X509SerialNumber>",
      X509SerialNumber,
      "</ds:X509SerialNumber>",
      "</etsi:IssuerSerial>",
      "</etsi:Cert>",
      "</etsi:SigningCertificate>",
      "</etsi:SignedSignatureProperties>",
      "<etsi:SignedDataObjectProperties>",
      `<etsi:DataObjectFormat ObjectReference="#Reference-ID-${referenceIdNumber}">`,
      "<etsi:Description>contenido comprobante</etsi:Description>",
      "<etsi:MimeType>text/xml</etsi:MimeType>",
      "</etsi:DataObjectFormat>",
      "</etsi:SignedDataObjectProperties>",
      "</etsi:SignedProperties>"
    ].join("");
  }
};

// src/sign-xml/domain/assemblers/xades-document.assembler.ts
var XadesDocumentAssembler = class {
  build(params) {
    const { KeyInfo, SignedInfo, SignedProperties, ids, signature } = params;
    return [
      `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#" Id="Signature${ids.signatureNumber}">`,
      "\n" + SignedInfo,
      `
<ds:SignatureValue Id="SignatureValue${ids.signatureValueNumber}">
`,
      signature,
      "\n</ds:SignatureValue>",
      "\n" + KeyInfo,
      `
<ds:Object Id="Signature${ids.signatureNumber}-Object${ids.ObjectNumber}">`,
      `<etsi:QualifyingProperties Target="#Signature${ids.signatureNumber}">`,
      SignedProperties,
      "</etsi:QualifyingProperties>",
      "</ds:Object>",
      "</ds:Signature>"
    ].join("");
  }
};

// src/utils/date-utils.ts
function formatDDMMYYYY(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}${m}${y}`;
}
function formatDDMM(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}${m}`;
}

// src/utils/utf8.util.ts
function utf8Encode(str) {
  if (str == null) throw new TypeError("Invalid input");
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return String.fromCharCode(...bytes);
}

// src/utils/xml.util.ts
function uint8ArrayToBase64(bytes) {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// src/sign-xml/domain/xades-signature.service.ts
var XadesSignatureService = class {
  constructor(clock, canonicalizer, hasher, idGenerator, signer) {
    this.clock = clock;
    this.canonicalizer = canonicalizer;
    this.hasher = hasher;
    this.idGenerator = idGenerator;
    this.signer = signer;
  }
  async sign(data) {
    const ids = this.idGenerator.generateAll();
    const { certData, xmlToSign } = data;
    const { issuerName } = certData;
    const canonicalizedXml = await this.canonicalizer.canonicalize(xmlToSign);
    const digestXml = this.hasher.sha1Base64(utf8Encode(canonicalizedXml));
    const certDigest = certData.base64Der;
    const serialNumber = certData.serialNumber;
    const certificateX509 = certData.certificateX509;
    const modulus = certData.publicKey.modulus;
    const exponent = certData.publicKey.exponent;
    const signedPropsBuilder = new SignedPropertiesBuilder(this.clock);
    const SignedProperties = signedPropsBuilder.build({
      signatureNumber: ids.signatureNumber,
      signedPropertiesNumber: ids.signedPropertiesNumber,
      certificateX509_der_hash: certDigest,
      issuerName,
      X509SerialNumber: serialNumber,
      referenceIdNumber: ids.referenceIdNumber
    });
    const sha1_SignedProperties = this.hasher.sha1Base64(
      utf8Encode(SignedProperties)
    );
    const KeyInfo = new KeyInfoBuilder().build({
      certificateNumber: ids.certificateNumber.toString(),
      certificateX509,
      modulus,
      exponent
    });
    const sha1_certificado = this.hasher.sha1Base64(KeyInfo);
    const SignedInfo = new SignedInfoBuilder().build({
      ids,
      sha1_SignedProperties,
      sha1_certificado,
      sha1_comprobante: digestXml
    });
    const signatureValue = this.signer.signSha1RsaBase64(SignedInfo);
    const xadesBes = new XadesDocumentAssembler().build({
      ids,
      SignedInfo,
      signature: signatureValue,
      KeyInfo,
      SignedProperties
    });
    return { xadesBes };
  }
};

// src/sign-xml/infrastructure/canonicalizer/exclusive-canonicalization-ts/Algorithm.ts
var Algorithm = class {
  constructor(options) {
    this.options = options;
  }
  name() {
    return null;
  }
  /**
   * Canonicaliza un nodo XML.
   * @param node Nodo XML a procesar.
   * @returns Una promesa que se resuelve con el resultado canonicalizado.
   */
  async canonicalise(node) {
    throw new Error("not implemented");
  }
};

// src/sign-xml/infrastructure/canonicalizer/exclusive-canonicalization-ts/escape.ts
var entities = {
  "&": "&amp;",
  '"': "&quot;",
  "<": "&lt;",
  ">": "&gt;",
  "	": "&#x9;",
  "\n": "&#xA;",
  "\r": "&#xD;"
};
function escapeAttributeEntities(input) {
  return input.replace(/([&<"\t\n\r])/g, (char) => entities[char]);
}
function escapeTextEntities(input) {
  return input.replace(/([&<>\r])/g, (char) => entities[char]);
}

// src/sign-xml/infrastructure/canonicalizer/exclusive-canonicalization-ts/ExclusiveCanonicalization.ts
var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var PROCESSING_INSTRUCTION_NODE = 7;
var COMMENT_NODE = 8;
var ExclusiveCanonicalisation = class extends Algorithm {
  constructor(options = {}) {
    super(options);
    this.includeComments = !!options.includeComments;
    this.inclusiveNamespaces = options.inclusiveNamespaces || [];
  }
  name() {
    return "http://www.w3.org/2001/10/xml-exc-c14n#" + (this.includeComments ? "WithComments" : "");
  }
  getIncludeComments() {
    return this.includeComments;
  }
  setIncludeComments(include) {
    this.includeComments = !!include;
  }
  getInclusiveNamespaces() {
    return [...this.inclusiveNamespaces];
  }
  setInclusiveNamespaces(namespaces) {
    this.inclusiveNamespaces = [...namespaces];
    return this;
  }
  addInclusiveNamespace(ns) {
    this.inclusiveNamespaces.push(ns);
    return this;
  }
  async canonicalise(node) {
    return this._processInner(node);
  }
  _compareAttributes(a, b) {
    if (!a.prefix && b.prefix) return -1;
    if (!b.prefix && a.prefix) return 1;
    return a.name.localeCompare(b.name);
  }
  _compareNamespaces(a, b) {
    const attr1 = a.prefix + a.namespaceURI;
    const attr2 = b.prefix + b.namespaceURI;
    return attr1.localeCompare(attr2);
  }
  _renderAttributes(node) {
    return Array.from(node.attributes || []).filter((attr) => !attr.name.startsWith("xmlns")).sort(this._compareAttributes).map((attr) => ` ${attr.name}="${escapeAttributeEntities(attr.value)}"`).join("");
  }
  _renderNamespace(node, prefixesInScope, defaultNamespace) {
    let res = "";
    let newDefaultNamespace = defaultNamespace;
    const newPrefixesInScope = [...prefixesInScope];
    const nsListToRender = [];
    const currentNamespace = node.namespaceURI || "";
    if (node.prefix) {
      const existing = newPrefixesInScope.find((e) => e.prefix === node.prefix);
      if (!existing || existing.namespaceURI !== node.namespaceURI) {
        newPrefixesInScope.filter((e) => e.prefix !== node.prefix);
        nsListToRender.push({
          prefix: node.prefix,
          namespaceURI: node.namespaceURI
        });
        newPrefixesInScope.push({
          prefix: node.prefix,
          namespaceURI: node.namespaceURI
        });
      }
    } else if (defaultNamespace !== currentNamespace) {
      newDefaultNamespace = currentNamespace;
      res += ` xmlns="${escapeAttributeEntities(newDefaultNamespace)}"`;
    }
    for (const attr of Array.from(node.attributes || [])) {
      if (attr.prefix && attr.prefix !== "xmlns") {
        const existing = newPrefixesInScope.find(
          (e) => e.prefix === attr.prefix
        );
        if (!existing || existing.namespaceURI !== attr.namespaceURI) {
          newPrefixesInScope.filter((e) => e.prefix !== attr.prefix);
          nsListToRender.push({
            prefix: attr.prefix,
            namespaceURI: attr.namespaceURI
          });
          newPrefixesInScope.push({
            prefix: attr.prefix,
            namespaceURI: attr.namespaceURI
          });
        }
      } else if (attr.prefix === "xmlns" && this.inclusiveNamespaces.includes(attr.localName)) {
        nsListToRender.push({
          prefix: attr.localName,
          namespaceURI: attr.nodeValue
        });
      }
    }
    nsListToRender.sort(this._compareNamespaces);
    for (const ns of nsListToRender) {
      res += ` xmlns:${ns.prefix}="${escapeAttributeEntities(ns.namespaceURI)}"`;
    }
    return { rendered: res, newPrefixesInScope, newDefaultNamespace };
  }
  _renderComment(node) {
    return `<!--${escapeTextEntities(node.data)}-->`;
  }
  _renderProcessingInstruction(node) {
    return `<?${node.target}${node.data ? " " + escapeTextEntities(node.data) : ""}?>`;
  }
  _processInner(node, prefixesInScope = [], defaultNamespace = "") {
    switch (node.nodeType) {
      case TEXT_NODE:
        return escapeTextEntities(node.data);
      case COMMENT_NODE:
        return this.includeComments ? this._renderComment(node) : "";
      case PROCESSING_INSTRUCTION_NODE:
        return this._renderProcessingInstruction(node);
      case ELEMENT_NODE: {
        const el = node;
        const ns = this._renderNamespace(el, prefixesInScope, defaultNamespace);
        const attrs = this._renderAttributes(el);
        const children = Array.from(el.childNodes).map(
          (child) => this._processInner(
            child,
            ns.newPrefixesInScope,
            ns.newDefaultNamespace
          )
        ).join("");
        return `<${el.tagName}${ns.rendered}${attrs}>${children}</${el.tagName}>`;
      }
      default:
        return "";
    }
  }
};

// src/sign-xml/infrastructure/canonicalizer/canonicalizer.implement.ts
var CanonicalizerImplement = class {
  constructor(context) {
    this.context = context;
  }
  async canonicalize() {
    const targetNode = this.context.getRootNode();
    const canonicalizer = new ExclusiveCanonicalisation({
      includeComments: false,
      inclusiveNamespaces: []
    });
    return await canonicalizer.canonicalise(targetNode);
  }
};

// src/sign-xml/infrastructure/clock/clock.implement.ts
var ClockImplement = class {
  nowISO() {
    const utcMs = Date.now();
    const ecuadorMs = utcMs - 5 * 60 * 60 * 1e3;
    const d = new Date(ecuadorMs);
    const y = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const h = String(d.getUTCHours()).padStart(2, "0");
    const mi = String(d.getUTCMinutes()).padStart(2, "0");
    const s = String(d.getUTCSeconds()).padStart(2, "0");
    return `${y}-${mo}-${day}T${h}:${mi}:${s}-05:00`;
  }
};

// src/sign-xml/infrastructure/forge-rsa-sha1-signer.implementation.ts

var ForgeRsaSha1Signer = class {
  constructor(privateKey) {
    this.privateKey = privateKey;
  }
  signSha1RsaBase64(input) {
    var _a, _b;
    const md3 = forge.md.sha1.create();
    md3.update(input, "utf8");
    const rawSignature = this.privateKey.sign(md3);
    const base64Signature = forge.util.encode64(rawSignature);
    return (_b = (_a = base64Signature.match(/.{1,76}/g)) == null ? void 0 : _a.join("\n")) != null ? _b : base64Signature;
  }
};

// src/sign-xml/infrastructure/hash/hash-provider.implement.ts

var HashProviderImplement = class {
  sha1Base64(input) {
    const md3 = forge.md.sha1.create();
    md3.update(input);
    const digestHex = md3.digest().toHex();
    const digestBytes = forge.util.hexToBytes(digestHex);
    return forge.util.encode64(digestBytes);
  }
  sha1RawBase64(input) {
    throw new Error("Method not implemented.");
  }
};

// src/sign-xml/infrastructure/signature-generation/signature-id-generator.implement.ts
var SignatureIdGeneratorImplement = class {
  generateAll() {
    return {
      certificateNumber: this.p_obtener_aleatorio(),
      signatureNumber: this.p_obtener_aleatorio(),
      signedPropertiesNumber: this.p_obtener_aleatorio(),
      signedInfoNumber: this.p_obtener_aleatorio(),
      signedPropertiesIdNumber: this.p_obtener_aleatorio(),
      referenceIdNumber: this.p_obtener_aleatorio(),
      signatureValueNumber: this.p_obtener_aleatorio(),
      ObjectNumber: this.p_obtener_aleatorio()
    };
  }
  p_obtener_aleatorio() {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return (1e5 + arr[0] % 99e5).toString();
  }
};

// src/sign-xml/infrastructure/XmlSignatureInjector.ts
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
var XmlSignatureInjector = class {
  constructor(context) {
    this.context = context;
  }
  insertSignature(signatureXml) {
    const parser = new DOMParser();
    const serializer = new XMLSerializer();
    const doc = this.context.getDocument();
    const signatureNode = parser.parseFromString(
      signatureXml,
      "application/xml"
    ).documentElement;
    const imported = doc.importNode(signatureNode, true);
    doc.documentElement.appendChild(imported);
    return serializer.serializeToString(doc);
  }
};

// src/sign-xml/infrastructure/composition/buildSignXmlUseCase.ts
function buildSignXmlUseCase(signerOrPrivateKey, context) {
  const clock = new ClockImplement();
  const canonicalizer = new CanonicalizerImplement(context);
  const hasher = new HashProviderImplement();
  const idGenerator = new SignatureIdGeneratorImplement();
  const signer = isSigner(signerOrPrivateKey) ? signerOrPrivateKey : new ForgeRsaSha1Signer(signerOrPrivateKey);
  const injector = new XmlSignatureInjector(context);
  const xadesService = new XadesSignatureService(
    clock,
    canonicalizer,
    hasher,
    idGenerator,
    signer
  );
  return new SignXmlUseCase(xadesService, injector);
}
function isSigner(value) {
  return typeof (value == null ? void 0 : value.signSha1RsaBase64) === "function";
}

// src/sign-xml/infrastructure/handlers/error.handle.ts
var ErrorHandler = class {
  static handle(error) {
    if (error instanceof UanatacaCertificateNotFoundError) {
      return {
        code: "UANATACA_CERT_NOT_FOUND",
        message: error.message,
        original: error
      };
    }
    if (error instanceof SigningKeyNotFoundError) {
      return {
        code: "SIGNING_KEY_NOT_FOUND",
        message: error.message,
        original: error
      };
    }
    if (error instanceof PrivateKeyExtractionError) {
      return {
        code: "PRIVATE_KEY_EXTRACTION_ERROR",
        message: error.message,
        original: error
      };
    }
    if (error instanceof UnknownSignStrategyError) {
      return {
        code: "UNKNOWN_SIGN_STRATEGY",
        message: error.message,
        original: error
      };
    }
    if (error instanceof SignStrategyError) {
      return {
        code: "SIGN_STRATEGY_ERROR",
        message: error.message,
        original: error
      };
    }
    if (error instanceof InvalidXmlStructureError) {
      return {
        code: "XML_STRUCTURE_ERROR",
        message: error.message,
        original: error
      };
    }
    if (error instanceof InvalidP12PasswordError) {
      return {
        code: "P12_PASSWORD_ERROR",
        message: error.message,
        original: error
      };
    }
    if (error instanceof InvalidP12StructureError) {
      return {
        code: "P12_STRUCTURE_ERROR",
        message: error.message,
        original: error
      };
    }
    if (error instanceof InfrastructureError) {
      return {
        code: "INFRASTRUCTURE_ERROR",
        message: error.message,
        original: error
      };
    }
    if (error instanceof Error) {
      return {
        code: "UNHANDLED_ERROR",
        message: error.message,
        original: error
      };
    }
    return {
      code: "UNKNOWN_ERROR",
      message: "Ha ocurrido un error desconocido",
      original: new Error(String(error))
    };
  }
};

// src/utils/node-crypto-loader.ts
var instance;
async function getNodeCrypto() {
  var _a;
  if (instance !== void 0) return instance;
  instance = null;
  try {
    if (typeof __require !== "undefined") {
      const mod = __require("crypto");
      if (typeof (mod == null ? void 0 : mod.createSign) === "function") {
        instance = mod;
        return instance;
      }
    }
  } catch {
  }
  try {
    const mod = await import("crypto");
    const candidate = (_a = mod == null ? void 0 : mod.default) != null ? _a : mod;
    if (typeof (candidate == null ? void 0 : candidate.createSign) === "function") instance = candidate;
  } catch {
  }
  return instance;
}

// src/sign-xml/infrastructure/node-rsa-sha1-signer.implementation.ts
var NodeRsaSha1Signer = class {
  constructor(privateKeyPem, crypto2) {
    this.privateKeyPem = privateKeyPem;
    this.crypto = crypto2;
  }
  signSha1RsaBase64(input) {
    var _a, _b;
    const signer = this.crypto.createSign("RSA-SHA1");
    signer.update(input, "utf8");
    const base64Signature = signer.sign(this.privateKeyPem, "base64");
    return (_b = (_a = base64Signature.match(/.{1,76}/g)) == null ? void 0 : _a.join("\n")) != null ? _b : base64Signature;
  }
};

// src/sign-xml/infrastructure/signer.factory.ts
async function createRsaSha1Signer(certData, privateKeyPem) {
  if (privateKeyPem && !forgeForzado()) {
    const nodeCrypto = await getNodeCrypto();
    if (nodeCrypto) return new NodeRsaSha1Signer(privateKeyPem, nodeCrypto);
  }
  return new ForgeRsaSha1Signer(certData.privateKey);
}
function forgeForzado() {
  var _a;
  return typeof process !== "undefined" && ((_a = process.env) == null ? void 0 : _a.OSODREAMER_SIGNER_RSA) === "forge";
}

// src/sign-xml/infrastructure/validations/p12.validation.ts
async function assertIsValidP12OrThrow(buffer, password) {
  const forge3 = await getForge();
  const binaryStr = Array.from(buffer).map((b) => String.fromCharCode(b)).join("");
  let asn1;
  try {
    asn1 = forge3.asn1.fromDer(forge3.util.createBuffer(binaryStr, "binary"));
  } catch {
    throw new InvalidP12StructureError();
  }
  try {
    forge3.pkcs12.pkcs12FromAsn1(asn1, password);
  } catch {
    throw new InvalidP12PasswordError();
  }
}

// src/sign-xml/infrastructure/xml-dom-context/xml-dom.context.ts
import { DOMParser as DOMParser2 } from "@xmldom/xmldom";
var XmlDomContext = class {
  constructor(xmlString) {
    try {
      const dom = new DOMParser2({
        errorHandler: () => {
        }
      }).parseFromString(xmlString, "text/xml");
      this.dom = dom;
    } catch (err) {
      throw new InvalidXmlStructureError();
    }
  }
  getDocument() {
    return this.dom;
  }
  getRootNode() {
    return this.dom.documentElement;
  }
};

// src/sign-xml/sign-xml.ts
async function signXml(cmd) {
  try {
    const { certData, privateKeyPem } = await loadCertificate(
      cmd.p12Buffer,
      cmd.password
    );
    const xmlToSign = new TextDecoder("utf-8").decode(cmd.xmlBuffer);
    const context = new XmlDomContext(xmlToSign);
    const signer = await createRsaSha1Signer(certData, privateKeyPem);
    const signXmlUseCase = buildSignXmlUseCase(signer, context);
    const finalXml = await signXmlUseCase.execute({
      xmlToSign,
      certData
    });
    return finalXml;
  } catch (error) {
    const handled = ErrorHandler.handle(error);
    throw Object.assign(handled.original, { code: handled.code });
  }
}
async function loadCertificate(p12Buffer, password) {
  const key = await certificateCacheKey(p12Buffer, password);
  const cached = getCachedCertificate(key);
  if (cached) return cached;
  await assertIsValidP12OrThrow(p12Buffer, password);
  const certProvider = new CertificateProviderImplement(
    p12Buffer,
    password,
    new SignStrategyFactory(),
    new CryptoUtils()
  );
  const certData = await certProvider.getCertificateData();
  const entry = {
    certData,
    privateKeyPem: await privateKeyToPem(certData)
  };
  setCachedCertificate(key, entry);
  return entry;
}
async function privateKeyToPem(certData) {
  try {
    const forge3 = await getForge();
    return forge3.pki.privateKeyToPem(certData.privateKey);
  } catch {
    return void 0;
  }
}

// src/generator/const/document-types.const.ts
var documentTypeCodes = {
  factura: 1,
  comprobanteRetencion: 7,
  guiaRemision: 6,
  notaCredito: 4,
  notaDebito: 5,
  liquidacionCompra: 3
};
var documentTypeName = {
  1: "factura",
  7: "comprobanteRetencion",
  6: "guiaRemision",
  4: "notaCredito",
  5: "notaDebito",
  3: "liquidacionCompra"
};

// src/generator/const/info-adicional.const.ts
var RUC_PROVEEDOR_CAMPO_NOMBRE = "RUC Proveedor";

// src/generator/enums/iva-percent-code.enum.ts
var IVA_PERCENTAGE_CODE_ENUM = /* @__PURE__ */ ((IVA_PERCENTAGE_CODE_ENUM2) => {
  IVA_PERCENTAGE_CODE_ENUM2["IVA_0"] = "0";
  IVA_PERCENTAGE_CODE_ENUM2["IVA_12"] = "2";
  IVA_PERCENTAGE_CODE_ENUM2["IVA_14"] = "3";
  IVA_PERCENTAGE_CODE_ENUM2["IVA_15"] = "4";
  IVA_PERCENTAGE_CODE_ENUM2["IVA_5"] = "5";
  IVA_PERCENTAGE_CODE_ENUM2["NO_OBJETO_IVA"] = "6";
  IVA_PERCENTAGE_CODE_ENUM2["EXENTO_IVA"] = "7";
  IVA_PERCENTAGE_CODE_ENUM2["IVA_DIFERENCIADO"] = "8";
  IVA_PERCENTAGE_CODE_ENUM2["IVA_13"] = "10";
  return IVA_PERCENTAGE_CODE_ENUM2;
})(IVA_PERCENTAGE_CODE_ENUM || {});

// src/generator/const/iva-percent-label-const.ts
var IVA_PERCENTAGE_LABELS = {
  ["0" /* IVA_0 */]: "0 (0%)",
  ["2" /* IVA_12 */]: "2 (12%)",
  ["3" /* IVA_14 */]: "3 (14%)",
  ["4" /* IVA_15 */]: "4 (15%)",
  ["5" /* IVA_5 */]: "5 (5%)",
  ["6" /* NO_OBJETO_IVA */]: "6 (No objeto de IVA)",
  ["7" /* EXENTO_IVA */]: "7 (Exento de IVA)",
  ["8" /* IVA_DIFERENCIADO */]: "8 (IVA diferenciado)",
  ["10" /* IVA_13 */]: "10 (13%)"
};

// src/generator/enums/codigo-pais.enum.ts
var CodigoPais = /* @__PURE__ */ ((CodigoPais2) => {
  CodigoPais2["AMERICAN_SAMOA"] = "016";
  CodigoPais2["BOUVET_ISLAND"] = "074";
  CodigoPais2["ARGENTINA"] = "101";
  CodigoPais2["BOLIVIA"] = "102";
  CodigoPais2["BRASIL"] = "103";
  CodigoPais2["CANAD"] = "104";
  CodigoPais2["COLOMBIA"] = "105";
  CodigoPais2["COSTA_RICA"] = "106";
  CodigoPais2["CUBA"] = "107";
  CodigoPais2["CHILE"] = "108";
  CodigoPais2["ANGUILA"] = "109";
  CodigoPais2["ESTADOS_UNIDOS"] = "110";
  CodigoPais2["GUATEMALA"] = "111";
  CodigoPais2["HAIT"] = "112";
  CodigoPais2["HONDURAS"] = "113";
  CodigoPais2["JAMAICA"] = "114";
  CodigoPais2["MALVINAS_ISLAS"] = "115";
  CodigoPais2["MXICO"] = "116";
  CodigoPais2["NICARAGUA"] = "117";
  CodigoPais2["PANAM"] = "118";
  CodigoPais2["PARAGUAY"] = "119";
  CodigoPais2["PER"] = "120";
  CodigoPais2["PUERTO_RICO"] = "121";
  CodigoPais2["REPBLICA_DOMINICANA"] = "122";
  CodigoPais2["EL_SALVADOR"] = "123";
  CodigoPais2["TRINIDAD_Y_TOBAGO"] = "124";
  CodigoPais2["URUGUAY"] = "125";
  CodigoPais2["VENEZUELA"] = "126";
  CodigoPais2["CURAZAO"] = "127";
  CodigoPais2["BAHAMAS"] = "129";
  CodigoPais2["BARBADOS"] = "130";
  CodigoPais2["GRANADA"] = "131";
  CodigoPais2["GUYANA"] = "132";
  CodigoPais2["SURINAM"] = "133";
  CodigoPais2["ANTIGUA_Y_BARBUDA"] = "134";
  CodigoPais2["BELICE"] = "135";
  CodigoPais2["DOMINICA"] = "136";
  CodigoPais2["SAN_CRISTOBAL_Y_NEVIS"] = "137";
  CodigoPais2["SANTA_LUCA"] = "138";
  CodigoPais2["SAN_VICENTE_Y_LAS_GRANAD"] = "139";
  CodigoPais2["ANTILLAS_HOLANDESAS"] = "140";
  CodigoPais2["ARUBA"] = "141";
  CodigoPais2["BERMUDA"] = "142";
  CodigoPais2["GUADALUPE"] = "143";
  CodigoPais2["GUYANA_FRANCESA"] = "144";
  CodigoPais2["ISLAS_CAIMN"] = "145";
  CodigoPais2["ISLAS_VIRGENES_BRITANICAS"] = "146";
  CodigoPais2["JOHNSTON_ISLA"] = "147";
  CodigoPais2["MARTINICA"] = "148";
  CodigoPais2["MONTSERRAT_ISLA"] = "149";
  CodigoPais2["TURCAS_Y_CAICOS_ISLAS"] = "151";
  CodigoPais2["VIRGENES_ISLAS_NORTAMER"] = "152";
  CodigoPais2["ALBANIA"] = "201";
  CodigoPais2["ALEMANIA"] = "202";
  CodigoPais2["AUSTRIA"] = "203";
  CodigoPais2["BLGICA"] = "204";
  CodigoPais2["BULGARIA"] = "205";
  CodigoPais2["ALBORAN_Y_PEREJIL"] = "207";
  CodigoPais2["DINAMARCA"] = "208";
  CodigoPais2["ESPAA"] = "209";
  CodigoPais2["FRANCIA"] = "211";
  CodigoPais2["FINLANDIA"] = "212";
  CodigoPais2["REINO_UNIDO"] = "213";
  CodigoPais2["GRECIA"] = "214";
  CodigoPais2["PAISES_BAJOS_HOLANDA"] = "215";
  CodigoPais2["HUNGRA"] = "216";
  CodigoPais2["IRLANDA"] = "217";
  CodigoPais2["ISLANDIA"] = "218";
  CodigoPais2["ITALIA"] = "219";
  CodigoPais2["LUXEMBURGO"] = "220";
  CodigoPais2["MALTA"] = "221";
  CodigoPais2["NORUEGA"] = "222";
  CodigoPais2["POLONIA"] = "223";
  CodigoPais2["PORTUGAL"] = "224";
  CodigoPais2["RUMANIA"] = "225";
  CodigoPais2["SUECIA"] = "226";
  CodigoPais2["SUIZA"] = "227";
  CodigoPais2["CANARIAS_ISLAS"] = "228";
  CodigoPais2["UCRANIA"] = "229";
  CodigoPais2["RUSIA"] = "230";
  CodigoPais2["YUGOSLAVIA"] = "231";
  CodigoPais2["ANDORRA"] = "233";
  CodigoPais2["LIECHTENSTEIN"] = "234";
  CodigoPais2["MNACO"] = "235";
  CodigoPais2["SAN_MARINO"] = "237";
  CodigoPais2["VATICANO_SANTA_SEDE"] = "238";
  CodigoPais2["GIBRALTAR"] = "239";
  CodigoPais2["BELARUS"] = "241";
  CodigoPais2["BOSNIA_Y_HERZEGOVINA"] = "242";
  CodigoPais2["CROACIA"] = "243";
  CodigoPais2["ESLOVENIA"] = "244";
  CodigoPais2["ESTONIA"] = "245";
  CodigoPais2["GEORGIA"] = "246";
  CodigoPais2["GROENLANDIA"] = "247";
  CodigoPais2["LETONIA"] = "248";
  CodigoPais2["LITUANIA"] = "249";
  CodigoPais2["MOLDOVA"] = "250";
  CodigoPais2["MACEDONIA"] = "251";
  CodigoPais2["ESLOVAQUIA"] = "252";
  CodigoPais2["ISLAS_FAROE"] = "253";
  CodigoPais2["FRENCH_SOUTHERN_TERRITORIES"] = "260";
  CodigoPais2["AFGANISTAN"] = "301";
  CodigoPais2["ARABIA_SAUDITA"] = "302";
  CodigoPais2["MYANMAR_BURMA"] = "303";
  CodigoPais2["CAMBOYA"] = "304";
  CodigoPais2["COREA_NORTE"] = "306";
  CodigoPais2["TAIWAN_CHINA"] = "307";
  CodigoPais2["FILIPINAS"] = "308";
  CodigoPais2["INDIA"] = "309";
  CodigoPais2["INDONESIA"] = "310";
  CodigoPais2["IRAK"] = "311";
  CodigoPais2["IRN_REPBLICA_ISLMICA"] = "312";
  CodigoPais2["ISRAEL"] = "313";
  CodigoPais2["JAPN"] = "314";
  CodigoPais2["JORDANIA"] = "315";
  CodigoPais2["KUWAIT"] = "316";
  CodigoPais2["LAOS_REP_POP_DEMOC"] = "317";
  CodigoPais2["LIBANO"] = "318";
  CodigoPais2["MALASIA"] = "319";
  CodigoPais2["MONGOLIA_MANCHURIA"] = "321";
  CodigoPais2["PAKISTN"] = "322";
  CodigoPais2["SIRIA"] = "323";
  CodigoPais2["TAILANDIA"] = "325";
  CodigoPais2["BAHREIN"] = "327";
  CodigoPais2["BANGLADESH"] = "328";
  CodigoPais2["BUTN"] = "329";
  CodigoPais2["COREA_DEL_SUR"] = "330";
  CodigoPais2["CHINA_POPULAR"] = "331";
  CodigoPais2["CHIPRE"] = "332";
  CodigoPais2["EMIRATOS_ARABES_UNIDOS"] = "333";
  return CodigoPais2;
})(CodigoPais || {});

// src/generator/enums/codigo-retencion.enum.ts
var CODIGO_RETENCION_ENUM = /* @__PURE__ */ ((CODIGO_RETENCION_ENUM2) => {
  CODIGO_RETENCION_ENUM2[CODIGO_RETENCION_ENUM2["IVA_CIENTO_POR_CIENTO_RESOLUCION"] = 3] = "IVA_CIENTO_POR_CIENTO_RESOLUCION";
  CODIGO_RETENCION_ENUM2[CODIGO_RETENCION_ENUM2["IVA_DOCE_POR_CIENTO_PRESUNTIVO_EDITORES"] = 4] = "IVA_DOCE_POR_CIENTO_PRESUNTIVO_EDITORES";
  CODIGO_RETENCION_ENUM2[CODIGO_RETENCION_ENUM2["IVA_CIENTO_POR_CIENTO_DISTRIBUIDORES"] = 5] = "IVA_CIENTO_POR_CIENTO_DISTRIBUIDORES";
  CODIGO_RETENCION_ENUM2[CODIGO_RETENCION_ENUM2["IVA_CIENTO_POR_CIENTO_VOCEADORES"] = 6] = "IVA_CIENTO_POR_CIENTO_VOCEADORES";
  CODIGO_RETENCION_ENUM2[CODIGO_RETENCION_ENUM2["RENTA_DOS_POR_MIL"] = 327] = "RENTA_DOS_POR_MIL";
  CODIGO_RETENCION_ENUM2[CODIGO_RETENCION_ENUM2["RENTA_TRES_POR_MIL"] = 328] = "RENTA_TRES_POR_MIL";
  return CODIGO_RETENCION_ENUM2;
})(CODIGO_RETENCION_ENUM || {});

// src/generator/enums/contribuyente-rimpe.enum.ts
var CONTRIBUYENTE_RIMPE_ENUM = /* @__PURE__ */ ((CONTRIBUYENTE_RIMPE_ENUM2) => {
  CONTRIBUYENTE_RIMPE_ENUM2["RIMPE_GENERAL"] = "CONTRIBUYENTE R\xC9GIMEN RIMPE";
  CONTRIBUYENTE_RIMPE_ENUM2["RIMPE_POPULAR"] = "CONTRIBUYENTE NEGOCIO POPULAR - R\xC9GIMEN RIMPE";
  return CONTRIBUYENTE_RIMPE_ENUM2;
})(CONTRIBUYENTE_RIMPE_ENUM || {});

// src/generator/enums/env.enum.ts
var ENV_ENUM = /* @__PURE__ */ ((ENV_ENUM2) => {
  ENV_ENUM2[ENV_ENUM2["TEST"] = 1] = "TEST";
  ENV_ENUM2[ENV_ENUM2["PROD"] = 2] = "PROD";
  return ENV_ENUM2;
})(ENV_ENUM || {});

// src/generator/enums/identification-code.enum.ts
var IDENTIFICATION_CODE_ENUM = /* @__PURE__ */ ((IDENTIFICATION_CODE_ENUM2) => {
  IDENTIFICATION_CODE_ENUM2["RUC"] = "04";
  IDENTIFICATION_CODE_ENUM2["CEDULA"] = "05";
  IDENTIFICATION_CODE_ENUM2["PASAPORTE"] = "06";
  IDENTIFICATION_CODE_ENUM2["CONSUMIDOR_FINAL"] = "07";
  IDENTIFICATION_CODE_ENUM2["EXTERIOR"] = "08";
  return IDENTIFICATION_CODE_ENUM2;
})(IDENTIFICATION_CODE_ENUM || {});

// src/generator/enums/impuesto-retener.enum.ts
var IMPUESTO_A_RETENER_ENUM = /* @__PURE__ */ ((IMPUESTO_A_RETENER_ENUM2) => {
  IMPUESTO_A_RETENER_ENUM2[IMPUESTO_A_RETENER_ENUM2["IVA_PRESUNTIVO_Y_RENTA"] = 4] = "IVA_PRESUNTIVO_Y_RENTA";
  return IMPUESTO_A_RETENER_ENUM2;
})(IMPUESTO_A_RETENER_ENUM || {});

// src/generator/enums/obligado-contabilidad.enum.ts
var OBLIGADO_CONTABILIDAD_ENUM = /* @__PURE__ */ ((OBLIGADO_CONTABILIDAD_ENUM2) => {
  OBLIGADO_CONTABILIDAD_ENUM2["SI"] = "SI";
  OBLIGADO_CONTABILIDAD_ENUM2["NO"] = "NO";
  return OBLIGADO_CONTABILIDAD_ENUM2;
})(OBLIGADO_CONTABILIDAD_ENUM || {});

// src/generator/enums/payment-method-code.enu,.ts
var PAYMENT_METHOD_CODE_ENUM = /* @__PURE__ */ ((PAYMENT_METHOD_CODE_ENUM2) => {
  PAYMENT_METHOD_CODE_ENUM2["SIN_UTILIZACION_DEL_SISTEMA_FINANCIERO"] = "01";
  PAYMENT_METHOD_CODE_ENUM2["COMPENSACION_DE_DEUDAS"] = "15";
  PAYMENT_METHOD_CODE_ENUM2["TARJETA_DE_DEBITO"] = "16";
  PAYMENT_METHOD_CODE_ENUM2["DINERO_ELECTRONICO"] = "17";
  PAYMENT_METHOD_CODE_ENUM2["TARJETA_PREPAGO"] = "18";
  PAYMENT_METHOD_CODE_ENUM2["TARJETA_DE_CREDITO"] = "19";
  PAYMENT_METHOD_CODE_ENUM2["OTROS_CON_SISTEMA_FINANCIERO"] = "20";
  PAYMENT_METHOD_CODE_ENUM2["ENDOSO_DE_TITULOS"] = "21";
  return PAYMENT_METHOD_CODE_ENUM2;
})(PAYMENT_METHOD_CODE_ENUM || {});

// src/generator/enums/tax-code.enum.ts
var TAX_CODE_ENUM = /* @__PURE__ */ ((TAX_CODE_ENUM2) => {
  TAX_CODE_ENUM2[TAX_CODE_ENUM2["VAT"] = 2] = "VAT";
  TAX_CODE_ENUM2[TAX_CODE_ENUM2["ICE"] = 3] = "ICE";
  TAX_CODE_ENUM2[TAX_CODE_ENUM2["IRBPNR"] = 5] = "IRBPNR";
  return TAX_CODE_ENUM2;
})(TAX_CODE_ENUM || {});

// src/generator/invoice/utils/campo-adicional.util.ts
function esCampoRucProveedor(nombre) {
  return (nombre == null ? void 0 : nombre.trim().toLowerCase()) === RUC_PROVEEDOR_CAMPO_NOMBRE.toLowerCase();
}

// src/generator/invoice/utils/clave-acceso.util.ts
function p_obtener_codigo_autorizacion(fechaEmision = /* @__PURE__ */ new Date(), tipoComprobante = "factura", ruc = "9999999999999", ambiente = 1 /* TEST */, estab = 1, ptoEmi = 1, secuencial, codigo, tipoEmision = 1) {
  var _a;
  const formattedDate = formatDDMMYYYY(fechaEmision);
  const tipoDoc = (_a = documentTypeCodes[tipoComprobante]) != null ? _a : "01";
  if (!secuencial) throw new Error("El secuencial es obligatorio");
  codigo = codigo != null ? codigo : formatDDMM(fechaEmision) + pad(secuencial, 4).slice(-3) + p_calcular_digito_modulo11(
    formatDDMM(fechaEmision) + pad(secuencial, 3).slice(-3)
  );
  const codigo_autorizacion = formattedDate + pad(tipoDoc, 2) + pad(ruc, 13) + pad(ambiente, 1) + pad(estab, 3) + pad(ptoEmi, 3) + pad(secuencial, 9) + pad(codigo, 8) + pad(tipoEmision, 1);
  const digito_calculado = p_calcular_digito_modulo11(codigo_autorizacion);
  return digito_calculado > -1 ? codigo_autorizacion + digito_calculado : "";
}
function pad(n, width, z = "0") {
  return n.toString().padStart(width, z);
}
function p_calcular_digito_modulo11(numero) {
  if (!/^\d+$/.test(numero)) return -1;
  const digitos = numero.split("").map(Number);
  let suma = digitos.reduce(
    (total, valor, i) => total + valor * (7 - i % 6),
    0
  );
  let digito = 11 - suma % 11;
  return digito === 11 ? 0 : digito === 10 ? 1 : digito;
}

// src/generator/invoice/utils/remove-nulls.util.ts
function removeNullFields(objeto) {
  for (const clave in objeto) {
    if (objeto[clave] === null || objeto[clave] === void 0 || objeto[clave] === "" || typeof objeto[clave] === "object" && Object.keys(objeto[clave]).length === 0) {
      delete objeto[clave];
    } else if (typeof objeto[clave] === "object") {
      removeNullFields(objeto[clave]);
    }
  }
  return objeto;
}

// src/generator/invoice/factory/invoice-xml.factory.ts
var InvoiceXmlFactory = class {
  create(invoice) {
    var _a;
    const {
      detalles,
      infoFactura,
      infoTributaria,
      infoAdicional,
      retenciones,
      rucProveedor
    } = invoice;
    const {
      ambiente,
      dirMatriz,
      estab,
      ptoEmi,
      razonSocial,
      ruc,
      secuencial,
      agenteRetencion,
      contribuyenteRimpe,
      nombreComercial
    } = infoTributaria;
    const {
      dirEstablecimiento,
      identificacionComprador,
      importeTotal,
      pagos,
      propina,
      razonSocialComprador,
      tipoIdentificacionComprador,
      totalConImpuestos,
      totalDescuento,
      totalSinImpuestos,
      contribuyenteEspecial,
      direccionComprador,
      guiaRemision,
      moneda,
      obligadoContabilidad,
      fechaEmision,
      valorRetIva,
      valorRetRenta
    } = infoFactura;
    let fechaClave = new Date(fechaEmision);
    const fechaEmisionParseada = [
      ("0" + fechaClave.getDate()).slice(-2),
      ("0" + (fechaClave.getMonth() + 1)).slice(-2),
      fechaClave.getFullYear()
    ].join("/");
    const tipoEmision = "1";
    const codDoc = pad(documentTypeCodes.factura, 2);
    const clave = p_obtener_codigo_autorizacion(
      fechaClave,
      documentTypeName[1],
      infoTributaria.ruc,
      infoTributaria.ambiente,
      Number(estab),
      Number(ptoEmi),
      infoTributaria.secuencial,
      null,
      Number(tipoEmision)
    );
    let claveAcceso = clave;
    const jsonFactura = {
      factura: {
        $: { id: "comprobante", version: "1.1.0" },
        infoTributaria: {
          ambiente,
          tipoEmision,
          razonSocial,
          nombreComercial,
          ruc,
          claveAcceso,
          codDoc,
          estab,
          ptoEmi,
          secuencial,
          dirMatriz,
          agenteRetencion,
          contribuyenteRimpe
        },
        infoFactura: {
          fechaEmision: fechaEmisionParseada,
          dirEstablecimiento,
          contribuyenteEspecial,
          obligadoContabilidad,
          tipoIdentificacionComprador,
          guiaRemision,
          razonSocialComprador,
          identificacionComprador: tipoIdentificacionComprador === "07" /* CONSUMIDOR_FINAL */ ? "9999999999999" : identificacionComprador,
          direccionComprador,
          totalSinImpuestos: totalSinImpuestos.toFixed(2),
          totalDescuento: totalDescuento.toFixed(2),
          totalConImpuestos: {
            totalImpuesto: []
          },
          propina: propina.toFixed(2),
          importeTotal: importeTotal.toFixed(2),
          moneda: moneda || "DOLAR",
          pagos: {
            pago: []
          },
          valorRetIva: valorRetIva != null ? valorRetIva.toFixed(2) : null,
          valorRetRenta: valorRetRenta != null ? valorRetRenta.toFixed(2) : null
        },
        detalles: {
          detalle: []
        },
        retenciones: {
          retencion: []
        },
        infoAdicional: {
          campoAdicional: []
        }
      }
    };
    const retencion = retenciones == null ? void 0 : retenciones.retencion;
    if (retencion) {
      for (const campo of retencion) {
        jsonFactura.factura.retenciones.retencion.push({
          codigo: campo.codigo,
          codigoPorcentaje: campo.codigoPorcentaje,
          tarifa: campo.tarifa.toFixed(2),
          valor: campo.valor.toFixed(2)
        });
      }
    } else {
      jsonFactura.factura.retenciones = null;
    }
    const campoAdicional = infoAdicional == null ? void 0 : infoAdicional.campoAdicional;
    if (campoAdicional || rucProveedor) {
      for (const campo of campoAdicional != null ? campoAdicional : []) {
        if (rucProveedor && esCampoRucProveedor(campo.nombre)) {
          continue;
        }
        jsonFactura.factura.infoAdicional.campoAdicional.push({
          $: { nombre: campo.nombre },
          _: campo.value
        });
      }
      if (rucProveedor) {
        jsonFactura.factura.infoAdicional.campoAdicional.push({
          $: { nombre: RUC_PROVEEDOR_CAMPO_NOMBRE },
          _: rucProveedor
        });
      }
    } else {
      jsonFactura.factura.infoAdicional = null;
    }
    for (const impuesto of totalConImpuestos.totalImpuesto) {
      jsonFactura.factura.infoFactura.totalConImpuestos.totalImpuesto.push({
        codigo: impuesto.codigo,
        codigoPorcentaje: impuesto.codigoPorcentaje.toString(),
        descuentoAdicional: impuesto.descuentoAdicional ? impuesto.descuentoAdicional.toFixed(2) : null,
        baseImponible: impuesto.baseImponible.toFixed(2),
        valor: impuesto.valor.toFixed(2)
      });
    }
    for (const pago of pagos.pago) {
      jsonFactura.factura.infoFactura.pagos.pago.push({
        formaPago: pago.formaPago,
        total: Number(pago.total).toFixed(2),
        plazo: pago.plazo,
        unidadTiempo: pago.unidadTiempo
      });
    }
    for (const detalle of detalles.detalle) {
      const detalleFactura = {
        codigoPrincipal: detalle.codigoPrincipal,
        codigoAuxiliar: detalle.codigoAuxiliar,
        descripcion: detalle.descripcion,
        cantidad: detalle.cantidad.toFixed(6),
        precioUnitario: Number(detalle.precioUnitario).toFixed(6),
        descuento: detalle.descuento.toFixed(2),
        precioTotalSinImpuesto: detalle.precioTotalSinImpuesto.toFixed(2),
        detallesAdicionales: { detAdicional: [] },
        impuestos: {
          impuesto: []
        }
      };
      const detAdicionales = (_a = detalle.detallesAdicionales) == null ? void 0 : _a.detAdicional;
      if (detAdicionales) {
        for (const det of detAdicionales) {
          detalleFactura.detallesAdicionales.detAdicional.push({
            $: { nombre: det.nombre, valor: det.valor }
          });
        }
      } else {
        detalleFactura.detallesAdicionales = null;
      }
      for (const impuesto of detalle.impuestos.impuesto) {
        detalleFactura.impuestos.impuesto.push({
          codigo: impuesto.codigo,
          codigoPorcentaje: impuesto.codigoPorcentaje.toString(),
          tarifa: impuesto.tarifa.toString(),
          baseImponible: impuesto.baseImponible.toFixed(2),
          valor: impuesto.valor.toFixed(2)
        });
      }
      jsonFactura.factura.detalles.detalle.push(detalleFactura);
    }
    return { factura: jsonFactura.factura };
  }
};

// src/generator/invoice/invoice.generator.ts
import { Builder } from "xml2js";

// src/generator/invoice/validators/sections/detalles.validator.ts
function validarDetalles(comprobante) {
  const { detalles } = comprobante;
  const errors = [];
  detalles.detalle.forEach((detalle, index) => {
    const ivaPercentageCodes = Object.values(IVA_PERCENTAGE_CODE_ENUM);
    detalle.impuestos.impuesto.forEach((imp, j) => {
      if (imp.codigo === 2 /* VAT */) {
        if (!ivaPercentageCodes.includes(
          imp.codigoPorcentaje.toString()
        )) {
          errors.push(
            `detalle[${index}]: impuesto[${j}]: "codigoPorcentaje" debe ser un valor v\xE1lido de IVA: ${ivaPercentageCodes.join(", ")}.`
          );
        }
      }
    });
  });
  return errors;
}

// src/generator/invoice/validators/sections/info-adicional.validator.ts
function validateInfoAdicional(comprobante) {
  var _a;
  const { infoAdicional, rucProveedor } = comprobante;
  const errors = [];
  if (!rucProveedor) {
    return errors;
  }
  const campoManual = (_a = infoAdicional == null ? void 0 : infoAdicional.campoAdicional) == null ? void 0 : _a.find(
    (campo) => esCampoRucProveedor(campo.nombre)
  );
  if (campoManual && campoManual.value !== rucProveedor) {
    errors.push(
      `El campoAdicional "${RUC_PROVEEDOR_CAMPO_NOMBRE}" (${campoManual.value}) no coincide con "rucProveedor" (${rucProveedor}). Envie solo uno de los dos.`
    );
  }
  return errors;
}

// src/generator/invoice/validators/sections/info-factura.validator.ts
function validateInfoFactura(comprobante) {
  const { infoFactura } = comprobante;
  const errors = [];
  if (infoFactura.tipoIdentificacionComprador === "05" /* CEDULA */ && infoFactura.identificacionComprador.length !== 10) {
    errors.push(`EL tipo de idenificacion no corresponde con una Cedula`);
  } else if (infoFactura.tipoIdentificacionComprador === "04" /* RUC */ && infoFactura.identificacionComprador.length !== 13) {
    errors.push(`EL tipo de idenificacion no corresponde con un Ruc`);
  }
  const ivaPercentageCodes = Object.values(IVA_PERCENTAGE_CODE_ENUM);
  infoFactura.totalConImpuestos.totalImpuesto.forEach((item, index) => {
    const prefix = `totalImpuesto[${index}]`;
    if (item.codigo === 2 /* VAT */) {
      if (!ivaPercentageCodes.includes(
        item.codigoPorcentaje.toString()
      )) {
        const validLabels = ivaPercentageCodes.map(
          (code) => IVA_PERCENTAGE_LABELS[code]
        ).join(", ");
        errors.push(
          `detalle[${index}]: impuesto[${index}]: "codigoPorcentaje" debe ser un valor v\xE1lido de IVA: ${validLabels}.`
        );
      }
    }
    if (item.codigo !== 2 /* VAT */ && item.descuentoAdicional !== void 0) {
      errors.push(
        `El campo "${prefix}.descuentoAdicional" solo es valido para el codigo 2 (iva)`
      );
    }
  });
  return errors;
}

// src/generator/const/tarifa-retencion-xml.const.ts
var TarifaRetencionXml = {
  // IVA
  [3 /* IVA_CIENTO_POR_CIENTO_RESOLUCION */]: 1,
  [4 /* IVA_DOCE_POR_CIENTO_PRESUNTIVO_EDITORES */]: 0.12,
  [5 /* IVA_CIENTO_POR_CIENTO_DISTRIBUIDORES */]: 100,
  [6 /* IVA_CIENTO_POR_CIENTO_VOCEADORES */]: 100,
  // Renta
  [327 /* RENTA_DOS_POR_MIL */]: 0.2,
  [328 /* RENTA_TRES_POR_MIL */]: 0.2
};

// src/generator/invoice/validators/sections/retenciones.validator.ts
function validarRetenciones(comprobante) {
  const { retenciones } = comprobante;
  const errors = [];
  if (retenciones) {
    retenciones.retencion.forEach((retencion, index) => {
      const prefix = `retencion[${index}]`;
      const tarifaRetencion = TarifaRetencionXml[retencion.codigoPorcentaje];
      if (tarifaRetencion !== retencion.tarifa) {
        errors.push(
          `El campo "${prefix}.tarifa" no es valido para el codigo de porcentaje ${prefix}`
        );
      }
    });
  }
  return errors;
}

// src/generator/invoice/validators/factura-validator.ts
function validateFactura(data) {
  const errors = [];
  errors.push(...validarDetalles(data));
  errors.push(...validateInfoFactura(data));
  errors.push(...validarRetenciones(data));
  errors.push(...validateInfoAdicional(data));
  return errors;
}

// src/lightweight-validator/strategies/boolean-validation.strategy.ts
var BooleanValidationStrategy = class {
  validate({ key, value }) {
    const errors = [];
    if (typeof value !== "boolean") {
      errors.push(`El campo "${key}" debe ser un boolean.`);
    }
    return errors;
  }
};

// src/lightweight-validator/strategies/date-validation.strategy.ts
var DateValidationStrategy = class {
  validate({ key, value, rule }) {
    const errors = [];
    let parsed;
    if (value instanceof Date) {
      parsed = value;
    } else if (typeof value === "string") {
      parsed = new Date(value);
    } else {
      errors.push(
        rule.message || `El campo "${key}" debe ser una fecha v\xE1lida en formato ISO 8601 (por ejemplo: "2025-06-22T14:30:00Z").`
      );
      return errors;
    }
    if (isNaN(parsed.getTime())) {
      errors.push(
        rule.message || `El campo "${key}" debe ser una fecha v\xE1lida en formato ISO 8601.`
      );
    }
    return errors;
  }
};

// src/lightweight-validator/strategies/enum-validation-strategy.ts
var EnumValidationStrategy = class {
  validate({ key, value, rule }) {
    const errors = [];
    const enumObj = rule.enum;
    if (!enumObj) return errors;
    const allowedValues = Object.entries(enumObj).filter(
      ([enumKey, enumVal]) => typeof enumVal !== "string" || isNaN(Number(enumKey))
    ).map(([, val]) => val);
    if (!allowedValues.includes(value)) {
      const receivedType = typeof value;
      const receivedValue = JSON.stringify(value);
      const formattedAllowed = allowedValues.map((v) => `${JSON.stringify(v)} (${typeof v})`).join(", ");
      errors.push(
        rule.message || `Valor inv\xE1lido para "${key}". Recibido: ${receivedValue} (${receivedType}). Permitidos: ${formattedAllowed}.`
      );
    }
    return errors;
  }
};

// src/lightweight-validator/strategies/number-validation.strategy.ts
var NumberValidationStrategy = class {
  validate({ key, value, rule }) {
    const errors = [];
    if (typeof value !== "number" || isNaN(value)) {
      errors.push(`El campo "${key}" debe ser un n\xFAmero.`);
      return errors;
    }
    if (rule.maxDigits !== void 0) {
      const digits = value.toString().replace(".", "").replace("-", "").length;
      if (digits > rule.maxDigits) {
        errors.push(
          rule.maxDigitsMessage || `El campo "${key}" no puede tener m\xE1s de ${rule.maxDigits} d\xEDgitos en total.`
        );
      }
    }
    if (rule.digits) {
      const [intPart, decPart = ""] = Math.abs(value).toString().split(".");
      const intDigits = intPart.replace(/^0+/, "").length || 1;
      const decDigits = decPart.length;
      if (intDigits > rule.digits.integer || decDigits > rule.digits.fraction) {
        errors.push(
          rule.digitsMessage || `El campo "${key}" debe tener como m\xE1ximo ${rule.digits.integer} d\xEDgitos enteros y ${rule.digits.fraction} decimales.`
        );
      }
    }
    return errors;
  }
};

// src/lightweight-validator/strategies/string-valiation.stategy.ts
var StringValidationStrategy = class {
  validate({ key, value, rule }) {
    const errors = [];
    if (typeof value !== "string") {
      errors.push(`El campo "${key}" debe ser un string.`);
      return errors;
    }
    if (rule.numericOnly && !/^\d+$/.test(value)) {
      errors.push(
        rule.message || `El campo "${key}" solo debe contener n\xFAmeros (sin letras ni s\xEDmbolos).`
      );
      return errors;
    }
    const length = value.length;
    if (rule.exactLength !== void 0 && length !== rule.exactLength) {
      errors.push(
        rule.exactLengthMessage || `El campo "${key}" debe tener exactamente ${rule.exactLength} caracteres.`
      );
    }
    if (rule.minLength !== void 0 && length < rule.minLength) {
      errors.push(
        rule.minLengthMessage || `El campo "${key}" debe tener al menos ${rule.minLength} caracteres.`
      );
    }
    if (rule.maxLength !== void 0 && length > rule.maxLength) {
      errors.push(
        rule.maxLengthMessage || `El campo "${key}" no puede tener m\xE1s de ${rule.maxLength} caracteres.`
      );
    }
    return errors;
  }
};

// src/lightweight-validator/consts/types.validators.const.ts
var typeValidators = {
  string: new StringValidationStrategy(),
  number: new NumberValidationStrategy(),
  boolean: new BooleanValidationStrategy(),
  enum: new EnumValidationStrategy(),
  date: new DateValidationStrategy()
};

// src/lightweight-validator/decorators.ts
function getValidationRules(instance2) {
  const rules = {};
  let current = instance2;
  while (current && current !== Object.prototype) {
    if (current.__validationRules) {
      Object.assign(rules, current.__validationRules);
    }
    current = Object.getPrototypeOf(current);
  }
  return rules;
}
function IsEnum(enumObj, message) {
  return function(target, context) {
    context.addInitializer(function() {
      if (!this.__validationRules) this.__validationRules = {};
      this.__validationRules[context.name] = {
        ...this.__validationRules[context.name] || {},
        type: "enum",
        enum: enumObj,
        message
      };
    });
  };
}
function IsRequired() {
  return (_, context) => {
    context.addInitializer(function() {
      this.__validationRules = this.__validationRules || {};
      this.__validationRules[context.name] = {
        ...this.__validationRules[context.name] || {},
        required: true
      };
    });
  };
}
function IsOptional() {
  return function(target, context) {
    context.addInitializer(function() {
      if (!this.__validationRules) this.__validationRules = {};
      this.__validationRules[context.name] = {
        ...this.__validationRules[context.name] || {},
        required: false
      };
    });
  };
}
function IsString() {
  return function(target, context) {
    context.addInitializer(function() {
      if (!this.__validationRules) this.__validationRules = {};
      this.__validationRules[context.name] = {
        ...this.__validationRules[context.name] || {},
        type: "string"
      };
    });
  };
}
function IsNumber() {
  return function(target, context) {
    context.addInitializer(function() {
      if (!this.__validationRules) this.__validationRules = {};
      this.__validationRules[context.name] = {
        ...this.__validationRules[context.name] || {},
        type: "number"
      };
    });
  };
}
function ValidateNested(type) {
  return (_, context) => {
    if (context.kind !== "field") {
      throw new Error(`ValidateNested solo puede usarse en propiedades`);
    }
    context.addInitializer(function() {
      this.__validationRules = this.__validationRules || {};
      this.__validationRules[context.name] = {
        ...this.__validationRules[context.name] || {},
        type: "object",
        nestedType: type
      };
    });
  };
}
function IsArray(itemType) {
  return (_, context) => {
    if (context.kind !== "field") {
      throw new Error(`IsArray solo puede usarse en propiedades`);
    }
    context.addInitializer(function() {
      this.__validationRules = this.__validationRules || {};
      this.__validationRules[context.name] = {
        ...this.__validationRules[context.name] || {},
        type: "array",
        arrayItemType: itemType
      };
    });
  };
}
function Length(options) {
  return function(target, context) {
    context.addInitializer(function() {
      if (!this.__validationRules) this.__validationRules = {};
      const rule = this.__validationRules[context.name] || {};
      if (!rule.type) {
        rule.type = "string";
      }
      if (rule.type !== "string") {
        throw new Error(
          `@Length solo puede usarse en propiedades de tipo string`
        );
      }
      this.__validationRules[context.name] = {
        ...rule,
        minLength: options.min,
        maxLength: options.max,
        exactLength: options.exact,
        minLengthMessage: options.minMessage,
        maxLengthMessage: options.maxMessage,
        exactLengthMessage: options.exactMessage
      };
    });
  };
}
function IsNumericString(message) {
  return function(_, context) {
    context.addInitializer(function() {
      this.__validationRules = this.__validationRules || {};
      this.__validationRules[context.name] = {
        ...this.__validationRules[context.name] || {},
        type: "string",
        // sigue siendo string
        numericOnly: true,
        message
      };
    });
  };
}
function IsDate(message) {
  return (_, context) => {
    context.addInitializer(function() {
      this.__validationRules = this.__validationRules || {};
      this.__validationRules[context.name] = {
        ...this.__validationRules[context.name] || {},
        type: "date",
        message
      };
    });
  };
}
function MaxDigits(max, message) {
  return (_, context) => {
    context.addInitializer(function() {
      this.__validationRules = this.__validationRules || {};
      this.__validationRules[context.name] = {
        ...this.__validationRules[context.name] || {},
        type: "number",
        maxDigits: max,
        maxDigitsMessage: message
      };
    });
  };
}
function Digits(options, message) {
  return (_, context) => {
    context.addInitializer(function() {
      this.__validationRules = this.__validationRules || {};
      this.__validationRules[context.name] = {
        ...this.__validationRules[context.name] || {},
        type: "number",
        digits: options,
        digitsMessage: message
      };
    });
  };
}

// src/lightweight-validator/validations/object.validation.ts
function toDecorated(ctor, raw) {
  if (raw === null || raw === void 0) return raw;
  return raw instanceof ctor ? raw : Object.assign(new ctor(), raw);
}
function validateObject(instance2, path = "") {
  const errors = [];
  if (instance2 === null || instance2 === void 0 || typeof instance2 !== "object") {
    return errors;
  }
  const rules = getValidationRules(instance2);
  if (!rules || Object.keys(rules).length === 0) return errors;
  for (const key in rules) {
    if (!Object.hasOwnProperty.call(rules, key)) continue;
    const fullPath = path ? `${path}.${key}` : key;
    const rule = rules[key];
    let value = instance2[key];
    const cleaned = typeof value === "string" ? value.trim() : value;
    if (rule.required && (cleaned === void 0 || cleaned === null || cleaned === "")) {
      errors.push(`El campo "${fullPath}" es obligatorio.`);
      continue;
    }
    if (!rule.required && (value === void 0 || value === null)) {
      continue;
    }
    const strategy = typeValidators[rule.type || ""];
    if (strategy) {
      errors.push(...strategy.validate({ key: fullPath, value, rule }));
      continue;
    }
    switch (rule.type) {
      case "object":
        if (value === null) {
          errors.push(`El campo "${fullPath}" debe ser un objeto.`);
        } else if (rule.nestedType) {
          try {
            const nestedInstance = toDecorated(rule.nestedType(), value);
            errors.push(...validateObject(nestedInstance, fullPath));
          } catch (e) {
            errors.push(`Error en campo "${fullPath}": ${e.message}`);
          }
        }
        break;
      case "array":
        if (!Array.isArray(value) || value.length === 0) {
          errors.push(`El campo "${fullPath}" debe ser un arreglo con datos.`);
        } else if (rule.arrayItemType) {
          value.forEach((item, index) => {
            const itemPath = `${fullPath}[${index}]`;
            if (item === null || item === void 0) {
              errors.push(`Elemento ${itemPath} no puede ser nulo`);
            } else {
              try {
                const itemInstance = toDecorated(rule.arrayItemType(), item);
                errors.push(...validateObject(itemInstance, itemPath));
              } catch (e) {
                errors.push(`Error en elemento ${itemPath}: ${e.message}`);
              }
            }
          });
        }
        break;
    }
  }
  return errors;
}

// src/generator/exceptions/validation.exception.ts
var ValidationException = class extends Error {
  constructor(errors) {
    super("Error de validaci\xF3n");
    this.errors = errors;
  }
};

// src/generator/invoice/models/comprobante.model.ts
var _contribuyenteRimpe_dec, _agenteRetencion_dec, _dirMatriz_dec, _secuencial_dec, _ptoEmi_dec, _estab_dec, _ruc_dec, _nombreComercial_dec, _razonSocial_dec, _ambiente_dec, _init;
_ambiente_dec = [IsRequired(), IsEnum(ENV_ENUM)], _razonSocial_dec = [IsString(), Length({ max: 300 }), IsRequired()], _nombreComercial_dec = [IsString(), Length({ max: 300 }), IsOptional()], _ruc_dec = [IsString(), Length({ exact: 13 }), IsNumericString(), IsRequired()], _estab_dec = [IsString(), Length({ exact: 3 }), IsNumericString(), IsRequired()], _ptoEmi_dec = [IsString(), Length({ exact: 3 }), IsNumericString(), IsRequired()], _secuencial_dec = [IsString(), Length({ exact: 9 }), IsNumericString(), IsRequired()], _dirMatriz_dec = [IsString(), Length({ max: 300 }), IsRequired()], _agenteRetencion_dec = [IsString(), Length({ min: 1, max: 8 }), IsNumericString(), IsOptional()], _contribuyenteRimpe_dec = [IsEnum(CONTRIBUYENTE_RIMPE_ENUM), IsOptional()];
var InfoTributariaModel = class {
  constructor() {
    this.ambiente = __runInitializers(_init, 8, this), __runInitializers(_init, 11, this);
    this.razonSocial = __runInitializers(_init, 12, this), __runInitializers(_init, 15, this);
    this.nombreComercial = __runInitializers(_init, 16, this), __runInitializers(_init, 19, this);
    this.ruc = __runInitializers(_init, 20, this), __runInitializers(_init, 23, this);
    this.estab = __runInitializers(_init, 24, this), __runInitializers(_init, 27, this);
    this.ptoEmi = __runInitializers(_init, 28, this), __runInitializers(_init, 31, this);
    this.secuencial = __runInitializers(_init, 32, this), __runInitializers(_init, 35, this);
    this.dirMatriz = __runInitializers(_init, 36, this), __runInitializers(_init, 39, this);
    this.agenteRetencion = __runInitializers(_init, 40, this), __runInitializers(_init, 43, this);
    this.contribuyenteRimpe = __runInitializers(_init, 44, this), __runInitializers(_init, 47, this);
  }
};
_init = __decoratorStart(null);
__decorateElement(_init, 5, "ambiente", _ambiente_dec, InfoTributariaModel);
__decorateElement(_init, 5, "razonSocial", _razonSocial_dec, InfoTributariaModel);
__decorateElement(_init, 5, "nombreComercial", _nombreComercial_dec, InfoTributariaModel);
__decorateElement(_init, 5, "ruc", _ruc_dec, InfoTributariaModel);
__decorateElement(_init, 5, "estab", _estab_dec, InfoTributariaModel);
__decorateElement(_init, 5, "ptoEmi", _ptoEmi_dec, InfoTributariaModel);
__decorateElement(_init, 5, "secuencial", _secuencial_dec, InfoTributariaModel);
__decorateElement(_init, 5, "dirMatriz", _dirMatriz_dec, InfoTributariaModel);
__decorateElement(_init, 5, "agenteRetencion", _agenteRetencion_dec, InfoTributariaModel);
__decorateElement(_init, 5, "contribuyenteRimpe", _contribuyenteRimpe_dec, InfoTributariaModel);
__decoratorMetadata(_init, InfoTributariaModel);
var _descuentoAdicional_dec, _valor_dec, _baseImponible_dec, _codigoPorcentaje_dec, _codigo_dec, _init2;
_codigo_dec = [IsEnum(TAX_CODE_ENUM), IsRequired()], _codigoPorcentaje_dec = [IsNumber(), MaxDigits(4), IsRequired()], _baseImponible_dec = [IsNumber(), MaxDigits(14), IsRequired()], _valor_dec = [IsNumber(), MaxDigits(14), IsRequired()], _descuentoAdicional_dec = [IsNumber(), MaxDigits(14), IsOptional()];
var TotalImpuestoModel = class {
  constructor() {
    this.codigo = __runInitializers(_init2, 8, this), __runInitializers(_init2, 11, this);
    this.codigoPorcentaje = __runInitializers(_init2, 12, this), __runInitializers(_init2, 15, this);
    this.baseImponible = __runInitializers(_init2, 16, this), __runInitializers(_init2, 19, this);
    this.valor = __runInitializers(_init2, 20, this), __runInitializers(_init2, 23, this);
    this.descuentoAdicional = __runInitializers(_init2, 24, this), __runInitializers(_init2, 27, this);
  }
  //TODO: SOLO PARA EL CODIGO TAX_CODE_ENUM VAT= 2
};
_init2 = __decoratorStart(null);
__decorateElement(_init2, 5, "codigo", _codigo_dec, TotalImpuestoModel);
__decorateElement(_init2, 5, "codigoPorcentaje", _codigoPorcentaje_dec, TotalImpuestoModel);
__decorateElement(_init2, 5, "baseImponible", _baseImponible_dec, TotalImpuestoModel);
__decorateElement(_init2, 5, "valor", _valor_dec, TotalImpuestoModel);
__decorateElement(_init2, 5, "descuentoAdicional", _descuentoAdicional_dec, TotalImpuestoModel);
__decoratorMetadata(_init2, TotalImpuestoModel);
var _totalImpuesto_dec, _init3;
_totalImpuesto_dec = [IsArray(() => TotalImpuestoModel), IsRequired()];
var TotalConImpuestosModel = class {
  constructor() {
    this.totalImpuesto = __runInitializers(_init3, 8, this), __runInitializers(_init3, 11, this);
  }
};
_init3 = __decoratorStart(null);
__decorateElement(_init3, 5, "totalImpuesto", _totalImpuesto_dec, TotalConImpuestosModel);
__decoratorMetadata(_init3, TotalConImpuestosModel);
var _unidadTiempo_dec, _plazo_dec, _total_dec, _formaPago_dec, _init4;
_formaPago_dec = [IsEnum(PAYMENT_METHOD_CODE_ENUM), IsRequired()], _total_dec = [IsNumber(), MaxDigits(14), IsRequired()], _plazo_dec = [IsNumber(), MaxDigits(14), IsOptional()], _unidadTiempo_dec = [IsString(), Length({ max: 10 }), IsOptional()];
var PagoModel = class {
  constructor() {
    this.formaPago = __runInitializers(_init4, 8, this), __runInitializers(_init4, 11, this);
    this.total = __runInitializers(_init4, 12, this), __runInitializers(_init4, 15, this);
    this.plazo = __runInitializers(_init4, 16, this), __runInitializers(_init4, 19, this);
    this.unidadTiempo = __runInitializers(_init4, 20, this), __runInitializers(_init4, 23, this);
  }
};
_init4 = __decoratorStart(null);
__decorateElement(_init4, 5, "formaPago", _formaPago_dec, PagoModel);
__decorateElement(_init4, 5, "total", _total_dec, PagoModel);
__decorateElement(_init4, 5, "plazo", _plazo_dec, PagoModel);
__decorateElement(_init4, 5, "unidadTiempo", _unidadTiempo_dec, PagoModel);
__decoratorMetadata(_init4, PagoModel);
var _pago_dec, _init5;
_pago_dec = [IsArray(() => PagoModel), IsRequired()];
var PagosModel = class {
  constructor() {
    this.pago = __runInitializers(_init5, 8, this), __runInitializers(_init5, 11, this);
  }
};
_init5 = __decoratorStart(null);
__decorateElement(_init5, 5, "pago", _pago_dec, PagosModel);
__decoratorMetadata(_init5, PagosModel);
var _valorRetRenta_dec, _valorRetIva_dec, _pagos_dec, _moneda_dec, _importeTotal_dec, _propina_dec, _totalConImpuestos_dec, _totalDescuento_dec, _totalSinImpuestos_dec, _direccionComprador_dec, _identificacionComprador_dec, _razonSocialComprador_dec, _guiaRemision_dec, _tipoIdentificacionComprador_dec, _obligadoContabilidad_dec, _contribuyenteEspecial_dec, _dirEstablecimiento_dec, _fechaEmision_dec, _init6;
_fechaEmision_dec = [IsDate(), IsRequired()], _dirEstablecimiento_dec = [IsString(), Length({ max: 300 }), IsOptional()], _contribuyenteEspecial_dec = [IsString(), Length({ min: 3, max: 13 }), IsOptional()], _obligadoContabilidad_dec = [IsEnum(OBLIGADO_CONTABILIDAD_ENUM), IsOptional()], _tipoIdentificacionComprador_dec = [IsEnum(IDENTIFICATION_CODE_ENUM), IsRequired()], _guiaRemision_dec = [IsString(), Length({ exact: 17 }), IsOptional()], _razonSocialComprador_dec = [IsString(), Length({ max: 300 }), IsRequired()], _identificacionComprador_dec = [IsString(), Length({ max: 20 }), IsRequired()], _direccionComprador_dec = [IsString(), Length({ max: 300 }), IsOptional()], _totalSinImpuestos_dec = [IsNumber(), MaxDigits(14), IsRequired()], _totalDescuento_dec = [IsNumber(), MaxDigits(14), IsRequired()], _totalConImpuestos_dec = [ValidateNested(() => TotalConImpuestosModel), IsRequired()], _propina_dec = [IsNumber(), MaxDigits(14), IsRequired()], _importeTotal_dec = [IsNumber(), MaxDigits(14), IsRequired()], _moneda_dec = [IsString(), MaxDigits(15), IsOptional()], _pagos_dec = [ValidateNested(() => PagosModel), IsRequired()], _valorRetIva_dec = [IsNumber(), Digits({ integer: 15, fraction: 2 }), IsOptional()], _valorRetRenta_dec = [IsNumber(), Digits({ integer: 15, fraction: 2 }), IsOptional()];
var InfoFacturaModel = class {
  constructor() {
    this.fechaEmision = __runInitializers(_init6, 8, this), __runInitializers(_init6, 11, this);
    this.dirEstablecimiento = __runInitializers(_init6, 12, this), __runInitializers(_init6, 15, this);
    this.contribuyenteEspecial = __runInitializers(_init6, 16, this), __runInitializers(_init6, 19, this);
    this.obligadoContabilidad = __runInitializers(_init6, 20, this), __runInitializers(_init6, 23, this);
    this.tipoIdentificacionComprador = __runInitializers(_init6, 24, this), __runInitializers(_init6, 27, this);
    this.guiaRemision = __runInitializers(_init6, 28, this), __runInitializers(_init6, 31, this);
    this.razonSocialComprador = __runInitializers(_init6, 32, this), __runInitializers(_init6, 35, this);
    this.identificacionComprador = __runInitializers(_init6, 36, this), __runInitializers(_init6, 39, this);
    this.direccionComprador = __runInitializers(_init6, 40, this), __runInitializers(_init6, 43, this);
    this.totalSinImpuestos = __runInitializers(_init6, 44, this), __runInitializers(_init6, 47, this);
    this.totalDescuento = __runInitializers(_init6, 48, this), __runInitializers(_init6, 51, this);
    this.totalConImpuestos = __runInitializers(_init6, 52, this), __runInitializers(_init6, 55, this);
    this.propina = __runInitializers(_init6, 56, this), __runInitializers(_init6, 59, this);
    this.importeTotal = __runInitializers(_init6, 60, this), __runInitializers(_init6, 63, this);
    this.moneda = __runInitializers(_init6, 64, this), __runInitializers(_init6, 67, this);
    this.pagos = __runInitializers(_init6, 68, this), __runInitializers(_init6, 71, this);
    this.valorRetIva = __runInitializers(_init6, 72, this), __runInitializers(_init6, 75, this);
    this.valorRetRenta = __runInitializers(_init6, 76, this), __runInitializers(_init6, 79, this);
  }
};
_init6 = __decoratorStart(null);
__decorateElement(_init6, 5, "fechaEmision", _fechaEmision_dec, InfoFacturaModel);
__decorateElement(_init6, 5, "dirEstablecimiento", _dirEstablecimiento_dec, InfoFacturaModel);
__decorateElement(_init6, 5, "contribuyenteEspecial", _contribuyenteEspecial_dec, InfoFacturaModel);
__decorateElement(_init6, 5, "obligadoContabilidad", _obligadoContabilidad_dec, InfoFacturaModel);
__decorateElement(_init6, 5, "tipoIdentificacionComprador", _tipoIdentificacionComprador_dec, InfoFacturaModel);
__decorateElement(_init6, 5, "guiaRemision", _guiaRemision_dec, InfoFacturaModel);
__decorateElement(_init6, 5, "razonSocialComprador", _razonSocialComprador_dec, InfoFacturaModel);
__decorateElement(_init6, 5, "identificacionComprador", _identificacionComprador_dec, InfoFacturaModel);
__decorateElement(_init6, 5, "direccionComprador", _direccionComprador_dec, InfoFacturaModel);
__decorateElement(_init6, 5, "totalSinImpuestos", _totalSinImpuestos_dec, InfoFacturaModel);
__decorateElement(_init6, 5, "totalDescuento", _totalDescuento_dec, InfoFacturaModel);
__decorateElement(_init6, 5, "totalConImpuestos", _totalConImpuestos_dec, InfoFacturaModel);
__decorateElement(_init6, 5, "propina", _propina_dec, InfoFacturaModel);
__decorateElement(_init6, 5, "importeTotal", _importeTotal_dec, InfoFacturaModel);
__decorateElement(_init6, 5, "moneda", _moneda_dec, InfoFacturaModel);
__decorateElement(_init6, 5, "pagos", _pagos_dec, InfoFacturaModel);
__decorateElement(_init6, 5, "valorRetIva", _valorRetIva_dec, InfoFacturaModel);
__decorateElement(_init6, 5, "valorRetRenta", _valorRetRenta_dec, InfoFacturaModel);
__decoratorMetadata(_init6, InfoFacturaModel);
var _valor_dec2, _nombre_dec, _init7;
_nombre_dec = [IsString(), Length({ max: 300 }), IsRequired()], _valor_dec2 = [IsString(), Length({ max: 300 }), IsRequired()];
var DetAdicionalModel = class {
  constructor() {
    this.nombre = __runInitializers(_init7, 8, this), __runInitializers(_init7, 11, this);
    this.valor = __runInitializers(_init7, 12, this), __runInitializers(_init7, 15, this);
  }
};
_init7 = __decoratorStart(null);
__decorateElement(_init7, 5, "nombre", _nombre_dec, DetAdicionalModel);
__decorateElement(_init7, 5, "valor", _valor_dec2, DetAdicionalModel);
__decoratorMetadata(_init7, DetAdicionalModel);
var _valor_dec3, _baseImponible_dec2, _tarifa_dec, _codigoPorcentaje_dec2, _codigo_dec2, _init8;
_codigo_dec2 = [IsEnum(TAX_CODE_ENUM), IsRequired()], _codigoPorcentaje_dec2 = [IsNumber(), MaxDigits(4), IsRequired()], _tarifa_dec = [IsNumber(), Digits({ integer: 2, fraction: 2 }), IsRequired()], _baseImponible_dec2 = [IsNumber(), MaxDigits(14), IsRequired()], _valor_dec3 = [IsNumber(), MaxDigits(14), IsRequired()];
var ImpuestoDetalleModel = class {
  constructor() {
    this.codigo = __runInitializers(_init8, 8, this), __runInitializers(_init8, 11, this);
    this.codigoPorcentaje = __runInitializers(_init8, 12, this), __runInitializers(_init8, 15, this);
    this.tarifa = __runInitializers(_init8, 16, this), __runInitializers(_init8, 19, this);
    this.baseImponible = __runInitializers(_init8, 20, this), __runInitializers(_init8, 23, this);
    this.valor = __runInitializers(_init8, 24, this), __runInitializers(_init8, 27, this);
  }
};
_init8 = __decoratorStart(null);
__decorateElement(_init8, 5, "codigo", _codigo_dec2, ImpuestoDetalleModel);
__decorateElement(_init8, 5, "codigoPorcentaje", _codigoPorcentaje_dec2, ImpuestoDetalleModel);
__decorateElement(_init8, 5, "tarifa", _tarifa_dec, ImpuestoDetalleModel);
__decorateElement(_init8, 5, "baseImponible", _baseImponible_dec2, ImpuestoDetalleModel);
__decorateElement(_init8, 5, "valor", _valor_dec3, ImpuestoDetalleModel);
__decoratorMetadata(_init8, ImpuestoDetalleModel);
var _detAdicional_dec, _init9;
_detAdicional_dec = [IsArray(() => DetAdicionalModel), IsRequired()];
var DetallesAdicionalesModel = class {
  constructor() {
    this.detAdicional = __runInitializers(_init9, 8, this), __runInitializers(_init9, 11, this);
  }
};
_init9 = __decoratorStart(null);
__decorateElement(_init9, 5, "detAdicional", _detAdicional_dec, DetallesAdicionalesModel);
__decoratorMetadata(_init9, DetallesAdicionalesModel);
var _impuesto_dec, _init10;
_impuesto_dec = [IsArray(() => ImpuestoDetalleModel), IsRequired()];
var ImpuestosModel = class {
  constructor() {
    this.impuesto = __runInitializers(_init10, 8, this), __runInitializers(_init10, 11, this);
  }
};
_init10 = __decoratorStart(null);
__decorateElement(_init10, 5, "impuesto", _impuesto_dec, ImpuestosModel);
__decoratorMetadata(_init10, ImpuestosModel);
var _impuestos_dec, _detallesAdicionales_dec, _precioTotalSinImpuesto_dec, _descuento_dec, _precioUnitario_dec, _cantidad_dec, _descripcion_dec, _codigoAuxiliar_dec, _codigoPrincipal_dec, _init11;
_codigoPrincipal_dec = [IsString(), Length({ max: 25 }), IsRequired()], _codigoAuxiliar_dec = [IsString(), Length({ max: 25 }), IsOptional()], _descripcion_dec = [IsString(), Length({ max: 300 }), IsRequired()], _cantidad_dec = [IsNumber(), MaxDigits(14), IsRequired()], _precioUnitario_dec = [IsNumber(), MaxDigits(14), IsRequired()], _descuento_dec = [IsNumber(), MaxDigits(14), IsRequired()], _precioTotalSinImpuesto_dec = [IsNumber(), MaxDigits(14), IsRequired()], _detallesAdicionales_dec = [ValidateNested(() => DetallesAdicionalesModel), IsOptional()], _impuestos_dec = [ValidateNested(() => ImpuestosModel), IsRequired()];
var DetalleModel = class {
  constructor() {
    this.codigoPrincipal = __runInitializers(_init11, 8, this), __runInitializers(_init11, 11, this);
    this.codigoAuxiliar = __runInitializers(_init11, 12, this), __runInitializers(_init11, 15, this);
    this.descripcion = __runInitializers(_init11, 16, this), __runInitializers(_init11, 19, this);
    this.cantidad = __runInitializers(_init11, 20, this), __runInitializers(_init11, 23, this);
    this.precioUnitario = __runInitializers(_init11, 24, this), __runInitializers(_init11, 27, this);
    this.descuento = __runInitializers(_init11, 28, this), __runInitializers(_init11, 31, this);
    this.precioTotalSinImpuesto = __runInitializers(_init11, 32, this), __runInitializers(_init11, 35, this);
    this.detallesAdicionales = __runInitializers(_init11, 36, this), __runInitializers(_init11, 39, this);
    this.impuestos = __runInitializers(_init11, 40, this), __runInitializers(_init11, 43, this);
  }
};
_init11 = __decoratorStart(null);
__decorateElement(_init11, 5, "codigoPrincipal", _codigoPrincipal_dec, DetalleModel);
__decorateElement(_init11, 5, "codigoAuxiliar", _codigoAuxiliar_dec, DetalleModel);
__decorateElement(_init11, 5, "descripcion", _descripcion_dec, DetalleModel);
__decorateElement(_init11, 5, "cantidad", _cantidad_dec, DetalleModel);
__decorateElement(_init11, 5, "precioUnitario", _precioUnitario_dec, DetalleModel);
__decorateElement(_init11, 5, "descuento", _descuento_dec, DetalleModel);
__decorateElement(_init11, 5, "precioTotalSinImpuesto", _precioTotalSinImpuesto_dec, DetalleModel);
__decorateElement(_init11, 5, "detallesAdicionales", _detallesAdicionales_dec, DetalleModel);
__decorateElement(_init11, 5, "impuestos", _impuestos_dec, DetalleModel);
__decoratorMetadata(_init11, DetalleModel);
var _value_dec, _nombre_dec2, _init12;
_nombre_dec2 = [IsString(), Length({ max: 300 }), IsRequired()], _value_dec = [IsString(), Length({ max: 300 }), IsRequired()];
var CampoAdicionalModel = class {
  constructor() {
    this.nombre = __runInitializers(_init12, 8, this), __runInitializers(_init12, 11, this);
    this.value = __runInitializers(_init12, 12, this), __runInitializers(_init12, 15, this);
  }
};
_init12 = __decoratorStart(null);
__decorateElement(_init12, 5, "nombre", _nombre_dec2, CampoAdicionalModel);
__decorateElement(_init12, 5, "value", _value_dec, CampoAdicionalModel);
__decoratorMetadata(_init12, CampoAdicionalModel);
var _campoAdicional_dec, _init13;
_campoAdicional_dec = [IsArray(() => CampoAdicionalModel), IsRequired()];
var InfoAdicionalModel = class {
  constructor() {
    this.campoAdicional = __runInitializers(_init13, 8, this), __runInitializers(_init13, 11, this);
  }
};
_init13 = __decoratorStart(null);
__decorateElement(_init13, 5, "campoAdicional", _campoAdicional_dec, InfoAdicionalModel);
__decoratorMetadata(_init13, InfoAdicionalModel);
var _detalle_dec, _init14;
_detalle_dec = [IsArray(() => DetalleModel), IsRequired()];
var DetallesModel = class {
  constructor() {
    this.detalle = __runInitializers(_init14, 8, this), __runInitializers(_init14, 11, this);
  }
};
_init14 = __decoratorStart(null);
__decorateElement(_init14, 5, "detalle", _detalle_dec, DetallesModel);
__decoratorMetadata(_init14, DetallesModel);
var _retencion_dec, _init15;
_retencion_dec = [IsArray(() => RetencionModel), IsRequired()];
var RetencionesModel = class {
  constructor() {
    this.retencion = __runInitializers(_init15, 8, this), __runInitializers(_init15, 11, this);
  }
};
_init15 = __decoratorStart(null);
__decorateElement(_init15, 5, "retencion", _retencion_dec, RetencionesModel);
__decoratorMetadata(_init15, RetencionesModel);
var _valor_dec4, _tarifa_dec2, _codigoPorcentaje_dec3, _codigo_dec3, _init16;
_codigo_dec3 = [IsEnum(IMPUESTO_A_RETENER_ENUM), IsRequired()], _codigoPorcentaje_dec3 = [IsEnum(CODIGO_RETENCION_ENUM), IsRequired()], _tarifa_dec2 = [IsNumber(), Digits({ integer: 3, fraction: 2 }), IsRequired()], _valor_dec4 = [IsNumber(), Digits({ integer: 12, fraction: 2 }), IsRequired()];
var RetencionModel = class {
  constructor() {
    this.codigo = __runInitializers(_init16, 8, this), __runInitializers(_init16, 11, this);
    this.codigoPorcentaje = __runInitializers(_init16, 12, this), __runInitializers(_init16, 15, this);
    this.tarifa = __runInitializers(_init16, 16, this), __runInitializers(_init16, 19, this);
    this.valor = __runInitializers(_init16, 20, this), __runInitializers(_init16, 23, this);
  }
};
_init16 = __decoratorStart(null);
__decorateElement(_init16, 5, "codigo", _codigo_dec3, RetencionModel);
__decorateElement(_init16, 5, "codigoPorcentaje", _codigoPorcentaje_dec3, RetencionModel);
__decorateElement(_init16, 5, "tarifa", _tarifa_dec2, RetencionModel);
__decorateElement(_init16, 5, "valor", _valor_dec4, RetencionModel);
__decoratorMetadata(_init16, RetencionModel);
var _rucProveedor_dec, _infoAdicional_dec, _retenciones_dec, _detalles_dec, _infoFactura_dec, _infoTributaria_dec, _init17;
_infoTributaria_dec = [ValidateNested(() => InfoTributariaModel), IsRequired()], _infoFactura_dec = [ValidateNested(() => InfoFacturaModel), IsRequired()], _detalles_dec = [ValidateNested(() => DetallesModel), IsRequired()], _retenciones_dec = [ValidateNested(() => RetencionesModel), IsOptional()], _infoAdicional_dec = [ValidateNested(() => InfoAdicionalModel), IsOptional()], _rucProveedor_dec = [IsString(), Length({ exact: 13 }), IsNumericString(), IsOptional()];
var ComprobanteModel = class {
  constructor() {
    this.infoTributaria = __runInitializers(_init17, 8, this), __runInitializers(_init17, 11, this);
    this.infoFactura = __runInitializers(_init17, 12, this), __runInitializers(_init17, 15, this);
    this.detalles = __runInitializers(_init17, 16, this), __runInitializers(_init17, 19, this);
    this.retenciones = __runInitializers(_init17, 20, this), __runInitializers(_init17, 23, this);
    this.infoAdicional = __runInitializers(_init17, 24, this), __runInitializers(_init17, 27, this);
    this.rucProveedor = __runInitializers(_init17, 28, this), __runInitializers(_init17, 31, this);
  }
};
_init17 = __decoratorStart(null);
__decorateElement(_init17, 5, "infoTributaria", _infoTributaria_dec, ComprobanteModel);
__decorateElement(_init17, 5, "infoFactura", _infoFactura_dec, ComprobanteModel);
__decorateElement(_init17, 5, "detalles", _detalles_dec, ComprobanteModel);
__decorateElement(_init17, 5, "retenciones", _retenciones_dec, ComprobanteModel);
__decorateElement(_init17, 5, "infoAdicional", _infoAdicional_dec, ComprobanteModel);
__decorateElement(_init17, 5, "rucProveedor", _rucProveedor_dec, ComprobanteModel);
__decoratorMetadata(_init17, ComprobanteModel);

// src/generator/invoice/invoice.generator.ts
async function generateXmlInvoice(invoice) {
  const user = toDecorated(ComprobanteModel, invoice);
  const errorsObject = validateObject(user);
  const errorsValidate = validateFactura(invoice);
  const errors = [...errorsObject, ...errorsValidate];
  if (errors.length > 0) {
    throw new ValidationException(errors);
  }
  const factura = new InvoiceXmlFactory().create(invoice);
  const cleaned = removeNullFields(factura);
  const xml = new Builder({ renderOpts: { pretty: true } }).buildObject(
    cleaned
  );
  return {
    generatedXml: xml,
    invoiceJson: cleaned
  };
}

// src/sri/const/sri-urls.ts
var SRI_URLS = {
  test: {
    recepcion: "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl",
    autorizacion: "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl"
  },
  prod: {
    recepcion: "https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl",
    autorizacion: "https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl"
  }
};

// src/sri/helpers/soap-client.ts
import * as soap from "soap";
import { DOMParser as DOMParser3, XMLSerializer as XMLSerializer2 } from "@xmldom/xmldom";
async function createSoapClient(wsdlUrl) {
  return await soap.createClientAsync(wsdlUrl);
}
function unescapeXml(str) {
  return str.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}
function extractAutorizacionXml(rawResponse) {
  const dom = new DOMParser3().parseFromString(rawResponse, "text/xml");
  const autorizacion = dom.getElementsByTagName("autorizacion")[0];
  if (!autorizacion) {
    throw new Error("No se encontr\xF3 <autorizacion> en la respuesta SOAP.");
  }
  const comprobanteNode = autorizacion.getElementsByTagName("comprobante")[0];
  if (comprobanteNode && comprobanteNode.textContent) {
    const comprobanteXml = unescapeXml(comprobanteNode.textContent);
    comprobanteNode.textContent = "";
    comprobanteNode.appendChild(
      new DOMParser3().parseFromString(comprobanteXml, "text/xml").documentElement
    );
  }
  const xml = new XMLSerializer2().serializeToString(autorizacion);
  return xml;
}

// src/sri/helpers/normalize-mensajes.helper.ts
function normalizeSriMessages(message) {
  if (!message) return null;
  return Array.isArray(message) ? message : [message];
}

// src/sri/exceptions/base-sri.error.ts
var BaseSRIError = class extends Error {
  constructor(params) {
    var _a;
    const fullMessage = (_a = params.customMessage) != null ? _a : `[SRI-${params.tipo}] ${params.mensaje} (ID ${params.identificador}) - ${params.informacionAdicional}`;
    super(fullMessage);
    this.estado = params.estado;
    this.identificador = params.identificador;
    this.mensajeSRI = params.mensaje;
    this.informacionAdicional = params.informacionAdicional;
    this.tipo = params.tipo;
    this.claveAcceso = params.claveAcceso;
  }
};
var SRIError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "SRIError";
  }
};

// src/sri/exceptions/sri-autorizacion.error.ts
var SRIAutorizacionError = class extends Error {
  constructor(params) {
    const msg = `[SRI-${params.tipo}] ${params.mensaje} (ID ${params.identificador}) - ${params.informacionAdicional}`;
    super(msg);
    this.estado = params.estado;
    this.identificador = params.identificador;
    this.mensajeSRI = params.mensaje;
    this.informacionAdicional = params.informacionAdicional;
    this.tipo = params.tipo;
    this.claveAcceso = params.claveAcceso;
    this.ambiente = params.ambiente;
    this.comprobanteXml = params.comprobanteXml;
  }
};
var SRIUnauthorizedError = class extends SRIError {
  constructor(estado) {
    super(`Estado del comprobante: ${estado}`);
    this.estado = estado;
    this.name = "SRIUnauthorizedError";
  }
};

// src/sri/services/sri-autorizacion.service.ts
async function authorizeXml(data) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const { claveAcceso, env } = data;
  const client = await createSoapClient(SRI_URLS[env].autorizacion);
  const [result, rawResponse] = await client.autorizacionComprobanteAsync({
    claveAccesoComprobante: claveAcceso
  });
  const autorizacionXml = extractAutorizacionXml(rawResponse);
  const respuesta = result == null ? void 0 : result.RespuestaAutorizacionComprobante;
  const autorizacion = (_a = respuesta == null ? void 0 : respuesta.autorizaciones) == null ? void 0 : _a.autorizacion;
  if (!autorizacion || autorizacion.length === 0) {
    throw new Error("No se recibi\xF3 informaci\xF3n de autorizaci\xF3n del SRI");
  }
  const estado = autorizacion.estado;
  if (estado === "AUTORIZADO") {
    return {
      claveAcceso: autorizacion.claveAcceso,
      estadoAutorizacion: estado,
      comprobante: autorizacion.comprobante,
      comprobanteCrudo: autorizacionXml,
      rucEmisor: (_b = autorizacion.numeroAutorizacion) != null ? _b : "",
      fechaAutorizacion: autorizacion.fechaAutorizacion,
      ambiente: autorizacion.ambiente,
      mensajes: normalizeSriMessages((_c = autorizacion.mensajes) == null ? void 0 : _c.mensaje)
    };
  }
  if (estado === "NO AUTORIZADO" || estado === "RECHAZADA") {
    const mensaje = (_d = autorizacion.mensajes) == null ? void 0 : _d.mensaje;
    const mensajeFinal = Array.isArray(mensaje) ? mensaje[0] : mensaje;
    if (mensajeFinal) {
      throw new SRIAutorizacionError({
        estado,
        identificador: (_e = mensajeFinal.identificador) != null ? _e : "SIN_IDENTIFICADOR",
        mensaje: (_f = mensajeFinal.mensaje) != null ? _f : "Mensaje no disponible",
        informacionAdicional: (_g = mensajeFinal.informacionAdicional) != null ? _g : "Sin informaci\xF3n adicional",
        tipo: (_h = mensajeFinal.tipo) != null ? _h : "ERROR",
        claveAcceso: (_i = respuesta.claveAccesoConsultada) != null ? _i : claveAcceso,
        ambiente: autorizacion.ambiente,
        comprobanteXml: autorizacion.comprobante
      });
    }
    throw new SRIUnauthorizedError(estado);
  }
  throw new SRIUnauthorizedError(estado);
}

// src/sri/exceptions/sri-rejected.error.ts
var SRIRejectedError = class extends BaseSRIError {
  constructor(params) {
    super(params);
  }
};

// src/sri/services/sri-recepcion.service.ts
async function validateXml(data) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const { env, xml } = data;
  const client = await createSoapClient(SRI_URLS[env].recepcion);
  const xmlBase64 = uint8ArrayToBase64(xml);
  let result;
  try {
    [result] = await client.validarComprobanteAsync({ xml: xmlBase64 });
  } catch (error) {
    throw new Error(`Error SOAP al validar comprobante: ${error.message}`);
  }
  const respuesta = result == null ? void 0 : result.RespuestaRecepcionComprobante;
  if (!respuesta) {
    throw new Error(
      "Respuesta inv\xE1lida del SRI (sin 'respuestaRecepcionComprobante')"
    );
  }
  const comprobante = Array.isArray((_a = respuesta.comprobantes) == null ? void 0 : _a.comprobante) ? respuesta.comprobantes.comprobante[0] : (_b = respuesta.comprobantes) == null ? void 0 : _b.comprobante;
  const mensaje = (_c = comprobante == null ? void 0 : comprobante.mensajes) == null ? void 0 : _c.mensaje;
  if (respuesta.estado !== "RECIBIDA") {
    if (mensaje) {
      throw new SRIRejectedError({
        estado: respuesta.estado,
        identificador: (_d = mensaje.identificador) != null ? _d : "SIN_IDENTIFICADOR",
        mensaje: (_e = mensaje.mensaje) != null ? _e : "Mensaje no disponible",
        informacionAdicional: (_f = mensaje.informacionAdicional) != null ? _f : "Sin informaci\xF3n adicional",
        tipo: (_g = mensaje.tipo) != null ? _g : "ERROR",
        claveAcceso: (_h = comprobante == null ? void 0 : comprobante.claveAcceso) != null ? _h : "SIN_CLAVE"
      });
    }
    throw new Error(
      "Comprobante no recibido y sin mensaje explicativo del SRI"
    );
  }
  return {
    estado: respuesta.estado,
    mensaje: (_i = mensaje == null ? void 0 : mensaje.mensaje) != null ? _i : "Comprobante recibido correctamente"
  };
}

// src/generator/invoice/models/invoice-sri-builder.model.ts
var Retenciones = class {
};
var Retencion = class {
};
export {
  BaseSRIError,
  CODIGO_RETENCION_ENUM,
  CONTRIBUYENTE_RIMPE_ENUM,
  CampoAdicionalModel,
  CodigoPais,
  ComprobanteModel,
  DetAdicionalModel,
  DetalleModel,
  DetallesAdicionalesModel,
  DetallesModel,
  ENV_ENUM,
  IDENTIFICATION_CODE_ENUM,
  IMPUESTO_A_RETENER_ENUM,
  IVA_PERCENTAGE_CODE_ENUM,
  ImpuestoDetalleModel,
  ImpuestosModel,
  InfoAdicionalModel,
  InfoFacturaModel,
  InfoTributariaModel,
  InfrastructureError,
  InvalidP12PasswordError,
  InvalidP12StructureError,
  InvalidXmlStructureError,
  OBLIGADO_CONTABILIDAD_ENUM,
  PAYMENT_METHOD_CODE_ENUM,
  PagoModel,
  PagosModel,
  PrivateKeyExtractionError,
  Retencion,
  RetencionModel,
  Retenciones,
  RetencionesModel,
  SRIAutorizacionError,
  SRIError,
  SRIRejectedError,
  SRIUnauthorizedError,
  SRI_URLS,
  SignStrategyError,
  SigningKeyNotFoundError,
  TAX_CODE_ENUM,
  TotalConImpuestosModel,
  TotalImpuestoModel,
  UanatacaCertificateNotFoundError,
  UnknownSignStrategyError,
  ValidationException,
  authorizeXml,
  certificateCacheSize,
  clearCertificateCache,
  generateXmlInvoice,
  signXml,
  validateXml
};
