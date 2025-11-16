/**
 * Products and Inspection Services Data Structures
 * Maps individual products to their corresponding inspection services
 */

export type Product = {
  id: string;
  name: string;
  unit?: string; // LF (Linear Feet), SF (Square Feet), EA (Each)
  aliases?: string[]; // Alternative names for product matching
};

export type InspectionService = {
  id: string;
  name: string;
  productIds: string[]; // Products that trigger this service
};

// All products organized by category
export const PRODUCTS: Record<string, Product[]> = {
  drainage: [
    { id: 'buried_discharge', name: 'Buried Discharge', unit: 'LF' },
    { id: 'interior_pvc_discharge', name: 'Interior PVC Discharge', unit: 'LF' },
    { id: 'basement_gutter', name: 'BasementGutter', unit: 'LF', aliases: ['Basement Gutter'] },
    { id: 'crawl_drain', name: 'CrawlDrain', unit: 'LF', aliases: ['Crawl Drain'] },
    { id: 'drain_tile_basement', name: 'Drain Tile-Basement', unit: 'LF', aliases: ['Drain Tile'] },
    { id: 'lateral_line', name: 'Lateral Line', unit: 'LF' },
    { id: 'inspection_port', name: 'Inspection Port', unit: 'EA' },
    { id: 'freeze_guard', name: 'FreezeGuard', unit: 'EA', aliases: ['Freeze Guard'] },
    { id: 'mini_channel', name: 'Mini Channel', unit: 'LF', aliases: ['MiniChannel'] },
    { id: 'speed_channel', name: 'SpeeD-Channel', unit: 'LF', aliases: ['Speed Channel', 'Channel Drain'] },
    { id: 'window_well_tap', name: 'Window Well Tap', unit: 'EA' },
    { id: 'yardwell_popup', name: 'YardWell Pop-up Emitter', unit: 'EA', aliases: ['Emitter', 'YardWell'] },
  ],
  
  waterproofing: [
    { id: 'wallseal_basement', name: 'WallSeal Basement Wall System', unit: 'LF', aliases: ['WallSeal'] },
    { id: 'sump_pit', name: 'Sump Pit', unit: 'EA' },
    { id: 'sump_pump', name: 'Sump Pump', unit: 'EA' },
    { id: 'exterior_water_membrane', name: 'Exterior Water Membrane', unit: 'SF' },
  ],
  
  structural_support: [
    { id: 'intellibrace', name: 'IntelliBrace', unit: 'EA', aliases: ['Steel Brace', 'PowerBrace'] },
    { id: 'wall_anchor', name: 'Wall Anchor', unit: 'EA' },
    { id: 'wall_anchor_c_channel', name: 'Wall Anchor with C-Channel', unit: 'EA', aliases: ['Channel Anchor'] },
    { id: 'carbon_fiber_strip', name: 'Carbon Fiber Strip', unit: 'LF', aliases: ['CFRP Strip', 'CFRP Strap'] },
  ],
  
  encapsulation: [
    { id: 'crawlseal_liner', name: 'CrawlSeal 20mil Liner', unit: 'SF', aliases: ['CrawlSeal', 'Moisture Barrier'] },
    { id: 'drainage_matting', name: 'Drainage Matting', unit: 'SF' },
    { id: 'wallseal_vapor_barrier', name: 'WallSeal Vapor Barrier 6mil', unit: 'SF', aliases: ['Vapor Barrier'] },
    { id: 'extremebloc_insulation', name: 'Extremebloc Insulation Board', unit: 'SF', aliases: ['Rigid Insulation'] },
    { id: 'crawlspace_dehumidifier', name: 'Crawlspace Dehumidifier', unit: 'EA', aliases: ['Dehumidifier'] },
  ],
  
  foundation_piers: [
    { id: 'helical_pier_288', name: 'Helical Pier 288', unit: 'EA', aliases: ['Helical Pile'] },
    { id: 'push_pier_288', name: 'Push Pier 288', unit: 'EA', aliases: ['Foundation Pier', 'PushPier'] },
    { id: 'slab_pier', name: 'Slab Pier', unit: 'EA', aliases: ['SlabPier'] },
    { id: 'helical_pier_287', name: 'Helical Pier 287', unit: 'EA' },
  ],
  
  structural_repair: [
    { id: 'floor_joist_replace', name: 'Floor Joist-Replace', unit: 'EA', aliases: ['Floor Joist Replace'] },
    { id: 'floor_joist_sister', name: 'Floor Joist-Sister', unit: 'EA', aliases: ['Floor Joist Sister'] },
    { id: 'lumber_beam_replace', name: 'Lumber Main Beam-Replace', unit: 'EA', aliases: ['Lumber Beam Replace'] },
    { id: 'lumber_beam_sister', name: 'Lumber Main Beam-Sister', unit: 'EA', aliases: ['Lumber Beam Sister'] },
    { id: 'web_stiffeners', name: 'Web Stiffeners-TJ\'s', unit: 'EA', aliases: ['Web Stiffeners'] },
    { id: 'perimeter_beam_replace', name: 'Perimeter Beam-Replace', unit: 'EA' },
    { id: 'sill_plate_replace', name: 'Sill Plate-Replace', unit: 'EA', aliases: ['Sill Plate Replace'] },
    { id: 'band_board_replace', name: 'Band Board-Replace', unit: 'EA', aliases: ['Band Board Replace', 'Rim Joist Replace'] },
    { id: 'sub_floor_replace', name: 'Sub Floor-Replace', unit: 'SF', aliases: ['Subfloor Replace'] },
    { id: 'intellijack', name: 'IntelliJack', unit: 'EA', aliases: ['Adjustable Column'] },
    { id: 'pier_footer_cip', name: 'Pier Footer-CIP (cast-in-place)', unit: 'EA', aliases: ['Pier Footing CIP', 'CIP Footing'] },
    { id: 'pier_footer_precast', name: 'Pier Footer-Pre-cast', unit: 'EA', aliases: ['Pier Footing Precast', 'Precast Footing'] },
    { id: 'supplemental_beam_lumber', name: 'Supplemental Beam-Lumber', unit: 'LF' },
    { id: 'supplemental_beam_steel', name: 'Supplemental Beam-IntelliBeam (Steel)', unit: 'LF', aliases: ['IntelliBeam', 'Steel Beam', 'S4 7x7'] },
  ],
  
  concrete: [
    { id: 'concrete_slab_rat', name: 'Concrete Slab Remove & Patch/Replace (Rat Slab)', unit: 'SF', aliases: ['Rat Slab', 'Slab Patch'] },
    { id: 'concrete_slab_structural', name: 'Concrete Slab Remove & Patch/Replace (Structural Slab)', unit: 'SF', aliases: ['Structural Slab', 'Slab Repair'] },
    { id: 'brick_lintels', name: 'Brick Lintels-Replace', unit: 'EA', aliases: ['Brick Lintel'] },
    { id: 'abcd_underpinning', name: 'ABCD Foundation Underpinning', unit: 'LF', aliases: ['Foundation Underpinning'] },
  ],
};

// Flatten all products into a single array
export const ALL_PRODUCTS: Product[] = Object.values(PRODUCTS).flat();

// Inspection Services with their associated products
export const INSPECTION_SERVICES: InspectionService[] = [
  {
    id: 'anchor_systems',
    name: 'Anchor Systems',
    productIds: ['wall_anchor', 'wall_anchor_c_channel'],
  },
  {
    id: 'bracing_systems',
    name: 'Bracing Systems',
    productIds: ['carbon_fiber_strip', 'intellibrace'],
  },
  {
    id: 'encapsulation_systems',
    name: 'Encapsulation Systems',
    productIds: ['crawlseal_liner', 'crawlspace_dehumidifier', 'extremebloc_insulation', 'wallseal_vapor_barrier'],
  },
  {
    id: 'support_systems',
    name: 'Support Systems',
    productIds: [
      'intellijack',
      'pier_footer_cip',
      'pier_footer_precast',
      'supplemental_beam_lumber',
      'supplemental_beam_steel',
      'lumber_beam_replace',
      'lumber_beam_sister',
      'band_board_replace',
      'floor_joist_replace',
      'floor_joist_sister',
      'sill_plate_replace',
      'sub_floor_replace',
      'web_stiffeners',
      'perimeter_beam_replace',
    ],
  },
  {
    id: 'underpinning_systems',
    name: 'Underpinning Systems',
    productIds: ['push_pier_288', 'slab_pier', 'helical_pier_288', 'helical_pier_287'],
  },
  {
    id: 'water_management_basement',
    name: 'Water Management Systems (Basement)',
    productIds: [
      'basement_gutter',
      'drain_tile_basement',
      'speed_channel',
      'mini_channel',
      'sump_pit',
      'sump_pump',
      'buried_discharge',
      'interior_pvc_discharge',
      'lateral_line',
      'yardwell_popup',
      'wallseal_basement',
      'concrete_slab_rat',
    ],
  },
  {
    id: 'water_management_crawlspace',
    name: 'Water Management Systems (Crawlspace)',
    productIds: [
      'crawl_drain',
      'drain_tile_basement',
      'sump_pit',
      'sump_pump',
      'buried_discharge',
      'lateral_line',
      'yardwell_popup',
    ],
  },
  {
    id: 'foundation_systems',
    name: 'Foundation Systems',
    productIds: [
      'pier_footer_cip',
      'pier_footer_precast',
      'exterior_water_membrane',
      'concrete_slab_rat',
      'concrete_slab_structural',
      'abcd_underpinning',
    ],
  },
  {
    id: 'retaining_wall_systems',
    name: 'Retaining Wall Systems',
    productIds: ['exterior_water_membrane', 'brick_lintels'],
  },
];

/**
 * Determine which inspection services are needed based on selected products
 */
export function getRequiredServices(productIds: string[]): InspectionService[] {
  const requiredServices: InspectionService[] = [];
  
  for (const service of INSPECTION_SERVICES) {
    // Check if any of the service's products are in the selected products
    const hasProduct = service.productIds.some(pid => productIds.includes(pid));
    if (hasProduct) {
      requiredServices.push(service);
    }
  }
  
  return requiredServices;
}

/**
 * Match products from extracted scope of work text
 */
export function matchProductsFromText(text: string): string[] {
  const matchedProductIds: Set<string> = new Set();
  const lowerText = text.toLowerCase();
  
  for (const product of ALL_PRODUCTS) {
    // Check product name
    if (lowerText.includes(product.name.toLowerCase())) {
      matchedProductIds.add(product.id);
      continue;
    }
    
    // Check aliases
    if (product.aliases) {
      for (const alias of product.aliases) {
        if (lowerText.includes(alias.toLowerCase())) {
          matchedProductIds.add(product.id);
          break;
        }
      }
    }
  }
  
  return Array.from(matchedProductIds);
}
