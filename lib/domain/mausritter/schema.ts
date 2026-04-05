export interface RandomTable {
  id: string;
  name: string;
  description?: string;
  die: string;
  entries: RandomTableEntry[];
}

export interface RandomTableEntry {
  roll: number | string;
  result: string;
}

export interface MultiColumnTable {
  id: string;
  name: string;
  description?: string;
  die: string;
  columns: string[];
  entries: MultiColumnTableEntry[];
}

export interface MultiColumnTableEntry {
  roll: number | string;
  values: Record<string, string>;
}

export interface NameGenerator {
  id: string;
  name: string;
  description?: string;
  parts: NameGeneratorPart[];
}

export interface NameGeneratorPart {
  name: string;
  die: string;
  options: string[];
}

export interface Faction {
  id: string;
  name: string;
  resources: string[];
  goals: FactionGoal[];
}

export interface FactionGoal {
  description: string;
  difficulty: number;
}

export interface MagicItem {
  id: string;
  name: string;
  type?: string;
  effect: string;
  trigger?: string;
}

export interface RoomStockingMatrix {
  id: string;
  name: string;
  description?: string;
  roomTypes: RoomStockingEntry[];
}

export interface RoomStockingEntry {
  roll: string;
  type: string;
  creature: number[];
  treasure: number[];
}
