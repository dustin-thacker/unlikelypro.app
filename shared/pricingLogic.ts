import { PRODUCTS, INSPECTION_SERVICES, type Product, type InspectionService } from './productsAndServices';

/**
 * Inspection Categories determine pricing models
 */
export type InspectionCategory = 'TPI' | 'CSI' | 'PSI';

/**
 * TPI = Third-Party Inspection
 * CSI = Continuous Special Inspection (production day pricing)
 * PSI = Periodic Special Inspection (fixed rate pricing)
 */

/**
 * Products that require Continuous Special Inspection (CSI)
 * These use production day pricing: ($600 × Production Days) + $400 + additional services
 */
const CSI_PRODUCTS = [
  'push_pier_288',
  'slab_pier',
  'helical_pier_288',
  'helical_pier_287',
  'wall_anchor',
  'wall_anchor_c_channel',
  'carbon_fiber_strip',
  'intellibrace'
];

/**
 * Products that require Periodic Special Inspection (PSI)
 * These use fixed rate pricing: $400 base + component multipliers
 */
const PSI_PRODUCTS = [
  'wall_pin',
  'intellijack',
  'supplemental_beam_steel'
];

/**
 * Get the inspection category for a product
 */
export function getProductInspectionCategory(productId: string): InspectionCategory {
  if (CSI_PRODUCTS.includes(productId)) return 'CSI';
  if (PSI_PRODUCTS.includes(productId)) return 'PSI';
  return 'TPI';
}

/**
 * System definitions for TPI pricing
 * Products in these groups can be priced as a system ($300) instead of per product
 */
const TPI_SYSTEMS = {
  encapsulation: ['crawlseal_20mil', 'crawlspace_dehumidifier', 'extremebloc_insulation'],
  crawlspace_water_mgmt: ['crawldrain', 'sump_pit', 'sump_pump', 'buried_discharge', 'yardwell_popup'],
  basement_water_mgmt_base: ['basement_gutter', 'drain_tile_basement', 'sump_pit', 'sump_pump', 'buried_discharge', 'yardwell_popup'],
  // Add more system definitions as needed
};

/**
 * Check if selected products form a complete TPI system
 */
export function detectTPISystems(productIds: string[]): {
  systemName: string;
  products: string[];
  isComplete: boolean;
}[] {
  const systems: { systemName: string; products: string[]; isComplete: boolean }[] = [];

  for (const [systemName, systemProducts] of Object.entries(TPI_SYSTEMS)) {
    const matchedProducts = productIds.filter(id => systemProducts.includes(id));
    if (matchedProducts.length > 0) {
      // Check if all required products for the system are present
      const isComplete = systemProducts.every(p => matchedProducts.includes(p));
      systems.push({
        systemName,
        products: matchedProducts,
        isComplete
      });
    }
  }

  return systems;
}

/**
 * Calculate inspection services required based on selected products
 */
export interface CalculatedService {
  serviceId: string;
  serviceName: string;
  category: InspectionCategory;
  products: string[];
  basePrice: number;
  requiresProductionDays: boolean;
  notes?: string;
}

export function calculateInspectionServices(productIds: string[]): CalculatedService[] {
  const services: CalculatedService[] = [];
  const processedProducts = new Set<string>();

  // 1. Detect TPI systems first
  const tpiSystems = detectTPISystems(productIds);
  for (const system of tpiSystems) {
    if (system.isComplete) {
      // Charge as system
      services.push({
        serviceId: system.systemName,
        serviceName: system.systemName.replace(/_/g, ' ').toUpperCase(),
        category: 'TPI',
        products: system.products,
        basePrice: 300,
        requiresProductionDays: false,
        notes: 'System pricing - $300 for complete system'
      });
      system.products.forEach(p => processedProducts.add(p));
    }
  }

  // 2. Group remaining products by inspection service
  const serviceGroups = new Map<string, string[]>();
  
  for (const productId of productIds) {
    if (processedProducts.has(productId)) continue;

    const product = Object.values(PRODUCTS).flat().find((p: Product) => p.id === productId);
    if (!product) continue;

    const category = getProductInspectionCategory(productId);
    
    // Find which inspection service this product belongs to
    for (const service of INSPECTION_SERVICES) {
      if (service.productIds.includes(productId)) {
        const key = `${service.id}_${category}`;
        if (!serviceGroups.has(key)) {
          serviceGroups.set(key, []);
        }
        serviceGroups.get(key)!.push(productId);
        processedProducts.add(productId);
        break;
      }
    }
  }

  // 3. Create service entries for grouped products
  for (const [key, products] of Array.from(serviceGroups.entries())) {
    const [serviceId, category] = key.split('_') as [string, InspectionCategory];
    const service = INSPECTION_SERVICES.find(s => s.id === serviceId);
    if (!service) continue;

    if (category === 'TPI') {
      // TPI by product - $300 each
      services.push({
        serviceId: service.id,
        serviceName: service.name,
        category: 'TPI',
        products,
        basePrice: products.length * 300,
        requiresProductionDays: false,
        notes: `TPI by product - $300 × ${products.length} products`
      });
    } else if (category === 'CSI') {
      // Continuous Special Inspection - production day pricing
      services.push({
        serviceId: service.id,
        serviceName: service.name,
        category: 'CSI',
        products,
        basePrice: 400,
        requiresProductionDays: true,
        notes: 'CSI pricing: ($600 × Production Days) + $400 + additional services'
      });
    } else if (category === 'PSI') {
      // Periodic Special Inspection - fixed rate
      services.push({
        serviceId: service.id,
        serviceName: service.name,
        category: 'PSI',
        products,
        basePrice: 400,
        requiresProductionDays: false,
        notes: 'PSI pricing: $400 base + component multipliers'
      });
    }
  }

  return services;
}

/**
 * Calculate total price for a service with production days
 */
export function calculateServicePrice(
  service: CalculatedService,
  productionDays?: number
): number {
  if (service.category === 'CSI' && productionDays) {
    return (productionDays * 600) + service.basePrice;
  }
  return service.basePrice;
}
