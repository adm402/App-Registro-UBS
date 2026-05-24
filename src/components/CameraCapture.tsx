/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, Check, RefreshCw, AlertCircle, Clock } from 'lucide-react';

interface CameraCapturePanelProps {
  label: string; // e.g. "Entrada (Clock-in)" or "Saída (Clock-out)"
  description: string;
  image: string | null;
  timestamp: string | null;
  onChange: (image: string | null, timestamp: string | null) => void;
}

export default function CameraCapturePanel({
  label,
  description,
  image,
  timestamp,
  onChange,
}: CameraCapturePanelProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [simulatedOptionsShown, setSimulatedOptionsShown] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop video stream when unmounting or switching off
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    setSimulatedOptionsShown(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'environment' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((err) => {
          console.error("Video play failed:", err);
        });
      }
    } catch (err: any) {
      console.warn("Camera hardware or permission block:", err);
      setCameraError(
        'Acesso à câmera bloqueado ou indisponível. Use upload de arquivo ou simulação de imagem da clínica.'
      );
    }
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    if (videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          
          const nowStr = new Date().toLocaleString('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'medium',
          });
          
          onChange(dataUrl, nowStr);
          stopCamera();
        }
      } catch (err) {
        console.error("Capture from canvas error:", err);
      }
    }
  };

  // Handle uploaded file (converts to base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        
        const nowStr = new Date().toLocaleString('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'medium',
        });
        
        onChange(dataUrl, nowStr);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate high quality mock camera scene representing clinic workspace in Medianeira PR
  const triggerSimulatedPhoto = (type: 'entry' | 'exit') => {
    // Generate an beautiful SVG dental office as a fallback image
    const nowStr = new Date().toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium',
    });
    
    // Create an elegant SVG data url representing dentist workplace
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
        <rect width="100%" height="100%" fill="#0f172a"/>
        <!-- Background Grid -->
        <g stroke="#1e293b" stroke-width="1">
          <line x1="0" y1="100" x2="600" y2="100" />
          <line x1="0" y1="200" x2="600" y2="200" />
          <line x1="0" y1="300" x2="600" y2="300" />
          <line x1="150" y1="0" x2="150" y2="400" />
          <line x1="300" y1="0" x2="300" y2="400" />
          <line x1="450" y1="0" x2="450" y2="400" />
        </g>
        <!-- Clinic Office Elements -->
        <rect x="180" y="240" width="240" height="120" rx="10" fill="#1e293b" stroke="#334155" stroke-width="2"/>
        <circle cx="300" cy="180" r="50" fill="#2dd4bf" opacity="0.15"/>
        <path d="M 270 180 Q 300 220 330 180 Q 300 140 270 180 Z" fill="none" stroke="#2dd4bf" stroke-width="3"/>
        <circle cx="300" cy="180" r="10" fill="#2dd4bf"/>
        <!-- Text details -->
        <text x="300" y="50" text-anchor="middle" fill="#2dd4bf" font-family="JetBrains Mono, monospace" font-size="14" font-weight="bold" tracking="2">CENTRO ODONTOLÓGICO UBS</text>
        <text x="300" y="80" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="12">Medianeira, Paraná, Brasil</text>
        <text x="300" y="300" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="14">REGISTRO DE FOTO COMPROBATÓRO</text>
        <text x="300" y="325" text-anchor="middle" fill="#38bdf8" font-family="JetBrains Mono, monospace" font-size="12">[EVIDÊNCIA DE ${type === 'entry' ? 'ENTRADA' : 'SAÍDA'}]</text>
        <text x="300" y="350" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="11">Data de Captura: ${nowStr}</text>
      </svg>
    `;
    const base64Svg = btoa(unescape(encodeURIComponent(svgContent)));
    const dataUrl = `data:image/svg+xml;base64,${base64Svg}`;
    
    onChange(dataUrl, nowStr);
    stopCamera();
    setSimulatedOptionsShown(false);
  };

  const removePhoto = () => {
    if (confirm(`Deseja remover a foto de ${label}?`)) {
      onChange(null, null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition duration-300 relative group flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${image ? 'bg-teal-400 animate-pulse' : 'bg-slate-700'}`} />
            <h4 className="font-bold text-white tracking-tight text-sm uppercase">{label}</h4>
          </div>
          {timestamp && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 font-mono text-[11px] font-bold border border-teal-500/15">
              <Clock className="w-3" />
              {timestamp}
            </span>
          )}
        </div>
        <p className="text-slate-400 text-xs mb-4">{description}</p>

        {isCameraActive ? (
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-700 mb-4 flex flex-col items-center justify-center">
            {cameraError ? (
              <div className="p-4 text-center">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-slate-300 text-xs leading-relaxed mb-4">{cameraError}</p>
                <div className="flex justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) fileInputRef.current.click();
                    }}
                    className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition duration-200"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload de Imagem
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerSimulatedPhoto(label.toLowerCase().includes('entr') ? 'entry' : 'exit')}
                    className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition duration-200"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Mock Consultório
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="inline-flex items-center gap-1.5 bg-transparent hover:bg-slate-800 text-slate-400 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  autoPlay
                  muted
                />
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 px-4 z-10">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20 transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Capturar Foto
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="bg-slate-900/80 hover:bg-slate-900 border border-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-lg text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        ) : image ? (
          <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950 mb-4 group/image">
            <img
              src={image}
              alt={`Evidence for ${label}`}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/image:opacity-100 transition duration-300 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={removePhoto}
                className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl p-2.5 shadow-lg shadow-rose-500/20 transition duration-200 cursor-pointer"
                title="Excluir Foto"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="absolute bottom-2 left-2 bg-emerald-500/80 backdrop-blur-sm text-slate-950 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" />
              Registrado
            </div>
          </div>
        ) : (
          <div className="aspect-video rounded-xl border border-dashed border-slate-800 bg-slate-950/50 flex flex-col items-center justify-center p-4 mb-4 text-center group-hover:border-slate-700 transition duration-300">
            <span className="p-3 bg-slate-900 rounded-full border border-slate-800 mb-2.5 group-hover:scale-110 transition duration-300">
              <Camera className="w-6 h-6 text-slate-500" />
            </span>
            <p className="text-slate-500 text-xs mb-3">Nenhuma foto registrada para este momento.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold rounded-lg px-2.5 py-1.5 text-xs transition duration-200 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                Câmera
              </button>
              <button
                type="button"
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.click();
                }}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold rounded-lg px-2.5 py-1.5 text-xs transition duration-200 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload
              </button>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
