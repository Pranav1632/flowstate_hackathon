export interface InventoryLot {
  lot_id: string;
  warehouse_id: string;
  quantity: number;
  status: string;
  product_name?: string;
}

export interface Shipment {
  id: string;
  destination: string;
  destination_type: string;
  status: string;
  tracking_number: string;
  lot_id?: string;
  quantity?: number;
}

export interface InventoryState {
  lots: InventoryLot[];
  shipments: Shipment[];
}

export interface BlastRadiusNode {
  id: string;
  type: "lot" | "warehouse" | "shipment" | "destination";
  label: string;
  sublabel?: string;
  status: string;
}

export interface BlastRadiusEdge {
  source: string;
  target: string;
  label?: string;
}

export interface BlastRadiusData {
  nodes: BlastRadiusNode[];
  edges: BlastRadiusEdge[];
  lot_id?: string;
  total_units?: number;
  shipments_count?: number;
  product?: {
    product_name?: string;
  };
}
