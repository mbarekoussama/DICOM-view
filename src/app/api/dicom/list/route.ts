import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Chemin vers le dossier des fichiers DICOM
    const dicomDir = path.join(
      process.cwd(),
      'dataset',
      'example-dicom-structural',
      'dicoms'
    );

    console.log('Lecture du dossier DICOM:', dicomDir);

    // Lire la liste des fichiers
    const files = await readdir(dicomDir);

    // Filtrer les fichiers DICOM (.dcm)
    const dicomFiles = files
      .filter(file => file.toLowerCase().endsWith('.dcm'))
      .sort();

    console.log(`Trouvé ${dicomFiles.length} fichiers DICOM`);

    return NextResponse.json({
      success: true,
      count: dicomFiles.length,
      files: dicomFiles,
    });
  } catch (error) {
    console.error('Erreur lors de la lecture du dossier DICOM:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Impossible de lire le dossier DICOM',
      },
      { status: 500 }
    );
  }
}
