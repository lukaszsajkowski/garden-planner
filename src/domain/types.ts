export type Pt = [number, number];
export type PolyType = 'boundary' | 'grass' | 'gravel' | 'paving' | 'bed' | 'house';
export type PointType = 'shrub' | 'conifer' | 'tree';
export type ShapeType = PolyType | PointType;

export interface PolyShape { id: string; type: PolyType; name?: string; pts: Pt[] }
export interface PointShape { id: string; type: PointType; name?: string; x: number; y: number; r: number }
export type Shape = PolyShape | PointShape;

export interface Background { src: string; x: number; y: number; w: number; aspect: number; opacity: number; visible: boolean }
export interface Plan { W: number; H: number; shapes: Shape[]; bg: Background | null }
