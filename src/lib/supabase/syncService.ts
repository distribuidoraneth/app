/**
 * Servicio de Sincronización Bidireccional con Supabase PostgreSQL
 */

import { supabase } from '@/lib/supabase/client';
import { Client, JavaProductOption, Order } from '@/types';
import { INITIAL_CLIENTS, JAVA_PRODUCT_CATALOG } from '@/lib/mockData';

export async function getClientsFromDb(): Promise<Client[]> {
  try {
    const { data, error } = await supabase.from('clients').select('*');
    if (error || !data || data.length === 0) {
      return INITIAL_CLIENTS;
    }

    return data.map((c: any) => ({
      id: c.id,
      qrToken: c.qr_token || `aneth-${c.id}`,
      fullName: c.full_name,
      businessName: c.business_name,
      gender: c.gender || 'Hombre',
      whatsappNumber: c.whatsapp_number,
      latitude: Number(c.latitude),
      longitude: Number(c.longitude),
      addressReference: c.address_reference,
      taxId: c.tax_id,
      taxIdType: c.tax_id_type,
      email: c.email,
      creditLimit: Number(c.credit_limit || 0),
      currentDebt: Number(c.current_debt || 0),
      birthDate: c.birth_date,
      economicActivity: c.economic_activity,
      taxpayerType: c.taxpayer_type,
      createdAt: c.created_at,
    }));
  } catch {
    return INITIAL_CLIENTS;
  }
}

export async function saveClientToDb(client: Client): Promise<{ success: boolean; error?: string }> {
  try {
    const clientRecord: any = {
      id: client.id,
      qr_token: client.qrToken,
      full_name: client.fullName,
      business_name: client.businessName,
      gender: client.gender,
      whatsapp_number: client.whatsappNumber,
      latitude: client.latitude,
      longitude: client.longitude,
      address_reference: client.addressReference,
      tax_id: client.taxId || null,
      tax_id_type: client.taxIdType || null,
      email: client.email || null,
      credit_limit: client.creditLimit || 0,
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

export async function getProductsFromDb(): Promise<JavaProductOption[]> {
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error || !data || data.length === 0) {
      return JAVA_PRODUCT_CATALOG;
    }

    return data.map((p: any) => ({
      id: p.id,
      beverageType: p.beverage_type,
      container: p.container,
      size: p.size,
      allowedFlavors: p.allowed_flavors || [],
      unitsPerJava: Number(p.units_per_java),
      pricePerJava: Number(p.price_per_java),
      pricePerUnit: p.price_per_unit ? Number(p.price_per_unit) : undefined,
      imageUrl: p.image_url,
      description: p.description,
      stockJavas: Number(p.stock_javas || 100),
    }));
  } catch {
    return JAVA_PRODUCT_CATALOG;
  }
}

export async function saveOrderToDb(order: Order): Promise<{ success: boolean; error?: string }> {
  try {
    const orderRecord = {
      order_number: order.orderNumber,
      client_id: order.clientId && order.clientId.startsWith('cli-') ? null : order.clientId,
      client_name: order.clientName,
      business_name: order.businessName,
      whatsapp_number: order.whatsappNumber,
      latitude: order.latitude,
      longitude: order.longitude,
      address_reference: order.addressReference,
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
    };

    const { data: insertedOrder, error: orderErr } = await supabase
      .from('orders')
      .insert(orderRecord)
      .select()
      .single();

    if (orderErr) {
      console.warn('Advertencia al guardar orden en Supabase:', orderErr.message);
      return { success: false, error: orderErr.message };
    }

    // Insert order items
    if (insertedOrder && order.items && order.items.length > 0) {
      const itemsToInsert = order.items.map((item) => ({
        order_id: insertedOrder.id,
        product_option_id: item.productOptionId && item.productOptionId.startsWith('opt-') ? null : item.productOptionId,
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

      await supabase.from('order_items').insert(itemsToInsert);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
