import React, { useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';

interface WebcamCaptureProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isAnalyzing: boolean;
  isCameraActive: boolean;
  onFeaturesExtracted: (ready: boolean) => void;
  onAttentionUpdate: (score: number, level: 'high' | 'medium' | 'low') => void;
  classSessionId?: string | number | null;
  modelUrl?: string | null;
}

// Utility helpers for vector math
const dist = (a: {x:number;y:number;z?:number}, b: {x:number;y:number;z?:number}) => {
  const dx = a.x - b.x; const dy = a.y - b.y; const dz = (a.z||0) - (b.z||0);
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
};

// EAR and MAR calculators using mediapipe landmark indices
const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];
const MOUTH = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324]; // approximate indices

const computeEAR = (landmarks: any[], idxs: number[]) => {
  const p1 = landmarks[idxs[0]]; // left corner
  const p2 = landmarks[idxs[1]]; // top 1
  const p3 = landmarks[idxs[2]]; // top 2
  const p4 = landmarks[idxs[3]]; // right corner
  const p5 = landmarks[idxs[4]]; // bottom 2
  const p6 = landmarks[idxs[5]]; // bottom 1
  const vertical = (dist(p2,p6) + dist(p3,p5)) / 2.0;
  const horizontal = dist(p1,p4);
  if (horizontal === 0) return 0;
  return vertical / horizontal;
};

const computeMAR = (landmarks: any[]) => {
  // We'll use a simple mouth opening ratio
  const top = landmarks[13] || landmarks[14] || landmarks[0];
  const bottom = landmarks[14] || landmarks[13] || landmarks[1];
  const left = landmarks[78] || landmarks[61] || landmarks[0];
  const right = landmarks[308] || landmarks[291] || landmarks[1];
  const vertical = dist(top,bottom);
  const horizontal = dist(left,right);
  if (horizontal === 0) return 0;
  return vertical / horizontal;
};

const computeHeadPose = (landmarks: any[]) => {
  // coarse approximations
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const nose = landmarks[1] || landmarks[4];
  // roll via eye vector
  const roll = Math.atan2(leftEye.y - rightEye.y, leftEye.x - rightEye.x) * 180 / Math.PI;
  // yaw and pitch approximations using nose vs mid-eyes
  const midEyes = { x: (leftEye.x + rightEye.x)/2, y: (leftEye.y + rightEye.y)/2, z: ((leftEye.z||0)+(rightEye.z||0))/2 };
  const pitch = Math.atan2(nose.y - midEyes.y, 1) * 180 / Math.PI; // simplified
  const yaw = Math.atan2(nose.x - midEyes.x, 1) * 180 / Math.PI;
  return { pitch, yaw, roll };
};

const buildModel = (windowSize: number, featureCount: number) => {
  const input = tf.input({ shape: [windowSize, featureCount] });
  const conv1 = tf.layers.conv1d({ filters: 64, kernelSize: 3, activation: 'relu', padding: 'same' }).apply(input) as tf.SymbolicTensor;
  const conv2 = tf.layers.conv1d({ filters: 64, kernelSize: 3, activation: 'relu', padding: 'same' }).apply(conv1) as tf.SymbolicTensor;
  try {
    // Attempt a BiLSTM (bidirectional LSTM) with attention mechanism
    const lstmLayer = tf.layers.lstm({ units: 64, returnSequences: true });
    // Some TF.js versions may not expose bidirectional in typings; cast to any when necessary
    // @ts-ignore
    const bi = (tf.layers as any).bidirectional({ layer: lstmLayer, mergeMode: 'concat' }).apply(conv2) as tf.SymbolicTensor; // [batch, time, units*2]

    // Attention: score each time-step
    const attDense = tf.layers.dense({ units: 1, activation: 'linear' }).apply(bi) as tf.SymbolicTensor; // [batch, time, 1]
    const squeezed = tf.layers.reshape({ targetShape: [windowSize] }).apply(attDense) as tf.SymbolicTensor; // [batch, time]
    const attSoft = tf.layers.activation({ activation: 'softmax' }).apply(squeezed) as tf.SymbolicTensor; // [batch, time]
    const attReshaped = tf.layers.reshape({ targetShape: [windowSize, 1] }).apply(attSoft) as tf.SymbolicTensor; // [batch, time, 1]

    // Weighted sum (context vector)
    const context = tf.layers.dot({ axes: [1, 1] }).apply([attReshaped, bi]) as tf.SymbolicTensor; // [batch, 1, units*2]
    const contextFlat = tf.layers.flatten().apply(context) as tf.SymbolicTensor; // [batch, units*2]

    const dense = tf.layers.dense({ units: 32, activation: 'relu' }).apply(contextFlat) as tf.SymbolicTensor;
    const output = tf.layers.dense({ units: 1, activation: 'sigmoid' }).apply(dense) as tf.SymbolicTensor;
    const model = tf.model({ inputs: input, outputs: output });
    model.compile({ optimizer: tf.train.adam(0.001), loss: 'binaryCrossentropy' });
    return model;
  } catch (err) {
    // Fallback: keep a small, simple model if BiLSTM/attention unavailable in runtime
    const lstm = tf.layers.simpleRNN({ units: 64, returnSequences: false }).apply(conv2) as tf.SymbolicTensor; // use simpleRNN to minimize complexity
    const dense = tf.layers.dense({ units: 32, activation: 'relu' }).apply(lstm) as tf.SymbolicTensor;
    const output = tf.layers.dense({ units: 1, activation: 'sigmoid' }).apply(dense) as tf.SymbolicTensor;
    const model = tf.model({ inputs: input, outputs: output });
    model.compile({ optimizer: tf.train.adam(0.001), loss: 'binaryCrossentropy' });
    return model;
  }
};

export default function WebcamCapture({ videoRef, isAnalyzing, isCameraActive, onFeaturesExtracted, onAttentionUpdate, classSessionId, modelUrl }: WebcamCaptureProps) {
  const cameraRef = useRef<any>(null);
  const faceMeshRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const featuresWindowRef = useRef<number[][]>([]);
  const lastAttentionRef = useRef<number>(100);
  const consecutiveLowRef = useRef<number>(0);

  useEffect(() => {
    // Build or load model when component mounts
    const windowSize = 30;
    const featureCount = 6; // leftEAR, rightEAR, MAR, pitch, yaw, roll
    let didCancel = false;
    const initModel = async () => {
      await tf.ready();
      try { await tf.setBackend('webgl'); } catch(e) {}

      // If modelUrl provided, try to load it
      if (!didCancel && (typeof (window as any) !== 'undefined')) {
        try {
          const url = (window as any).__ATTENTION_MODEL_URL__ || null;
          const candidate = (typeof modelUrl === 'string' && modelUrl) || url || '/models/attention_model/model.json';
          if (candidate) {
            try {
              // Avoid repeating checks during the same session
              const checked = (window as any).__ATTENTION_MODEL_CHECKED__;
              if (!checked) {
                const resp = await fetch(candidate, { method: 'HEAD' });
                (window as any).__ATTENTION_MODEL_AVAILABLE__ = resp.ok;
                (window as any).__ATTENTION_MODEL_CHECKED__ = true;
              }
              if ((window as any).__ATTENTION_MODEL_AVAILABLE__) {
                const loaded = await tf.loadLayersModel(candidate).catch(() => null);
                if (loaded) {
                  modelRef.current = loaded;
                  return;
                }
              }
            } catch (e) {
              // network error or CORS; skip loading and fallback
            }
          }
        } catch (e) {
          // fallthrough: build local model
        }
      }

      // fallback: build a small demo model (note: replace with trained model for production)
      console.info('No TF.js model found at candidate URL, using demo fallback model.');
      modelRef.current = buildModel(windowSize, featureCount);
      const warmup = tf.zeros([1, windowSize, featureCount]);
      modelRef.current.predict(warmup).dispose();
      warmup.dispose();
    };
    initModel();
    return () => { didCancel = true; };
  }, [modelUrl]);

  useEffect(() => {
    let cameraInst: any = null;
    let faceMeshInst: any = null;
    let active = true;
    const init = async () => {
      if (!isCameraActive || !videoRef.current) return;
      // Dynamic imports to avoid SSR issues
      const fm = await import('@mediapipe/face_mesh');
      const FaceMeshClass = fm.FaceMesh;

      faceMeshInst = new FaceMeshClass({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
      faceMeshInst.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });

      faceMeshInst.onResults((results: any) => {
        if (!active) return;
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
        const landmarks = results.multiFaceLandmarks[0];
        const leftEAR = computeEAR(landmarks, LEFT_EYE);
        const rightEAR = computeEAR(landmarks, RIGHT_EYE);
        const mar = computeMAR(landmarks);
        const { pitch, yaw, roll } = computeHeadPose(landmarks);
        const features = [leftEAR, rightEAR, mar, pitch/90, yaw/90, roll/180];
        const win = featuresWindowRef.current;
        if (win.length >= 30) win.shift();
        win.push(features);
        if (win.length === 30 && isAnalyzing) {
          onFeaturesExtracted(true);
          const inp = tf.tensor([win]);
          const pred = modelRef.current.predict(inp) as tf.Tensor;
          const valArr = pred.dataSync();
          const probDistracted = valArr[0];
          const attentionScore = Math.round((1 - probDistracted) * 100);
          let level: 'high'|'medium'|'low' = 'high';
          if (attentionScore < 40) level = 'low';
          else if (attentionScore < 70) level = 'medium';
          onAttentionUpdate(attentionScore, level);
          inp.dispose(); pred.dispose();
        }
      });

      // Use a requestAnimationFrame loop to feed frames to mediapipe when camera_utils is not available
      let rafId: number | null = null;
      const frameLoop = async () => {
        if (!videoRef.current) return;
        await faceMeshInst.send({ image: videoRef.current });
        rafId = requestAnimationFrame(frameLoop);
      };
      rafId = requestAnimationFrame(frameLoop);
      cameraInst = { stop: () => { if (rafId) cancelAnimationFrame(rafId); } };
    };

    init();

    return () => {
      active = false;
      if (cameraInst) cameraInst.stop();
      if (faceMeshInst) faceMeshInst.close && faceMeshInst.close();
      featuresWindowRef.current = [];
      onFeaturesExtracted(false);
    };
  }, [videoRef, isCameraActive, isAnalyzing, onFeaturesExtracted, onAttentionUpdate]);

  return null; // This component doesn't render anything itself, it works with the passed videoRef
}
