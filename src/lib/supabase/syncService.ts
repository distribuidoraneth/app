/**
 * Servicio de Sincronización Bidireccional con Supabase PostgreSQL
 */

import { supabase } from '@/lib/supabase/client';
import { Client, JavaProductOption, Order, Invoice } from '@/types';
import { INITIAL_CLIENTS, JAVA_PRODUCT_CATALOG } from '@/lib/mockData';

export async function getClientsFromDb(): Promise<Client[]> {
  try {
    const { data, error } = await supabase.from('clients', 'select=*');
    if (error || !data || data.length === 0) {
      return INITIAL_CLIENTS;
    }

    return data.map((c: any) => ({
      id: c.id,
      qrToken: c.qr_token,
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
      createdAt: c.created_at,
    }));
  } catch {
    return INITIAL_CLIENTS;
  }
}

export async function getProductsFromDb(): Promise<JavaProductOption[]> {
  try {
    const { data, error } = await supabase.from('products', 'select=*');
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
      stockJavas: Number(p.stock_javas),
    }));
  } catch {
    return JAVA_PRODUCT_CATALOG;
  }
}

export async function saveOrderToDb(order: Order): Promise<{ success: boolean; error?: string }> {
  try {
    const orderRecord = {
      order_number: order.orderNumber,
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
      payment_status: order.paymentStatus,
      payment_method: order.paymentMethod,
      notes: order.notes,
    };

    const { data: insertedOrder, error: orderErr } = await supabase.insert('orders', orderRecord);
    if (orderErr) {
      console.warn('Advertencia al guardar orden en Supabase:', orderErr);
      return { success: false, error: orderErr };
    }

    // Insert order items
    if (insertedOrder && order.items && order.items.length > 0) {
      for (const item of order.items) {
        await supabase.insert('order_items', {
          order_id: insertedOrder.id,
          product_option_id: item.productOptionId,
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
        });
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
