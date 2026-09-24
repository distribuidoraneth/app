/**
 * Servicio de Sincronización Bidireccional con Supabase PostgreSQL
 */

import { supabase } from '@/lib/supabase/client';
import { Client, JavaProductOption, Order, OrderStatus, Invoice, CartItem, PaymentTransaction } from '@/types';
import { INITIAL_CLIENTS, JAVA_PRODUCT_CATALOG } from '@/lib/mockData';
import { cleanAddress, expandCartItemsToFacturaLines } from '@/lib/utils/formatters';
import { generarClaveAcceso } from '@/lib/sri/claveAcceso';
import { DEFAULT_TAX_PROFILE } from '@/lib/sri/xmlBuilder';

export function isValidUuid(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function mapDbClient(c: any): Client {
  const tierMatch = c.qr_token?.match(/\|tier:(normal|distribuidor|especial)/);
  const clientTier = tierMatch ? tierMatch[1] : (c.client_tier || 'normal');
  const cleanTaxId = c.tax_id?.trim().replace(/\D/g, '');
  const rawQr = c.qr_token ? c.qr_token.split('|')[0] : '';

  // Si el cliente tiene Cédula o RUC (>= 10 dígitos) y su token actual es el formato legacy ("aneth-...") o está vacío:
  let cleanQr = rawQr;
  if (cleanTaxId && cleanTaxId.length >= 10 && (!cleanQr || cleanQr.startsWith('aneth-') || cleanQr.startsWith('cli-'))) {
    cleanQr = cleanTaxId;
  } else if (!cleanQr) {
    cleanQr = cleanTaxId || (c.whatsapp_number ? c.whatsapp_number.replace(/\D/g, '') : `cli-${c.id}`);
  }

  // Si se modernizó un token viejo a la cédula, sincronizar en background con Supabase
  if (rawQr && cleanQr !== rawQr && cleanQr === cleanTaxId) {
    const safeUpdatedToken = `${cleanQr}|tier:${clientTier}`;
    supabase.from('clients').update({ qr_token: safeUpdatedToken }).eq('id', c.id).then();
  }

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
}

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

    return (data || []).map(mapDbClient);
  } catch (err) {
    console.warn('Excepción al consultar clientes:', err);
    return null;
  }
}

export async function getClientsByTokenFromDb(rawToken: string): Promise<Client[] | null> {
  try {
    const cleanToken = decodeURIComponent(rawToken || '').trim();
    if (!cleanToken) return null;

    const tokenDigits = cleanToken.replace(/\D/g, '');
    let query = supabase.from('clients').select('*');

    const orClauses: string[] = [
      `qr_token.ilike.%${cleanToken}%`,
    ];

    if (isValidUuid(cleanToken)) {
      orClauses.push(`id.eq.${cleanToken}`);
    }

    if (cleanToken.length >= 3) {
      orClauses.push(`tax_id.eq.${cleanToken}`);
    }

    if (tokenDigits.length >= 9) {
      orClauses.push(`tax_id.eq.${tokenDigits}`);
      orClauses.push(`whatsapp_number.ilike.%${tokenDigits}%`);
    }

    const { data, error } = await query.or(orClauses.join(','));
    if (error) {
      console.warn('Advertencia al consultar cliente por token en Supabase:', error.message);
      return null;
    }

    return (data || []).map(mapDbClient);
  } catch (err) {
    console.warn('Excepción al buscar cliente por token:', err);
    return null;
  }
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

    let { error } = await supabase.from('clients').upsert(clientRecord);
    
    // Si falla por duplicado de token (código 23505 de PostgreSQL), reintentar con sufijo único
    if (error && (error.code === '23505' || error.message?.includes('duplicate key'))) {
      const baseToken = client.qrToken.split('|')[0];
      const uniqueSuffix = Math.floor(100 + Math.random() * 900);
      const fallbackToken = `${baseToken}-${uniqueSuffix}|tier:${client.clientTier || 'normal'}`;
      clientRecord.qr_token = fallbackToken;
      const retry = await supabase.from('clients').upsert(clientRecord);
      error = retry.error;
    }

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
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const res = await fetch('/api/clients/delete', {
      method: 'POST',
      headers,
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
    invoiceId: o.invoice_id || undefined,
    invoiceNumber: o.invoice_number || undefined,
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
      // IMPORTANTE: Si clean no es UUID, JAMÁS incluir id.eq.${clean} porque Postgres fallará con error 22P02
      const numPart = clean.replace(/[^0-9]/g, '');
      if (numPart) {
        query = query.or(
          `order_number.eq.${clean},order_number.ilike.%${clean}%,order_number.ilike.%${numPart}%`
        );
      } else {
        query = query.or(`order_number.eq.${clean},order_number.ilike.%${clean}%`);
      }
    }

    const { data, error } = await query.limit(1).maybeSingle();
    if (error) {
      console.warn('Advertencia al consultar pedido por ID en Supabase:', error.message);
      return null;
    }

    if (!data) return null;
    const mappedOrder = mapDbOrder(data);

    // Anidar número de factura desde tabla invoices de forma confiable
    try {
      let invQuery = supabase.from('invoices').select('invoice_number');
      if (isValidUuid(mappedOrder.invoiceId)) {
        invQuery = invQuery.eq('id', mappedOrder.invoiceId);
      } else if (isValidUuid(mappedOrder.id)) {
        invQuery = invQuery.eq('order_id', mappedOrder.id);
      }
      const { data: invData } = await invQuery.maybeSingle();
      if (invData?.invoice_number) {
        mappedOrder.invoiceNumber = invData.invoice_number;
      }
    } catch {
      // ignore
    }

    return mappedOrder;
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

export async function saveOrderToDb(order: Order): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const orderRecord: any = {
      order_number: order.orderNumber,
      client_id: isValidUuid(order.clientId) ? order.clientId : null,
      client_name: order.clientName,
      business_name: order.businessName,
      whatsapp_number: order.whatsappNumber,
      latitude: order.latitude,
      longitude: order.longitude,
      address_reference: cleanAddress(order.addressReference) || '',
      total_javas: order.totalJavas,
      total_units: order.totalUnits || 0,
      total_bottles: order.totalBottles || ((order.totalJavas * 12) + (order.totalUnits || 0)),
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
      invoice_id: isValidUuid(order.invoiceId) ? order.invoiceId : null,
      invoice_number: order.invoiceNumber || null,
      delivered_at: order.deliveredAt || null,
    };

    if (isValidUuid(order.id)) {
      orderRecord.id = order.id;
    }

    let { data: insertedOrder, error: orderErr } = await supabase
      .from('orders')
      .insert(orderRecord)
      .select()
      .single();

    // Si las columnas dedicadas no han sido creadas aún en Supabase (error 42703), reintentar sin ellas
    // garantizando que la información quede registrada en 'notes', 'debt_balance' y 'amount_paid'
    if (orderErr && (orderErr.code === '42703' || orderErr.message?.includes('promised_collection') || orderErr.message?.includes('invoice_number'))) {
      delete orderRecord.promised_collection_date;
      delete orderRecord.promised_collection_time;
      if (orderErr.message?.includes('invoice_number')) {
        delete orderRecord.invoice_number;
      }
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
        product_option_id: item.productOptionId || null,
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
        total_bottles: item.totalBottles || ((item.quantityJavas * item.unitsPerJava) + (item.quantityUnits || 0)),
        subtotal: item.subtotal,
      }));

      let { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsErr && (itemsErr.code === '42703' || itemsErr.code === '23503')) {
        const fallbackItems = itemsToInsert.map(({ brand, product_option_id, ...rest }: any) => ({
          ...rest,
          product_option_id: itemsErr?.code === '23503' ? null : product_option_id,
        }));
        await supabase.from('order_items').insert(fallbackItems);
      }
    }

    return { success: true, data: insertedOrder };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export interface UpdateOrderPayload {
  status?: OrderStatus;
  invoiceId?: string;
  invoiceNumber?: string;
  deliveredAt?: string;
  amountPaid?: number;
  debtBalance?: number;
  paymentStatus?: 'pending' | 'paid' | 'partial';
  paymentMethod?: string;
  scheduledDeliveryDate?: string;
  scheduledTimeSlot?: string;
  notes?: string;
}

export async function updateOrderStatusInDb(
  orderId: string,
  statusOrPayload: OrderStatus | UpdateOrderPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const rawPayload: any =
      typeof statusOrPayload === 'string'
        ? { status: statusOrPayload }
        : { ...statusOrPayload };

    const dbPayload: any = {};
    if (rawPayload.status !== undefined) dbPayload.status = rawPayload.status;
    if (rawPayload.deliveredAt !== undefined) dbPayload.delivered_at = rawPayload.deliveredAt;
    if (rawPayload.invoiceId !== undefined) {
      dbPayload.invoice_id = isValidUuid(rawPayload.invoiceId) ? rawPayload.invoiceId : null;
    }
    if (rawPayload.amountPaid !== undefined) dbPayload.amount_paid = Number(rawPayload.amountPaid);
    if (rawPayload.debtBalance !== undefined) dbPayload.debt_balance = Number(rawPayload.debtBalance);
    if (rawPayload.paymentStatus !== undefined) dbPayload.payment_status = rawPayload.paymentStatus;
    if (rawPayload.paymentMethod !== undefined) dbPayload.payment_method = rawPayload.paymentMethod;
    if (rawPayload.scheduledDeliveryDate !== undefined) {
      dbPayload.scheduled_delivery_date = rawPayload.scheduledDeliveryDate;
    }
    if (rawPayload.scheduledTimeSlot !== undefined) {
      dbPayload.scheduled_time_slot = rawPayload.scheduledTimeSlot;
    }
    if (rawPayload.notes !== undefined) dbPayload.notes = rawPayload.notes;
    if (rawPayload.invoiceNumber !== undefined) dbPayload.invoice_number = rawPayload.invoiceNumber;

    let query = supabase.from('orders').update(dbPayload);

    if (isValidUuid(orderId)) {
      query = query.eq('id', orderId);
    } else {
      query = query.eq('order_number', orderId);
    }

    let { error } = await query;

    // Si la columna invoice_number aún no se refleja en el schema cache de PostgREST, reintentar sin ella
    if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('invoice_number'))) {
      delete dbPayload.invoice_number;
      let retryQuery = supabase.from('orders').update(dbPayload);
      if (isValidUuid(orderId)) {
        retryQuery = retryQuery.eq('id', orderId);
      } else {
        retryQuery = retryQuery.eq('order_number', orderId);
      }
      const retryResult = await retryQuery;
      error = retryResult.error;
    }

    if (error) {
      console.warn('Advertencia al actualizar orden en Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function savePaymentToDb(
  payment: PaymentTransaction
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const paymentRecord: any = {
      id: isValidUuid(payment.id) ? payment.id : generateUuid(),
      order_id: isValidUuid(payment.orderId) ? payment.orderId : null,
      client_id: isValidUuid(payment.clientId) ? payment.clientId : null,
      amount: Number(payment.amount || 0),
      payment_method: payment.paymentMethod || 'cash',
      payment_proof_url: payment.paymentProofUrl || null,
      reference_number: payment.referenceNumber || null,
      notes: payment.notes || null,
      recorded_at: payment.recordedAt || new Date().toISOString(),
    };

    const { data, error } = await supabase.from('payments').insert(paymentRecord).select().single();
    if (error) {
      console.warn('Advertencia al guardar pago en Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    console.warn('Excepción al guardar pago en Supabase:', err);
    return { success: false, error: err?.message };
  }
}

export async function getPaymentsByOrderFromDb(orderId: string): Promise<PaymentTransaction[]> {
  try {
    if (!isValidUuid(orderId)) return [];
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('recorded_at', { ascending: false });

    if (error) {
      console.warn('Advertencia al consultar pagos en Supabase:', error.message);
      return [];
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      orderId: p.order_id,
      clientId: p.client_id,
      amount: Number(p.amount || 0),
      paymentMethod: p.payment_method,
      paymentProofUrl: p.payment_proof_url,
      referenceNumber: p.reference_number,
      notes: p.notes,
      recordedAt: p.recorded_at,
    }));
  } catch (err) {
    console.warn('Excepción al consultar pagos:', err);
    return [];
  }
}

export async function getPaymentsByClientFromDb(clientId: string): Promise<PaymentTransaction[]> {
  try {
    if (!isValidUuid(clientId)) return [];
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('client_id', clientId)
      .order('recorded_at', { ascending: false });

    if (error) {
      console.warn('Advertencia al consultar pagos por cliente:', error.message);
      return [];
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      orderId: p.order_id,
      clientId: p.client_id,
      amount: Number(p.amount || 0),
      paymentMethod: p.payment_method,
      paymentProofUrl: p.payment_proof_url,
      referenceNumber: p.reference_number,
      notes: p.notes,
      recordedAt: p.recorded_at,
    }));
  } catch (err) {
    console.warn('Excepción al consultar pagos por cliente:', err);
    return [];
  }
}

export async function getOrdersByClientIdFromDb(clientId: string): Promise<Order[] | null> {
  try {
    if (!clientId) return null;
    let query = supabase.from('orders').select('*, order_items(*)');

    if (isValidUuid(clientId)) {
      query = query.eq('client_id', clientId);
    } else {
      query = query.or(`client_id.eq.${clientId},order_number.ilike.%${clientId}%`);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('Advertencia al consultar pedidos por cliente:', error.message);
      return null;
    }
    return (data || []).map(mapDbOrder);
  } catch (err) {
    console.warn('Excepción al consultar pedidos por cliente:', err);
    return null;
  }
}

export async function getInvoicesByClientIdFromDb(clientId: string): Promise<Invoice[] | null> {
  try {
    if (!clientId) return null;
    let query = supabase.from('invoices').select('*, invoice_items(*), orders(order_number)');

    if (isValidUuid(clientId)) {
      query = query.eq('client_id', clientId);
    } else {
      query = query.eq('client_tax_id', clientId);
    }

    const { data, error } = await query
      .order('issued_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('Advertencia al consultar facturas por cliente:', error.message);
      return null;
    }
    return (data || []).map(mapDbInvoice);
  } catch (err) {
    console.warn('Excepción al consultar facturas por cliente:', err);
    return null;
  }
}

function mapDbInvoice(i: any): Invoice {
  const items: CartItem[] = (i.invoice_items || []).map((it: any) => {
    // Cross-reference with official product catalog
    const cat = it.item_code
      ? JAVA_PRODUCT_CATALOG.find((c) => c.id === it.item_code)
      : null;

    let brand = cat?.brand || (it.description?.includes('Forest') ? 'Forest' : 'Fructi');
    let beverageType =
      cat?.beverageType ||
      (it.description?.includes('Agua')
        ? 'Aguas'
        : it.description?.includes('Té')
        ? 'Tés'
        : 'Colas');
    let container =
      cat?.container ||
      (it.description?.toLowerCase().includes('vid') ? 'Vidrio' : 'Plástico');

    let size = cat?.size;
    if (!size) {
      if (it.description?.includes('3.0') || it.description?.includes('3 Litros') || it.item_code?.includes('3000')) {
        size = '3.0 Litros';
      } else if (it.description?.includes('1.5') || it.description?.includes('1.5 Litros') || it.item_code?.includes('1500')) {
        size = '1.5 Litros';
      } else if (it.description?.includes('1 Litro') || it.description?.includes('1000') || it.item_code?.includes('1000')) {
        size = '1 Litro';
      } else if (it.description?.includes('600') || it.item_code?.includes('600')) {
        size = '600 ml';
      } else if (it.description?.includes('550') || it.item_code?.includes('550')) {
        size = '550 ml';
      } else if (it.description?.includes('500') || it.item_code?.includes('500')) {
        size = '500 ml';
      } else if (it.description?.includes('300') || it.item_code?.includes('300')) {
        size = '300 ml';
      } else {
        size = '500 ml';
      }
    }

    const isVidrio = container.toLowerCase().includes('vid');
    const unitsPerJava =
      cat?.unitsPerJava ||
      (isVidrio ? 24 : size.includes('3.0') || size.includes('3L') ? 6 : 12);

    const pricePerUnit = Number(it.unit_price) || cat?.pricePerUnit || 0;
    const pricePerJava =
      cat?.pricePerJava || Number((pricePerUnit * unitsPerJava).toFixed(2));

    let selectedFlavor = 'Original';
    if (it.description) {
      const parts = it.description.split('-');
      if (parts.length > 1) {
        selectedFlavor = parts[1].replace(/\(.*\)/, '').trim();
      }
    }

    return {
      id: it.id,
      productOptionId: it.item_code || cat?.id || 'opt-generic',
      brand,
      beverageType,
      container,
      size,
      flavorType: 'single',
      selectedFlavor,
      quantityJavas: Math.max(0, Number(it.quantity_javas || 0)),
      quantityUnits: Math.max(0, Number(it.quantity_units || 0)),
      unitsPerJava,
      pricePerJava,
      pricePerUnit,
      totalBottles: Math.max(0, Number(it.total_quantity || 0)),
      subtotal: Math.max(0, Number(it.subtotal || 0)),
    };
  });

  return {
    id: i.id,
    invoiceNumber: i.invoice_number,
    orderId: i.order_id || '',
    orderNumber: i.orders?.order_number || i.order_number || undefined,
    claveAcceso: i.clave_acceso,
    ambiente: (i.ambiente || (process.env.NEXT_PUBLIC_SRI_ENVIRONMENT === '1' ? '1' : '2')) as '1' | '2',
    sriStatus: i.sri_status || 'PENDING',
    sriAuthorizationNumber: i.sri_authorization_number || undefined,
    sriAuthorizationDate: i.sri_authorization_date || undefined,
    sriErrorMessage: i.sri_error_message || undefined,
    clientId: i.client_id || 'guest',
    clientName: i.client_name,
    businessName: i.business_name || i.client_name,
    clientTaxId: i.client_tax_id || '9999999999999',
    clientTaxIdType: i.client_tax_id_type || '07',
    clientEmail: i.client_email || '',
    clientWhatsapp: i.client_whatsapp || '',
    clientAddress: i.client_address || '',
    items,
    totalJavas: Number(i.total_javas || 0),
    totalUnits: Number(i.total_units || 0),
    subtotal: Number(i.subtotal || 0),
    subtotal15: Number(i.subtotal_15 || 0),
    subtotal0: Number(i.subtotal_0 || 0),
    tax: Number(i.tax || 0),
    total: Number(i.total || 0),
    xmlContent: i.xml_content || undefined,
    pdfDownloadUrl: i.pdf_ride_url || undefined,
    status: i.status || 'emitida',
    issuedAt: i.issued_at || new Date().toISOString(),
  };
}

export function reconstructInvoiceFromOrder(order: Order, fallbackSeq?: number): Invoice {
  const facturaLines = expandCartItemsToFacturaLines(order.items, 15);
  const subtotal15 = Number(facturaLines.reduce((s, l) => s + l.precioTotalSinImpuesto, 0).toFixed(2));
  const tax15 = Number(facturaLines.reduce((s, l) => s + l.iva, 0).toFixed(2));

  let invoiceNum = order.invoiceNumber;
  let seqNumber = 120;
  if (invoiceNum && invoiceNum.includes('001-001-')) {
    const parsed = parseInt(invoiceNum.replace(/\D/g, '').slice(-9), 10);
    if (!isNaN(parsed) && parsed > 0) {
      seqNumber = parsed;
    }
  } else if (typeof fallbackSeq === 'number' && fallbackSeq >= 119) {
    seqNumber = fallbackSeq;
    invoiceNum = `001-001-${String(seqNumber).padStart(9, '0')}`;
  } else {
    // Si la orden no tiene número de factura ni secuencial asignado, jamás extraer dígitos de timestamps (evita saltos absurdos a 7369, 3737, etc.)
    seqNumber = 120;
    invoiceNum = 'PENDIENTE';
  }

  const ambienteDefault: '1' | '2' = ((DEFAULT_TAX_PROFILE.ambiente || '2') === '1' ? '1' : '2') as '1' | '2';
  const claveAcceso = seqNumber >= 119 && invoiceNum !== 'PENDIENTE'
    ? generarClaveAcceso({
        fecha: order.createdAt ? new Date(order.createdAt) : new Date(),
        ruc: DEFAULT_TAX_PROFILE.ruc,
        ambiente: ambienteDefault,
        establecimiento: DEFAULT_TAX_PROFILE.establecimiento || '001',
        puntoEmision: DEFAULT_TAX_PROFILE.puntoEmision || '001',
        secuencial: seqNumber,
      })
    : '';

  const reconstructedInvoice: Invoice = {
    id: order.invoiceId && isValidUuid(order.invoiceId) ? order.invoiceId : generateUuid(),
    invoiceNumber: invoiceNum,
    orderId: order.id,
    orderNumber: order.orderNumber,
    clientId: order.clientId,
    clientName: order.clientName,
    businessName: order.businessName || order.clientName,
    clientTaxId: '9999999999999',
    clientTaxIdType: '07',
    clientWhatsapp: order.whatsappNumber,
    clientAddress: order.addressReference,
    items: order.items,
    totalJavas: order.totalJavas,
    totalUnits: order.totalUnits || 0,
    subtotal: subtotal15,
    subtotal15,
    subtotal0: 0,
    tax: tax15,
    total: order.totalAmount,
    claveAcceso,
    ambiente: ambienteDefault,
    sriStatus: 'PENDING',
    status: order.paymentStatus === 'paid' ? 'pagada' : 'emitida',
    issuedAt: order.deliveredAt || order.createdAt || new Date().toISOString(),
  };

  return reconstructedInvoice;
}

export async function saveInvoiceToDb(
  invoice: Invoice
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const safeId = isValidUuid(invoice.id) ? invoice.id : generateUuid();
    const orderId = isValidUuid(invoice.orderId) ? invoice.orderId : null;
    const clientId = isValidUuid(invoice.clientId) ? invoice.clientId : null;

    const invoiceRecord: any = {
      id: safeId,
      invoice_number: invoice.invoiceNumber,
      order_id: orderId,
      clave_acceso: invoice.claveAcceso || '0'.repeat(49),
      ambiente: invoice.ambiente || ((DEFAULT_TAX_PROFILE.ambiente || '2') === '1' ? '1' : '2'),
      sri_status: invoice.sriStatus || 'PENDING',
      sri_authorization_number: invoice.sriAuthorizationNumber || null,
      sri_authorization_date: invoice.sriAuthorizationDate || null,
      sri_error_message: invoice.sriErrorMessage || null,
      client_id: clientId,
      client_name: invoice.clientName || 'Consumidor Final',
      business_name: invoice.businessName || invoice.clientName || '',
      client_tax_id: invoice.clientTaxId || '9999999999999',
      client_tax_id_type: invoice.clientTaxIdType || '07',
      client_email: invoice.clientEmail || null,
      client_whatsapp: invoice.clientWhatsapp || '',
      client_address: cleanAddress(invoice.clientAddress) || '',
      total_javas: invoice.totalJavas || 0,
      total_units: invoice.totalUnits || 0,
      subtotal: Number(invoice.subtotal || 0),
      subtotal_15: Number(invoice.subtotal15 || 0),
      subtotal_0: Number(invoice.subtotal0 || 0),
      tax: Number(invoice.tax || 0),
      total: Number(invoice.total || 0),
      xml_content: invoice.xmlContent || null,
      pdf_ride_url: invoice.pdfDownloadUrl || null,
      status: invoice.status || 'emitida',
      issued_at: invoice.issuedAt || new Date().toISOString(),
    };

    const { data: savedInvoice, error: invError } = await supabase
      .from('invoices')
      .upsert(invoiceRecord, { onConflict: 'invoice_number' })
      .select()
      .single();

    if (invError) {
      console.warn('Advertencia al guardar factura en Supabase:', invError.message);
      return { success: false, error: invError.message };
    }

    const effectiveInvoiceId = savedInvoice?.id || safeId;

    // Guardar los renglones / items de la factura
    if (invoice.items && invoice.items.length > 0 && effectiveInvoiceId) {
      const itemsToInsert = invoice.items.map((it) => {
        const cat = it.productOptionId
          ? JAVA_PRODUCT_CATALOG.find((c) => c.id === it.productOptionId)
          : null;
        const brand = cat?.brand || it.brand || 'Fructi';
        const container = cat?.container || it.container || 'Plástico';
        let size = cat?.size || it.size || '500 ml';
        if (it.productOptionId?.includes('3000') || it.productOptionId?.includes('3.0')) {
          size = '3.0 Litros';
        }
        const isVidrio = container.toLowerCase().includes('vid');
        const unitsPerJava =
          cat?.unitsPerJava ||
          it.unitsPerJava ||
          (isVidrio ? 24 : size.includes('3.0') || size.includes('3L') ? 6 : 12);
        const pricePerJava = it.pricePerJava > 0 ? itemPrice(it.pricePerJava) : (cat?.pricePerJava || 0);
        function itemPrice(p: any) { return Number(p) || 0; }
        const pricePerUnit =
          it.pricePerUnit > 0
            ? it.pricePerUnit
            : cat?.pricePerUnit || Number(((pricePerJava || 0) / unitsPerJava).toFixed(4));

        const itemSubtotal =
          it.subtotal > 0
            ? it.subtotal
            : it.quantityJavas * pricePerJava + (it.quantityUnits || 0) * pricePerUnit;
        const itemTotal = Number((itemSubtotal * 1.15).toFixed(2));
        const totalQty =
          it.quantityJavas * unitsPerJava + (it.quantityUnits || 0);

        const itemCode = it.productOptionId || cat?.id || 'PROD';
        const description = `${brand} ${container} ${size} - ${
          it.selectedFlavor || it.flavorType || 'Original'
        }`;

        return {
          invoice_id: effectiveInvoiceId,
          item_code: itemCode,
          description,
          quantity_javas: it.quantityJavas || 0,
          quantity_units: it.quantityUnits || 0,
          total_quantity: totalQty,
          unit_price: pricePerUnit,
          discount: 0,
          iva_rate: 15,
          subtotal: Number(itemSubtotal.toFixed(2)),
          total: itemTotal,
        };
      });

      // Limpiar items anteriores si era upsert y re-insertar
      await supabase.from('invoice_items').delete().eq('invoice_id', effectiveInvoiceId);
      await supabase.from('invoice_items').insert(itemsToInsert);
    }

    // Vincular invoice_id en la orden si es UUID
    if (orderId) {
      await supabase
        .from('orders')
        .update({ invoice_id: effectiveInvoiceId })
        .eq('id', orderId);
    }

    // Proteger y registrar secuencial de factura en company_tax_profiles
    // ¡CRÍTICO: Únicamente actualizar el secuencial oficial si la factura está AUTORIZADA por el SRI!
    // Las facturas en borrador, pendientes o con errores JAMÁS deben alterar la secuencia oficial.
    if (invoice.sriStatus === 'AUTORIZADO') {
      const seq = parseInt(invoice.invoiceNumber?.replace(/\D/g, '')?.slice(-9) || '0', 10);
      if (seq >= 119 && seq < 3000) {
        updateCompanySecuencialInDb(seq).catch(() => {});
      }
    }

    return { success: true, data: savedInvoice };
  } catch (err: any) {
    console.warn('Excepción al guardar factura en Supabase:', err);
    return { success: false, error: err?.message };
  }
}

export async function getInvoicesFromDb(): Promise<Invoice[] | null> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*), orders(order_number)')
      .order('issued_at', { ascending: false })
      .limit(100);

    if (error) {
      console.warn('Advertencia al consultar facturas en Supabase:', error.message);
      return null;
    }

    return (data || []).map(mapDbInvoice);
  } catch (err) {
    console.warn('Excepción al consultar facturas en Supabase:', err);
    return null;
  }
}

export async function getInvoiceByIdOrNumberFromDb(
  idOrNumber: string
): Promise<Invoice | null> {
  try {
    const clean = decodeURIComponent(idOrNumber).trim();
    if (!clean) return null;

    // 0. Comprobar caché local síncrona si está disponible en el navegador (0ms latencia)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('distribuidora_aneth_oficial_v12');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed.invoices)) {
            const foundInv = parsed.invoices.find(
              (i: Invoice) =>
                i.invoiceNumber === clean ||
                i.id === clean ||
                i.orderId === clean ||
                i.orderNumber === clean ||
                i.claveAcceso === clean
            );
            if (foundInv) return foundInv;
          }
          if (Array.isArray(parsed.orders)) {
            const foundOrder = parsed.orders.find(
              (o: Order) =>
                o.orderNumber === clean ||
                o.id === clean ||
                o.invoiceId === clean ||
                o.invoiceNumber === clean
            );
            if (foundOrder && foundOrder.invoiceNumber && foundOrder.invoiceNumber.includes('001-001-')) {
              return reconstructInvoiceFromOrder(foundOrder);
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // 1. Buscar en la tabla 'invoices' de Supabase
    let query = supabase.from('invoices').select('*, invoice_items(*), orders(order_number)');
    if (isValidUuid(clean)) {
      query = query.or(`id.eq.${clean},order_id.eq.${clean},invoice_number.eq.${clean}`);
    } else {
      query = query.or(`invoice_number.eq.${clean},clave_acceso.eq.${clean}`);
    }

    const { data, error } = await query.limit(1).maybeSingle();
    if (data) {
      return mapDbInvoice(data);
    }

    // 2. Si el identificador es un fac- timestamp, buscar la orden correspondiente creada en ese momento
    if (clean.startsWith('fac-')) {
      const timestamp = parseInt(clean.replace('fac-', ''), 10);
      if (!isNaN(timestamp)) {
        const dateNear = new Date(timestamp);
        const windowStart = new Date(dateNear.getTime() - 15 * 60 * 1000).toISOString();
        const windowEnd = new Date(dateNear.getTime() + 15 * 60 * 1000).toISOString();
        const { data: nearOrders } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .gte('created_at', windowStart)
          .lte('created_at', windowEnd)
          .order('created_at', { ascending: false })
          .limit(1);

        if (nearOrders && nearOrders.length > 0 && nearOrders[0].invoice_number) {
          return reconstructInvoiceFromOrder(mapDbOrder(nearOrders[0]));
        }
      }
    }

    // 3. Buscar si coincide con una orden existente (por order_number o UUID)
    const order = await getOrderByIdFromDb(clean);
    if (order) {
      // Si la orden ya tenía invoice_id UUID, verificar si existe en la tabla de facturas
      if (order.invoiceId && isValidUuid(order.invoiceId)) {
        const { data: linkedInv } = await supabase
          .from('invoices')
          .select('*, invoice_items(*)')
          .eq('id', order.invoiceId)
          .maybeSingle();
        if (linkedInv) return mapDbInvoice(linkedInv);
      }

      // Si la orden tiene un número de factura oficial asignado, recuperarla
      if (order.invoiceNumber && order.invoiceNumber.includes('001-001-')) {
        return reconstructInvoiceFromOrder(order);
      }

      // Si el pedido aún no tiene factura emitida, no inventar datos
      return null;
    }

    return null;
  } catch (err) {
    console.warn('Excepción al buscar factura en Supabase:', err);
    return null;
  }
}

export async function getCompanyTaxProfileFromDb(): Promise<{ ruc: string; current_secuencial: number } | null> {
  try {
    if (typeof window !== 'undefined') {
      const res = await fetch('/api/billing/sequence', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return {
          ruc: DEFAULT_TAX_PROFILE.ruc,
          current_secuencial: Number(data.current_secuencial) || 119,
        };
      }
    }

    const { data, error } = await supabase
      .from('company_tax_profiles')
      .select('ruc, current_secuencial')
      .eq('ruc', DEFAULT_TAX_PROFILE.ruc)
      .maybeSingle();

    if (error) {
      console.warn('Advertencia al consultar company_tax_profiles:', error.message);
      return { ruc: DEFAULT_TAX_PROFILE.ruc, current_secuencial: 119 };
    }

    return {
      ruc: data?.ruc || DEFAULT_TAX_PROFILE.ruc,
      current_secuencial: Number(data?.current_secuencial) || 119,
    };
  } catch (err) {
    console.warn('Excepción al consultar company_tax_profiles:', err);
    return { ruc: DEFAULT_TAX_PROFILE.ruc, current_secuencial: 119 };
  }
}

export async function updateCompanySecuencialInDb(newSecuencial: number): Promise<boolean> {
  try {
    if (!newSecuencial || newSecuencial < 119) return false;

    if (typeof window !== 'undefined') {
      const res = await fetch('/api/billing/sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secuencial: newSecuencial }),
      });
      if (res.ok) return true;
    }

    const { data: existing } = await supabase
      .from('company_tax_profiles')
      .select('id, current_secuencial')
      .eq('ruc', DEFAULT_TAX_PROFILE.ruc)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('company_tax_profiles')
        .update({
          current_secuencial: newSecuencial,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    }
    return true;
  } catch (err) {
    console.warn('Excepción al actualizar secuencial en DB:', err);
    return false;
  }
}

