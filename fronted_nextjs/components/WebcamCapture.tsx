"use client";

import React, { useEffect, useRef } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

interface WebcamCaptureProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isAnalyzing: boolean;
  isCameraActive: boolean;
  onFeaturesExtracted: (ready: boolean) => void;
  onAttentionUpdate: (
    score: number,
    level: "high" | "medium" | "low",
    rawFeatures?: {ear: number, mar: number}[]
  ) => void;
  classSessionId?: string | number | null;
  modelEndpoint?: string;
}

type LM = NormalizedLandmark;

function euclidean(a: LM, b: LM) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function computeEAR(landmarks: LM[], idx: number[]): number {
  const [p1, p2, p3, p4, p5, p6] = idx.map((i) => landmarks[i]);
  const A = euclidean(p2, p6);
  const B = euclidean(p3, p5);
  const C = euclidean(p1, p4);
  return C === 0 ? 0 : (A + B) / (2.0 * C);
}

function computeMAR(landmarks: LM[], idx: number[]): number {
  const [top, bottom, left, right] = idx.map((i) => landmarks[i]);
  const vertical = euclidean(top, bottom);
  const horizontal = euclidean(left, right);
  return horizontal === 0 ? 0 : vertical / horizontal;
}

export default function WebcamCapture({
  videoRef,
  isAnalyzing,
  isCameraActive,
  onFeaturesExtracted,
  onAttentionUpdate,
  classSessionId,
  modelEndpoint = "http://localhost:8000/api/predict-distractions/",
}: WebcamCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const rafIdRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);
  
  // Features buffer para modelo (30 frames ~1s a 30fps)
  const featuresBufferRef = useRef<{ear: number, mar: number, timestamp: number}[]>([]);
  const featuresReadyRef = useRef(false);
  
  // Throttle para API calls
  const lastModelCallRef = useRef<number>(0);
  const MODEL_THROTTLE_MS = 500;
  
  // Callback estable para onAttentionUpdate
  const onAttentionUpdateRef = useRef(onAttentionUpdate);
  
  // Actualizar ref cuando cambia la función
  useEffect(() => {
    onAttentionUpdateRef.current = onAttentionUpdate;
  }, [onAttentionUpdate]);
  
  // Índices MediaPipe
  const rightEyeIdx = [33, 159, 158, 133, 153, 145];
  const leftEyeIdx = [362, 385, 387, 263, 373, 380];
  const mouthIdx = [13, 14, 78, 308];

  // Envío de batch al modelo
  const sendToModel = async (batch: {ear: number, mar: number, timestamp: number}[]) => {
    if (Date.now() - lastModelCallRef.current < MODEL_THROTTLE_MS) return;
    
    try {
      lastModelCallRef.current = Date.now();
      const response = await fetch(modelEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          features: batch.map(f => [f.ear, f.mar]), // [[ear,mar], [ear,mar], ...]
          sessionId: classSessionId,
          timestamp: Date.now()
        })
      });
      
      if (!response.ok) throw new Error('API error');
      
      const { distraction_score, level, confidence } = await response.json();
      
      console.log('WebcamCapture: Calling onAttentionUpdate with (model):', distraction_score, level);
      onAttentionUpdateRef.current(
        distraction_score, 
        level, 
        batch.slice(-5).map(f => ({ear: f.ear, mar: f.mar}))
      );
    } catch (e) {
      console.warn('WebcamCapture: Modelo falló, usando fallback:', e);
      
      // Fallback a lógica local simple
      const avgEar = batch.reduce((sum, f) => sum + f.ear, 0) / batch.length;
      const avgMar = batch.reduce((sum, f) => sum + f.mar, 0) / batch.length;
      
      // Lógica mejorada de fallback
      // EAR alto (ojos abiertos) = buena atención, MAR bajo (boca cerrada) = buena atención
      const earScore = avgEar * 100; // 0-100
      const marScore = (1 - avgMar) * 100; // Invertido: boca cerrada = alto score
      const fallbackScore = Math.round((earScore * 0.7 + marScore * 0.3)); // EAR tiene más peso
      
      const fallbackLevel: 'high' | 'medium' | 'low' = 
        fallbackScore < 45 ? 'low' : 
        fallbackScore < 70 ? 'medium' : 
        'high';
      
      console.log('WebcamCapture: Calling onAttentionUpdate with (fallback):', fallbackScore, fallbackLevel);
      onAttentionUpdateRef.current(fallbackScore, fallbackLevel);
    }
  };

  useEffect(() => {
    cancelledRef.current = false;

    async function setup() {
      if (!isCameraActive || !videoRef.current) {
        featuresReadyRef.current = false;
        featuresBufferRef.current = [];
        onFeaturesExtracted(false);
        return;
      }

      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const faceLandmarker = await FaceLandmarker.createFromModelPath(
          filesetResolver,
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
        );

        faceLandmarker.setOptions({
          baseOptions: { delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 1,
        });

        if (cancelledRef.current) {
          faceLandmarker.close();
          return;
        }

        faceLandmarkerRef.current = faceLandmarker;

        const loop = () => {
          if (
            cancelledRef.current ||
            !videoRef.current ||
            !canvasRef.current ||
            !faceLandmarkerRef.current
          ) {
            return;
          }

          const video = videoRef.current;
          if (video.readyState < 2) {
            rafIdRef.current = requestAnimationFrame(loop);
            return;
          }

          const now = performance.now();
          if (!isAnalyzing) {
            rafIdRef.current = requestAnimationFrame(loop);
            return;
          }

          if (lastVideoTimeRef.current === video.currentTime) {
            rafIdRef.current = requestAnimationFrame(loop);
            return;
          }
          lastVideoTimeRef.current = video.currentTime;

          const result = faceLandmarkerRef.current!.detectForVideo(video, now);
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            rafIdRef.current = requestAnimationFrame(loop);
            return;
          }

          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
            const lms = result.faceLandmarks[0] as LM[];
            
            // Dibujado debug (opcional)
            const toPixel = (p: LM) => ({ x: p.x * canvas.width, y: p.y * canvas.height });
            const drawPoints = (indices: number[], color = "#00FF00") => {
              ctx.fillStyle = color;
              indices.forEach((i) => {
                const p = toPixel(lms[i]);
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fill();
              });
            };
            
            drawPoints(rightEyeIdx, "#00E676");
            drawPoints(leftEyeIdx, "#00E676");
            drawPoints(mouthIdx, "#FF6B35");

            // Cálculos EAR/MAR
            const earRight = computeEAR(lms, rightEyeIdx);
            const earLeft = computeEAR(lms, leftEyeIdx);
            const ear = (earRight + earLeft) / 2.0;
            const mar = computeMAR(lms, mouthIdx);

            // Agregar al buffer
            featuresBufferRef.current.push({ ear, mar, timestamp: now });
            if (featuresBufferRef.current.length > 30) {
              featuresBufferRef.current.shift();
            }

            // Notificar features ready (primera vez)
            if (!featuresReadyRef.current) {
              featuresReadyRef.current = true;
              onFeaturesExtracted(true);
              console.log('✅ Features ready - detection started');
            }

            // Enviar al modelo si hay suficientes datos (15+ frames)
            if (featuresBufferRef.current.length >= 15) {
              sendToModel(featuresBufferRef.current.slice());
            }

          } else {
            // Sin rostro detectado: features bajas
            console.log('⚠️ No face detected');
            featuresBufferRef.current.push({ ear: 0.1, mar: 0.8, timestamp: now });
            if (featuresBufferRef.current.length > 30) {
              featuresBufferRef.current.shift();
            }
            
            if (featuresBufferRef.current.length >= 15) {
              sendToModel(featuresBufferRef.current.slice());
            }
          }

          rafIdRef.current = requestAnimationFrame(loop);
        };

        rafIdRef.current = requestAnimationFrame(loop);
      } catch (error) {
        console.error('Error initializing FaceLandmarker:', error);
      }
    }

    setup();

    return () => {
      console.log('🧹 WebcamCapture cleanup');
      cancelledRef.current = true;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
        faceLandmarkerRef.current = null;
      }
      featuresReadyRef.current = false;
      featuresBufferRef.current = [];
      lastVideoTimeRef.current = -1;
    };
  }, [isCameraActive, isAnalyzing, videoRef, onFeaturesExtracted, classSessionId, modelEndpoint]);
  // ⚠️ NOTA: onAttentionUpdate NO está en las dependencias - usamos ref para evitar re-montajes

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}