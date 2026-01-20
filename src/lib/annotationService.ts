/**
 * Types et utilitaires pour les annotations et mesures DICOM
 */

export interface Point {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'text' | 'measurement';
  points: Point[];
  text?: string;
  color?: string;
  label?: string;
  createdAt: Date;
  createdBy: string;
}

export interface Measurement {
  id: string;
  type: 'distance' | 'angle' | 'area';
  points: Point[];
  value?: number;
  unit?: string;
  label?: string;
}

/**
 * Calcule la distance entre deux points
 */
export function calculateDistance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcule l'angle entre trois points
 */
export function calculateAngle(p1: Point, p2: Point, p3: Point): number {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
  
  const dotProduct = v1.x * v2.x + v1.y * v2.y;
  const magnitude1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const magnitude2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  const cosAngle = dotProduct / (magnitude1 * magnitude2);
  return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
}

/**
 * Calcule l'aire d'un polygone (formule de Shoelace)
 */
export function calculateArea(points: Point[]): number {
  if (points.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  return Math.abs(area / 2);
}

/**
 * Dessine une annotation sur le canvas
 */
export function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  annotation: Annotation,
  zoom: number = 1
) {
  const color = annotation.color || '#00ff00';
  const lineWidth = 2 / zoom;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.globalAlpha = 0.7;

  switch (annotation.type) {
    case 'rectangle':
      if (annotation.points.length >= 2) {
        const [p1, p2] = annotation.points;
        const width = p2.x - p1.x;
        const height = p2.y - p1.y;
        ctx.strokeRect(p1.x, p1.y, width, height);
      }
      break;

    case 'circle':
      if (annotation.points.length >= 2) {
        const [center, edge] = annotation.points;
        const radius = calculateDistance(center, edge);
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;

    case 'line':
      if (annotation.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
        for (let i = 1; i < annotation.points.length; i++) {
          ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
        }
        ctx.stroke();
      }
      break;

    case 'text':
      if (annotation.points.length > 0 && annotation.text) {
        ctx.font = `${12 / zoom}px Arial`;
        ctx.fillText(annotation.text, annotation.points[0].x, annotation.points[0].y);
      }
      break;

    case 'measurement':
      if (annotation.points.length >= 2) {
        const [p1, p2] = annotation.points;
        const distance = calculateDistance(p1, p2);
        
        // Dessiner la ligne
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        
        // Dessiner les points
        const pointRadius = 3 / zoom;
        ctx.fillRect(p1.x - pointRadius, p1.y - pointRadius, pointRadius * 2, pointRadius * 2);
        ctx.fillRect(p2.x - pointRadius, p2.y - pointRadius, pointRadius * 2, pointRadius * 2);
        
        // Afficher la distance
        if (annotation.label) {
          ctx.font = `${10 / zoom}px Arial`;
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          ctx.fillText(annotation.label, midX, midY - 5 / zoom);
        }
      }
      break;
  }

  ctx.globalAlpha = 1;
}

/**
 * Exporte les annotations en JSON
 */
export function exportAnnotations(annotations: Annotation[]): string {
  return JSON.stringify(annotations, null, 2);
}

/**
 * Importe les annotations depuis JSON
 */
export function importAnnotations(jsonString: string): Annotation[] {
  try {
    const annotations = JSON.parse(jsonString);
    return annotations.map((ann: any) => ({
      ...ann,
      createdAt: new Date(ann.createdAt),
    }));
  } catch (error) {
    console.error('Erreur lors de l\'import des annotations:', error);
    return [];
  }
}
