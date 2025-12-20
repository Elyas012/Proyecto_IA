"use client";

import React, { useEffect, useRef } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

interface WebcamCaptureProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isAnalyzing: boolean;
  isCameraActive: boolean;
  onFeaturesExtracted: (ready: boolean) => void;
  onAttentionUpdate: (
    score: number,
    level: "high" | "medium" | "low"
  ) => void;
  classSessionId?: string | number | null;
  modelUrl?: string | null;
}

type LM = NormalizedLandmark;

function euclidean(a: LM, b: LM) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Eye Aspect Ratio usando índices típicos de MediaPipe FaceMesh.
function computeEAR(landmarks: LM[], idx: number[]): number {
  const [p1, p2, p3, p4, p5, p6] = idx.map((i) => landmarks[i]);
  const A = euclidean(p2, p6);
  const B = euclidean(p3, p5);
  const C = euclidean(p1, p4);
  // proteger división por 0
  return C === 0 ? 0 : (A + B) / (2.0 * C);
}

// Mouth Aspect Ratio aproximado.
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
}: WebcamCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const rafIdRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  // Estado que indica si ya notificamos que las features fueron extraídas
  const featuresReadyRef = useRef(false);

  // Buffer para suavizar el score (smoothing)
  const scoreBufferRef = useRef<number[]>([]);
  const SMOOTHING_WINDOW = 15; // frames para promediar

  // Throttle para enviar onAttentionUpdate (ms)
  const lastReportedRef = useRef<number>(0);
  const REPORT_THROTTLE_MS = 1000;

  // Índices para ojos y boca (MediaPipe)
  const rightEyeIdx = [33, 159, 158, 133, 153, 145];
  const leftEyeIdx = [362, 385, 387, 263, 373, 380];
  const mouthIdx = [13, 14, 78, 308]; // top, bottom, left, right

  // Umbrales para mapeo de score
  const EAR_CLOSED = 0.19;
  const EAR_OPEN = 0.30;
  const MAR_OPEN = 0.60;
  const MAR_CLOSED = 0.18;

  useEffect(() => {
    cancelledRef.current = false;

    async function setup() {
      // Reset flags si no hay cámara o no hay videoRef
      if (!isCameraActive || !videoRef.current) {
        featuresReadyRef.current = false;
        scoreBufferRef.current = [];
        onFeaturesExtracted(false);
        return;
      }

      // Cargar wasm y modelo
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

        // No procesar si no está activo el análisis
        if (!isAnalyzing) {
          // Reset temporales cuando analysis se detiene
          // (pero no notificamos features false aquí para evitar flicker)
          rafIdRef.current = requestAnimationFrame(loop);
          return;
        }

        // Evitar procesar el mismo frame dos veces
        if (lastVideoTimeRef.current === video.currentTime) {
          rafIdRef.current = requestAnimationFrame(loop);
          return;
        }
        lastVideoTimeRef.current = video.currentTime;

        // Detectar landmarks en el frame actual
        const result = faceLandmarkerRef.current!.detectForVideo(video, now);

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          rafIdRef.current = requestAnimationFrame(loop);
          return;
        }

        // Mantener mismo tamaño que el video
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Solo dibujamos OJOS y BOCA (y solo si hay landmarks)
        if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
          const lms = result.faceLandmarks[0] as LM[];

          // --- DIBUJADO: ojos y boca solo ---
          // transformar coordenadas normalizadas a píxeles
          const toPixel = (p: LM) => ({ x: p.x * canvas.width, y: p.y * canvas.height });

          // dibuja puntos pequeños para cada índice pedido
          const drawPoints = (indices: number[], color = "#00FF00") => {
            ctx.fillStyle = color;
            indices.forEach((i) => {
              const p = toPixel(lms[i]);
              ctx.beginPath();
              ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
              ctx.fill();
            });
          };

          // dibuja líneas conectando pares (simple polyline) para visual
          const drawPolyline = (indices: number[], color = "#00FF00") => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            indices.forEach((i, idx) => {
              const p = toPixel(lms[i]);
              if (idx === 0) ctx.moveTo(p.x, p.y);
              else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
          };

          // Right eye, left eye and mouth points/outline
          drawPoints(rightEyeIdx, "#00E676");
          drawPolyline([33, 159, 158, 133], "#00E676");

          drawPoints(leftEyeIdx, "#00E676");
          drawPolyline([362, 385, 387, 263], "#00E676");

          drawPoints(mouthIdx, "#FF6B35");
          drawPolyline([78, 13, 14, 308, 78], "#FF6B35"); // simple outline

          // --- CÁLCULOS para EAR / MAR ---
          const earRight = computeEAR(lms, rightEyeIdx);
          const earLeft = computeEAR(lms, leftEyeIdx);
          const ear = (earRight + earLeft) / 2.0;

          const mar = computeMAR(lms, mouthIdx);

          // Mapear a un score combinado (0..100) con lógica robusta
          const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

          // Normalizar EAR en rango [EAR_CLOSED, EAR_OPEN]
          const earNorm = clamp01((ear - EAR_CLOSED) / (EAR_OPEN - EAR_CLOSED));
          const eyesScore = 50 + earNorm * 50; // de 50 a 100 dependiendo apertura

          // Normalizar MAR (cuando boca abierta, reduce score)
          const marNorm = clamp01((MAR_OPEN - mar) / (MAR_OPEN - MAR_CLOSED));
          const mouthScore = marNorm * 100; // 0..100 (1 = boca cerrada)

          // Peso combinado (ojos 70%, boca 30%)
          let rawScore = Math.round(eyesScore * 0.7 + mouthScore * 0.3);
          rawScore = Math.max(0, Math.min(100, rawScore));

          // Push al buffer para smoothing
          scoreBufferRef.current.push(rawScore);
          if (scoreBufferRef.current.length > SMOOTHING_WINDOW) {
            scoreBufferRef.current.shift();
          }
          const avgScore =
            Math.round(
              scoreBufferRef.current.reduce((a, b) => a + b, 0) /
                scoreBufferRef.current.length
            ) || rawScore;

          // Determinar nivel
          let level: "high" | "medium" | "low" = "high";
          if (avgScore < 45) level = "low";
          else if (avgScore < 70) level = "medium";
          else level = "high";

          // Notificar una vez que features fueron extraídas (solo la primera vez)
          if (!featuresReadyRef.current) {
            featuresReadyRef.current = true;
            try {
              onFeaturesExtracted(true);
            } catch (e) {
              // no bloquear por errores externos
              console.warn("onFeaturesExtracted callback falló", e);
            }
          }

          // Throttle en notificación de atención (1s)
          const nowMs = Date.now();
          if (!lastReportedRef.current || nowMs - lastReportedRef.current > REPORT_THROTTLE_MS) {
            lastReportedRef.current = nowMs;
            try {
              onAttentionUpdate(avgScore, level);
            } catch (e) {
              console.warn("onAttentionUpdate callback falló", e);
            }
          }
        } else {
          // Sin rostro -> empujar valor bajo suavizado también
          scoreBufferRef.current.push(10);
          if (scoreBufferRef.current.length > SMOOTHING_WINDOW) {
            scoreBufferRef.current.shift();
          }
          const avgScore =
            Math.round(
              scoreBufferRef.current.reduce((a, b) => a + b, 0) /
                scoreBufferRef.current.length
            ) || 10;

          // Reset featuresReadyRef? No, mantener true si ya se extrajeron al menos una vez.
          // Notificar atención baja con throttle
          const nowMs = Date.now();
          if (!lastReportedRef.current || nowMs - lastReportedRef.current > REPORT_THROTTLE_MS) {
            lastReportedRef.current = nowMs;
            try {
              onAttentionUpdate(avgScore, "low");
            } catch (e) {
              console.warn("onAttentionUpdate callback falló", e);
            }
          }
        }

        rafIdRef.current = requestAnimationFrame(loop);
      };

      // Start loop
      rafIdRef.current = requestAnimationFrame(loop);
    }

    setup();

    return () => {
      // cleanup
      cancelledRef.current = true;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (faceLandmarkerRef.current) {
        try {
          faceLandmarkerRef.current.close();
        } catch (e) {
          console.warn("Error closing faceLandmarker", e);
        }
        faceLandmarkerRef.current = null;
      }
      // reset helpers
      featuresReadyRef.current = false;
      scoreBufferRef.current = [];
      lastVideoTimeRef.current = -1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraActive, videoRef, isAnalyzing, onFeaturesExtracted, onAttentionUpdate]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
