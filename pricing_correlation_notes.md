# Pricing Correlation Notes

Source: https://docs.google.com/document/d/1uG5q4NZQOwCnLx-MooCooXlYg0irk5vUia_K1LqW3os/edit?usp=sharing

## 1. Third-Party Inspection (TPI) by Product - $300 per product

**Project Structure:**
- Project Level: Contains multiple Tasks (System Inspections)
- Task Level: System Inspection Service  
- Subtask Level: Individual Products (each priced at $300)

**Product-to-System Correlation:**

Foundation & Structural Products:
- Pier Footer → Foundation Systems
- CIP Footer → Foundation Systems
- Foundation Wall → Foundation Systems
- Exterior Waterproofing → Foundation Systems
- Backfill → Multiple Systems (Foundation, Underpinning, Anchor)
- Slabs → Foundation Systems
- Porch → Foundation Systems
- Stoop → Foundation Systems
- Areaway → Foundation Systems

Wood Support Products:
- Wood Floor Joist - Sister → Support Systems
- Wood Floor Joist - Replace → Support Systems
- Wood Rim Joist → Support Systems
- Wood Sill Plate → Support Systems
- Wood Beam - Sister → Support Systems
- Wood Beam - Replace → Support Systems
- Wood Beam - Supplemental → Support Systems
- Wood Subfloor → Support Systems

**Invoicing Structure:**
```
Project: Client Name - Project Number - Address
├─ Task: Foundation System Inspection ($300 per product)
│  ├─ Subtask: Foundation Wall ($300)
│  ├─ Subtask: Backfill ($300)
│  └─ Subtask: Slabs ($300)
├─ Task: Support System Inspection ($300 per product)
│  ├─ Subtask: Wood Floor Joist - Sister ($300)
│  └─ Subtask: Wood Beam - Replace ($300)
Total: $1,500 (5 products × $300)
```

## 2. Third-Party Inspection (TPI) by System - $300 per system

**System-Based Pricing:**

### Encapsulation System - $300
- **Products Included:**
  - Moisture Barrier (CrawlSeal)
  - Rigid Insulation
  - Dehumidifier
- **Project Structure:** Single Task with multiple Subtasks (products)
- **Invoicing:** One line item at $300 regardless of how many products are used

### Water Management Systems:

**Crawlspace Water Management - $300**
- **Products Included:**
  - Drain Tile
  - Channel Drain
  - Sump Pump/Pit
  - Discharge Line
  - Yard Well

**Basement Water Management with Slab Work - $600**
- **Base System:** $300
- **Slab Repair:** +$300
- **Products Included:**
  - Basement Gutter
  - Drain Tile
  - Channel Drain
  - Sump Pump/Pit
  - Discharge Line
  - Yard Well

**Basement Water Management with Slab Work and Moisture Barrier - $900**
- **Base System:** $300
- **Slab Repair:** +$300
- **Moisture Barrier:** +$300
- **Products Included:** All above plus WallSeal

**Project Structure Mapping:**
```
Project: Client Name - Project Number - Address
├─ Task: Encapsulation System Inspection ($300)
│  ├─ Subtask: Moisture Barrier (Included)
│  ├─ Subtask: Rigid Insulation (Included)
│  └─ Subtask: Dehumidifier (Included)
├─ Task: Basement Water Management System ($600)
│  ├─ Subtask: Basement Gutter (Included)
│  ├─ Subtask: Drain Tile (Included)
│  ├─ Subtask: Sump Pump/Pit (Included)
│  └─ Subtask: Slab Work (+$300)
Total: $900
```

## 3. Special Inspection (SI) by System

### Fixed Rate SI - $400 per system

**Steel Beam Supplemental System - $400**
- **Project Structure:** Single Task
- **Invoicing:** Fixed $400 per system

**Adjustable Column System - $400 + $300 per footer type**
- **Base Rate:** $400
- **Additional:** $300 per different footer type
- **Examples:**
  - 1 footer type: $400 + $300 = $700
  - 2 footer types: $400 + $300 + $300 = $1,000

### Production Day SI - ($600 × Production Days) + $400

**Formula:** (Number of Production Days × $600) + $400 base

**Anchor Systems:**
- Wall Anchors
- Channel Anchors  
- Backfills

**CFRP Systems:**
- Carbon Fiber Reinforced Polymer Straps

**Underpinning Systems:**
- Push Piers
- Helical Piers
- Slab Piers

## Key Takeaways

1. **Three Pricing Models:**
   - TPI by Product: $300 each product
   - TPI by System: $300 base (with add-ons for complexity)
   - SI by System: $400 base (with production day multipliers)

2. **Hierarchy:**
   - Project → Tasks (System Inspections) → Subtasks (Products)

3. **Invoicing Logic:**
   - Some systems bundle products into one price
   - Some systems charge per product
   - Special inspections add production day calculations

4. **Need to determine:**
   - How does the system know which pricing model to use?
   - Is it based on client preference?
   - Is it based on jurisdiction requirements?
   - Is it based on project type?

## Production Day SI Details

**Formula:** ($600 × Production Days) + $400

### Anchor Systems:
- **Wall Anchor System:** Base $400 + ($600 × Production Days) + $300 (Backfill)
- **Channel Anchor System:** Base $400 + ($600 × Production Days) + $300 (Backfill)

### CFRP Systems:
- **Base Formula:** ($600 × Production Days) + $400

### Underpinning Systems:
- **Push Piers System:** Base $400 + ($600 × Production Days) + $300 (Backfill)
- **Slab Piers System:** Base $400 + ($600 × Production Days) + $300 (Slab Patch)
- **Helical Piles System:** Base $400 + ($600 × Production Days) + $300 (Backfill)

**Example Project Structure:**
```
Project: Client Name - Project Number - Address
├─ Task: Wall Anchor System Inspection
│  ├─ Production Days: 1
│  ├─ Base Rate: $400
│  ├─ Production Day Rate: $600 × 1 = $600
│  ├─ Subtask: Backfill (+$300)
│  └─ Total: $1,300
├─ Task: Push Piers System Inspection
│  ├─ Production Days: 2
│  ├─ Base Rate: $400
│  ├─ Production Day Rate: $600 × 2 = $1,200
│  ├─ Subtask: Backfill (+$300)
│  └─ Total: $1,900
Total Project: $3,200
```

## 4. Correlation Rules for Implementation

### Project-to-Task Relationship:
1. **Project** = Overall inspection job for a client
2. **Task** = System-level inspection service
3. **Subtask** = Product-level components or additional services

### Pricing Calculation Logic:
1. **TPI by Product:** Sum all product subtasks × $300
2. **TPI by System:** Fixed system rate + additional components
3. **SI Fixed:** Base rate + component multipliers
4. **SI Production Day:** (Production Days × $600) + $400 + additional services

### Status Workflow Integration:
- **Project Status:** Tracks overall project progress
- **Task Status:** Tracks system inspection progress
- **Subtask Status:** Tracks individual product/component completion

### Custom Fields Required:

**Project Level:**
- Total Value
- Production Days
- Inspection Type (TPI by Product, TPI by System, SI Fixed, SI Production Day)

**Task Level:**
- Service Type
- Base Rate
- Production Day Rate
- System Status

**Subtask Level:**
- Product Type
- Quantity
- Material Details
- Installation Details

## Questions for Clarification

1. **How is the inspection type determined?**
   - Is it based on client preference?
   - Is it based on jurisdiction requirements?
   - Is it based on the type of products being installed?

2. **Can a single project have multiple pricing models?**
   - Example: Some systems priced by product, others by system?

3. **When does Production Day pricing apply?**
   - Only for Special Inspections?
   - Only for specific systems (Anchor, CFRP, Underpinning)?

4. **How are footer types counted for Adjustable Column pricing?**
   - Is it the number of different footer designs?
   - Or the total number of footers?
