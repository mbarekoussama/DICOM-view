'use client';

import { useRef, useState } from 'react';
import { listDicomFiles, downloadDicomFile } from '@/lib/dicomLoaderService';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
}

export default function FileUploader({ onFilesSelected }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.name.endsWith('.dcm') || file.type === 'application/dicom'
    );

    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const loadFromDataTest = async () => {
    setIsLoading(true);
    try {
      const fileInfos = await listDicomFiles();
      
      if (fileInfos.length === 0) {
        alert('Aucun fichier DICOM trouvé dans data_test');
        return;
      }

      const files: File[] = [];
      for (const fileInfo of fileInfos) {
        const file = await downloadDicomFile(fileInfo.name);
        if (file) {
          files.push(file);
        }
      }

      if (files.length > 0) {
        onFilesSelected(files);
      } else {
        alert('Erreur lors du chargement des fichiers');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement des fichiers');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      {/* Bouton Charger depuis data_test */}
      <button
        onClick={loadFromDataTest}
        disabled={isLoading}
        className="w-full px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-green-700 disabled:to-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="animate-spin">⏳</span>
            Chargement...
          </>
        ) : (
          <>
            📂 Charger data_test
          </>
        )}
      </button>

      {/* Zone Drag & Drop */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".dcm,.DCM"
        onChange={handleChange}
        className="hidden"
      />

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
          dragActive
            ? 'border-blue-400 bg-blue-900/20'
            : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
        }`}
      >
        <div className="text-slate-300">
          <svg
            className="w-8 h-8 mx-auto mb-2 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6"
            />
          </svg>
          <p className="text-sm font-medium">
            Glissez les fichiers DICOM ici ou cliquez pour parcourir
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Fichiers supportés: .dcm
          </p>
        </div>
      </div>
    </div>
  );
}
