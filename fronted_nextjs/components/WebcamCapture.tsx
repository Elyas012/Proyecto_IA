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
  modelUrl?: string | null; // ya no se usa, pero lo puedes dejar por compatibilidad
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
  return (A + B) / (2.0 * C);
}

// Mouth Aspect Ratio aproximado.
function computeMAR(landmarks: LM[], idx: number[]): number {
  const [top, bottom, left, right] = idx.map((i) => landmarks[i]);
  const vertical = euclidean(top, bottom);
  const horizontal = euclidean(left, right);
  return vertical / horizontal;
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

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      if (!isCameraActive || !videoRef.current) {
        onFeaturesExtracted(false);
        return;
      }

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

      if (cancelled) {
        faceLandmarker.close();
        return;
      }

      faceLandmarkerRef.current = faceLandmarker;

      const loop = () => {
        if (
          cancelled ||
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

        // Si no se está analizando, mantener loop sin procesar.
        if (!isAnalyzing) {
          rafIdRef.current = requestAnimationFrame(loop);
          return;
        }

        // Evitar procesar el mismo frame dos veces.
        if (lastVideoTimeRef.current === video.currentTime) {
          rafIdRef.current = requestAnimationFrame(loop);
          return;
        }
        lastVideoTimeRef.current = video.currentTime;

        const result = faceLandmarkerRef.current.detectForVideo(video, now);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          rafIdRef.current = requestAnimationFrame(loop);
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const drawingUtils = new DrawingUtils(ctx);

        if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
          const lms = result.faceLandmarks[0] as LM[];

          // Dibujar todos los puntos en verde.
          drawingUtils.drawLandmarks(lms, {
            radius: 1,
            color: "#00FF00",
          });

          // Índices para ojos (EAR).
          const rightEyeIdx = [33, 159, 158, 133, 153, 145];
          const leftEyeIdx = [362, 385, 387, 263, 373, 380];

          const earRight = computeEAR(lms, rightEyeIdx);
          const earLeft = computeEAR(lms, leftEyeIdx);
          const ear = (earRight + earLeft) / 2.0;

          // Índices aproximados para boca (MAR).
          const mouthIdx = [13, 14, 78, 308]; // top, bottom, left, right
          const mar = computeMAR(lms, mouthIdx);

          // Umbrales simples (ajustables).
          const EAR_CLOSED = 0.19; // menor → ojos cerrados
          const MAR_OPEN = 0.6; // mayor → boca muy abierta

          let score = 80;
          let level: "high" | "medium" | "low" = "high";

          const eyesClosed = ear < EAR_CLOSED;
          const mouthOpen = mar > MAR_OPEN;

          if (eyesClosed || mouthOpen) {
            score = 30;
            level = "low";
          } else if (ear < EAR_CLOSED + 0.03 || mar > MAR_OPEN - 0.1) {
            score = 55;
            level = "medium";
          } else {
            score = 80;
            level = "high";
          }

          onFeaturesExtracted(true);
          onAttentionUpdate(score, level);
        } else {
          // Sin rostro → atención muy baja.
          onAttentionUpdate(10, "low");
        }

        rafIdRef.current = requestAnimationFrame(loop);
      };

      loop();
    }

    setup();

    return () => {
      cancelled = true;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
        faceLandmarkerRef.current = null;
      }
    };
  }, [isCameraActive, videoRef, onFeaturesExtracted, onAttentionUpdate, isAnalyzing]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
