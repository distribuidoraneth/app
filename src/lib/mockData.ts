import { Client, JavaProductOption, Order, Invoice } from '@/types';

export const INITIAL_CLIENTS: Client[] = [];

// Precios y Unidades Oficiales por Java:
// 250ml: 12 unidades - $2.50
// 300ml: 12 unidades - $3.60
// 500ml: 12 unidades - $4.10
// 1.5 Litros: 12 unidades - $10.50
// 3.0 Litros: 6 unidades - $10.00
// 300ml Vidrio: 24 unidades - $8.75
export const JAVA_PRODUCT_CATALOG: JavaProductOption[] = [
  // --- COLAS PLÁSTICO ---
  {
    id: 'opt-colas-plastico-250',
    beverageType: 'Colas',
    container: 'Plástico',
    size: '250 ml',
    allowedFlavors: ['Piña'],
    unitsPerJava: 12,
    pricePerJava: 2.50,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
    description: 'Java de 12 botellas de 250 ml. Sabor Piña.',
    stockJavas: 80,
  },
  {
    id: 'opt-colas-plastico-300',
    beverageType: 'Colas',
    container: 'Plástico',
    size: '300 ml',
    allowedFlavors: ['Piña', 'Tamarindo', 'Mora', 'Uva', 'Mandarina'],
    unitsPerJava: 12,
    pricePerJava: 3.60,
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80',
    description: 'Java de 12 botellas de 300 ml. Disponible en todos los sabores y surtido.',
    stockJavas: 120,
  },
  {
    id: 'opt-colas-plastico-500',
    beverageType: 'Colas',
    container: 'Plástico',
    size: '500 ml',
    allowedFlavors: ['Piña', 'Mora'],
    unitsPerJava: 12,
    pricePerJava: 4.10,
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
    description: 'Java de 12 botellas de 500 ml. Disponible en Piña y Mora.',
    stockJavas: 95,
  },
  {
    id: 'opt-colas-plastico-1500',
    beverageType: 'Colas',
    container: 'Plástico',
    size: '1.5 Litros',
    allowedFlavors: ['Piña', 'Mora'],
    unitsPerJava: 12,
    pricePerJava: 10.50,
    imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&auto=format&fit=crop&q=80',
    description: 'Java de 12 botellas de 1.5 Litros.',
    stockJavas: 65,
  },
  {
    id: 'opt-colas-plastico-3000',
    beverageType: 'Colas',
    container: 'Plástico',
    size: '3.0 Litros',
    allowedFlavors: ['Piña'],
    unitsPerJava: 6,
    pricePerJava: 10.00,
    imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&auto=format&fit=crop&q=80',
    description: 'Java de 6 botellas de 3.0 Litros. Sabor Piña.',
    stockJavas: 40,
  },

  // --- COLAS VIDRIO ---
  {
    id: 'opt-colas-vidrio-300',
    beverageType: 'Colas',
    container: 'Vidrio',
    size: '300 ml',
    allowedFlavors: ['Mora', 'Piña', 'Mandarina', 'Tamarindo'],
    unitsPerJava: 24,
    pricePerJava: 8.75,
    imageUrl: 'https://images.unsplash.com/photo-1543253687-c931c8e01820?w=600&auto=format&fit=crop&q=80',
    description: 'Java de 24 botellas de vidrio de 300 ml retornable.',
    stockJavas: 110,
  },

  // --- AGUAS PLÁSTICO ---
  {
    id: 'opt-aguas-plastico-500',
    beverageType: 'Aguas',
    container: 'Plástico',
    size: '500 ml',
    allowedFlavors: ['Sin Gas', 'Con Gas'],
    unitsPerJava: 12,
    pricePerJava: 4.10,
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80',
    description: 'Java de 12 botellas de agua purificada 500 ml.',
    stockJavas: 90,
  },
  {
    id: 'opt-aguas-plastico-1500',
    beverageType: 'Aguas',
    container: 'Plástico',
    size: '1.5 Litros',
    allowedFlavors: ['Sin Gas', 'Con Gas'],
    unitsPerJava: 12,
    pricePerJava: 5.00,
    imageUrl: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?w=600&auto=format&fit=crop&q=80',
    description: 'Java de 12 botellas de agua purificada 1.5 Litros.',
    stockJavas: 70,
  },

  // --- TÉS ---
  {
    id: 'opt-tes-vidrio-300',
    beverageType: 'Tés',
    container: 'Vidrio',
    size: '300 ml',
    allowedFlavors: ['Limón', 'Durazno'],
    unitsPerJava: 24,
    pricePerJava: 8.75,
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
    description: 'Java de 24 botellas de vidrio de té 300 ml.',
    stockJavas: 50,
  },
  {
    id: 'opt-tes-plastico-500',
    beverageType: 'Tés',
    container: 'Plástico',
    size: '500 ml',
    allowedFlavors: ['Limón', 'Durazno'],
    unitsPerJava: 12,
    pricePerJava: 4.10,
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
    description: 'Java de 12 botellas de té 500 ml.',
    stockJavas: 60,
  },
  {
    id: 'opt-tes-plastico-1500',
    beverageType: 'Tés',
    container: 'Plástico',
    size: '1.5 Litros',
    allowedFlavors: ['Limón', 'Durazno'],
    unitsPerJava: 12,
    pricePerJava: 10.50,
    imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop&q=80',
    description: 'Java de 12 botellas de té 1.5 Litros.',
    stockJavas: 40,
  }
];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_INVOICES: Invoice[] = [];
