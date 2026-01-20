import * as dcmjs from 'dcmjs';

export interface DicomMetadata {
  patientName?: string;
  patientID?: string;
  studyDate?: string;
  studyTime?: string;
  modality?: string;
  institutionName?: string;
  studyDescription?: string;
  seriesNumber?: string;
  instanceNumber?: string;
  pixelSpacing?: number[];
  dicomWindowCenter?: number;
  dicomWindowWidth?: number;
  photometricInterpretation?: string;
  bitsAllocated?: number;
  bitsStored?: number;
  highBit?: number;
  pixelRepresentation?: number;
}

export interface DicomImage {
  filename: string;
  arrayBuffer: ArrayBuffer;
  metadata: DicomMetadata;
  pixelData?: Uint8Array | Uint16Array;
  rows?: number;
  columns?: number;
}

/**
 * Charge un fichier DICOM et extrait ses métadonnées et données de pixels
 */
export async function loadDicomFile(file: File): Promise<DicomImage> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Parser le fichier DICOM
    const dataset = dcmjs.data.DicomMessage.readFile(arrayBuffer);
    const elements = dataset.dict;
    
    console.log('DICOM Elements:', elements);

    // Fonction helper pour extraire les valeurs
    const getValue = (tag: string, index = 0): any => {
      const element = elements[tag];
      if (!element || !element.Value) return undefined;
      return element.Value[index];
    };

    // Extraction des métadonnées
    const metadata: DicomMetadata = {
      patientName: getValue('00100010')?.toString(),
      patientID: getValue('00100020')?.toString(),
      studyDate: getValue('00080020')?.toString(),
      studyTime: getValue('00080030')?.toString(),
      modality: getValue('00080060')?.toString(),
      institutionName: getValue('00080080')?.toString(),
      studyDescription: getValue('0008103E')?.toString(),
      seriesNumber: getValue('00200011')?.toString(),
      instanceNumber: getValue('00200013')?.toString(),
      photometricInterpretation: getValue('00280004')?.toString(),
      bitsAllocated: getValue('00280100'),
      bitsStored: getValue('00280101'),
      highBit: getValue('00280102'),
      pixelRepresentation: getValue('00280103'),
      dicomWindowCenter: getValue('00281050'),
      dicomWindowWidth: getValue('00281051'),
    };

    // Extraction des dimensions de l'image
    const rows = getValue('00280010');
    const columns = getValue('00280011');
    const bitsAllocated = metadata.bitsAllocated || 16;
    const pixelRepresentation = metadata.pixelRepresentation || 0;

    console.log('Image dimensions:', { rows, columns, bitsAllocated });

    // Extraction des données de pixels
    let pixelData: Uint8Array | Uint16Array | undefined;
    const pixelDataElement = elements['7FE00010'];
    
    if (pixelDataElement && pixelDataElement.Value) {
      const rawPixelData = pixelDataElement.Value[0];
      
      if (bitsAllocated === 16) {
        if (rawPixelData instanceof ArrayBuffer) {
          pixelData = new Uint16Array(rawPixelData);
        } else if (rawPixelData instanceof Uint8Array) {
          pixelData = new Uint16Array(rawPixelData.buffer, rawPixelData.byteOffset, rawPixelData.byteLength / 2);
        } else {
          pixelData = new Uint16Array(rawPixelData);
        }
      } else {
        if (rawPixelData instanceof ArrayBuffer) {
          pixelData = new Uint8Array(rawPixelData);
        } else if (rawPixelData instanceof Uint8Array) {
          pixelData = rawPixelData;
        } else {
          pixelData = new Uint8Array(rawPixelData);
        }
      }
      
      if (pixelData && pixelData.length > 0) {
        const samplePixels = Array.from(pixelData).slice(0, 100);
        console.log('Pixel data loaded:', {
          length: pixelData.length,
          min: Math.min(...samplePixels),
          max: Math.max(...samplePixels),
        });
      }
    }

    return {
      filename: file.name,
      arrayBuffer,
      metadata,
      pixelData,
      rows: Number(rows),
      columns: Number(columns),
    };
  } catch (error) {
    console.error('Erreur lors du parsing DICOM:', error);
    throw new Error(`Impossible de charger le fichier DICOM: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Convertit les données DICOM en données d'image pour le rendu Canvas
 */
export function convertDicomToImageData(
  pixelData: Uint8Array | Uint16Array,
  rows: number,
  columns: number,
  windowCenter: number = 40,
  windowWidth: number = 400
): ImageData {
  if (!pixelData || rows <= 0 || columns <= 0) {
    throw new Error('Données invalides pour la conversion');
  }

  const imageData = new ImageData(columns, rows);
  const data = imageData.data;

  const windowMin = windowCenter - windowWidth / 2;
  const windowMax = windowCenter + windowWidth / 2;

  // Déterminer les valeurs min/max des données de pixels
  let pixelMin = pixelData[0];
  let pixelMax = pixelData[0];
  
  for (let i = 0; i < pixelData.length; i++) {
    if (pixelData[i] < pixelMin) pixelMin = pixelData[i];
    if (pixelData[i] > pixelMax) pixelMax = pixelData[i];
  }

  console.log('Pixel range:', { pixelMin, pixelMax, windowCenter, windowWidth });

  // Remplir les données d'image avec le windowing DICOM appliqué
  for (let i = 0; i < pixelData.length; i++) {
    const pixelValue = pixelData[i];
    
    // Application du windowing DICOM
    let normalized = (pixelValue - windowMin) / (windowMax - windowMin);
    normalized = Math.max(0, Math.min(1, normalized));
    
    const intensity = Math.floor(normalized * 255);

    const dataIndex = i * 4;
    data[dataIndex] = intensity;      // R
    data[dataIndex + 1] = intensity;  // G
    data[dataIndex + 2] = intensity;  // B
    data[dataIndex + 3] = 255;        // A
  }

  return imageData;
}

/**
 * Récupère les informations d'une série DICOM
 */
export function getSeriesInfo(metadata: DicomMetadata): string {
  const info = [
    metadata.patientName && `Patient: ${metadata.patientName}`,
    metadata.studyDate && `Date: ${metadata.studyDate}`,
    metadata.modality && `Modalité: ${metadata.modality}`,
    metadata.institutionName && `Institution: ${metadata.institutionName}`,
  ].filter(Boolean);

  return info.join(' | ');
}
