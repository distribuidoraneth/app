/**
 * Servicio de Sincronización Bidireccional con Supabase PostgreSQL
 */

import { supabase } from '@/lib/supabase/client';
import { Client, JavaProductOption, Order, OrderStatus, Invoice, CartItem } from '@/types';
import { INITIAL_CLIENTS, JAVA_PRODUCT_CATALOG } from '@/lib/mockData';
import { cleanAddress, expandCartItemsToFacturaLines } from '@/lib/utils/formatters';
import { generarClaveAcceso } from '@/lib/sri/claveAcceso';
import { DEFAULT_TAX_PROFILE } from '@/lib/sri/xmlBuilder';

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
    invoiceId: o.invoice_id || undefined,
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

export async function saveOrderToDb(order: Order): Promise<{ success: boolean; data?: any; error?: string }> {
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
        total_bottles: item.totalBottles || ((item.quantityJavas * item.unitsPerJava) + (item.quantityUnits || 0)),
        subtotal: item.subtotal,
      }));

      const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsErr && itemsErr.code === '42703') {
        const fallbackItems = itemsToInsert.map(({ brand, ...rest }: any) => rest);
        await supabase.from('order_items').insert(fallbackItems);
      }
    }

    return { success: true, data: insertedOrder };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function updateOrderStatusInDb(
  orderId: string,
  status: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .or(`id.eq.${orderId},order_number.eq.${orderId}`);

    if (error) {
      console.warn('Advertencia al actualizar estado de orden en Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

function mapDbInvoice(i: any): Invoice {
  const items: CartItem[] = (i.invoice_items || []).map((it: any) => ({
    id: it.id,
    productOptionId: it.item_code || 'opt-generic',
    brand: it.description?.includes('Forest') ? 'Forest' : 'Fructi',
    beverageType: it.description?.includes('Agua') ? 'Aguas' : 'Colas',
    container: 'Plástico',
    size: '500 ml',
    flavorType: 'single',
    selectedFlavor: it.description?.split('-')?.[1]?.trim() || 'General',
    quantityJavas: Number(it.quantity_javas || 0),
    quantityUnits: Number(it.quantity_units || 0),
    unitsPerJava: 12,
    pricePerJava: Number((Number(it.unit_price) * 12).toFixed(2)),
    pricePerUnit: Number(it.unit_price),
    totalBottles: Number(it.total_quantity),
    subtotal: Number(it.subtotal),
  }));

  return {
    id: i.id,
    invoiceNumber: i.invoice_number,
    orderId: i.order_id || '',
    orderNumber: i.orders?.order_number || i.order_number || undefined,
    claveAcceso: i.clave_acceso,
    ambiente: i.ambiente || '1',
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

function reconstructInvoiceFromOrder(order: Order): Invoice {
  const facturaLines = expandCartItemsToFacturaLines(order.items, 15);
  const subtotal15 = Number(facturaLines.reduce((s, l) => s + l.precioTotalSinImpuesto, 0).toFixed(2));
  const tax15 = Number(facturaLines.reduce((s, l) => s + l.iva, 0).toFixed(2));
  const seqMatch = order.orderNumber?.match(/(\d{3,9})/);
  const seqNumber = seqMatch ? parseInt(seqMatch[1].slice(-4), 10) || 1 : 1;
  const invoiceNum = `001-001-${String(seqNumber).padStart(9, '0')}`;

  const claveAcceso = generarClaveAcceso({
    fecha: order.createdAt ? new Date(order.createdAt) : new Date(),
    ruc: DEFAULT_TAX_PROFILE.ruc,
    ambiente: '1',
    establecimiento: DEFAULT_TAX_PROFILE.establecimiento || '001',
    puntoEmision: DEFAULT_TAX_PROFILE.puntoEmision || '001',
    secuencial: seqNumber,
  });

  const reconstructedInvoice: Invoice = {
    id: generateUuid(),
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
    ambiente: '1',
    sriStatus: 'PENDING',
    status: order.paymentStatus === 'paid' ? 'pagada' : 'emitida',
    issuedAt: order.deliveredAt || order.createdAt || new Date().toISOString(),
  };

  // Guardar en segundo plano para que ya quede en la base de datos
  saveInvoiceToDb(reconstructedInvoice).catch((e) =>
    console.warn('Error al auto-persistir factura reconstruida en Supabase:', e)
  );

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
      ambiente: invoice.ambiente || '1',
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
        const itemSubtotal =
          it.subtotal ||
          it.quantityJavas * it.pricePerJava +
            (it.quantityUnits || 0) * (it.pricePerUnit || 0);
        const itemTotal = Number((itemSubtotal * 1.15).toFixed(2));
        const totalQty =
          it.quantityJavas * (it.unitsPerJava || 12) + (it.quantityUnits || 0);
        return {
          invoice_id: effectiveInvoiceId,
          item_code: it.productOptionId || 'PROD',
          description: `${it.brand || 'Fructi'} ${it.beverageType} ${it.container} ${it.size} - ${
            it.selectedFlavor || it.flavorType
          }`,
          quantity_javas: it.quantityJavas || 0,
          quantity_units: it.quantityUnits || 0,
          total_quantity: totalQty,
          unit_price:
            it.pricePerUnit ||
            Number((it.pricePerJava / (it.unitsPerJava || 12)).toFixed(4)),
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

        if (nearOrders && nearOrders.length > 0) {
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

      // Reconstruir la factura en caliente para garantizar disponibilidad inmediata
      return reconstructInvoiceFromOrder(order);
    }

    return null;
  } catch (err) {
    console.warn('Excepción al buscar factura en Supabase:', err);
    return null;
  }
}

