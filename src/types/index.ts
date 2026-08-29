export type Gender = 'Hombre' | 'Mujer' | 'Otro';

export type BeverageType = 'Colas' | 'Aguas' | 'Tés';
export type ContainerType = 'Plástico' | 'Vidrio';
export type BeverageSize = '250 ml' | '300 ml' | '500 ml' | '1.5 Litros' | '3.0 Litros' | '1500 ml' | '3000 ml';

export type ColaFlavor = 'Piña' | 'Tamarindo' | 'Mora' | 'Uva' | 'Mandarina';
export type WaterFlavor = 'Sin Gas' | 'Con Gas';
export type TeaFlavor = 'Limón' | 'Durazno';

export interface SurtidoBreakdown {
  [flavor: string]: number; // e.g. { "Piña": 12, "Mora": 12 }
}

export interface JavaProductOption {
  id: string;
  beverageType: BeverageType;
  container: ContainerType;
  size: BeverageSize;
  allowedFlavors: string[];
  unitsPerJava: number; // e.g. 12 for 250ml/300ml/500ml/1.5L, 6 for 3.0L, 24 for 300ml Vidrio
  pricePerJava: number;
  pricePerUnit?: number; // Calculated or customized unit price (e.g. pricePerJava / unitsPerJava)
  imageUrl: string;
  description: string;
  stockJavas: number;
}

export interface CartItem {
  id: string;
  productOptionId: string;
  beverageType: BeverageType;
  container: ContainerType;
  size: BeverageSize;
  flavorType: 'single' | 'surtido';
  selectedFlavor?: string;
  surtidoDetails?: SurtidoBreakdown;
  quantityJavas: number;
  quantityUnits: number; // Loose individual bottles
  unitsPerJava: number;
  pricePerJava: number;
  pricePerUnit: number;
  totalBottles: number;
  subtotal: number;
  imageUrl: string;
}

export interface Client {
  id: string;
  qrToken: string;
  fullName: string;
  businessName: string;
  gender: Gender;
  whatsappNumber: string;
  latitude: number;
  longitude: number;
  addressReference: string;
  taxId?: string; // Cédula o RUC
  taxIdType?: '04' | '05' | '06' | '07';
  email?: string;
  createdAt: string;
}

export type OrderStatus = 'pending' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid';
export type PaymentMethod = 'cash' | 'transfer';

export interface Order {
  id: string;
  orderNumber: string; // e.g. "ORD-00102"
  clientId: string;
  clientName: string;
  businessName: string;
  whatsappNumber: string;
  latitude: number;
  longitude: number;
  addressReference: string;
  items: CartItem[];
  totalJavas: number;
  totalUnits: number;
  totalBottles: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
  deliveredAt?: string;
  invoiceId?: string;
}

export type SriEnvironment = '1' | '2'; // 1: Sandbox/Pruebas, 2: Producción
export type SriStatus = 'PENDING' | 'RECIBIDA' | 'DEVUELTA' | 'AUTORIZADO' | 'NO AUTORIZADO';
export type TaxIdentificationType = '04' | '05' | '06' | '07'; // 04: RUC, 05: Cédula, 06: Pasaporte, 07: Consumidor Final

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "001-001-000000452"
  orderId: string;
  claveAcceso?: string; // 49 digits
  ambiente?: SriEnvironment;
  sriStatus?: SriStatus;
  sriAuthorizationNumber?: string;
  sriAuthorizationDate?: string;
  sriErrorMessage?: string;
  clientId: string;
  clientName: string;
  businessName: string;
  clientTaxId?: string;
  clientTaxIdType?: TaxIdentificationType;
  clientEmail?: string;
  clientWhatsapp: string;
  clientAddress: string;
  items: CartItem[];
  totalJavas: number;
  totalUnits: number;
  subtotal: number;
  subtotal15: number;
  subtotal0: number;
  tax: number;
  total: number;
  xmlContent?: string;
  pdfDownloadUrl?: string;
  issuedAt: string;
  status: 'emitida' | 'pagada' | 'anulada';
}

export interface CompanyTaxProfile {
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  dirMatriz: string;
  dirEstablecimiento?: string;
  establecimiento: string;
  puntoEmision: string;
  ambiente: '1' | '2';
  obligadoContabilidad: 'SI' | 'NO';
  regimenRimpe?: boolean;
}

