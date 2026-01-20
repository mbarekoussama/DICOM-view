import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileName = searchParams.get('file');
    const action = searchParams.get('action');

    // Action: lister tous les fichiers DICOM de data_test
    if (action === 'list') {
      const dataTestPath = path.join(process.cwd(), 'data_test');
      
      try {
        const files = await readdir(dataTestPath);
        const dicomFiles = files
          .filter(file => file.toLowerCase().endsWith('.dcm'))
          .map(file => ({
            name: file,
            path: `/api/dicom?file=${encodeURIComponent(file)}`
          }));

        return NextResponse.json({
          success: true,
          files: dicomFiles,
          count: dicomFiles.length
        });
      } catch (error) {
        console.error('Erreur lors de la lecture de data_test:', error);
        return NextResponse.json({
          success: false,
          files: [],
          count: 0,
          error: 'Dossier data_test non accessible'
        });
      }
    }

    // Action: télécharger un fichier DICOM spécifique
    if (!fileName) {
      return NextResponse.json(
        { error: 'Paramètre "file" manquant' },
        { status: 400 }
      );
    }

    // Validation du nom de fichier pour éviter les path traversal attacks
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return NextResponse.json(
        { error: 'Nom de fichier invalide' },
        { status: 400 }
      );
    }

    // Chemin vers le fichier DICOM dans data_test
    const filePath = path.join(process.cwd(), 'data_test', fileName);

    console.log('Chargement du fichier DICOM:', filePath);

    // Lire le fichier
    const fileBuffer = await readFile(filePath);

    // Retourner le fichier avec les headers appropriés
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/dicom',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Erreur lors du chargement du fichier DICOM:', error);
    
    if (error instanceof Error && error.message.includes('ENOENT')) {
      return NextResponse.json(
        { error: 'Fichier DICOM non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors du chargement du fichier' },
      { status: 500 }
    );
  }
}
