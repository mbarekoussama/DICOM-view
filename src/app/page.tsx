'use client';

import { useState, useEffect } from 'react';
import DICOMViewer from '@/components/DICOMViewer';
import FileUploader from '@/components/FileUploader';
import DiscussionPanel from '@/components/DiscussionPanel';
import ToolsPanel from '@/components/ToolsPanel';
import { preloadAllDicomFiles } from '@/lib/dicomLoaderService';

interface DicomFileData {
  name: string;
  file: File;
}

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<DicomFileData | null>(null);
  const [dicomFiles, setDICOMFiles] = useState<DicomFileData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [presetLevel, setPresetLevel] = useState(40);
  const [presetWidth, setPresetWidth] = useState(400);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(1);
  const [flipped, setFlipped] = useState(false);
  const [isLoadingInit, setIsLoadingInit] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [discussionOpen, setDiscussionOpen] = useState(true);

  // Charger les fichiers DICOM au démarrage
  useEffect(() => {
    const loadInitialFiles = async () => {
      try {
        console.log('📂 Chargement des fichiers DICOM de data_test...');
        const files = await preloadAllDicomFiles();
        
        if (files.length > 0) {
          const dicomFileData: DicomFileData[] = files.map(file => ({
            name: file.name,
            file: file
          }));
          
          setDICOMFiles(dicomFileData);
          setSelectedImage(dicomFileData[0]);
          setLoadedCount(files.length);
          console.log(`✓ ${files.length} fichiers chargés avec succès`);
        } else {
          console.warn('⚠️ Aucun fichier DICOM trouvé');
        }
      } catch (error) {
        console.error('✗ Erreur lors du chargement initial:', error);
      } finally {
        setIsLoadingInit(false);
      }
    };

    loadInitialFiles();
  }, []);

  const handleFilesSelected = (files: File[]) => {
    const newFiles = files
      .filter(f => f.name.toLowerCase().endsWith('.dcm'))
      .map(f => ({ name: f.name, file: f }));
    
    setDICOMFiles(prev => [...prev, ...newFiles]);
    if (newFiles.length > 0 && !selectedImage) {
      setSelectedImage(newFiles[0]);
    }
  };

  const filteredFiles = dicomFiles.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRemoveFile = (fileName: string) => {
    setDICOMFiles(prev => prev.filter(f => f.name !== fileName));
    if (selectedImage?.name === fileName) {
      setSelectedImage(null);
    }
  };

  const applyPreset = (levelValue: number, widthValue: number) => {
    setPresetLevel(levelValue);
    setPresetWidth(widthValue);
  };

  const resetControls = () => {
    setZoom(1);
    setBrightness(0);
    setContrast(1);
    setFlipped(false);
  };

  if (isLoadingInit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-600 border-t-blue-500 mx-auto mb-6"></div>
          <p className="text-white text-xl font-semibold mb-2">Chargement des images DICOM...</p>
          <p className="text-slate-400 text-sm">Veuillez patienter</p>
          {loadedCount > 0 && (
            <p className="text-blue-300 text-sm mt-4">✓ {loadedCount} fichier(s) chargé(s)</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 px-4 lg:px-6 py-3 lg:py-4 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 lg:gap-3 min-w-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur-lg opacity-75"></div>
              <div className="relative w-8 lg:w-10 h-8 lg:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-lg lg:text-xl shadow-lg flex-shrink-0">
                🏥
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent truncate">
                DICOM Viewer
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-3 flex-wrap justify-end">
            <div className="px-2 lg:px-3 py-1 rounded-lg bg-blue-600/20 border border-blue-400/50 text-xs lg:text-sm text-blue-200 whitespace-nowrap">
              📊 {dicomFiles.length}
            </div>
            {activeTool && (
              <div className="px-2 lg:px-3 py-1 rounded-lg bg-purple-600/20 border border-purple-400/50 text-xs text-purple-200 hidden sm:block">
                🔧 {activeTool}
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
              title="Toggle sidebar"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* Toolbar - Outils (responsive) */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700/50 px-4 lg:px-6 py-2 lg:py-3 shadow-lg overflow-x-auto">
        <div className="flex items-center gap-2 lg:gap-4 min-w-max">
          <span className="text-xs lg:text-sm font-bold text-slate-300 flex-shrink-0">🛠️</span>
          <div className="flex-1 min-w-0">
            <ToolsPanel onToolSelect={setActiveTool} />
          </div>
        </div>
      </div>

      {/* Main Content Area - Responsive Grid */}
      <main className="flex-1 overflow-hidden flex gap-2 lg:gap-4 p-2 lg:p-4 flex-col lg:flex-row">
        {/* Left Panel - Files (Mobile: Hidden by default, Toggle with button) */}
        <div className={`${sidebarOpen ? 'flex' : 'hidden'} lg:flex w-full lg:w-64 flex-col bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl lg:rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden transition-all duration-300`}>
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-3 lg:px-4 py-2 lg:py-3 border-b border-slate-700/50">
            <h2 className="text-sm lg:text-base font-bold text-white">📥 Fichiers</h2>
            <p className="text-green-100 text-xs mt-1">Glissez vos images</p>
          </div>

          <div className="px-2 lg:px-3 py-1 lg:py-2 border-b border-slate-700/50 bg-slate-900/50">
            <input
              type="text"
              placeholder="🔍 Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 lg:px-3 py-1 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>

          <div className="px-2 lg:px-3 py-1 lg:py-2 border-b border-slate-700/50 bg-slate-900/50">
            <FileUploader onFilesSelected={handleFilesSelected} />
          </div>

          <div className="flex-1 overflow-y-auto">
            {dicomFiles.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 px-2 lg:px-3">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl mb-2">📭</div>
                  <p className="text-xs lg:text-sm">Aucun fichier</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1 p-1 lg:p-2">
                {filteredFiles.map((fileData, idx) => (
                  <div
                    key={idx}
                    className={`group rounded-lg overflow-hidden transition-all ${
                      selectedImage?.name === fileData.name
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg'
                        : 'bg-slate-700/40 hover:bg-slate-700/60'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setSelectedImage(fileData);
                        setSidebarOpen(false); // Auto-close sidebar on mobile
                      }}
                      className="w-full p-2 text-left text-xs lg:text-sm flex items-center justify-between"
                    >
                      <span className={`truncate font-medium ${
                        selectedImage?.name === fileData.name ? 'text-white' : 'text-slate-300'
                      }`}>
                        📄 {fileData.name}
                      </span>
                      {selectedImage?.name === fileData.name && <span className="text-white flex-shrink-0">✓</span>}
                    </button>
                    {selectedImage?.name === fileData.name && (
                      <button
                        onClick={() => handleRemoveFile(fileData.name)}
                        className="w-full px-2 py-1 text-xs bg-blue-700/50 hover:bg-blue-800/50 text-blue-100"
                      >
                        ✕ Supprimer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Panel - DICOM Viewer */}
        <div className="flex-1 min-w-0">
          {selectedImage ? (
            <DICOMViewer
              file={selectedImage.file}
              fileName={selectedImage.name}
              presetLevel={presetLevel}
              presetWidth={presetWidth}
              activeTool={activeTool}
              zoom={zoom}
              brightness={brightness}
              contrast={contrast}
              flipped={flipped}
            />
          ) : (
            <div className="w-full h-full bg-slate-900 rounded-xl lg:rounded-2xl border border-slate-700/50 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <div className="text-4xl mb-3">📂</div>
                <p className="text-lg font-semibold">Aucune image sélectionnée</p>
                <p className="text-sm mt-2">Chargez ou sélectionnez une image DICOM</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Discussion (Mobile: Hidden, Toggle with button) */}
        <div className={`${discussionOpen ? 'flex' : 'hidden'} lg:flex w-full lg:w-64 flex-col bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl lg:rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden`}>
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-3 lg:px-4 py-2 lg:py-3 border-b border-slate-700/50 flex items-center justify-between">
            <h2 className="text-sm lg:text-base font-bold text-white">💬 Discussions</h2>
            <button
              onClick={() => setDiscussionOpen(false)}
              className="lg:hidden text-white hover:text-slate-300 text-lg"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <DiscussionPanel imageId={selectedImage?.name || ''} />
          </div>
        </div>
      </main>

      {/* Mobile Discussion Toggle Button */}
      <button
        onClick={() => setDiscussionOpen(!discussionOpen)}
        className="lg:hidden fixed bottom-4 right-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg z-40 transition"
        title="Toggle discussion"
      >
        💬
      </button>
    </div>
  );
}
