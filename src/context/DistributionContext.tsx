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
} from '@/types';
import {
  INITIAL_CLIENTS,
  JAVA_PRODUCT_CATALOG,
  INITIAL_ORDERS,
  INITIAL_INVOICES,
} from '@/lib/mockData';

interface DistributionContextType {
  // Data
  clients: Client[];
  catalog: JavaProductOption[];
  orders: Order[];
  invoices: Invoice[];

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
  createOrder: (orderData: {
    clientId: string;
    items: CartItem[];
    paymentMethod: PaymentMethod;
    notes?: string;
    customLocation?: { latitude: number; longitude: number; addressReference?: string };
  }) => Order;
  cancelOrder: (orderId: string) => boolean;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updatePaymentStatus: (orderId: string, status: PaymentStatus) => void;
  generateInvoice: (orderId: string) => Invoice | null;
  updateStock: (optionId: string, newStock: number) => void;
}

const DistributionContext = createContext<DistributionContextType | undefined>(undefined);

const STORAGE_KEY = 'distribuidora_aneth_oficial_v8';

export function DistributionProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [catalog, setCatalog] = useState<JavaProductOption[]>(JAVA_PRODUCT_CATALOG);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);

  const [selectedClientId, setSelectedClientId] = useState<string>(INITIAL_CLIENTS[0]?.id || '');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.clients) setClients(parsed.clients);
        if (parsed.catalog) setCatalog(parsed.catalog);
        if (parsed.orders) setOrders(parsed.orders);
        if (parsed.invoices) setInvoices(parsed.invoices);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ clients, catalog, orders, invoices })
      );
    } catch {
      // ignore
    }
  }, [clients, catalog, orders, invoices]);

  // Cart operations
  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      // Check if identical item already exists (same option, container, size, flavor)
      const existingIdx = prev.findIndex((i) => {
        if (i.productOptionId !== item.productOptionId) return false;
        if (i.flavorType !== item.flavorType) return false;
        if (i.flavorType === 'single') {
          return i.selectedFlavor === item.selectedFlavor;
        }
        // Surtido check
        return JSON.stringify(i.surtidoDetails) === JSON.stringify(item.surtidoDetails);
      });

      if (existingIdx > -1) {
        const updated = [...prev];
        const existing = updated[existingIdx];
        const newJavas = existing.quantityJavas + item.quantityJavas;
        const newUnits = (existing.quantityUnits || 0) + (item.quantityUnits || 0);
        const newSubtotal = (newJavas * item.pricePerJava) + (newUnits * item.pricePerUnit);
        const newTotalBottles = (newJavas * item.unitsPerJava) + newUnits;

        updated[existingIdx] = {
          ...existing,
          quantityJavas: newJavas,
          quantityUnits: newUnits,
          totalBottles: newTotalBottles,
          subtotal: Number(newSubtotal.toFixed(2)),
        };
        return updated;
      }

      return [...prev, item];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, quantityJavas: number, quantityUnits?: number) => {
    const units = quantityUnits !== undefined ? quantityUnits : 0;
    if (quantityJavas <= 0 && units <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        const finalJavas = Math.max(0, quantityJavas);
        const finalUnits = Math.max(0, units);
        const subtotal = (finalJavas * i.pricePerJava) + (finalUnits * i.pricePerUnit);
        const totalBottles = (finalJavas * i.unitsPerJava) + finalUnits;
        return {
          ...i,
          quantityJavas: finalJavas,
          quantityUnits: finalUnits,
          totalBottles,
          subtotal: Number(subtotal.toFixed(2)),
        };
      })
    );
  };

  const clearCart = () => setCart([]);

  const cartTotalAmount = Number(cart.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  const cartTotalJavas = cart.reduce((sum, item) => sum + item.quantityJavas, 0);
  const cartTotalUnits = cart.reduce((sum, item) => sum + (item.quantityUnits || 0), 0);
  const cartTotalBottles = cart.reduce((sum, item) => sum + (item.totalBottles || (item.quantityJavas * item.unitsPerJava)), 0);

  // Client registration
  const addClient = (clientData: Omit<Client, 'id' | 'qrToken' | 'createdAt'>): Client => {
    const slug = clientData.fullName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    const qrToken = `aneth-${slug}-${randomSuffix}`;

    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
      qrToken,
      createdAt: new Date().toISOString(),
    };

    setClients((prev) => [newClient, ...prev]);
    return newClient;
  };

  // Create Order
  const createOrder = ({
    clientId,
    items,
    paymentMethod,
    notes,
    customLocation,
  }: {
    clientId: string;
    items: CartItem[];
    paymentMethod: PaymentMethod;
    notes?: string;
    customLocation?: { latitude: number; longitude: number; addressReference?: string };
  }): Order => {
    const client = clients.find((c) => c.id === clientId) || clients[0];
    const totalAmount = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
    const totalJavas = items.reduce((sum, item) => sum + item.quantityJavas, 0);
    const totalUnits = items.reduce((sum, item) => sum + (item.quantityUnits || 0), 0);
    const totalBottles = items.reduce((sum, item) => sum + (item.totalBottles || (item.quantityJavas * item.unitsPerJava)), 0);

    const orderNum = `ORD-${String(orders.length + 101).padStart(5, '0')}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
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
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod,
      notes,
      createdAt: new Date().toISOString(),
    };

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

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const cancelOrder = (orderId: string): boolean => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return false;
    if (order.status === 'delivered') {
      return false; // Cannot cancel delivered orders
    }

    // Restore stock
    order.items.forEach((item) => {
      setCatalog((prev) =>
        prev.map((c) =>
          c.id === item.productOptionId
            ? { ...c, stockJavas: c.stockJavas + item.quantityJavas }
            : c
        )
      );
    });

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
    );
    return true;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const deliveredAt = status === 'delivered' ? new Date().toISOString() : o.deliveredAt;
          return { ...o, status, deliveredAt };
        }
        return o;
      })
    );
  };

  const updatePaymentStatus = (orderId: string, status: PaymentStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: status } : o))
    );
  };

  const generateInvoice = (orderId: string): Invoice | null => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return null;

    const existing = invoices.find((inv) => inv.orderId === orderId);
    if (existing) return existing;

    const invoiceNum = `001-001-${String(invoices.length + 100).padStart(9, '0')}`;
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
      subtotal: order.totalAmount,
      subtotal15: order.totalAmount,
      subtotal0: 0,
      tax: 0,
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

  const updateStock = (optionId: string, newStock: number) => {
    setCatalog((prev) =>
      prev.map((c) => (c.id === optionId ? { ...c, stockJavas: Math.max(0, newStock) } : c))
    );
  };

  return (
    <DistributionContext.Provider
      value={{
        clients,
        catalog,
        orders,
        invoices,
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
        createOrder,
        cancelOrder,
        updateOrderStatus,
        updatePaymentStatus,
        generateInvoice,
        updateStock,
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
