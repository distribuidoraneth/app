'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Client,
  JavaProductOption,
  Order,
  Invoice,
  CartItem,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  SaleType,
} from '@/types';
import {
  INITIAL_CLIENTS,
  JAVA_PRODUCT_CATALOG,
  INITIAL_ORDERS,
  INITIAL_INVOICES,
} from '@/lib/mockData';
import { formatOrderNumber, generateOrderNumber, expandCartItemsToFacturaLines } from '@/lib/utils/formatters';
import { generarClaveAcceso } from '@/lib/sri/claveAcceso';
import { DEFAULT_TAX_PROFILE } from '@/lib/sri/xmlBuilder';
import {
  saveOrderToDb,
  saveClientToDb,
  deleteClientFromDb,
  getClientsFromDb,
  getProductsFromDb,
  getOrdersFromDb,
  getOrderByIdFromDb,
  updateClientDebtInDb,
  updateOrderStatusInDb,
  saveInvoiceToDb,
  getInvoicesFromDb,
  getCompanyTaxProfileFromDb,
  updateCompanySecuencialInDb,
  GetOrdersOptions,
  generateUuid,
  isValidUuid,
  savePaymentToDb,
  getClientsByTokenFromDb,
  getOrdersByClientIdFromDb,
  getInvoicesByClientIdFromDb,
} from '@/lib/supabase/syncService';

interface DistributionContextType {
  // Data
  clients: Client[];
  catalog: JavaProductOption[];
  orders: Order[];
  invoices: Invoice[];
  ordersFilter: GetOrdersOptions;
  isOrdersLoading: boolean;
  loadOrders: (options?: GetOrdersOptions) => Promise<void>;
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantityJavas: number, quantityUnits?: number) => void;
  clearCart: () => void;
  cartTotalAmount: number;
  cartTotalJavas: number;
  cartTotalUnits: number;
  cartTotalBottles: number;

  // Operations
  addClient: (client: Omit<Client, 'id' | 'qrToken' | 'createdAt'>) => Promise<Client>;
  updateClient: (client: Client) => void;
  deleteClient: (clientId: string) => Promise<boolean>;
  createOrder: (orderData: {
    clientId: string;
    items: CartItem[];
    paymentMethod: PaymentMethod;
    saleType?: SaleType;
    scheduledDeliveryDate?: string;
    scheduledTimeSlot?: string;
    promisedCollectionDate?: string;
    promisedCollectionTime?: string;
    amountPaid?: number;
    paymentProofUrl?: string;
    notes?: string;
    customLocation?: { latitude: number; longitude: number; addressReference?: string };
  }) => Order;
  cancelOrder: (orderId: string) => boolean;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updatePaymentStatus: (orderId: string, status: PaymentStatus) => void;
  updateOrderSchedule: (orderId: string, date: string, timeSlot?: string) => void;
  recordOrderPayment: (orderId: string, amount: number, method: PaymentMethod, proofUrl?: string) => void;
  recordDebtPayment: (clientId: string, amount: number, method?: PaymentMethod, notes?: string) => void;
  generateInvoice: (orderId: string) => Invoice | null;
  updateStock: (optionId: string, newStock: number) => void;
  refreshData: () => Promise<void>;
  clearLocalCache: () => Promise<void>;
  ensureOrderLoaded: (idOrNumber: string) => Promise<Order | null>;
  loadClientPortalData: (token: string) => Promise<{
    client: Client | null;
    matchingClients: Client[];
    orders: Order[];
    invoices: Invoice[];
  }>;
  currentSecuencial: number;
  setManualSecuencial: (newSeq: number) => Promise<boolean>;
  updateInvoiceSequence: (invoiceId: string, newSeq: number) => Promise<Invoice | null>;
}

const DistributionContext = createContext<DistributionContextType | undefined>(undefined);

export const STORAGE_KEY = 'distribuidora_aneth_oficial_v12';
export const MIN_INVOICE_SEQUENCE_BASE = 119;
export const SEQUENCE_STORAGE_KEY = 'distribuidora_aneth_last_sequence_prod';

export function getNextInvoiceSequence(invoicesList?: Invoice[], currentSecuencialBase?: number): number {
  // 1. Si currentSecuencialBase fue provisto y es un número válido (e.g. 326 configurado en la base de datos),
  // la base de datos es la autoridad oficial y el siguiente secuencial es exactamente base + 1 (ej: 327).
  if (typeof currentSecuencialBase === 'number' && currentSecuencialBase >= MIN_INVOICE_SEQUENCE_BASE) {
    return currentSecuencialBase + 1;
  }

  let maxSeq = MIN_INVOICE_SEQUENCE_BASE;

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SEQUENCE_STORAGE_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > maxSeq) {
          maxSeq = parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  if (Array.isArray(invoicesList)) {
    for (const inv of invoicesList) {
      // No tomar en cuenta facturas emitidas en ambiente de pruebas (1)
      if (inv.ambiente === '1') continue;
      // No tomar en cuenta facturas anuladas ni aquellas que fallaron/fueron devueltas sin autorización
      if (inv.status === 'anulada') continue;
      if (inv.sriStatus && inv.sriStatus !== 'AUTORIZADO') continue;

      const num = parseInt(inv.invoiceNumber?.replace(/\D/g, '')?.slice(-9) || '0', 10);
      if (num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  return maxSeq + 1;
}

export function recordUsedInvoiceSequence(seq: number): void {
  if (typeof window !== 'undefined' && seq >= MIN_INVOICE_SEQUENCE_BASE) {
    try {
      localStorage.setItem(SEQUENCE_STORAGE_KEY, String(seq));
    } catch {
      // ignore
    }
  }
}

export function DistributionProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.clients)) return parsed.clients;
        }
      } catch {}
    }
    return [];
  });

  const [catalog, setCatalog] = useState<JavaProductOption[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.catalog) && parsed.catalog.length > 0) return parsed.catalog;
        }
      } catch {}
    }
    return JAVA_PRODUCT_CATALOG;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.orders)) {
            const now = new Date();
            return parsed.orders.filter((o: Order) => {
              if (o.status === 'pending') return true;
              if (!o.createdAt) return false;
              const d = new Date(o.createdAt);
              return (
                d.getFullYear() === now.getFullYear() &&
                d.getMonth() === now.getMonth() &&
                d.getDate() === now.getDate()
              );
            });
          }
        }
      } catch {}
    }
    return INITIAL_ORDERS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.invoices)) return parsed.invoices;
        }
      } catch {}
    }
    return INITIAL_INVOICES;
  });

  const [currentSecuencial, setCurrentSecuencial] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(SEQUENCE_STORAGE_KEY);
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed) && parsed >= MIN_INVOICE_SEQUENCE_BASE) {
            return parsed;
          }
        }
      } catch {
        // ignore
      }
    }
    return MIN_INVOICE_SEQUENCE_BASE;
  });

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Filtros de pedidos y estado de carga
  const [ordersFilter, setOrdersFilter] = useState<GetOrdersOptions>({ datePreset: 'today' });
  const [isOrdersLoading, setIsOrdersLoading] = useState<boolean>(false);

  const loadOrders = async (options?: GetOrdersOptions) => {
    setIsOrdersLoading(true);
    try {
      const opts = options || ordersFilter || { datePreset: 'today' };
      setOrdersFilter(opts);
      const dbOrders = await getOrdersFromDb(opts);
      if (dbOrders !== null) {
        setOrders((prev) => {
          const dbOrderIds = new Set(dbOrders.map((o) => o.id));
          // Solo preservar pedidos recién creados en los últimos 60 segundos (en vuelo / pendiente de sync)
          const recentInFlight = prev.filter(
            (o) => !dbOrderIds.has(o.id) && o.createdAt && Date.now() - new Date(o.createdAt).getTime() < 60000
          );
          return [...dbOrders, ...recentInFlight];
        });
      }
    } catch (err) {
      console.warn('Error al cargar pedidos:', err);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  // Sincronizar simultáneamente productos, clientes y órdenes con Supabase
  const refreshData = async () => {
    try {
      const isPortal = typeof window !== 'undefined' && window.location.pathname.startsWith('/p/');
      if (isPortal) {
        // En portales públicos de clientes (/p/...), solo cargar el catálogo para privacidad y velocidad
        const dbProducts = await getProductsFromDb();
        if (dbProducts !== null) setCatalog(dbProducts);
        return;
      }

      const [dbProducts, dbClients, dbOrders, dbInvoices, dbTaxProfile] = await Promise.all([
        getProductsFromDb(),
        getClientsFromDb(),
        getOrdersFromDb(ordersFilter || { datePreset: 'today' }),
        getInvoicesFromDb(),
        getCompanyTaxProfileFromDb(),
      ]);

      if (dbTaxProfile && typeof dbTaxProfile.current_secuencial === 'number') {
        const profileSeq = Math.max(dbTaxProfile.current_secuencial, MIN_INVOICE_SEQUENCE_BASE);
        setCurrentSecuencial(profileSeq);
        recordUsedInvoiceSequence(profileSeq);
      }

      if (dbProducts !== null) {
        setCatalog(dbProducts);
      }
      if (dbClients !== null) {
        setClients((prev) => {
          const dbClientIds = new Set(dbClients.map((c) => c.id));
          // Preservar clientes recién creados en los últimos 60 segundos (en vuelo / pendiente de sync)
          const recentInFlight = prev.filter(
            (c) => !dbClientIds.has(c.id) && c.createdAt && Date.now() - new Date(c.createdAt).getTime() < 60000
          );
          return [...dbClients, ...recentInFlight];
        });
        setSelectedClientId((prev) =>
          dbClients.some((c) => c.id === prev) ? prev : (dbClients[0]?.id || '')
        );
      }
      if (dbInvoices !== null) {
        setInvoices(dbInvoices);
      }
      if (dbOrders !== null) {
        const invList = dbInvoices || invoices;
        const invoiceMap = new Map((invList || []).map((inv) => [inv.id, inv.invoiceNumber]));
        const invoiceOrderMap = new Map((invList || []).map((inv) => [inv.orderId, inv.invoiceNumber]));

        setOrders((prev) => {
          const dbOrderIds = new Set(dbOrders.map((o) => o.id));
          // Solo preservar pedidos recién creados en los últimos 60 segundos (en vuelo / pendiente de sync)
          const recentInFlight = prev.filter(
            (o) => !dbOrderIds.has(o.id) && o.createdAt && Date.now() - new Date(o.createdAt).getTime() < 60000
          );
          const combined = [...dbOrders, ...recentInFlight];
          return combined.map((o) => {
            const foundNum = (o.invoiceId ? invoiceMap.get(o.invoiceId) : null) || invoiceOrderMap.get(o.id) || o.invoiceNumber;
            return foundNum ? { ...o, invoiceNumber: foundNum } : o;
          });
        });
      }
    } catch (err) {
      console.warn('Error al sincronizar datos desde Supabase:', err);
    }
  };

  // Carga inicial: leer caché local y sincronizar de inmediato con Supabase PostgreSQL
  useEffect(() => {
    const isPortal = typeof window !== 'undefined' && window.location.pathname.startsWith('/p/');
    if (!isPortal) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.clients)) setClients(parsed.clients);
          if (Array.isArray(parsed.catalog) && parsed.catalog.length > 0) setCatalog(parsed.catalog);
          if (Array.isArray(parsed.invoices)) setInvoices(parsed.invoices);
          if (Array.isArray(parsed.orders)) {
            const now = new Date();
            const todayOrders = parsed.orders.filter((o: Order) => {
              if (o.status === 'pending') return true;
              if (!o.createdAt) return false;
              const d = new Date(o.createdAt);
              return (
                d.getFullYear() === now.getFullYear() &&
                d.getMonth() === now.getMonth() &&
                d.getDate() === now.getDate()
              );
            });
            setOrders(todayOrders);
          }
          if (parsed.clients && parsed.clients.length > 0 && !selectedClientId) {
            setSelectedClientId(parsed.clients[0].id);
          }
        }
      } catch {
        // ignore
      }
    }

    // La verdad de la base de datos toma precedencia sobre la caché
    refreshData();
  }, []);

  // Guardar en almacenamiento local como captura rápida (Supabase es la única fuente de verdad)
  useEffect(() => {
    const isPortal = typeof window !== 'undefined' && window.location.pathname.startsWith('/p/');
    if (isPortal) return; // No sobreescribir la base de clientes administrativa desde un portal individual

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          clients,
          catalog,
          orders,
          invoices,
        })
      );
    } catch {
      // ignore
    }
  }, [clients, catalog, orders, invoices]);

  // Carga bajo demanda y aislada para el portal del cliente
  const loadClientPortalData = async (token: string) => {
    try {
      const dbClients = await getClientsByTokenFromDb(token);
      if (!dbClients || dbClients.length === 0) {
        return { client: null, matchingClients: [], orders: [], invoices: [] };
      }

      setClients((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newToAdd = dbClients.filter((c) => !existingIds.has(c.id));
        return [...prev, ...newToAdd];
      });

      const primary = dbClients[0];
      setSelectedClientId(primary.id);

      const [clientOrders, clientInvoices] = await Promise.all([
        getOrdersByClientIdFromDb(primary.id),
        getInvoicesByClientIdFromDb(primary.id),
      ]);

      if (clientOrders) {
        setOrders((prev) => {
          const fetchedIds = new Set(clientOrders.map((o) => o.id));
          const kept = prev.filter((o) => !fetchedIds.has(o.id));
          return [...clientOrders, ...kept];
        });
      }

      if (clientInvoices) {
        setInvoices((prev) => {
          const fetchedIds = new Set(clientInvoices.map((i) => i.id));
          const kept = prev.filter((i) => !fetchedIds.has(i.id));
          return [...clientInvoices, ...kept];
        });
      }

      return {
        client: primary,
        matchingClients: dbClients,
        orders: clientOrders || [],
        invoices: clientInvoices || [],
      };
    } catch (err) {
      console.warn('Error al cargar datos del portal de cliente:', err);
      return { client: null, matchingClients: [], orders: [], invoices: [] };
    }
  };

  // Limpiar toda la caché local y re-sincronizar estrictamente desde Supabase
  const clearLocalCache = async () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.clear();
    } catch {
      // ignore
    }
    await refreshData();
  };

  // Cart operations
  const addToCart = (newItem: CartItem) => {
    setCart((prev) => {
      // Auto-conversión si el nuevo ítem trae suficientes unidades para armar paquetes
      const itemExtraJavas = Math.floor((newItem.quantityUnits || 0) / (newItem.unitsPerJava || 12));
      const normalizedUnits = (newItem.quantityUnits || 0) % (newItem.unitsPerJava || 12);
      const normalizedJavas = newItem.quantityJavas + itemExtraJavas;

      const normalizedItem: CartItem = {
        ...newItem,
        quantityJavas: normalizedJavas,
        quantityUnits: normalizedUnits,
        totalBottles: (normalizedJavas * (newItem.unitsPerJava || 12)) + normalizedUnits,
        subtotal: Number(
          ((normalizedJavas * newItem.pricePerJava) + (normalizedUnits * newItem.pricePerUnit)).toFixed(2)
        ),
      };

      const existingIndex = prev.findIndex(
        (item) =>
          item.productOptionId === normalizedItem.productOptionId &&
          item.flavorType === normalizedItem.flavorType &&
          item.selectedFlavor === normalizedItem.selectedFlavor &&
          JSON.stringify(item.surtidoDetails || {}) === JSON.stringify(normalizedItem.surtidoDetails || {})
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const rawUnits = (existing.quantityUnits || 0) + normalizedItem.quantityUnits;
        const extraJavas = Math.floor(rawUnits / (existing.unitsPerJava || 12));
        const combinedUnits = rawUnits % (existing.unitsPerJava || 12);
        const combinedJavas = existing.quantityJavas + normalizedItem.quantityJavas + extraJavas;
        const combinedBottles = (combinedJavas * existing.unitsPerJava) + combinedUnits;
        const combinedSubtotal = Number(
          ((combinedJavas * existing.pricePerJava) + (combinedUnits * existing.pricePerUnit)).toFixed(2)
        );

        updated[existingIndex] = {
          ...existing,
          quantityJavas: combinedJavas,
          quantityUnits: combinedUnits,
          totalBottles: combinedBottles,
          subtotal: combinedSubtotal,
        };
        return updated;
      }

      return [...prev, normalizedItem];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateCartQuantity = (
    itemId: string,
    quantityJavas: number,
    quantityUnits?: number
  ) => {
    if (quantityJavas <= 0 && (quantityUnits === undefined || quantityUnits <= 0)) {
      removeFromCart(itemId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const rawUnits = quantityUnits !== undefined ? Math.max(0, quantityUnits) : (item.quantityUnits || 0);
          const extraJavas = Math.floor(rawUnits / (item.unitsPerJava || 12));
          const qU = rawUnits % (item.unitsPerJava || 12);
          const qJ = Math.max(0, quantityJavas) + extraJavas;
          const totalBottles = (qJ * item.unitsPerJava) + qU;
          const subtotal = Number(((qJ * item.pricePerJava) + (qU * item.pricePerUnit)).toFixed(2));
          return {
            ...item,
            quantityJavas: qJ,
            quantityUnits: qU,
            totalBottles,
            subtotal,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotalAmount = Number(cart.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  const cartTotalJavas = cart.reduce((sum, item) => sum + item.quantityJavas, 0);
  const cartTotalUnits = cart.reduce((sum, item) => sum + (item.quantityUnits || 0), 0);
  const cartTotalBottles = cart.reduce((sum, item) => sum + (item.totalBottles || (item.quantityJavas * item.unitsPerJava)), 0);

  // Add Client
  const addClient = async (clientData: Omit<Client, 'id' | 'qrToken' | 'createdAt'>): Promise<Client> => {
    const cleanTaxId = clientData.taxId?.trim().replace(/\D/g, '');
    const cleanPhone = clientData.whatsappNumber?.trim().replace(/\D/g, '');

    // Prioridad 1: Cédula o RUC (10 o 13 dígitos)
    // Prioridad 2: Número de WhatsApp limpio
    // Prioridad 3: Slug legible del negocio o nombre completo
    let qrToken = '';
    if (cleanTaxId && cleanTaxId.length >= 10) {
      // Verificar si ya existe otro cliente con este mismo taxId (sucursales múltiples)
      const existingWithSameTaxId = clients.filter(
        (c) => c.taxId && c.taxId.trim().replace(/\D/g, '') === cleanTaxId
      );

      if (existingWithSameTaxId.length === 0) {
        // Primera ubicación / Matriz
        qrToken = cleanTaxId;
      } else {
        // Sucursal adicional con la misma cédula/RUC:
        // Extraer sufijo inteligente basado en ubicación o nombre del negocio
        const addressText = (clientData.addressReference || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const businessText = (clientData.businessName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        let branchTag = '';
        if (addressText.includes('norte') || businessText.includes('norte')) branchTag = 'norte';
        else if (addressText.includes('sur') || businessText.includes('sur')) branchTag = 'sur';
        else if (addressText.includes('centro') || businessText.includes('centro')) branchTag = 'centro';
        else {
          const words = businessText.replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/);
          const lastWord = words[words.length - 1];
          if (lastWord && lastWord.length > 2 && !['local', 'tienda', 'bodega', 'minimarket'].includes(lastWord)) {
            branchTag = lastWord;
          } else {
            branchTag = `sucursal-${existingWithSameTaxId.length + 1}`;
          }
        }

        let candidateToken = `${cleanTaxId}-${branchTag}`;
        if (clients.some((c) => c.qrToken === candidateToken)) {
          candidateToken = `${cleanTaxId}-${branchTag}-${existingWithSameTaxId.length + 1}`;
        }
        qrToken = candidateToken;
      }
    } else if (cleanPhone && cleanPhone.length >= 9) {
      const phoneToken = cleanPhone.startsWith('593') ? cleanPhone.slice(3) : cleanPhone;
      if (clients.some((c) => c.qrToken === phoneToken)) {
        qrToken = `${phoneToken}-${Math.floor(100 + Math.random() * 900)}`;
      } else {
        qrToken = phoneToken;
      }
    } else {
      const slug = (clientData.businessName || clientData.fullName)
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      qrToken = `${slug || 'cliente'}-${randomSuffix}`;
    }

    const validUuid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });

    const newClient: Client = {
      ...clientData,
      id: validUuid,
      qrToken,
      creditLimit: clientData.creditLimit || 0.00,
      currentDebt: 0.00,
      createdAt: new Date().toISOString(),
    };

    setClients((prev) => [newClient, ...prev]);
    setSelectedClientId(newClient.id);

    // Persistir a Supabase y esperar confirmación
    const res = await saveClientToDb(newClient);
    if (!res.success) {
      console.warn('Advertencia al guardar cliente en Supabase:', res.error);
    }

    return newClient;
  };

  // Update Client
  const updateClient = (updatedClient: Client) => {
    const cleanTaxId = updatedClient.taxId?.trim().replace(/\D/g, '');
    let finalClient = updatedClient;

    // Si tiene cédula/RUC y su token actual era legacy ("aneth-...") o está vacío o correspondía a un taxId anterior:
    if (cleanTaxId && cleanTaxId.length >= 10 && (!updatedClient.qrToken || updatedClient.qrToken.startsWith('aneth-') || /^\d{10,13}$/.test(updatedClient.qrToken))) {
      finalClient = {
        ...updatedClient,
        qrToken: cleanTaxId,
      };
    }

    setClients((prev) =>
      prev.map((c) => (c.id === finalClient.id ? finalClient : c))
    );

    // Persist to Supabase in background
    saveClientToDb(finalClient).catch((err) => {
      console.warn('Error updating client in Supabase:', err);
    });
  };

  // Delete Client
  const deleteClient = async (clientId: string): Promise<boolean> => {
    try {
      const target = clients.find((c) => c.id === clientId);
      const res = await deleteClientFromDb(clientId, target?.qrToken);
      if (res.success) {
        setClients((prev) => prev.filter((c) => c.id !== clientId));
        if (selectedClientId === clientId) {
          setSelectedClientId('');
        }
        return true;
      }
      console.error('No se pudo eliminar el cliente en Supabase:', res.error);
      return false;
    } catch (err) {
      console.warn('Error deleting client from Supabase:', err);
      return false;
    }
  };

  // Create Order
  const createOrder = ({
    clientId,
    items,
    paymentMethod,
    saleType = 'preventa',
    scheduledDeliveryDate,
    scheduledTimeSlot,
    promisedCollectionDate,
    promisedCollectionTime,
    amountPaid,
    paymentProofUrl,
    notes,
    customLocation,
  }: {
    clientId: string;
    items: CartItem[];
    paymentMethod: PaymentMethod;
    saleType?: SaleType;
    scheduledDeliveryDate?: string;
    scheduledTimeSlot?: string;
    promisedCollectionDate?: string;
    promisedCollectionTime?: string;
    amountPaid?: number;
    paymentProofUrl?: string;
    notes?: string;
    customLocation?: { latitude: number; longitude: number; addressReference?: string };
  }): Order => {
    const client = clients.find((c) => c.id === clientId) || clients[0];
    const totalAmount = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
    const totalJavas = items.reduce((sum, item) => sum + item.quantityJavas, 0);
    const totalUnits = items.reduce((sum, item) => sum + (item.quantityUnits || 0), 0);
    const totalBottles = items.reduce((sum, item) => sum + (item.totalBottles || (item.quantityJavas * item.unitsPerJava)), 0);

    const actualAmountPaid = amountPaid !== undefined
      ? Math.max(0, Number(amountPaid))
      : (paymentMethod === 'cash' || paymentMethod === 'deuna' || paymentMethod === 'transfer' ? totalAmount : 0);

    const debtBalance = Math.max(0, Number((totalAmount - actualAmountPaid).toFixed(2)));

    let paymentStatus: PaymentStatus = 'pending';
    if (actualAmountPaid >= totalAmount) {
      paymentStatus = 'paid';
    } else if (actualAmountPaid > 0) {
      paymentStatus = 'partial';
    }

    const orderNum = generateOrderNumber(client);

    const formattedNotes = notes
      ? (promisedCollectionDate ? `[Cobro saldo: ${promisedCollectionDate} ${promisedCollectionTime || ''}] ${notes}` : notes)
      : (promisedCollectionDate ? `Cobro saldo programado: ${promisedCollectionDate} (${promisedCollectionTime || 'En ruta'})` : undefined);

    const newOrder: Order = {
      id: generateUuid(),
      orderNumber: orderNum,
      clientId: client?.id || 'guest',
      clientName: client?.fullName || 'Cliente Mostrador',
      businessName: client?.businessName || 'Local Registrado',
      whatsappNumber: client?.whatsappNumber || '+593',
      latitude: customLocation?.latitude ?? client?.latitude ?? -0.180653,
      longitude: customLocation?.longitude ?? client?.longitude ?? -78.467834,
      addressReference: customLocation?.addressReference ?? client?.addressReference ?? '',
      items: [...items],
      totalJavas,
      totalUnits,
      totalBottles,
      totalAmount,
      status: saleType === 'autoventa' ? 'delivered' : (scheduledDeliveryDate ? 'scheduled' : 'pending'),
      saleType,
      scheduledDeliveryDate,
      scheduledTimeSlot,
      promisedCollectionDate,
      promisedCollectionTime,
      paymentStatus,
      paymentMethod,
      amountPaid: actualAmountPaid,
      debtBalance,
      paymentProofUrl,
      notes: formattedNotes,
      createdAt: new Date().toISOString(),
      deliveredAt: saleType === 'autoventa' ? new Date().toISOString() : undefined,
    };

    // Update client debt if applicable
    if (client && debtBalance > 0) {
      const updatedDebt = Number(((client.currentDebt || 0) + debtBalance).toFixed(2));
      setClients((prev) =>
        prev.map((c) =>
          c.id === client.id
            ? { ...c, currentDebt: updatedDebt }
            : c
        )
      );
      updateClientDebtInDb(client.id, updatedDebt).catch(() => {});
    }

    // Deduct stock
    items.forEach((item) => {
      setCatalog((prev) =>
        prev.map((c) =>
          c.id === item.productOptionId
            ? { ...c, stockJavas: Math.max(0, c.stockJavas - item.quantityJavas) }
            : c
        )
      );
    });

    // Facturación: Los pedidos se crean sin factura automática.
    // La factura se genera únicamente cuando el usuario presiona "Generar Factura" de forma explícita.

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();

    if (typeof window !== 'undefined') {
      try {
        const rawLocal = localStorage.getItem(STORAGE_KEY);
        const parsed = rawLocal ? JSON.parse(rawLocal) : {};
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            ...parsed,
            orders: [newOrder, ...(parsed.orders || [])],
          })
        );
      } catch {}
    }

    // Async save to Supabase
    saveOrderToDb(newOrder).catch((err) => console.warn('Sync DB error:', err));

    if (actualAmountPaid > 0) {
      savePaymentToDb({
        id: generateUuid(),
        orderId: newOrder.id,
        clientId: client?.id || '',
        amount: actualAmountPaid,
        paymentMethod,
        paymentProofUrl,
        notes: `Cobro inicial registrado en pedido ${orderNum}`,
        recordedAt: new Date().toISOString(),
      }).catch((err) => console.warn('Error al guardar pago inicial en Supabase:', err));
    }

    return newOrder;
  };

  const cancelOrder = (orderId: string): boolean => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return false;
    if (order.status === 'cancelled') return false; // Ya está cancelado

    // 1. Reintegrar stock a inventario (paquetes y unidades)
    order.items.forEach((item) => {
      setCatalog((prev) =>
        prev.map((c) =>
          c.id === item.productOptionId
            ? { ...c, stockJavas: c.stockJavas + item.quantityJavas }
            : c
        )
      );
    });

    // 2. Descontar la deuda del cliente si este pedido tenía saldo pendiente
    if (order.debtBalance > 0 && order.clientId) {
      setClients((prev) =>
        prev.map((c) => {
          if (c.id === order.clientId) {
            const adjustedDebt = Math.max(0, (c.currentDebt || 0) - order.debtBalance);
            updateClientDebtInDb(c.id, adjustedDebt).catch((err) =>
              console.warn('Error al sincronizar deuda al cancelar:', err)
            );
            return { ...c, currentDebt: adjustedDebt };
          }
          return c;
        })
      );
    }

    // 3. Opción Legal Automatizada SRI: Emisión de NOTA DE CRÉDITO ELECTRÓNICA (Tipo 04)
    // Solo si el pedido ya fue facturado (Autoventa o Preventa ya despachada)
    const linkedInvoice = invoices.find(
      (inv) => inv.orderId === orderId || inv.id === order.invoiceId
    );

    if (linkedInvoice && linkedInvoice.status !== 'anulada') {
      const ncSeq = invoices.filter((i) => i.status === 'anulada').length + 1;
      const creditNoteNumber = `001-001-${String(ncSeq).padStart(9, '0')}`;
      const ncClaveAcceso = generarClaveAcceso({
        fecha: new Date(),
        tipoComprobante: '04', // Nota de Crédito
        ruc: DEFAULT_TAX_PROFILE.ruc,
        ambiente: '1', // Pruebas
        establecimiento: DEFAULT_TAX_PROFILE.establecimiento || '001',
        puntoEmision: DEFAULT_TAX_PROFILE.puntoEmision || '001',
        secuencial: ncSeq,
      });

      // Anular factura en el sistema asociando la Nota de Crédito
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === linkedInvoice.id
            ? {
                ...inv,
                status: 'anulada',
                creditNoteId: `nc-${Date.now()}`,
                creditNoteNumber,
              }
            : inv
        )
      );

      // Transmisión de la Nota de Crédito electrónica al SRI (SOAP Offline)
      fetch('/api/sri/nota-credito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice: linkedInvoice,
          order,
          secuencial: ncSeq,
          motivo: 'ANULACION DE PEDIDO Y COMPROBANTE',
        }),
      }).catch((err) => console.warn('Error al transmitir Nota de Crédito al SRI:', err));
    }

    // 4. Actualizar estado local del pedido a 'cancelled'
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
    );

    // 5. Persistir estado en Supabase
    updateOrderStatusInDb(order.id, 'cancelled').catch((err) =>
      console.warn('Error al actualizar orden cancelada en Supabase:', err)
    );

    return true;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const deliveredAtTime = status === 'delivered' ? new Date().toISOString() : undefined;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status,
            deliveredAt: deliveredAtTime || o.deliveredAt,
          };
        }
        return o;
      })
    );

    updateOrderStatusInDb(orderId, {
      status,
      deliveredAt: deliveredAtTime,
    }).catch((err) =>
      console.warn('Error al sincronizar estado de orden en Supabase:', err)
    );
  };

  const updatePaymentStatus = (orderId: string, status: PaymentStatus) => {
    let finalPaid: number | undefined;
    let finalDebt: number | undefined;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const amountPaid = status === 'paid' ? o.totalAmount : o.amountPaid;
          const debtBalance = status === 'paid' ? 0 : o.debtBalance;
          finalPaid = amountPaid;
          finalDebt = debtBalance;
          return { ...o, paymentStatus: status, amountPaid, debtBalance };
        }
        return o;
      })
    );

    updateOrderStatusInDb(orderId, {
      paymentStatus: status,
      amountPaid: finalPaid,
      debtBalance: finalDebt,
    }).catch((err) => console.warn('Error al sincronizar estado de pago en Supabase:', err));
  };

  const updateOrderSchedule = (orderId: string, date: string, timeSlot?: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'scheduled',
              scheduledDeliveryDate: date,
              scheduledTimeSlot: timeSlot || o.scheduledTimeSlot,
            }
          : o
      )
    );

    updateOrderStatusInDb(orderId, {
      status: 'scheduled',
      scheduledDeliveryDate: date,
      scheduledTimeSlot: timeSlot,
    }).catch((err) => console.warn('Error al sincronizar agenda de entrega en Supabase:', err));
  };

  const recordOrderPayment = (
    orderId: string,
    amount: number,
    method: PaymentMethod,
    proofUrl?: string
  ) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (targetOrder) {
      savePaymentToDb({
        id: generateUuid(),
        orderId: targetOrder.id,
        clientId: targetOrder.clientId,
        amount,
        paymentMethod: method,
        paymentProofUrl: proofUrl,
        notes: `Abono a orden ${targetOrder.orderNumber}`,
        recordedAt: new Date().toISOString(),
      }).catch((err) => console.warn('Error al guardar pago en Supabase:', err));
    }

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const newPaid = Number((o.amountPaid + amount).toFixed(2));
          const newDebt = Math.max(0, Number((o.totalAmount - newPaid).toFixed(2)));
          const paymentStatus: PaymentStatus = newDebt === 0 ? 'paid' : 'partial';

          // Update client debt balance
          if (o.clientId) {
            const client = clients.find((c) => c.id === o.clientId);
            if (client) {
              const updatedDebt = Math.max(0, Number(((client.currentDebt || 0) - amount).toFixed(2)));
              setClients((cPrev) =>
                cPrev.map((c) =>
                  c.id === o.clientId
                    ? { ...c, currentDebt: updatedDebt }
                    : c
                )
              );
              updateClientDebtInDb(client.id, updatedDebt).catch(() => {});
            }
          }

          updateOrderStatusInDb(orderId, {
            amountPaid: newPaid,
            debtBalance: newDebt,
            paymentStatus,
            paymentMethod: method,
          }).catch((err) => console.warn('Error al actualizar abono de orden en Supabase:', err));

          return {
            ...o,
            amountPaid: newPaid,
            debtBalance: newDebt,
            paymentStatus,
            paymentMethod: method,
            paymentProofUrl: proofUrl || o.paymentProofUrl,
          };
        }
        return o;
      })
    );
  };

  const generateInvoice = (orderId: string): Invoice | null => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return null;

    const existing = invoices.find((inv) => inv.orderId === orderId && inv.status !== 'anulada');
    if (existing) {
      if (existing.sriStatus === 'AUTORIZADO') {
        return existing;
      }

      // Si la factura NO está autorizada y el secuencial esperado difiere del actual (ej: tenía 328 y debe ser 327)
      const expectedSeq = getNextInvoiceSequence(invoices.filter((i) => i.id !== existing.id), currentSecuencial);
      const existingSeq = parseInt(existing.invoiceNumber.replace(/\D/g, '').slice(-9), 10);
      if (existingSeq !== expectedSeq) {
        const invoiceNum = `001-001-${String(expectedSeq).padStart(9, '0')}`;
        const ambienteVal: '1' | '2' = ((DEFAULT_TAX_PROFILE.ambiente || '2') === '1' ? '1' : '2') as '1' | '2';
        const claveAcceso = generarClaveAcceso({
          fecha: new Date(),
          ruc: DEFAULT_TAX_PROFILE.ruc,
          ambiente: ambienteVal,
          establecimiento: DEFAULT_TAX_PROFILE.establecimiento || '001',
          puntoEmision: DEFAULT_TAX_PROFILE.puntoEmision || '001',
          secuencial: expectedSeq,
        });
        const corrected: Invoice = {
          ...existing,
          invoiceNumber: invoiceNum,
          claveAcceso,
          sriStatus: 'PENDING',
          sriAuthorizationNumber: undefined,
          sriAuthorizationDate: undefined,
          sriErrorMessage: undefined,
        };
        setInvoices((prev) => prev.map((i) => (i.id === existing.id ? corrected : i)));
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, invoiceId: corrected.id, invoiceNumber: corrected.invoiceNumber } : o))
        );
        saveInvoiceToDb(corrected).catch(console.warn);

        // Retransmitir en segundo plano al SRI con el nuevo secuencial oficial corregido
        fetch('/api/sri/facturar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order: {
              ...order,
              paymentMethod: order.paymentMethod || 'cash',
            },
            client: {
              fullName: corrected.clientName,
              businessName: corrected.businessName,
              taxId: corrected.clientTaxId,
              taxIdType: corrected.clientTaxIdType,
              whatsappNumber: corrected.clientWhatsapp,
              email: corrected.clientEmail,
              addressReference: corrected.clientAddress,
            },
            secuencial: expectedSeq,
            claveAcceso,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data && data.sriStatus) {
              const updatedInv: Invoice = {
                ...corrected,
                claveAcceso: data.claveAcceso || corrected.claveAcceso,
                sriStatus: data.sriStatus,
                sriAuthorizationNumber: data.numeroAutorizacion,
                sriAuthorizationDate: data.fechaAutorizacion,
                sriErrorMessage: data.error,
                xmlContent: data.xml,
              };
              setInvoices((prev) => prev.map((inv) => (inv.id === corrected.id ? updatedInv : inv)));
              saveInvoiceToDb(updatedInv).catch(console.warn);
              if (data.sriStatus === 'AUTORIZADO' || data.sriStatus === 'RECIBIDA') {
                setCurrentSecuencial(expectedSeq);
                recordUsedInvoiceSequence(expectedSeq);
                updateCompanySecuencialInDb(expectedSeq).catch(console.warn);
              }
            }
          })
          .catch((err) => console.warn('SRI sync error on re-sequence:', err));

        return corrected;
      }
      return existing;
    }

    const client = clients.find((c) => c.id === order.clientId);
    const facturaLines = expandCartItemsToFacturaLines(order.items, 15);
    const subtotal15 = Number(facturaLines.reduce((s, l) => s + l.precioTotalSinImpuesto, 0).toFixed(2));
    const tax15 = Number(facturaLines.reduce((s, l) => s + l.iva, 0).toFixed(2));
    const seqNumber = getNextInvoiceSequence(invoices, currentSecuencial);

    const invoiceNum = `001-001-${String(seqNumber).padStart(9, '0')}`;
    const ambienteVal: '1' | '2' = ((DEFAULT_TAX_PROFILE.ambiente || '2') === '1' ? '1' : '2') as '1' | '2';
    const claveAcceso = generarClaveAcceso({
      fecha: new Date(),
      ruc: DEFAULT_TAX_PROFILE.ruc,
      ambiente: ambienteVal,
      establecimiento: DEFAULT_TAX_PROFILE.establecimiento || '001',
      puntoEmision: DEFAULT_TAX_PROFILE.puntoEmision || '001',
      secuencial: seqNumber,
    });

    const newInvoice: Invoice = {
      id: generateUuid(),
      invoiceNumber: invoiceNum,
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentMethod: order.paymentMethod || 'cash',
      clientId: order.clientId,
      clientName: client?.fullName || order.clientName || 'Consumidor Final',
      businessName: client?.businessName || order.businessName || 'Local Registrado',
      clientTaxId: client?.taxId || '9999999999999',
      clientTaxIdType: client?.taxIdType || '07',
      clientEmail: client?.email || '',
      clientWhatsapp: order.whatsappNumber || client?.whatsappNumber || '',
      clientAddress: order.addressReference || client?.addressReference || '',
      items: order.items,
      totalJavas: order.totalJavas,
      totalUnits: order.totalUnits || 0,
      subtotal: subtotal15,
      subtotal15: subtotal15,
      subtotal0: 0,
      tax: tax15,
      total: order.totalAmount,
      claveAcceso,
      ambiente: ambienteVal,
      sriStatus: 'PENDING',
      issuedAt: new Date().toISOString(),
      status: order.paymentStatus === 'paid' ? 'pagada' : 'emitida',
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, invoiceId: newInvoice.id, invoiceNumber: newInvoice.invoiceNumber }
          : o
      )
    );

    if (typeof window !== 'undefined') {
      try {
        const rawLocal = localStorage.getItem(STORAGE_KEY);
        const parsed = rawLocal ? JSON.parse(rawLocal) : {};
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            ...parsed,
            invoices: [newInvoice, ...(parsed.invoices || [])],
          })
        );
      } catch {}
    }

    // Persistir factura en Supabase y vincular con la orden
    saveInvoiceToDb(newInvoice).catch((err) =>
      console.warn('Error al guardar factura en Supabase:', err)
    );
    updateOrderStatusInDb(order.id, {
      invoiceId: newInvoice.id,
      invoiceNumber: newInvoice.invoiceNumber,
    }).catch(() => {});

    // Iniciar transmisión oficial al WebService del SRI en segundo plano
    fetch('/api/sri/facturar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order: {
          ...order,
          paymentMethod: order.paymentMethod || 'cash',
        },
        client: {
          fullName: newInvoice.clientName,
          businessName: newInvoice.businessName,
          taxId: newInvoice.clientTaxId,
          taxIdType: newInvoice.clientTaxIdType,
          whatsappNumber: newInvoice.clientWhatsapp,
          email: newInvoice.clientEmail,
          addressReference: newInvoice.clientAddress,
        },
        secuencial: seqNumber,
        claveAcceso,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.sriStatus) {
          const updatedInv: Invoice = {
            ...newInvoice,
            claveAcceso: data.claveAcceso || newInvoice.claveAcceso,
            sriStatus: data.sriStatus,
            sriAuthorizationNumber: data.numeroAutorizacion,
            sriAuthorizationDate: data.fechaAutorizacion,
            sriErrorMessage: data.error,
            xmlContent: data.xml,
          };
          setInvoices((prev) =>
            prev.map((inv) => (inv.id === newInvoice.id ? updatedInv : inv))
          );
          saveInvoiceToDb(updatedInv).catch((err) =>
            console.warn('Error al actualizar factura SRI en Supabase:', err)
          );

          // ¡ÚNICAMENTE si fue AUTORIZADO o RECIBIDA por el SRI, avanzar el secuencial en la DB!
          if (data.sriStatus === 'AUTORIZADO' || data.sriStatus === 'RECIBIDA') {
            setCurrentSecuencial(seqNumber);
            recordUsedInvoiceSequence(seqNumber);
            updateCompanySecuencialInDb(seqNumber).catch(() => {});
          }
        }
      })
      .catch((err) => console.warn('SRI background sync error on manual generation:', err));

    return newInvoice;
  };

  const recordDebtPayment = (
    clientId: string,
    amount: number,
    method: PaymentMethod = 'cash',
    notes?: string
  ) => {
    let updatedDebt = 0;
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          updatedDebt = Math.max(0, Number(((c.currentDebt || 0) - amount).toFixed(2)));
          return { ...c, currentDebt: updatedDebt };
        }
        return c;
      })
    );

    updateClientDebtInDb(clientId, updatedDebt).catch((err) =>
      console.warn('Error al sincronizar saldo de cliente en Supabase:', err)
    );

    savePaymentToDb({
      id: generateUuid(),
      orderId: '',
      clientId,
      amount,
      paymentMethod: method,
      notes: notes || 'Abono general a deuda de cliente',
      recordedAt: new Date().toISOString(),
    }).catch((err) => console.warn('Error al guardar abono a deuda en Supabase:', err));
  };

  const updateStock = (optionId: string, newStock: number) => {
    setCatalog((prev) =>
      prev.map((c) => (c.id === optionId ? { ...c, stockJavas: Math.max(0, newStock) } : c))
    );
  };

  const ensureOrderLoaded = async (idOrNumber: string): Promise<Order | null> => {
    const clean = decodeURIComponent(idOrNumber).trim();
    if (!clean) return null;

    // 1. En memoria
    const existing = orders.find(
      (o) =>
        o.id === clean ||
        o.orderNumber === clean ||
        formatOrderNumber(o.orderNumber) === formatOrderNumber(clean)
    );
    if (existing) return existing;

    // 2. En caché localStorage (inmediato, sin latencia)
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.orders)) {
          const localMatch = parsed.orders.find(
            (o: any) =>
              o.id === clean ||
              o.orderNumber === clean ||
              formatOrderNumber(o.orderNumber) === formatOrderNumber(clean)
          );
          if (localMatch) {
            setOrders((prev) => (prev.some((o) => o.id === localMatch.id) ? prev : [localMatch, ...prev]));
            // Consulta en segundo plano para refrescar con datos del servidor
            getOrderByIdFromDb(localMatch.orderNumber || localMatch.id).then((fresh) => {
              if (fresh) {
                setOrders((prev) =>
                  prev.map((o) => (o.id === fresh.id || o.orderNumber === fresh.orderNumber ? fresh : o))
                );
              }
            }).catch(() => {});
            return localMatch;
          }
        }
      }
    } catch {
      // ignore
    }

    // 3. En base de datos Supabase
    const dbOrder = await getOrderByIdFromDb(clean);
    if (dbOrder) {
      setOrders((prev) => (prev.some((o) => o.id === dbOrder.id) ? prev : [dbOrder, ...prev]));
      return dbOrder;
    }
    return null;
  };

  const setManualSecuencial = async (newSeq: number): Promise<boolean> => {
    if (!newSeq || newSeq < MIN_INVOICE_SEQUENCE_BASE) return false;
    setCurrentSecuencial(newSeq);
    recordUsedInvoiceSequence(newSeq);
    return await updateCompanySecuencialInDb(newSeq);
  };

  const updateInvoiceSequence = async (invoiceId: string, newSeq: number): Promise<Invoice | null> => {
    if (!invoiceId || !newSeq || newSeq < MIN_INVOICE_SEQUENCE_BASE) return null;
    const inv = invoices.find(
      (i) => i.id === invoiceId || i.invoiceNumber === invoiceId || i.invoiceNumber.endsWith(String(newSeq).padStart(9, '0'))
    );
    if (!inv) return null;

    const formattedNum = `001-001-${String(newSeq).padStart(9, '0')}`;
    const ambienteVal: '1' | '2' = ((DEFAULT_TAX_PROFILE.ambiente || '2') === '1' ? '1' : '2') as '1' | '2';
    const nuevaClave = generarClaveAcceso({
      fecha: new Date(),
      ruc: DEFAULT_TAX_PROFILE.ruc,
      ambiente: ambienteVal,
      establecimiento: DEFAULT_TAX_PROFILE.establecimiento || '001',
      puntoEmision: DEFAULT_TAX_PROFILE.puntoEmision || '001',
      secuencial: newSeq,
    });

    const updated: Invoice = {
      ...inv,
      invoiceNumber: formattedNum,
      claveAcceso: nuevaClave,
      sriStatus: 'PENDING',
      sriAuthorizationNumber: undefined,
      sriAuthorizationDate: undefined,
      sriErrorMessage: undefined,
    };

    setInvoices((prev) => prev.map((i) => (i.id === inv.id ? updated : i)));
    await saveInvoiceToDb(updated);

    return updated;
  };

  return (
    <DistributionContext.Provider
      value={{
        clients,
        catalog,
        orders,
        invoices,
        ordersFilter,
        isOrdersLoading,
        loadOrders,
        selectedClientId,
        setSelectedClientId,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotalAmount,
        cartTotalJavas,
        cartTotalUnits,
        cartTotalBottles,
        addClient,
        updateClient,
        deleteClient,
        createOrder,
        cancelOrder,
        updateOrderStatus,
        updatePaymentStatus,
        updateOrderSchedule,
        recordOrderPayment,
        recordDebtPayment,
        generateInvoice,
        updateStock,
        refreshData,
        clearLocalCache,
        ensureOrderLoaded,
        loadClientPortalData,
        currentSecuencial,
        setManualSecuencial,
        updateInvoiceSequence,
      }}
    >
      {children}
    </DistributionContext.Provider>
  );
}

export function useDistribution() {
  const context = useContext(DistributionContext);
  if (!context) {
    throw new Error('useDistribution must be used within a DistributionProvider');
  }
  return context;
}
