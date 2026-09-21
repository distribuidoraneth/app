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
  GetOrdersOptions,
} from '@/lib/supabase/syncService';

interface DistributionContextType {
  // Data
  clients: Client[];
  catalog: JavaProductOption[];
  orders: Order[];
  invoices: Invoice[];

  // Orders Filter & Smart Querying
  ordersFilter: GetOrdersOptions;
  isOrdersLoading: boolean;
  loadOrders: (options?: GetOrdersOptions) => Promise<void>;

  // Active state
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

  // Actions
  addClient: (client: Omit<Client, 'id' | 'qrToken' | 'createdAt'>) => Client;
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
  ensureOrderLoaded: (idOrNumber: string) => Promise<Order | null>;
}

const DistributionContext = createContext<DistributionContextType | undefined>(undefined);

export const STORAGE_KEY = 'distribuidora_aneth_oficial_v12';

export function getNextInvoiceSequence(invoicesList: Invoice[]): number {
  const maxSeq = (invoicesList || []).reduce((max, inv) => {
    const num = parseInt(inv.invoiceNumber?.replace(/\D/g, '')?.slice(-9) || '0', 10);
    return num > max ? num : max;
  }, 113);
  return maxSeq + 1;
}

export function DistributionProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [catalog, setCatalog] = useState<JavaProductOption[]>(JAVA_PRODUCT_CATALOG);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);

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
      const [dbProducts, dbClients, dbOrders] = await Promise.all([
        getProductsFromDb(),
        getClientsFromDb(),
        getOrdersFromDb(ordersFilter || { datePreset: 'today' }),
      ]);

      if (dbProducts !== null) {
        setCatalog(dbProducts);
      }
      if (dbClients !== null) {
        setClients(dbClients);
        setSelectedClientId((prev) =>
          dbClients.some((c) => c.id === prev) ? prev : (dbClients[0]?.id || '')
        );
      }
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
      console.warn('Error al sincronizar datos desde Supabase:', err);
    }
  };

  // Carga inicial: leer caché local y sincronizar de inmediato con Supabase PostgreSQL
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.clients)) setClients(parsed.clients);
        if (Array.isArray(parsed.catalog) && parsed.catalog.length > 0) setCatalog(parsed.catalog);
        if (Array.isArray(parsed.invoices)) setInvoices(parsed.invoices);
        if (Array.isArray(parsed.orders)) {
          // En arranque inicial (filtro "today"), no hidratar pedidos ya entregados de días anteriores
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

    // La verdad de la base de datos toma precedencia sobre la caché
    refreshData();
  }, []);

  // Save to local storage (Merge with existing cached orders to preserve past days)
  useEffect(() => {
    try {
      let existingOrders: Order[] = [];
      let existingInvoices: Invoice[] = [];
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.orders)) existingOrders = parsed.orders;
        if (Array.isArray(parsed.invoices)) existingInvoices = parsed.invoices;
      }

      // Merge: current active orders take priority, then preserve previous orders by ID
      const mergedOrdersMap = new Map<string, Order>();
      orders.forEach((o) => mergedOrdersMap.set(o.id, o));
      existingOrders.forEach((o) => {
        if (!mergedOrdersMap.has(o.id)) {
          mergedOrdersMap.set(o.id, o);
        }
      });
      const combinedOrders = Array.from(mergedOrdersMap.values())
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 50);

      // Merge invoices
      const mergedInvoicesMap = new Map<string, Invoice>();
      invoices.forEach((i) => mergedInvoicesMap.set(i.id, i));
      existingInvoices.forEach((i) => {
        if (!mergedInvoicesMap.has(i.id)) {
          mergedInvoicesMap.set(i.id, i);
        }
      });
      const combinedInvoices = Array.from(mergedInvoicesMap.values())
        .sort((a, b) => new Date(b.issuedAt || 0).getTime() - new Date(a.issuedAt || 0).getTime())
        .slice(0, 30);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          clients,
          catalog,
          orders: combinedOrders,
          invoices: combinedInvoices,
        })
      );
    } catch {
      // ignore
    }
  }, [clients, catalog, orders, invoices]);

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
  const addClient = (clientData: Omit<Client, 'id' | 'qrToken' | 'createdAt'>): Client => {
    const slug = clientData.fullName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 20);
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    const qrToken = `aneth-${slug}-${randomSuffix}`;

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

    // Persist to Supabase in background
    saveClientToDb(newClient).catch((err) => {
      console.warn('Error saving client to Supabase:', err);
    });

    return newClient;
  };

  // Update Client
  const updateClient = (updatedClient: Client) => {
    setClients((prev) =>
      prev.map((c) => (c.id === updatedClient.id ? updatedClient : c))
    );

    // Persist to Supabase in background
    saveClientToDb(updatedClient).catch((err) => {
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

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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

    // Auto-generate Invoice ONLY for orders that are delivered immediately (Autoventa)
    // For Preventa, the invoice is generated automatically at the exact moment of dispatch/delivery
    if (saleType === 'autoventa') {
      const seqNumber = getNextInvoiceSequence(invoices);
      const invoiceNum = `001-001-${String(seqNumber).padStart(9, '0')}`;
      const facturaLines = expandCartItemsToFacturaLines(items, 15);
      const subtotal15 = Number(facturaLines.reduce((s, l) => s + l.precioTotalSinImpuesto, 0).toFixed(2));
      const tax = Number(facturaLines.reduce((s, l) => s + l.iva, 0).toFixed(2));
      const claveAcceso = generarClaveAcceso({
        fecha: new Date(),
        ruc: DEFAULT_TAX_PROFILE.ruc,
        ambiente: '1', // Ambiente de pruebas
        establecimiento: DEFAULT_TAX_PROFILE.establecimiento || '001',
        puntoEmision: DEFAULT_TAX_PROFILE.puntoEmision || '001',
        secuencial: seqNumber,
      });

      const newInvoice: Invoice = {
        id: `fac-${Date.now()}`,
        invoiceNumber: invoiceNum,
        orderId: newOrder.id,
        clientId: client?.id || 'guest',
        clientName: client?.fullName || 'Consumidor Final',
        businessName: client?.businessName || newOrder.businessName || 'Local Registrado',
        clientTaxId: client?.taxId || '9999999999999',
        clientTaxIdType: client?.taxIdType || '07',
        clientEmail: client?.email || '',
        clientWhatsapp: client?.whatsappNumber || newOrder.whatsappNumber,
        clientAddress: client?.addressReference || newOrder.addressReference,
        items: [...items],
        totalJavas,
        totalUnits,
        subtotal: subtotal15,
        subtotal15,
        subtotal0: 0,
        tax,
        total: totalAmount,
        claveAcceso,
        ambiente: '1',
        sriStatus: 'PENDING',
        status: 'emitida',
        issuedAt: new Date().toISOString(),
      };

      newOrder.invoiceId = newInvoice.id;
      setInvoices((prev) => [newInvoice, ...prev]);

      // Enviar a SRI y sincronizar estado oficial
      fetch('/api/sri/facturar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: newOrder,
          client,
          secuencial: seqNumber,
          claveAcceso,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.sriStatus) {
            setInvoices((prev) =>
              prev.map((inv) =>
                inv.id === newInvoice.id
                  ? {
                      ...inv,
                      claveAcceso: data.claveAcceso || inv.claveAcceso,
                      sriStatus: data.sriStatus,
                      sriAuthorizationNumber: data.numeroAutorizacion,
                      sriAuthorizationDate: data.fechaAutorizacion,
                      sriErrorMessage: data.error,
                      xmlContent: data.xml,
                    }
                  : inv
              )
            );
          }
        })
        .catch((err) => console.warn('SRI background sync error:', err));
    }

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();

    // Async save to Supabase
    saveOrderToDb(newOrder).catch((err) => console.warn('Sync DB error:', err));

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
    const targetOrder = orders.find((o) => o.id === orderId);
    let createdInvoiceId: string | undefined = targetOrder?.invoiceId;

    // Facturación automática al momento del Despacho/Entrega si no tenía factura previa (Preventa)
    if (status === 'delivered' && targetOrder && !targetOrder.invoiceId) {
      const client = clients.find((c) => c.id === targetOrder.clientId);
      const seqNumber = getNextInvoiceSequence(invoices);
      const invoiceNum = `001-001-${String(seqNumber).padStart(9, '0')}`;
      const facturaLines = expandCartItemsToFacturaLines(targetOrder.items, 15);
      const subtotal15 = Number(facturaLines.reduce((s, l) => s + l.precioTotalSinImpuesto, 0).toFixed(2));
      const tax = Number(facturaLines.reduce((s, l) => s + l.iva, 0).toFixed(2));
      const claveAcceso = generarClaveAcceso({
        fecha: new Date(),
        ruc: DEFAULT_TAX_PROFILE.ruc,
        ambiente: '1', // Pruebas
        establecimiento: DEFAULT_TAX_PROFILE.establecimiento || '001',
        puntoEmision: DEFAULT_TAX_PROFILE.puntoEmision || '001',
        secuencial: seqNumber,
      });

      const newInvoice: Invoice = {
        id: `fac-${Date.now()}`,
        invoiceNumber: invoiceNum,
        orderId: targetOrder.id,
        clientId: client?.id || 'guest',
        clientName: client?.fullName || 'Consumidor Final',
        businessName: client?.businessName || targetOrder.businessName || 'Local Registrado',
        clientTaxId: client?.taxId || '9999999999999',
        clientTaxIdType: client?.taxIdType || '07',
        clientEmail: client?.email || '',
        clientWhatsapp: client?.whatsappNumber || targetOrder.whatsappNumber,
        clientAddress: client?.addressReference || targetOrder.addressReference,
        items: [...targetOrder.items],
        totalJavas: targetOrder.totalJavas,
        totalUnits: targetOrder.totalUnits,
        subtotal: subtotal15,
        subtotal15,
        subtotal0: 0,
        tax,
        total: targetOrder.totalAmount,
        claveAcceso,
        ambiente: '1',
        sriStatus: 'PENDING',
        status: 'emitida',
        issuedAt: new Date().toISOString(),
      };

      createdInvoiceId = newInvoice.id;
      setInvoices((prev) => [newInvoice, ...prev]);

      // Enviar a SRI y sincronizar estado oficial
      fetch('/api/sri/facturar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: targetOrder,
          client,
          secuencial: seqNumber,
          claveAcceso,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.sriStatus) {
            setInvoices((prev) =>
              prev.map((inv) =>
                inv.id === newInvoice.id
                  ? {
                      ...inv,
                      claveAcceso: data.claveAcceso || inv.claveAcceso,
                      sriStatus: data.sriStatus,
                      sriAuthorizationNumber: data.numeroAutorizacion,
                      sriAuthorizationDate: data.fechaAutorizacion,
                      sriErrorMessage: data.error,
                      xmlContent: data.xml,
                    }
                  : inv
              )
            );
          }
        })
        .catch((err) => console.warn('SRI background sync error on delivery:', err));
    }

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const deliveredAt = status === 'delivered' ? new Date().toISOString() : o.deliveredAt;
          return {
            ...o,
            status,
            deliveredAt,
            invoiceId: createdInvoiceId || o.invoiceId,
          };
        }
        return o;
      })
    );
    updateOrderStatusInDb(orderId, status).catch((err) =>
      console.warn('Error al sincronizar estado de orden en Supabase:', err)
    );
  };

  const updatePaymentStatus = (orderId: string, status: PaymentStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const amountPaid = status === 'paid' ? o.totalAmount : o.amountPaid;
          const debtBalance = status === 'paid' ? 0 : o.debtBalance;
          return { ...o, paymentStatus: status, amountPaid, debtBalance };
        }
        return o;
      })
    );
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
  };

  const recordOrderPayment = (
    orderId: string,
    amount: number,
    method: PaymentMethod,
    proofUrl?: string
  ) => {
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

    const existing = invoices.find((inv) => inv.orderId === orderId);
    if (existing) return existing;

    const facturaLines = expandCartItemsToFacturaLines(order.items, 15);
    const subtotal15 = Number(facturaLines.reduce((s, l) => s + l.precioTotalSinImpuesto, 0).toFixed(2));
    const tax15 = Number(facturaLines.reduce((s, l) => s + l.iva, 0).toFixed(2));
    const seqNumber = getNextInvoiceSequence(invoices);
    const invoiceNum = `001-001-${String(seqNumber).padStart(9, '0')}`;
    const newInvoice: Invoice = {
      id: `fac-${Date.now()}`,
      invoiceNumber: invoiceNum,
      orderId: order.id,
      clientId: order.clientId,
      clientName: order.clientName,
      businessName: order.businessName,
      clientWhatsapp: order.whatsappNumber,
      clientAddress: order.addressReference,
      items: order.items,
      totalJavas: order.totalJavas,
      totalUnits: order.totalUnits || 0,
      subtotal: subtotal15,
      subtotal15: subtotal15,
      subtotal0: 0,
      tax: tax15,
      total: order.totalAmount,
      issuedAt: new Date().toISOString(),
      status: order.paymentStatus === 'paid' ? 'pagada' : 'emitida',
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, invoiceId: newInvoice.id } : o))
    );

    return newInvoice;
  };

  const recordDebtPayment = (
    clientId: string,
    amount: number,
    method: PaymentMethod = 'cash',
    notes?: string
  ) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          const newDebt = Math.max(0, (c.currentDebt || 0) - amount);
          return { ...c, currentDebt: newDebt };
        }
        return c;
      })
    );
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
        ensureOrderLoaded,
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
