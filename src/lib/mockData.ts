import type { Client, JavaProductOption, Order, Invoice } from '@/types';

export const INITIAL_CLIENTS: Client[] = [];

// Precios Oficiales de Catálogo (Con IVA incluido):
// --- COLAS (FRUCTI) ---
// 300ml Plástico: 12 unidades - $3.60
// 500ml Plástico: 12 unidades - $4.10
// 1.5L Plástico: 12 unidades - $10.50
// 3.0L Plástico: 6 unidades - $10.00
// 300ml Vidrio Retornable: 24 unidades - $8.50
// --- TÉS (FRUCTI) ---
// 550ml Plástico: 12 unidades - $5.00
// --- AGUAS (FOREST) ---
// 600ml Plástico: 12 unidades - $3.12 ($0.26 c/u)
// 1 Litro Plástico: 12 unidades - $3.96 ($0.33 c/u)
export const JAVA_PRODUCT_CATALOG: JavaProductOption[] = [
  // --- COLAS (FRUCTI) ---
  {
    id: 'opt-colas-plastico-250',
    brand: 'Fructi',
    beverageType: 'Colas',
    container: 'Plástico',
    size: '250 ml',
    allowedFlavors: ['Piña'],
    unitsPerJava: 12,
    pricePerJava: 2.50,
    pricePerUnit: 0.2083,
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80',
    description: 'Pack de 12 botellas de 250 ml plástico. Sabor Piña.',
    stockJavas: 100,
  },
  {
    id: 'opt-colas-plastico-300',
    brand: 'Fructi',
    beverageType: 'Colas',
    container: 'Plástico',
    size: '300 ml',
    allowedFlavors: ['Piña', 'Mandarina', 'Uva', 'Tamarindo', 'Mora'],
    unitsPerJava: 12,
    pricePerJava: 3.60,
    pricePerUnit: 0.30,
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80',
    description: 'Pack de 12 botellas de 300 ml plástico. Sabores: Piña, Mandarina, Uva, Tamarindo, Mora.',
    stockJavas: 120,
  },
  {
    id: 'opt-colas-plastico-500',
    brand: 'Fructi',
    beverageType: 'Colas',
    container: 'Plástico',
    size: '500 ml',
    allowedFlavors: ['Piña', 'Mora'],
    unitsPerJava: 12,
    pricePerJava: 4.10,
    pricePerUnit: 0.3417,
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
    description: 'Pack de 12 botellas de 500 ml plástico. Sabores: Piña y Mora.',
    stockJavas: 95,
  },
  {
    id: 'opt-colas-plastico-1500',
    brand: 'Fructi',
    beverageType: 'Colas',
    container: 'Plástico',
    size: '1.5 Litros',
    allowedFlavors: ['Piña', 'Mora'],
    unitsPerJava: 12,
    pricePerJava: 10.50,
    pricePerUnit: 0.875,
    imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&auto=format&fit=crop&q=80',
    description: 'Pack de 12 botellas de 1.5 Litros plástico. Sabores: Piña y Mora.',
    stockJavas: 65,
  },
  {
    id: 'opt-colas-plastico-3000',
    brand: 'Fructi',
    beverageType: 'Colas',
    container: 'Plástico',
    size: '3.0 Litros',
    allowedFlavors: ['Piña'],
    unitsPerJava: 6,
    pricePerJava: 10.00,
    pricePerUnit: 1.6667,
    imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&auto=format&fit=crop&q=80',
    description: 'Pack de 6 botellas de 3.0 Litros plástico. Sabor Piña.',
    stockJavas: 40,
  },
  {
    id: 'opt-colas-vidrio-300',
    brand: 'Fructi',
    beverageType: 'Colas',
    container: 'Vidrio',
    size: '300 ml',
    allowedFlavors: ['Piña', 'Mandarina', 'Tamarindo', 'Mora'],
    unitsPerJava: 24,
    pricePerJava: 8.50,
    pricePerUnit: 0.3542,
    imageUrl: 'https://images.unsplash.com/photo-1543253687-c931c8e01820?w=600&auto=format&fit=crop&q=80',
    description: 'Java de 24 botellas de vidrio de 300 ml retornable. Con azúcar de caña natural.',
    stockJavas: 110,
  },

  // --- TÉS (FRUCTI) ---
  {
    id: 'opt-tes-plastico-250',
    brand: 'Fructi',
    beverageType: 'Tés',
    container: 'Plástico',
    size: '250 ml',
    allowedFlavors: ['Lima Limón', 'Flor de Jamaica'],
    unitsPerJava: 12,
    pricePerJava: 2.50,
    pricePerUnit: 0.2083,
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
    description: 'Pack de 12 botellas de té 250 ml. Sabores: Lima Limón y Flor de Jamaica.',
    stockJavas: 80,
  },
  {
    id: 'opt-tes-plastico-550',
    brand: 'Fructi',
    beverageType: 'Tés',
    container: 'Plástico',
    size: '550 ml',
    allowedFlavors: ['Lima Limón', 'Flor de Jamaica'],
    unitsPerJava: 12,
    pricePerJava: 5.00,
    pricePerUnit: 0.4167,
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
    description: 'Pack de 12 botellas de té 550 ml. Sabores: Lima Limón y Flor de Jamaica.',
    stockJavas: 60,
  },
  {
    id: 'opt-tes-plastico-1500',
    brand: 'Fructi',
    beverageType: 'Tés',
    container: 'Plástico',
    size: '1.5 Litros',
    allowedFlavors: ['Lima Limón', 'Flor de Jamaica'],
    unitsPerJava: 6,
    pricePerJava: 5.25,
    pricePerUnit: 0.875,
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
    description: 'Pack de 6 botellas de té 1.5 Litros plástico. Sabores: Lima Limón y Flor de Jamaica.',
    stockJavas: 60,
  },

  // --- AGUAS (FOREST) ---
  {
    id: 'opt-aguas-forest-600',
    brand: 'Forest',
    beverageType: 'Aguas',
    container: 'Plástico',
    size: '600 ml',
    allowedFlavors: ['Sin Gas', 'Con Gas'],
    unitsPerJava: 12,
    pricePerJava: 3.12,
    pricePerUnit: 0.26,
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80',
    description: 'Pack de 12 botellas de agua Forest 600 ml ($0.26 por unidad con IVA).',
    stockJavas: 90,
  },
  {
    id: 'opt-aguas-forest-1000',
    brand: 'Forest',
    beverageType: 'Aguas',
    container: 'Plástico',
    size: '1 Litro',
    allowedFlavors: ['Sin Gas', 'Con Gas'],
    unitsPerJava: 12,
    pricePerJava: 3.96,
    pricePerUnit: 0.33,
    imageUrl: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?w=600&auto=format&fit=crop&q=80',
    description: 'Pack de 12 botellas de agua Forest 1 Litro ($0.33 por unidad con IVA).',
    stockJavas: 70,
  }
];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_INVOICES: Invoice[] = [];
