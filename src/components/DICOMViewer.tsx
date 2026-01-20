'use client';

import { useEffect, useRef, useState } from 'react';
import { loadDicomFile, convertDicomToImageData, getSeriesInfo, DicomImage } from '@/lib/dicomService';

interface DICOMViewerProps {
  file: File;
  fileName: string;
  presetLevel?: number;
  presetWidth?: number;
  activeTool?: string | null;
  zoom?: number;
  brightness?: number;
  contrast?: number;
  flipped?: boolean;
}

interface DrawPoint {
  x: number;
  y: number;
}

interface Annotation {
  type: 'rectangle' | 'circle' | 'line' | 'measure' | 'angle' | 'text';
  start: DrawPoint;
  end: DrawPoint;
  text?: string;
  timestamp?: number;
  thirdPoint?: DrawPoint; // Pour l'angle
}

export default function DICOMViewer({ 
  file, 
  fileName, 
  presetLevel = 40, 
  presetWidth = 400, 
  activeTool = null,
  zoom: externalZoom,
  brightness: externalBrightness,
  contrast: externalContrast,
  flipped: externalFlipped
}: DICOMViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [dicomImage, setDicomImage] = useState<DicomImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [windowLevel, setWindowLevel] = useState(presetLevel);
  const [windowWidth, setWindowWidth] = useState(presetWidth);
  const [zoom, setZoom] = useState(externalZoom ?? 1);
  const [brightness, setBrightness] = useState(externalBrightness ?? 0);
  const [contrast, setContrast] = useState(externalContrast ?? 1);
  const [rotation, setRotation] = useState(0);
  const [flipped, setFlipped] = useState(externalFlipped ?? false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  // États pour les annotations
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<DrawPoint | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState<DrawPoint | null>(null);
  const [angleMode, setAngleMode] = useState<'waiting' | 'first-point' | 'second-point' | 'third-point'>('waiting');
  const [anglePoints, setAnglePoints] = useState<DrawPoint[]>([]);

  // Synchroniser avec les props externes
  useEffect(() => {
    if (externalZoom !== undefined) {
      setZoom(externalZoom);
    }
  }, [externalZoom]);

  useEffect(() => {
    if (externalBrightness !== undefined) {
      setBrightness(externalBrightness);
    }
  }, [externalBrightness]);

  useEffect(() => {
    if (externalContrast !== undefined) {
      setContrast(externalContrast);
    }
  }, [externalContrast]);

  useEffect(() => {
    if (externalFlipped !== undefined) {
      setFlipped(externalFlipped);
    }
  }, [externalFlipped]);

  useEffect(() => {
    setWindowLevel(presetLevel);
    setWindowWidth(presetWidth);
  }, [presetLevel, presetWidth]);

  // Charger le fichier DICOM
  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('📂 Chargement du fichier DICOM:', fileName);

        const loaded = await loadDicomFile(file);
        console.log('✓ Fichier chargé:', loaded);
        setDicomImage(loaded);

        if (loaded.metadata.dicomWindowCenter && loaded.metadata.dicomWindowWidth) {
          setWindowLevel(loaded.metadata.dicomWindowCenter);
          setWindowWidth(loaded.metadata.dicomWindowWidth);
        }

        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error('✗ Erreur lors du chargement DICOM:', errorMessage);
        setError(errorMessage);
        setLoading(false);
      }
    };

    if (file) {
      loadImage();
    }
  }, [file, fileName]);

  // Rendu du canvas
  useEffect(() => {
    if (!canvasRef.current || !dicomImage?.pixelData) {
      console.warn('⚠️ Canvas ou image DICOM manquant');
      return;
    }

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const width = dicomImage.columns || 512;
      const height = dicomImage.rows || 512;

      console.log('🎨 Rendu canvas:', { width, height, windowLevel, windowWidth });

      canvas.width = width;
      canvas.height = height;

      if (overlayCanvasRef.current) {
        overlayCanvasRef.current.width = width;
        overlayCanvasRef.current.height = height;
      }

      // Convertir les données DICOM en ImageData
      let imageData = convertDicomToImageData(
        dicomImage.pixelData,
        height,
        width,
        windowLevel,
        windowWidth
      );

      // Appliquer luminosité et contraste
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const pixelValue = data[i];
        let adjusted = pixelValue * contrast + brightness;
        adjusted = Math.max(0, Math.min(255, adjusted));
        data[i] = adjusted;
        data[i + 1] = adjusted;
        data[i + 2] = adjusted;
      }

      // Afficher l'image directement sur le canvas principal
      ctx.putImageData(imageData, 0, 0);

      // Appliquer les transformations (rotation, flip)
      if (rotation !== 0 || flipped) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        tempCtx.putImageData(imageData, 0, 0);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(width / 2, height / 2);
        if (flipped) ctx.scale(-1, 1);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(tempCanvas, -width / 2, -height / 2);
        ctx.restore();
      }

      redrawAnnotations();
      console.log('✓ Canvas rendu avec succès');
    } catch (err) {
      console.error('✗ Erreur lors du rendu:', err);
      setError(err instanceof Error ? err.message : 'Erreur de rendu');
    }
  }, [dicomImage, windowLevel, windowWidth, brightness, contrast, rotation, flipped]);

  const redrawAnnotations = () => {
    if (!overlayCanvasRef.current) return;
    const ctx = overlayCanvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);

    annotations.forEach((ann) => {
      ctx.strokeStyle = '#00ff00';
      ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
      ctx.lineWidth = 2;

      if (ann.type === 'rectangle') {
        const width = ann.end.x - ann.start.x;
        const height = ann.end.y - ann.start.y;
        ctx.strokeRect(ann.start.x, ann.start.y, width, height);
      } else if (ann.type === 'circle') {
        const radius = Math.sqrt(
          Math.pow(ann.end.x - ann.start.x, 2) + Math.pow(ann.end.y - ann.start.y, 2)
        );
        ctx.beginPath();
        ctx.arc(ann.start.x, ann.start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (ann.type === 'line' || ann.type === 'measure') {
        ctx.beginPath();
        ctx.moveTo(ann.start.x, ann.start.y);
        ctx.lineTo(ann.end.x, ann.end.y);
        ctx.stroke();

        const distance = Math.sqrt(
          Math.pow(ann.end.x - ann.start.x, 2) + Math.pow(ann.end.y - ann.start.y, 2)
        );
        const mid = {
          x: (ann.start.x + ann.end.x) / 2,
          y: (ann.start.y + ann.end.y) / 2,
        };
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`${distance.toFixed(0)}px`, mid.x, mid.y - 5);
      } else if (ann.type === 'text') {
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(ann.text || '', ann.start.x, ann.start.y);
      } else if (ann.type === 'angle') {
        ctx.beginPath();
        ctx.moveTo(ann.start.x, ann.start.y);
        ctx.lineTo(ann.end.x, ann.end.y);
        ctx.lineTo(ann.thirdPoint!.x, ann.thirdPoint!.y);
        ctx.stroke();

        const angle = Math.abs(
          (Math.atan2(ann.thirdPoint!.y - ann.end.y, ann.thirdPoint!.x - ann.end.x) -
            Math.atan2(ann.start.y - ann.end.y, ann.start.x - ann.end.x)) *
            (180 / Math.PI)
        );
        const mid = {
          x: (ann.start.x + ann.end.x + ann.thirdPoint!.x) / 3,
          y: (ann.start.y + ann.end.y + ann.thirdPoint!.y) / 3,
        };
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`${angle.toFixed(1)}°`, mid.x, mid.y - 5);
      }
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!activeTool) return;
    if (!overlayCanvasRef.current) return;

    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - pan.x;
    const y = (e.clientY - rect.top) / zoom - pan.y;

    // Gestion de l'outil texte
    if (activeTool === 'draw-text') {
      setTextPosition({ x, y });
      setShowTextInput(true);
      setTextInput('');
      return;
    }

    // Gestion de l'outil angle
    if (activeTool === 'measure-angle') {
      if (angleMode === 'waiting') {
        setAnglePoints([{ x, y }]);
        setAngleMode('first-point');
      } else if (angleMode === 'first-point') {
        setAnglePoints([...anglePoints, { x, y }]);
        setAngleMode('second-point');
      } else if (angleMode === 'second-point') {
        const thirdPt = { x, y };
        const newAnnotation: Annotation = {
          type: 'angle',
          start: anglePoints[0],
          end: anglePoints[1],
          thirdPoint: thirdPt,
        };
        setAnnotations([...annotations, newAnnotation]);
        setAngleMode('waiting');
        setAnglePoints([]);
      }
      return;
    }

    // Outils de dessin classiques
    if (!activeTool.startsWith('draw') && activeTool !== 'measure-distance') return;

    setIsDrawing(true);
    setStartPoint({ x, y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint || !overlayCanvasRef.current) return;

    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - pan.x;
    const y = (e.clientY - rect.top) / zoom - pan.y;

    redrawAnnotations();

    const ctx = overlayCanvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#00ff00';
    ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
    ctx.lineWidth = 2;

    if (activeTool === 'draw-rectangle') {
      const width = x - startPoint.x;
      const height = y - startPoint.y;
      ctx.strokeRect(startPoint.x, startPoint.y, width, height);
    } else if (activeTool === 'draw-circle') {
      const radius = Math.sqrt(
        Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)
      );
      ctx.beginPath();
      ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (activeTool === 'draw-line' || activeTool === 'measure-distance') {
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();

      const distance = Math.sqrt(
        Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)
      );
      const mid = {
        x: (startPoint.x + x) / 2,
        y: (startPoint.y + y) / 2,
      };
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(`${distance.toFixed(0)}px`, mid.x, mid.y - 5);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint || !overlayCanvasRef.current) return;

    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - pan.x;
    const y = (e.clientY - rect.top) / zoom - pan.y;

    if (activeTool === 'draw-rectangle' || activeTool === 'draw-circle' || 
        activeTool === 'draw-line' || activeTool === 'measure-distance') {
      setAnnotations([
        ...annotations,
        {
          type: activeTool === 'measure-distance' ? 'measure' : (activeTool.replace('draw-', '') as 'rectangle' | 'circle' | 'line'),
          start: startPoint,
          end: { x, y },
        },
      ]);
    }

    setIsDrawing(false);
    setStartPoint(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newZoom = e.deltaY > 0 ? zoom * 0.9 : zoom * 1.1;
    setZoom(Math.max(0.1, Math.min(newZoom, 4)));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 4) {
      setPan({
        x: pan.x + e.movementX,
        y: pan.y + e.movementY
      });
    }
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setBrightness(0);
    setContrast(1);
    setRotation(0);
    setFlipped(false);
  };

  const clearAnnotations = () => {
    setAnnotations([]);
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      }
    }
  };

  const exportAsJPG = () => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName.replace('.dcm', '')}.jpg`;
        link.click();
        URL.revokeObjectURL(link.href);
      }
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 h-full">
      {/* Control Bar - Zoom & Luminosité */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 px-4 py-3 shadow-lg">
        <div className="flex items-center gap-4">
          {/* Zoom Control */}
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm font-semibold text-slate-300 whitespace-nowrap">🔍 Zoom:</span>
            <input
              type="range"
              min="0.1"
              max="4"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-slate-700 rounded appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-sm text-slate-400 w-12 text-right">{(zoom * 100).toFixed(0)}%</span>
          </div>

          {/* Brightness Control */}
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm font-semibold text-slate-300 whitespace-nowrap">💡 Luminosité:</span>
            <input
              type="range"
              min="-100"
              max="100"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="flex-1 h-2 bg-slate-700 rounded appearance-none cursor-pointer accent-yellow-500"
            />
            <span className="text-sm text-slate-400 w-12 text-right">{brightness > 0 ? '+' : ''}{brightness}</span>
          </div>

          {/* Contrast Control */}
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm font-semibold text-slate-300 whitespace-nowrap">⚙️ Contraste:</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="flex-1 h-2 bg-slate-700 rounded appearance-none cursor-pointer accent-orange-500"
            />
            <span className="text-sm text-slate-400 w-12 text-right">{(contrast * 100).toFixed(0)}%</span>
          </div>

          {/* Rotation Control */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-300 whitespace-nowrap">↻ Rotation:</span>
            <select
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm"
            >
              <option value="0">0°</option>
              <option value="90">90°</option>
              <option value="180">180°</option>
              <option value="270">270°</option>
            </select>
          </div>

          {/* Action Buttons */}
          <button
            onClick={() => setFlipped(!flipped)}
            className={`px-3 py-1 rounded text-sm font-medium transition whitespace-nowrap ${
              flipped
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
            title="Miroir horizontal"
          >
            ↔️ Miroir
          </button>

          <button
            onClick={resetView}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-medium transition whitespace-nowrap"
            title="Réinitialiser la vue"
          >
            ↺ Reset
          </button>

          <button
            onClick={exportAsJPG}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded font-medium transition whitespace-nowrap"
            title="Télécharger en JPG"
          >
            💾 JPG
          </button>

          <button
            onClick={clearAnnotations}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded font-medium transition whitespace-nowrap"
            title="Effacer les annotations"
          >
            🗑️ Effacer
          </button>
        </div>
      </div>

      {/* Canvas Display */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-black flex items-center justify-center relative cursor-move"
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20 backdrop-blur-sm">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-600 border-t-blue-500 mx-auto mb-4"></div>
              <p className="text-lg font-medium">Chargement DICOM...</p>
              <p className="text-sm text-gray-400 mt-2">{fileName}</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/70 z-20 backdrop-blur-sm">
            <div className="text-red-100 text-center p-6 bg-red-900/50 rounded-lg border border-red-700 max-w-md">
              <p className="font-bold text-lg mb-2">⚠️ Erreur</p>
              <p className="text-sm mb-4">{error}</p>
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
        
        <div style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'center',
          position: 'relative',
        }}>
          <canvas
            ref={canvasRef}
            className="cursor-crosshair shadow-2xl border border-slate-600"
          />
          <canvas
            ref={overlayCanvasRef}
            className="absolute top-0 left-0 cursor-crosshair"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          />
        </div>

        {/* Text Input Modal */}
        {showTextInput && textPosition && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/50">
            <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 shadow-2xl max-w-sm">
              <h3 className="text-lg font-bold text-slate-100 mb-4">Ajouter du texte</h3>
              <input
                type="text"
                autoFocus
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && textInput.trim()) {
                    setAnnotations([
                      ...annotations,
                      {
                        type: 'text',
                        start: textPosition,
                        end: textPosition,
                        text: textInput,
                      },
                    ]);
                    setShowTextInput(false);
                    setTextInput('');
                    setTextPosition(null);
                    redrawAnnotations();
                  }
                }}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:outline-none focus:border-blue-500 mb-4"
                placeholder="Entrez le texte..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (textInput.trim()) {
                      setAnnotations([
                        ...annotations,
                        {
                          type: 'text',
                          start: textPosition,
                          end: textPosition,
                          text: textInput,
                        },
                      ]);
                      setShowTextInput(false);
                      setTextInput('');
                      setTextPosition(null);
                      redrawAnnotations();
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition"
                >
                  Ajouter
                </button>
                <button
                  onClick={() => {
                    setShowTextInput(false);
                    setTextInput('');
                    setTextPosition(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-medium transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Angle Mode Indicator */}
        {angleMode !== 'waiting' && (
          <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-10 text-sm font-medium">
            {angleMode === 'first-point' && '📍 Cliquez sur le premier point du rayon'}
            {angleMode === 'second-point' && '📍 Cliquez sur le sommet de l\'angle'}
            {angleMode === 'third-point' && '📍 Cliquez sur le deuxième point du rayon'}
          </div>
        )}
      </div>

      {/* Info Bar */}
      {dicomImage && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-t border-slate-700 p-3 text-xs text-slate-300">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-semibold text-blue-300">{getSeriesInfo(dicomImage.metadata)}</p>
              <p className="text-slate-500 mt-1">Dims: {dicomImage.columns}×{dicomImage.rows} | Annotations: {annotations.length} | Outil: {activeTool || 'Aucun'}</p>
            </div>
            <div className="text-right text-slate-400">
              <p>📊 L:{windowLevel} W:{windowWidth} | 🔍 {(zoom * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
