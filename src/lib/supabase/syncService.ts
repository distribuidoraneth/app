/**
 * Servicio de Sincronización Bidireccional con Supabase PostgreSQL
 */

import { supabase } from '@/lib/supabase/client';
import { Client, JavaProductOption, Order } from '@/types';
import { INITIAL_CLIENTS, JAVA_PRODUCT_CATALOG } from '@/lib/mockData';
import { cleanAddress } from '@/lib/utils/formatters';

export async function getClientsFromDb(): Promise<Client[] | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Advertencia al consultar clientes en Supabase:', error.message);
      return null;
    }

    return (data || []).map((c: any) => {
      const tierMatch = c.qr_token?.match(/\|tier:(normal|distribuidor|especial)/);
      const clientTier = tierMatch ? tierMatch[1] : (c.client_tier || 'normal');
      const cleanQr = c.qr_token ? c.qr_token.split('|')[0] : `aneth-${c.id}`;

      return {
        id: c.id,
        qrToken: cleanQr,
        fullName: c.full_name,
        businessName: c.business_name,
        gender: c.gender || 'Hombre',
        clientTier,
        whatsappNumber: c.whatsapp_number,
        latitude: Number(c.latitude),
        longitude: Number(c.longitude),
        addressReference: cleanAddress(c.address_reference),
        taxId: c.tax_id,
        taxIdType: c.tax_id_type,
        email: c.email,
        creditLimit: Number(c.credit_limit || 0),
        currentDebt: Number(c.current_debt || 0),
        birthDate: c.birth_date,
        economicActivity: c.economic_activity,
        taxpayerType: c.taxpayer_type,
        createdAt: c.created_at,
      };
    });
  } catch (err) {
    console.warn('Excepción al consultar clientes:', err);
    return null;
  }
}

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function saveClientToDb(client: Client): Promise<{ success: boolean; error?: string }> {
  try {
    const safeQrToken = client.qrToken.includes('|tier:')
      ? client.qrToken
      : `${client.qrToken}|tier:${client.clientTier || 'normal'}`;

    const safeId = isValidUuid(client.id) ? client.id : generateUuid();

    const clientRecord: any = {
      id: safeId,
      qr_token: safeQrToken,
      full_name: client.fullName,
      business_name: client.businessName || client.fullName,
      gender: client.gender || 'Hombre',
      whatsapp_number: client.whatsappNumber || '',
      latitude: client.latitude,
      longitude: client.longitude,
      address_reference: cleanAddress(client.addressReference) || '',
      tax_id: client.taxId || null,
      tax_id_type: client.taxIdType || (client.taxId?.length === 13 ? '04' : client.taxId?.length === 10 ? '05' : '07'),
      email: client.email || null,
      current_debt: client.currentDebt || 0,
      created_at: client.createdAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('clients').upsert(clientRecord);
    if (error) {
      console.warn('Advertencia al guardar cliente en Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteClientFromDb(
  clientId: string,
  qrToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/clients/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientId, qrToken }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.success) {
      const errorMsg = json?.error || `Error ${res.status} al eliminar cliente`;
      console.warn('Error al eliminar cliente vía API:', errorMsg);
      return { success: false, error: errorMsg };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Excepción al eliminar cliente:', err);
    return { success: false, error: err?.message || 'Error al conectar con el servidor' };
  }
}

export async function getProductsFromDb(): Promise<JavaProductOption[] | null> {
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.warn('Advertencia al consultar productos en Supabase:', error.message);
      return null;
    }

    const sortOrder: Record<string, number> = {
      'opt-colas-plastico-300': 1,
      'opt-colas-plastico-500': 2,
      'opt-colas-plastico-1500': 3,
      'opt-colas-plastico-3000': 4,
      'opt-colas-vidrio-300': 5,
      'opt-tes-plastico-550': 6,
      'opt-aguas-forest-600': 7,
      'opt-aguas-forest-1000': 8,
    };

    return (data || [])
      .sort((a: any, b: any) => (sortOrder[a.id] || 99) - (sortOrder[b.id] || 99))
      .map((p: any) => ({
        id: p.id,
        brand: p.brand || (p.beverage_type === 'Aguas' ? 'Forest' : 'Fructi'),
        beverageType: p.beverage_type,
        container: p.container,
        size: p.size,
        allowedFlavors: p.allowed_flavors || [],
        unitsPerJava: Number(p.units_per_java),
        pricePerJava: Number(p.price_per_java),
        priceDistribuidor: p.price_distribuidor ? Number(p.price_distribuidor) : undefined,
        priceEspecial: p.price_especial ? Number(p.price_especial) : undefined,
        pricePerUnit: p.price_per_unit ? Number(p.price_per_unit) : undefined,
        imageUrl: p.image_url || '',
        description: p.description || '',
        stockJavas: Number(p.stock_javas || 100),
      }));
  } catch (err) {
    console.warn('Excepción al consultar productos en Supabase:', err);
    return null;
  }
}

export interface GetOrdersOptions {
  datePreset?: 'today' | 'yesterday' | 'week' | 'all' | 'custom';
  customDate?: string; // YYYY-MM-DD
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  status?: string;
  limit?: number;
}

export async function getOrdersFromDb(options?: GetOrdersOptions): Promise<Order[] | null> {
  try {
    let query = supabase
      .from('orders')
      .select('*, order_items(*)');

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

    // 1. Filtrado por búsqueda textual (nombre de comercio, cliente o número de pedido)
    if (options?.searchQuery && options.searchQuery.trim()) {
      const cleanQ = options.searchQuery.trim();
      query = query.or(`business_name.ilike.%${cleanQ}%,client_name.ilike.%${cleanQ}%,order_number.ilike.%${cleanQ}%`);
    } else {
      // 2. Filtrado por fecha
      const preset = options?.datePreset || 'today';

      if (preset === 'today') {
        // Por defecto: Pedidos creados hoy O pedidos que sigan pendientes de entrega (independiente de la fecha)
        query = query.or(`status.eq.pending,created_at.gte.${startOfToday}`);
      } else if (preset === 'yesterday') {
        const yest = new Date(now);
        yest.setDate(yest.getDate() - 1);
        const startOfYest = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 0, 0, 0, 0).toISOString();
        const endOfYest = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 23, 59, 59, 999).toISOString();
        query = query.gte('created_at', startOfYest).lte('created_at', endOfYest);
      } else if (preset === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const startOfWeek = new Date(weekAgo.getFullYear(), weekAgo.getMonth(), weekAgo.getDate(), 0, 0, 0, 0).toISOString();
        query = query.gte('created_at', startOfWeek);
      } else if (preset === 'custom' && options?.customDate) {
        const parts = options.customDate.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const startOfCustom = new Date(year, month, day, 0, 0, 0, 0).toISOString();
          const endOfCustom = new Date(year, month, day, 23, 59, 59, 999).toISOString();
          query = query.gte('created_at', startOfCustom).lte('created_at', endOfCustom);
        }
      }
      // Si preset === 'all', no agregamos filtro de fecha
    }

    // 3. Filtrado por estado si está especificado
    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }

    const maxLimit = options?.limit || (options?.datePreset === 'all' ? 100 : 150);
    query = query.order('created_at', { ascending: false }).limit(maxLimit);

    const { data, error } = await query;

    if (error) {
      console.warn('Advertencia al consultar pedidos en Supabase:', error.message);
      return null;
    }

    return (data || []).map(mapDbOrder);
  } catch (err) {
    console.warn('Excepción al consultar pedidos en Supabase:', err);
    return null;
  }
}

function mapDbOrder(o: any): Order {
  return {
    id: o.id,
    orderNumber: o.order_number,
    clientId: o.client_id || 'guest',
    clientName: o.client_name,
    businessName: o.business_name,
    whatsappNumber: o.whatsapp_number,
    latitude: Number(o.latitude),
    longitude: Number(o.longitude),
    addressReference: cleanAddress(o.address_reference),
    items: (o.order_items || []).map((it: any) => ({
      id: it.id,
      productOptionId: it.product_option_id,
      brand: it.brand || 'Fructi',
      beverageType: it.beverage_type,
      container: it.container,
      size: it.size,
      flavorType: it.flavor_type,
      selectedFlavor: it.selected_flavor,
      surtidoDetails: it.surtido_details,
      quantityJavas: Number(it.quantity_javas || 0),
      quantityUnits: Number(it.quantity_units || 0),
      unitsPerJava: Number(it.units_per_java || 12),
      pricePerJava: Number(it.price_per_java || 0),
      pricePerUnit: Number(it.price_per_unit || 0),
      totalBottles: Number(it.total_bottles || 0),
      subtotal: Number(it.subtotal || 0),
    })),
    totalJavas: Number(o.total_javas || 0),
    totalUnits: Number(o.total_units || 0),
    totalBottles: Number(o.total_bottles || 0),
    totalAmount: Number(o.total_amount || 0),
    status: o.status,
    saleType: o.sale_type,
    scheduledDeliveryDate: o.scheduled_delivery_date,
    scheduledTimeSlot: o.scheduled_time_slot,
    promisedCollectionDate: o.promised_collection_date,
    promisedCollectionTime: o.promised_collection_time,
    paymentStatus: o.payment_status,
    paymentMethod: o.payment_method,
    amountPaid: Number(o.amount_paid || 0),
    debtBalance: Number(o.debt_balance || 0),
    notes: o.notes,
    createdAt: o.created_at,
    deliveredAt: o.delivered_at,
  };
}

export async function getOrderByIdFromDb(idOrNumber: string): Promise<Order | null> {
  try {
    const clean = decodeURIComponent(idOrNumber).trim();
    if (!clean) return null;

    let query = supabase.from('orders').select('*, order_items(*)');

    if (isValidUuid(clean)) {
      query = query.or(`id.eq.${clean},order_number.eq.${clean}`);
    } else {
      const numPart = clean.replace(/[^0-9]/g, '');
      if (numPart) {
        query = query.or(
          `order_number.eq.${clean},order_number.ilike.%${clean}%,order_number.ilike.%${numPart}%,id.eq.${clean}`
        );
      } else {
        query = query.or(`order_number.eq.${clean},order_number.ilike.%${clean}%,id.eq.${clean}`);
      }
    }

    const { data, error } = await query.limit(1).maybeSingle();
    if (error) {
      console.warn('Advertencia al consultar pedido por ID en Supabase:', error.message);
      return null;
    }

    if (!data) return null;
    return mapDbOrder(data);
  } catch (err) {
    console.warn('Excepción al buscar pedido en Supabase:', err);
    return null;
  }
}

export async function updateClientDebtInDb(clientId: string, newDebt: number): Promise<void> {
  try {
    if (!isValidUuid(clientId)) return;
    await supabase.from('clients').update({ current_debt: newDebt }).eq('id', clientId);
  } catch (err) {
    console.warn('Error al actualizar deuda de cliente en Supabase:', err);
  }
}

export async function saveOrderToDb(order: Order): Promise<{ success: boolean; error?: string }> {
  try {
    const orderRecord: any = {
      order_number: order.orderNumber,
      client_id: order.clientId && order.clientId.startsWith('cli-') ? null : order.clientId,
      client_name: order.clientName,
      business_name: order.businessName,
      whatsapp_number: order.whatsappNumber,
      latitude: order.latitude,
      longitude: order.longitude,
      address_reference: cleanAddress(order.addressReference) || '',
      total_javas: order.totalJavas,
      total_units: order.totalUnits || 0,
      total_bottles: order.totalBottles || (order.totalJavas * 12),
      total_amount: order.totalAmount,
      status: order.status,
      sale_type: order.saleType,
      scheduled_delivery_date: order.scheduledDeliveryDate || null,
      scheduled_time_slot: order.scheduledTimeSlot || null,
      payment_status: order.paymentStatus,
      payment_method: order.paymentMethod,
      amount_paid: order.amountPaid,
      debt_balance: order.debtBalance,
      notes: order.notes,
      promised_collection_date: order.promisedCollectionDate || null,
      promised_collection_time: order.promisedCollectionTime || null,
    };

    let { data: insertedOrder, error: orderErr } = await supabase
      .from('orders')
      .insert(orderRecord)
      .select()
      .single();

    // Si las columnas dedicadas no han sido creadas aún en Supabase (error 42703), reintentar sin ellas
    // garantizando que la información quede registrada en 'notes', 'debt_balance' y 'amount_paid'
    if (orderErr && (orderErr.code === '42703' || orderErr.message?.includes('promised_collection'))) {
      delete orderRecord.promised_collection_date;
      delete orderRecord.promised_collection_time;
      const retryResult = await supabase
        .from('orders')
        .insert(orderRecord)
        .select()
        .single();
      insertedOrder = retryResult.data;
      orderErr = retryResult.error;
    }

    if (orderErr) {
      console.warn('Advertencia al guardar orden en Supabase:', orderErr.message);
      return { success: false, error: orderErr.message };
    }

    // Insert order items
    if (insertedOrder && order.items && order.items.length > 0) {
      const itemsToInsert = order.items.map((item) => ({
        order_id: insertedOrder.id,
        product_option_id: item.productOptionId && item.productOptionId.startsWith('opt-') ? null : item.productOptionId,
        brand: item.brand || 'Fructi',
        beverage_type: item.beverageType,
        container: item.container,
        size: item.size,
        flavor_type: item.flavorType,
        selected_flavor: item.selectedFlavor,
        surtido_details: item.surtidoDetails,
        quantity_javas: item.quantityJavas,
        quantity_units: item.quantityUnits || 0,
        units_per_java: item.unitsPerJava,
        price_per_java: item.pricePerJava,
        price_per_unit: item.pricePerUnit || Number((item.pricePerJava / item.unitsPerJava).toFixed(4)),
        total_bottles: item.totalBottles || (item.quantityJavas * item.unitsPerJava),
        subtotal: item.subtotal,
      }));

      const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsErr && itemsErr.code === '42703') {
        const fallbackItems = itemsToInsert.map(({ brand, ...rest }: any) => rest);
        await supabase.from('order_items').insert(fallbackItems);
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
