/**
 * Service pour charger les fichiers DICOM depuis data_test
 */

export interface DicomFileInfo {
  name: string;
  path: string;
}

/**
 * Récupère la liste de tous les fichiers DICOM disponibles dans data_test
 */
export async function listDicomFiles(): Promise<DicomFileInfo[]> {
  try {
    const response = await fetch('/api/dicom?action=list');
    
    if (!response.ok) {
      console.error('Erreur lors de la récupération de la liste:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Erreur lors de la récupération de la liste DICOM:', error);
    return [];
  }
}

/**
 * Télécharge un fichier DICOM spécifique et le convertit en File
 */
export async function downloadDicomFile(fileName: string): Promise<File | null> {
  try {
    const response = await fetch(`/api/dicom?file=${encodeURIComponent(fileName)}`);
    
    if (!response.ok) {
      console.error(`Erreur lors du téléchargement de ${fileName}:`, response.statusText);
      return null;
    }

    const blob = await response.blob();
    const file = new File([blob], fileName, { type: 'application/dicom' });
    return file;
  } catch (error) {
    console.error(`Erreur lors du téléchargement de ${fileName}:`, error);
    return null;
  }
}

/**
 * Charge tous les fichiers DICOM de data_test
 */
export async function preloadAllDicomFiles(): Promise<File[]> {
  try {
    const fileInfos = await listDicomFiles();
    
    if (fileInfos.length === 0) {
      console.warn('Aucun fichier DICOM trouvé dans data_test');
      return [];
    }

    console.log(`Chargement de ${fileInfos.length} fichiers DICOM...`);

    const files: File[] = [];

    for (const fileInfo of fileInfos) {
      try {
        const file = await downloadDicomFile(fileInfo.name);
        if (file) {
          files.push(file);
          console.log(`✓ Chargé: ${fileInfo.name}`);
        }
      } catch (error) {
        console.error(`✗ Erreur pour ${fileInfo.name}:`, error);
      }
    }

    console.log(`${files.length}/${fileInfos.length} fichiers chargés avec succès`);
    return files;
  } catch (error) {
    console.error('Erreur lors du préchargement des fichiers DICOM:', error);
    return [];
  }
}
