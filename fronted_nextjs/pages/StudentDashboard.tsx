import { useState, useRef, useEffect, useCallback } from "react";
import api from '../lib/api';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Separator } from "../components/ui/separator";
import { 
  LayoutDashboard, 
  Video, 
  BarChart3, 
  User, 
  Camera, 
  CameraOff, 
  AlertCircle,
  Activity,
  Clock,
  TrendingUp,
  BookOpen,
  LogOut,
  FileText,
  Eye,
  Smile,
  Brain,
  PlayCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  GripVertical
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StudentReport } from "./StudentReport";
import WebcamCapture from "../components/WebcamCapture";
import CourseMaterials from "../components/CourseMaterials";
import VideoPlayer from "../components/VideoPlayer";
import { Toaster, toast } from 'sonner';
import { motion } from "framer-motion";
import { QuizModal } from "../components/QuizModal";

type ViewType = "dashboard" | "classes" | "stats" | "profile" | "report";
type AttentionLevel = "high" | "medium" | "low";
type PomodoroPhase = "trabajo" | "descanso-corto" | "descanso-largo";

interface AttentionData {
  time: string;
  attention: number;
}

interface Course {
  id: string;
  course_id: number; // <--- AGREGAR ESTO
  name: string;
  professor: string;
  time: string;
  status: "active" | "upcoming" | "completed";
}

interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  user_code?: string;
}

interface PomodoroMetrics {
  total_events: number;
  auto_pauses: number;
  effective_seconds: number;
}

interface StatsSummary {
  average_attention: number;
  total_sessions: number;
  total_minutes: number;
  period: string;
}

interface TimelineData {
  timestamp: string;
  attention: number;
}

interface HourData {
  hour: number;
  attention: number;
}

interface ClassComparison {
  course: string;
  course_name: string;
  student_avg: number;
  class_avg: number;
}

interface PomodoroStatsMetrics {
  total_events: number;
  auto_pauses: number;
  effective_minutes: number;
}

interface StatsData {
  summary: StatsSummary;
  timeline: TimelineData[];
  by_hour: HourData[];
  class_comparison: ClassComparison[];
  pomodoro_metrics: PomodoroStatsMetrics;
}

interface StudentDashboardProps {
  onLogout?: () => void;
}

interface PomodoroBackendStatus {
  status: 'idle' | 'working' | 'paused' | 'break_distracted';
  time_remaining_in_current_phase: number;
  is_distracted_during_pause: boolean;
  work_duration_minutes: number;
  pause_duration_minutes: number;
}

export function StudentDashboard({ onLogout }: StudentDashboardProps) {
  const [currentView, setCurrentView] = useState<ViewType>("classes");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFeaturesExtracted, setIsFeaturesExtracted] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const isFeaturesExtractedRef = useRef<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCameraMinimized, setIsCameraMinimized] = useState(false);

  // Estados para Quiz con IA
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizMaterialId, setQuizMaterialId] = useState<number | null>(null);

  // Estado para el video activo
  const [activeVideo, setActiveVideo] = useState<any>(null);

  useEffect(() => {
    isFeaturesExtractedRef.current = isFeaturesExtracted;
  }, [isFeaturesExtracted]);

  const [attentionLevel, setAttentionLevel] = useState<AttentionLevel>("high");
  const [attentionScore, setAttentionScore] = useState(85);
  const [showLowAttentionAlert, setShowLowAttentionAlert] = useState(false);
  const [showMediumAttentionAlert, setShowMediumAttentionAlert] = useState(false);
  const [consecutiveLow, setConsecutiveLow] = useState(0);
  const lastReportedRef = useRef<number | null>(null);
  const [attentionHistory, setAttentionHistory] = useState<AttentionData[]>([
    { time: "0s", attention: 85 },
  ]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [pomodoroMetrics, setPomodoroMetrics] = useState<PomodoroMetrics | null>(null);
  const [autoPauseTriggered, setAutoPauseTriggered] = useState(false);
  
  // Estados para Estadísticas
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState<'week' | 'month' | 'semester'>('month');
  
  const defaultWorkSeconds = 5 * 60;
  const defaultPauseSeconds = 2 * 60;

  const [pomodoroSession, setPomodoroSession] = useState(1);
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>("trabajo");
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(defaultWorkSeconds);
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [backendPomodoroStatus, setBackendPomodoroStatus] = useState<PomodoroBackendStatus | null>(null);

  const getWorkDurationSeconds = () =>
    (backendPomodoroStatus?.work_duration_minutes ?? defaultWorkSeconds / 60) * 60;
  const getShortBreakSeconds = () =>
    (backendPomodoroStatus?.pause_duration_minutes ?? defaultPauseSeconds / 60) * 60;
  const getLongBreakSeconds = () => Math.max(getShortBreakSeconds() * 2, 5 * 60);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadUser = async () => {
    try {
      const resp = await api.get('/auth/me/');
      setUser(resp.data);
    } catch (err) {
      console.warn('No authenticated user (me) or error', err);
      setUser(null);
    }
  };

  const loadPomodoroMetrics = async () => {
    try {
      const resp = await api.get('/student/pomodoro-metrics/');
      setPomodoroMetrics(resp.data);
    } catch (err) {
      console.warn('Could not load pomodoro metrics', err);
      setPomodoroMetrics(null);
    }
  };

  const loadStatistics = async (period: 'week' | 'month' | 'semester' = 'month') => {
    setStatsLoading(true);
    try {
      const response = await api.get('/student/report/', {
        params: { period }
      });
      setStatsData(response.data);
    } catch (error) {
      console.error('Error loading statistics:', error);
      toast.error('No se pudieron cargar las estadísticas');
    } finally {
      setStatsLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.warning('No token presente. Inicia sesión o pega un token en la opción correspondiente.');
        throw new Error('No auth token');
      }
      const response = await api.get('/student/courses/');
      setCourses(response.data);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('No autenticado o error al cargar cursos. Inicia sesión o pega un token.');
      setCourses([]);
    }
  };

  const handleFeaturesExtracted = useCallback((ready: boolean) => {
    console.log('📦 Features extracted:', ready);
    setIsFeaturesExtracted(ready);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setToken(token);
    if (token) {
      loadUser();
      loadCourses();
      loadPomodoroMetrics();
    }
  }, []);

  // Cargar estadísticas cuando se cambia a la vista de stats
  useEffect(() => {
    if (currentView === 'stats' && token) {
      loadStatistics(statsPeriod);
    }
  }, [currentView, token]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    const fetchPomodoroStatus = async () => {
      if (!isPomodoroActive || !selectedCourse || !token) {
        return;
      }

      try {
        const response = await api.get(`/student/pomodoro-status/?class_session_id=${selectedCourse.id}`);
        const data: PomodoroBackendStatus = response.data;
        setBackendPomodoroStatus(data);

        if (data.status === 'working') {
          if (pomodoroPhase !== 'trabajo') setPomodoroPhase('trabajo');
          setPomodoroTimeLeft(data.time_remaining_in_current_phase);
        } else if (data.status === 'paused' || data.status === 'break_distracted') {
          if (pomodoroPhase === 'trabajo') {
            if (pomodoroSession % 4 === 0) {
              setPomodoroPhase('descanso-largo');
            } else {
              setPomodoroPhase('descanso-corto');
            }
          }
          if (data.is_distracted_during_pause && (pomodoroPhase === 'descanso-corto' || pomodoroPhase === 'descanso-largo')) {
            toast.error('🛑 Distracción detectada durante el descanso. La pausa se ha reiniciado.');
            setPomodoroTimeLeft(data.pause_duration_minutes * 60);
          } else {
            setPomodoroTimeLeft(data.time_remaining_in_current_phase);
          }
        } else if (data.status === 'idle') {
          if (pomodoroPhase !== 'trabajo') setPomodoroPhase('trabajo');
          setPomodoroTimeLeft(prev => (prev > 0 ? prev : getWorkDurationSeconds()));
        }
      } catch (error) {
        console.error('Error fetching pomodoro status:', error);
      }
    };

    if (isPomodoroActive && selectedCourse && token) {
      fetchPomodoroStatus(); 
      interval = setInterval(fetchPomodoroStatus, 5000);
    } else {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPomodoroActive, selectedCourse, token, pomodoroPhase, pomodoroSession]);

  const attentionScoreRef = useRef<number>(attentionScore);
  useEffect(() => {
    attentionScoreRef.current = attentionScore;
    console.log('📊 attentionScoreRef updated to:', attentionScore);
  }, [attentionScore]);

  useEffect(() => {
    if (!isAnalyzing || !isFeaturesExtracted) return;
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${String(now.getSeconds()).padStart(2, '0')}s`;
      setAttentionHistory(prev => {
        const newHistory = [...prev, { time: timeStr, attention: Math.round(attentionScoreRef.current) }];
        return newHistory.slice(-40);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isAnalyzing, isFeaturesExtracted]);

  useEffect(() => {
    if (!isAnalyzing || !isFeaturesExtracted) {
      setAttentionHistory([]);
    }
  }, [isAnalyzing, isFeaturesExtracted]);

  // Temporizador Pomodoro - VERSIÓN CORREGIDA
useEffect(() => {
  if (!isPomodoroActive || !isFeaturesExtracted || !selectedCourse || !backendPomodoroStatus) return;
  
  const interval = setInterval(() => {
    setPomodoroTimeLeft(prev => {
      const currentStatus = backendPomodoroStatus.status;
      const currentAttention = attentionScoreRef.current;
      // Solo decrementa si la atención es >= 50
      const shouldDecrement = currentAttention >= 50;
      
      // Si backend está break_distracted, sincroniza con backend
      if (currentStatus === 'break_distracted') {
        return backendPomodoroStatus.time_remaining_in_current_phase;
      }

      if (currentStatus === 'idle') {
        if (prev <= 0) {
          return getWorkDurationSeconds();
        }
        return shouldDecrement ? prev - 1 : prev;
      }
      
      // En fase de trabajo
      if (currentStatus === 'working') {
        if (prev <= 1) {
          // ✅ Timer finished, transición a descanso
          const nextSession = pomodoroSession;
          console.log('🏁 Sesión completada:', nextSession);
          
          // Determinar tipo de descanso
          if (nextSession % 4 === 0) {
            console.log('🎉 Descanso largo (5 min) después de 4 sesiones');
            setPomodoroPhase('descanso-largo');
            setPomodoroTimeLeft(getLongBreakSeconds());
          } else {
            console.log('☕ Descanso corto (2 min)');
            setPomodoroPhase('descanso-corto');
            setPomodoroTimeLeft(getShortBreakSeconds());
          }
          
          // Notificar al backend
          api.post('/student/pomodoro-events/', { 
            class_session_id: selectedCourse.id, 
            event_type: 'auto_pause', 
            reason: 'work_session_ended',
            session_number: nextSession
          }).catch(error => console.error('Error posting auto_pause event:', error));
          
          return nextSession % 4 === 0 ? getLongBreakSeconds() : getShortBreakSeconds();
        }
        // Solo decrementa si hay buena atención, sino mantiene el tiempo
        return shouldDecrement ? prev - 1 : prev;
      }
      
      // En fase de pausa (descanso)
      if (currentStatus === 'paused') {
        if (prev <= 1) {
          // ✅ Descanso terminado, incrementar sesión y volver a trabajo
          const newSession = pomodoroSession + 1;
          console.log('🚀 Iniciando sesión:', newSession);
          
          setPomodoroSession(newSession); // ✅ Incrementar AQUÍ
          setPomodoroPhase('trabajo');
          setPomodoroTimeLeft(getWorkDurationSeconds());
          
          // Notificar al backend
          api.post('/student/pomodoro-events/', { 
            class_session_id: selectedCourse.id, 
            event_type: 'start', 
            reason: 'pause_ended',
            session_number: newSession
          }).catch(error => console.error('Error posting start event:', error));
          
          return getWorkDurationSeconds();
        }
        // Durante la pausa, siempre decrementa
        return prev - 1;
      }
      
      return prev;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [isPomodoroActive, isFeaturesExtracted, selectedCourse, backendPomodoroStatus, pomodoroSession]);
// ✅ IMPORTANTE: Agregar pomodoroSession a las dependencias

  const formatPomodoroTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getPhaseName = (): string => {
    if (pomodoroPhase === "trabajo") return "Sesión de Trabajo";
    if (pomodoroPhase === "descanso-corto") return "Descanso Corto";
    return "Descanso Largo";
  };

  const toggleCamera = async () => {
    if (isCameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        videoRef.current.srcObject = stream as any;
      }

      setIsCameraActive(true);
    } catch (err) {
      console.error("Error activando cámara:", err);
      toast.error("No se pudo activar la cámara");
    }
  };

  // ✅ FIX: Restaurar stream al video cuando se regresa a la vista después de navegar
  useEffect(() => {
    console.log('🎥 Estado de cámara:', { 
      isCameraActive, 
      hasStream: !!streamRef.current, 
      hasVideoRef: !!videoRef.current,
      hasSrcObject: videoRef.current?.srcObject ? 'sí' : 'no',
      isFeaturesExtracted,
      isAnalyzing
    });
    
    if (isCameraActive && streamRef.current && videoRef.current) {
      // Si el video no tiene srcObject pero tenemos el stream, reconectarlo
      if (!videoRef.current.srcObject) {
        console.log('🔧 Restaurando stream al video element');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        videoRef.current.srcObject = streamRef.current as any;
      }
    }
  }, [isCameraActive, currentView, isFeaturesExtracted, isAnalyzing]); // Se ejecuta cuando cambia la vista, análisis o features

  const startAnalysis = () => {
    if (!isCameraActive) {
      alert("Primero debes activar la cámara");
      return;
    }
    
    if (!selectedCourse) {
      alert("Primero debes seleccionar un curso desde el Dashboard");
      return;
    }

    setIsAnalyzing(true);
    setExtractionProgress(10);
    
    const progressInterval = setInterval(() => {
      setExtractionProgress(p => Math.min(90, p + 10));
      if (isFeaturesExtractedRef.current) {
        setExtractionProgress(100);
        clearInterval(progressInterval);
        setTimeout(() => {
          alert("✅ Features extraídos exitosamente!");
        }, 300);
      }
    }, 500);
    
    setTimeout(() => {
      if (!isFeaturesExtractedRef.current) {
        console.log('🔥 FORCE FEATURES READY');
        setIsFeaturesExtracted(true);
      }
    }, 5000);
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false);
    setIsFeaturesExtracted(false);
    setExtractionProgress(0);
  };

  // ✅ CRITICAL: useCallback para prevenir re-montaje de WebcamCapture
const handleAttentionUpdate = useCallback((score: number, level: 'high' | 'medium' | 'low') => {
  console.log('🔥🔥🔥 handleAttentionUpdate CALLED:', { 
    score, 
    level,
    timestamp: new Date().toLocaleTimeString() 
  });
  
  setAttentionScore(score);
  console.log('✅✅✅ setAttentionScore executed with:', score);
  
  // ✅ CAMBIO: Pausa SOLO si score <= 30% POR 5-10 SEGUNDOS (usaremos 7s como promedio)
  if (score <= 30) {
    setConsecutiveLow(prev => {
      const val = prev + 1;
      
      // ✅ PAUSA AUTOMÁTICA: SOLO 0-30% POR 7 SEGUNDOS CONSECUTIVOS
      if (val >= 7 && pomodoroPhase === 'trabajo' && isPomodoroActive) {
        console.log('⏸️ PAUSA AUTOMÁTICA: 7 segundos de baja atención');
        
        // Determinar tipo de descanso según la sesión actual
        const isLongBreak = pomodoroSession % 4 === 0;
        const breakDuration = isLongBreak ? getLongBreakSeconds() : getShortBreakSeconds();
        const breakMinutes = Math.round(breakDuration / 60);
        
        setPomodoroPhase(isLongBreak ? 'descanso-largo' : 'descanso-corto');
        setPomodoroTimeLeft(breakDuration);
        setAutoPauseTriggered(true);
        setTimeout(() => setAutoPauseTriggered(false), 5000);
        
        // Record auto-pause event to backend
        if (selectedCourse && isAnalyzing) {
          api.post('/student/pomodoro-events/', { 
            class_session_id: selectedCourse.id, 
            event_type: 'auto_pause', 
            reason: 'low_attention_7s',
            distraction_count: val,
            session_number: pomodoroSession
          }).catch(() => {});
        }
        
        toast(`🛑 Pausa automática: ${val}s de baja atención. ${isLongBreak ? `Descanso largo (${breakMinutes} min)` : `Descanso corto (${breakMinutes} min)`}`, {
          action: {
            label: 'OK',
            onClick: () => {},
          },
        });
        return 0; // Reset contador
      }
      
      // Lógica pausa durante descanso (mantiene igual)
      if ((pomodoroPhase === 'descanso-corto' || pomodoroPhase === 'descanso-largo') && 
          isPomodoroActive && selectedCourse && isAnalyzing) {
        api.post('/student/feature-records/', { 
          class_session_id: selectedCourse.id, 
          features: { attentionScore: score }, 
          attention_score: score 
        }).catch(() => {});
        toast.warning('⚠️ Distracción durante pausa.');
      }

      return val;
    });
  } else {
    // ✅ RESET: Si score > 30%, contador = 0
    setConsecutiveLow(0);
    setShowLowAttentionAlert(false);
    setShowMediumAttentionAlert(false);
  }
  
  // Alertas (mantiene igual)
  if (score < 40) {
    setAttentionLevel('low');
    setShowLowAttentionAlert(true);
    setShowMediumAttentionAlert(false);
  } else if (score < 70) {
    setAttentionLevel('medium');
    setShowLowAttentionAlert(false);
    setShowMediumAttentionAlert(true);
  } else {
    setAttentionLevel('high');
    setShowLowAttentionAlert(false);
    setShowMediumAttentionAlert(false);
  }

  // Record attention
  const now = Date.now();
  if (selectedCourse && isAnalyzing && 
      (!lastReportedRef.current || (now - lastReportedRef.current) > 1000)) {
    lastReportedRef.current = now;
    api.post('/student/record-attention/', { 
      class_session_id: selectedCourse.id, 
      attention_score: score,
      raw_features: [], 
      duration_seconds: 1 
    }).catch(() => {});
  }
}, [pomodoroPhase, isPomodoroActive, selectedCourse, isAnalyzing, pomodoroSession]);
// ✅ Agregar pomodoroSession a las dependencias

  const getAttentionColor = () => {
    if (attentionLevel === "high") return "text-green-600";
    if (attentionLevel === "medium") return "text-yellow-600";
    return "text-red-600";
  };

  const getAttentionBgColor = () => {
    if (attentionLevel === "high") return "bg-green-100 border-green-300";
    if (attentionLevel === "medium") return "bg-yellow-100 border-yellow-300";
    return "bg-red-100 border-red-300";
  };

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsPomodoroActive(false);
    setPomodoroSession(1);
    setPomodoroPhase('trabajo');
    setPomodoroTimeLeft(getWorkDurationSeconds());
    setBackendPomodoroStatus(null);
    setConsecutiveLow(0);
    setAutoPauseTriggered(false);
    setShowLowAttentionAlert(false);
    setShowMediumAttentionAlert(false);
    setCurrentView("classes");
  };

  const handleLogoutClick = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsAnalyzing(false);
    setIsFeaturesExtracted(false);
    setExtractionProgress(0);
    setIsPomodoroActive(false);
    setPomodoroSession(1);
    setPomodoroPhase('trabajo');
    setPomodoroTimeLeft(getWorkDurationSeconds());
    setBackendPomodoroStatus(null);
    setSelectedCourse(null);
    setConsecutiveLow(0);
    setAutoPauseTriggered(false);
    setShowLowAttentionAlert(false);
    setShowMediumAttentionAlert(false);
    onLogout?.();
  };

  const togglePomodoro = async () => {
    if (!selectedCourse) {
      toast.error('Selecciona un curso para iniciar el Pomodoro.');
      return;
    }
    const newPomodoroActiveState = !isPomodoroActive;
    setIsPomodoroActive(newPomodoroActiveState);

    try {
      if (newPomodoroActiveState) {
        setConsecutiveLow(0);
        setAutoPauseTriggered(false);
        setShowLowAttentionAlert(false);
        setShowMediumAttentionAlert(false);
        setPomodoroPhase('trabajo');
        setPomodoroTimeLeft(getWorkDurationSeconds());
        await api.post('/student/pomodoro-events/', { class_session_id: selectedCourse.id, event_type: 'start', reason: 'manual_start' });
        toast.success('Pomodoro iniciado!');
      } else {
        await api.post('/student/pomodoro-events/', { class_session_id: selectedCourse.id, event_type: 'manual_pause', reason: 'manual_pause_request' });
        toast.info('Pomodoro pausado.');
      }
    } catch (error) {
      console.error('Error toggling pomodoro:', error);
      toast.error('Error al cambiar el estado del Pomodoro.');
      setIsPomodoroActive(!newPomodoroActiveState);
    }
  };

  const startNewStudySession = async () => {
    if (!selectedCourse) {
      toast.error('Selecciona un curso para iniciar el Pomodoro.');
      return;
    }

    if (!isFeaturesExtracted) {
      toast.error('Activa la camara y el analisis antes de iniciar una nueva sesion.');
      return;
    }

    setPomodoroSession(1);
    setConsecutiveLow(0);
    setAutoPauseTriggered(false);
    setShowLowAttentionAlert(false);
    setShowMediumAttentionAlert(false);
    setPomodoroPhase('trabajo');
    setPomodoroTimeLeft(getWorkDurationSeconds());
    setIsPomodoroActive(true);

    try {
      await api.post('/student/pomodoro-events/', {
        class_session_id: selectedCourse.id,
        event_type: 'start',
        reason: 'new_session',
      });
      toast.success('Nueva sesion iniciada.');
    } catch (error) {
      console.error('Error starting new session:', error);
      toast.error('No se pudo iniciar la nueva sesion.');
      setIsPomodoroActive(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      <Toaster position="top-right" />
      
      {/* Mobile Header */}
      <div className="lg:hidden bg-[#1a1a1a] border-b border-gray-800 text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">FocusLearn</h2>
            <p className="text-gray-500 text-xs">Panel Estudiante</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      
      <div className="flex">
        {/* Sidebar - Desktop y Mobile */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40
          ${isSidebarCollapsed ? 'w-20' : 'w-64'} 
          min-h-screen flex flex-col
          bg-[#1a1a1a] text-white shadow-2xl
          ${isSidebarCollapsed ? 'px-3 py-6' : 'px-4 py-6'}
          transform transition-all duration-300 ease-in-out
          lg:transform-none
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className={`mb-6 hidden lg:flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} pb-4 border-b border-gray-800`}>
            <div className={`${isSidebarCollapsed ? 'hidden' : 'flex items-center gap-3'}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">FocusLearn</h2>
                <p className="text-gray-500 text-xs">Panel Estudiante</p>
              </div>
            </div>
            {!isSidebarCollapsed ? (
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => {
                setCurrentView("dashboard");
                setIsMobileMenuOpen(false);
                if (isSidebarCollapsed) setIsSidebarCollapsed(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 group ${
                currentView === "dashboard" 
                  ? "bg-gray-800 text-white border-l-4 border-cyan-500" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent"
              }`}
              title="Dashboard"
            >
              <LayoutDashboard className={`w-5 h-5 flex-shrink-0 ${
                currentView === "dashboard" ? "text-cyan-500" : "group-hover:text-cyan-500"
              }`} />
              <span className={`${isSidebarCollapsed ? 'hidden' : 'block'} text-sm font-medium`}>Dashboard</span>
            </button>

            <button
              onClick={() => {
                setCurrentView("classes");
                setIsMobileMenuOpen(false);
                if (isSidebarCollapsed) setIsSidebarCollapsed(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 group ${
                currentView === "classes" 
                  ? "bg-gray-800 text-white border-l-4 border-cyan-500" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent"
              }`}
              title="Mis Clases"
            >
              <Video className={`w-5 h-5 flex-shrink-0 ${
                currentView === "classes" ? "text-cyan-500" : "group-hover:text-cyan-500"
              }`} />
              <span className={`${isSidebarCollapsed ? 'hidden' : 'block'} text-sm font-medium`}>Mis Clases</span>
              {selectedCourse && !isSidebarCollapsed && (
                <Badge className="ml-auto bg-cyan-500 text-white text-xs px-2">1</Badge>
              )}
            </button>

            <button
              onClick={() => {
                setCurrentView("stats");
                setIsMobileMenuOpen(false);
                if (isSidebarCollapsed) setIsSidebarCollapsed(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 group ${
                currentView === "stats" 
                  ? "bg-gray-800 text-white border-l-4 border-cyan-500" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent"
              }`}
              title="Estadísticas"
            >
              <BarChart3 className={`w-5 h-5 flex-shrink-0 ${
                currentView === "stats" ? "text-cyan-500" : "group-hover:text-cyan-500"
              }`} />
              <span className={`${isSidebarCollapsed ? 'hidden' : 'block'} text-sm font-medium`}>Estadísticas</span>
            </button>

            <button
              onClick={() => {
                setCurrentView("report");
                setIsMobileMenuOpen(false);
                if (isSidebarCollapsed) setIsSidebarCollapsed(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 group ${
                currentView === "report" 
                  ? "bg-gray-800 text-white border-l-4 border-cyan-500" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent"
              }`}
              title="Mi Reporte"
            >
              <FileText className={`w-5 h-5 flex-shrink-0 ${
                currentView === "report" ? "text-cyan-500" : "group-hover:text-cyan-500"
              }`} />
              <span className={`${isSidebarCollapsed ? 'hidden' : 'block'} text-sm font-medium`}>Mi Reporte</span>
            </button>

            <button
              onClick={() => {
                setCurrentView("profile");
                setIsMobileMenuOpen(false);
                if (isSidebarCollapsed) setIsSidebarCollapsed(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 group ${
                currentView === "profile" 
                  ? "bg-gray-800 text-white border-l-4 border-cyan-500" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent"
              }`}
              title="Mi Perfil"
            >
              <User className={`w-5 h-5 flex-shrink-0 ${
                currentView === "profile" ? "text-cyan-500" : "group-hover:text-cyan-500"
              }`} />
              <span className={`${isSidebarCollapsed ? 'hidden' : 'block'} text-sm font-medium`}>Mi Perfil</span>
            </button>
          </nav>

          {/* Divider */}
          <div className="my-4 border-t border-gray-800"></div>

          <div className="mt-auto pt-4">
            <button 
              onClick={() => {
                handleLogoutClick();
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg text-gray-400 hover:bg-red-900 hover:bg-opacity-20 hover:text-red-400 transition-all duration-200 border-l-4 border-transparent hover:border-red-500 group`}
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5 flex-shrink-0 group-hover:text-red-400" />
              <span className={`${isSidebarCollapsed ? 'hidden' : 'block'} text-sm font-medium`}>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* Overlay para cerrar menú en móvil */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 z-30 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {currentView === "dashboard" && (
            <div className="bg-gray-50 min-h-screen -m-8 p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Panel de Estudiante</h1>
                <p className="text-gray-500">Bienvenido, {user ? (user.first_name ? `${user.first_name} ${user.last_name || ''}` : (user.username || user.email)) : 'Estudiante'}</p>
              </div>

              {/* Tarjetas grandes principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-cyan-400 to-cyan-500 text-white h-40">
                    <CardContent className="p-6 h-full flex flex-col justify-between">
                      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                        <TrendingUp className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Eventos</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-3xl font-bold">{pomodoroMetrics ? pomodoroMetrics.total_events : '0'}</span>
                          <Activity className="w-5 h-5 text-white opacity-70" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-400 to-orange-500 text-white h-40">
                    <CardContent className="p-6 h-full flex flex-col justify-between">
                      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                        <BookOpen className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Pausas</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-3xl font-bold">{pomodoroMetrics ? pomodoroMetrics.auto_pauses : '0'}</span>
                          <Activity className="w-5 h-5 text-white opacity-70" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-400 to-blue-500 text-white h-40">
                    <CardContent className="p-6 h-full flex flex-col justify-between">
                      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                        <Clock className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Tiempo</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-3xl font-bold">{pomodoroMetrics ? `${(pomodoroMetrics.effective_seconds / 3600).toFixed(1)}h` : '0h'}</span>
                          <Activity className="w-5 h-5 text-white opacity-70" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-pink-400 to-purple-500 text-white h-40">
                    <CardContent className="p-6 h-full flex flex-col justify-between">
                      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                        <BookOpen className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Cursos</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-3xl font-bold">{courses.length}</span>
                          <Activity className="w-5 h-5 text-white opacity-70" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Secciones de acceso rápido */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-white cursor-pointer" onClick={() => setCurrentView("classes")}>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center mb-3">
                        <Video className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm">Mis Clases</h3>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-white cursor-pointer" onClick={() => setCurrentView("stats")}>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center mb-3">
                        <BarChart3 className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm">Estadísticas</h3>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-white cursor-pointer" onClick={() => setCurrentView("report")}>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center mb-3">
                        <FileText className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm">Mi Reporte</h3>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-white cursor-pointer" onClick={() => setCurrentView("profile")}>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center mb-3">
                        <User className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm">Mi Perfil</h3>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-white cursor-pointer">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center mb-3">
                        <Clock className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm">Horario</h3>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-white cursor-pointer">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center mb-3">
                        <Activity className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm">Actividad</h3>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <Card className="mb-8 border-0 shadow-lg bg-white">
                <CardHeader className="border-b bg-gray-50">
                  <CardTitle className="text-xl font-bold text-gray-800">Cursos Disponibles</CardTitle>
                  <CardDescription className="text-gray-500">Selecciona un curso para iniciar la sesión de monitoreo</CardDescription>
                </CardHeader>
                <CardContent>
                  {courses.length === 0 ? (
                    <div className="p-4">
                      <Alert className="border-cyan-300 bg-cyan-50">
                        <AlertCircle className="h-4 w-4 text-cyan-600" />
                        <AlertDescription className="text-cyan-700">
                          No se encontraron cursos. Inicia sesión para ver tus cursos.
                        </AlertDescription>
                      </Alert>
                      <div className="mt-4 flex gap-2">
                        <Button onClick={() => setCurrentView('profile')}>Iniciar Sesión / Perfil</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {courses.map((course) => (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          whileHover={{ x: 4 }}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                            selectedCourse?.id === course.id
                              ? "bg-cyan-50 border-cyan-500 shadow-md"
                              : course.status === "active"
                              ? "bg-green-50 border-green-300"
                              : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                              selectedCourse?.id === course.id
                                ? "bg-cyan-500"
                                : course.status === "active"
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }`}>
                              <BookOpen className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{course.name}</p>
                              <p className="text-sm text-gray-600">{course.professor} - {course.time}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {course.status === "active" && (
                              <Badge className="bg-green-500 text-white">En vivo</Badge>
                            )}
                            {selectedCourse?.id === course.id ? (
                              <Badge className="bg-cyan-500 text-white">Seleccionado</Badge>
                            ) : (
                              <Button onClick={() => handleSelectCourse(course)} size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                                Seleccionar
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {!selectedCourse && (
                <Alert className="border-cyan-300 bg-cyan-50 mb-8">
                  <AlertCircle className="h-4 w-4 text-cyan-600" />
                  <AlertDescription className="text-cyan-700">
                    <strong>Instrucciones:</strong> Selecciona un curso para comenzar. Luego ve a "Mis Clases" para activar la cámara e iniciar el análisis de atención.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="border-b bg-gray-50">
                    <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-cyan-500" />
                      Reporte Individual
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-600 mb-4">
                      Revisa gráficos detallados y análisis temporal de tu desempeño.
                    </p>
                    <Button 
                      onClick={() => setCurrentView("report")}
                      className="w-full bg-cyan-500 hover:bg-cyan-600"
                    >
                      Ver mi reporte
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="border-b bg-gray-50">
                    <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-cyan-500" />
                      Inicio Rápido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-600 mb-4">
                      {selectedCourse ? `Curso seleccionado: ${selectedCourse.name}` : "Selecciona un curso para comenzar"}
                    </p>
                    <Button 
                      onClick={() => setCurrentView("classes")}
                      className="w-full bg-cyan-500 hover:bg-cyan-600"
                      disabled={!selectedCourse}
                    >
                      Ir a clase virtual
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {currentView === "classes" && (
            <div className="bg-gray-50 min-h-screen -m-8 p-8 relative">
              {/* Cámara Minimizada Flotante */}
              {isFeaturesExtracted && isAnalyzing && isCameraActive && (
                <motion.div
                  drag
                  dragConstraints={{
                    top: 0,
                    left: 0,
                    right: typeof window !== 'undefined' ? window.innerWidth - 256 : 1000,
                    bottom: typeof window !== 'undefined' ? window.innerHeight - 400 : 600
                  }}
                  dragElastic={0.1}
                  dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="fixed top-20 right-6 z-50 w-64 bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-cyan-500 cursor-move"
                  style={{ touchAction: 'none' }}
                >
                  <div className="bg-cyan-500 px-3 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-white opacity-70" />
                      <Camera className="w-4 h-4 text-white" />
                      <span className="text-white font-semibold text-sm">Mi Cámara</span>
                    </div>
                    <Badge className="bg-green-500 text-white px-2 py-0.5 text-xs">
                      En vivo
                    </Badge>
                  </div>
                  <div className="relative bg-black aspect-video" onPointerDown={(e) => e.stopPropagation()}>
                    <video
                      ref={videoRef}
                      className="block w-full h-full object-cover pointer-events-none"
                      autoPlay
                      muted
                      playsInline
                      onLoadedMetadata={() => console.log('📹 Video cargado en cámara minimizada')}
                    />
                    {isCameraActive && (
                      <WebcamCapture
                        videoRef={videoRef}
                        isAnalyzing={isAnalyzing}
                        isCameraActive={isCameraActive}
                        onFeaturesExtracted={handleFeaturesExtracted}
                        onAttentionUpdate={handleAttentionUpdate}
                        classSessionId={selectedCourse?.id ?? null}
                      />
                    )}
                    {!streamRef.current && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cyan-900 to-cyan-700">
                        <div className="text-center text-white p-2">
                          <Camera className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                          <p className="text-xs">Modo Simulación</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 px-3 py-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Estado:</span>
                      <Badge className={`text-xs ${
                        pomodoroPhase === 'trabajo' 
                          ? 'bg-cyan-500 text-white' 
                          : pomodoroPhase === 'descanso-corto' || pomodoroPhase === 'descanso-largo'
                          ? 'bg-green-500 text-white'
                          : 'bg-purple-500 text-white'
                      }`}>
                        {getPhaseName()} #{pomodoroSession}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Tiempo:</span>
                      <span className="text-lg font-bold text-cyan-600">
                        {formatPomodoroTime(pomodoroTimeLeft)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={togglePomodoro}
                        onPointerDown={(e) => e.stopPropagation()}
                        className={`flex-1 text-xs ${
                          isPomodoroActive 
                            ? 'bg-amber-500 hover:bg-amber-600' 
                            : 'bg-cyan-500 hover:bg-cyan-600'
                        } text-white`}
                      >
                        {isPomodoroActive ? "Pausar" : "Iniciar"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Sala de Clase Virtual</h1>
                <p className="text-gray-500">
                  {selectedCourse 
                    ? `Configuración y análisis - ${selectedCourse.name}`
                    : "Activa tu cámara y selecciona un curso para comenzar"
                  }
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Reproductor de Video Principal */}
                  {isFeaturesExtracted && isAnalyzing ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="border-0 shadow-lg bg-white">
                        <CardHeader className="border-b bg-gray-50">
                          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <PlayCircle className="w-6 h-6 text-cyan-500" />
                            Contenido de Clase
                          </CardTitle>
                          <CardDescription className="text-gray-500">Recursos educativos del curso</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                          {activeVideo ? (
                            <VideoPlayer material={activeVideo} />
                          ) : (
                            <div className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-black aspect-video flex items-center justify-center">
                              <div className="text-center text-white px-6 py-12">
                                <div className="w-24 h-24 mx-auto mb-6 bg-cyan-500 bg-opacity-20 rounded-full flex items-center justify-center">
                                  <PlayCircle className="w-16 h-16 text-cyan-400" />
                                </div>
                                <h3 className="text-3xl font-bold mb-3 text-white">Reproductor de Video</h3>
                                <p className="text-gray-300 mb-2 text-lg">Los videos del curso se mostrarán aquí</p>
                                <p className="text-sm text-gray-400">Selecciona un video desde "Material del Curso" abajo</p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    <Card className="border-0 shadow-lg bg-white">
                      <CardHeader className="border-b bg-gray-50">
                        <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <Camera className="w-6 h-6 text-cyan-500" />
                          Video en Vivo
                        </CardTitle>
                        <CardDescription className="text-gray-500">Tu cámara - Configuración de análisis</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                        {isCameraActive && isFeaturesExtracted && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 max-w-[calc(100%-1rem)] sm:max-w-none"
                          >
                            <Card className="bg-cyan-500 border-0 shadow-xl">
                              <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-white font-medium opacity-90">
                                      {getPhaseName()} #{pomodoroSession}
                                    </p>
                                    <p className="text-xl sm:text-2xl font-bold text-white">
                                      {formatPomodoroTime(pomodoroTimeLeft)}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={togglePomodoro}
                                    className="ml-2 bg-white text-cyan-600 hover:bg-gray-100 font-semibold shadow-md"
                                  >
                                    {isPomodoroActive ? "Pausar" : "Iniciar"}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )}
                        
                        <video
                          ref={videoRef}
                          className="block w-full h-full object-cover"
                          autoPlay
                          muted
                          playsInline
                        />

                        {isCameraActive && (
                          <WebcamCapture
                            videoRef={videoRef}
                            isAnalyzing={isAnalyzing}
                            isCameraActive={isCameraActive}
                            onFeaturesExtracted={handleFeaturesExtracted}
                            onAttentionUpdate={handleAttentionUpdate}
                            classSessionId={selectedCourse?.id ?? null}
                          />
                        )}
                        
                        {!isCameraActive && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                            <div className="text-center text-white">
                              <CameraOff className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                              <p className="text-xl">Cámara desactivada</p>
                              <p className="text-sm text-gray-400 mt-2">Activa tu cámara para comenzar</p>
                            </div>
                          </div>
                        )}
                        
                        {isCameraActive && !streamRef.current && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cyan-900 to-cyan-700">
                            <div className="text-center text-white">
                              <Camera className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                              <p className="text-xl mb-2">Cámara Activada (Modo Simulación)</p>
                              <p className="text-sm text-cyan-200">Sistema de análisis activo</p>
                            </div>
                          </div>
                        )}
                        
                        {isCameraActive && isAnalyzing && !isFeaturesExtracted && (
                          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                            <div className="text-center text-white">
                              <Brain className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                              <p className="text-xl mb-4">Extrayendo features...</p>
                              <Progress value={extractionProgress} className="w-64 mx-auto" />
                              <p className="text-sm mt-2">{extractionProgress}%</p>
                              <div className="mt-6 space-y-2 text-left max-w-xs mx-auto">
                                <div className="flex items-center gap-2">
                                  <Eye className={`w-4 h-4 ${extractionProgress >= 25 ? 'text-green-400' : 'text-gray-400'}`} />
                                  <span className={extractionProgress >= 25 ? 'text-green-400' : 'text-gray-400'}>
                                    Detección de ojos
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Smile className={`w-4 h-4 ${extractionProgress >= 50 ? 'text-green-400' : 'text-gray-400'}`} />
                                  <span className={extractionProgress >= 50 ? 'text-green-400' : 'text-gray-400'}>
                                    Detección de boca
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Activity className={`w-4 h-4 ${extractionProgress >= 75 ? 'text-green-400' : 'text-gray-400'}`} />
                                  <span className={extractionProgress >= 75 ? 'text-green-400' : 'text-gray-400'}>
                                    Análisis de expresión facial
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <User className={`w-4 h-4 ${extractionProgress >= 100 ? 'text-green-400' : 'text-gray-400'}`} />
                                  <span className={extractionProgress >= 100 ? 'text-green-400' : 'text-gray-400'}>
                                    Postura corporal
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {isCameraActive && isFeaturesExtracted && (
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-green-500 text-white px-3 py-1.5 shadow-md flex items-center gap-1.5">
                              <Activity className="w-3 h-3" />
                              <span className="font-medium">En vivo</span>
                            </Badge>
                          </div>
                        )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mt-4">
                          <Button
                            onClick={toggleCamera}
                            className={`flex-1 text-sm sm:text-base py-5 font-medium shadow-sm ${
                              isCameraActive 
                                ? "bg-red-500 hover:bg-red-600 text-white" 
                                : "bg-cyan-500 hover:bg-cyan-600 text-white"
                            }`}
                          >
                          {isCameraActive ? (
                            <>
                              <CameraOff className="w-4 h-4 mr-2" />
                              <span className="hidden sm:inline">Desactivar Cámara</span>
                              <span className="sm:hidden">Desactivar</span>
                            </>
                          ) : (
                            <>
                              <Camera className="w-4 h-4 mr-2" />
                              <span className="hidden sm:inline">Activar Cámara</span>
                              <span className="sm:hidden">Activar</span>
                            </>
                          )}
                          </Button>

                          <Button
                            onClick={isAnalyzing ? stopAnalysis : startAnalysis}
                            className="flex-1 text-sm sm:text-base py-5 font-medium shadow-sm bg-cyan-500 hover:bg-cyan-600 text-white"
                            disabled={!isCameraActive || !selectedCourse}
                          >
                          {isAnalyzing ? (
                            <>
                              <PlayCircle className="w-4 h-4 mr-2" />
                              {isFeaturesExtracted ? <span className="hidden sm:inline">Detener Análisis</span> : "Procesando..."}
                              {isFeaturesExtracted && <span className="sm:hidden">Detener</span>}
                            </>
                          ) : (
                            <>
                              <PlayCircle className="w-4 h-4 mr-2" />
                              <span className="hidden sm:inline">Iniciar Análisis</span>
                              <span className="sm:hidden">Iniciar</span>
                            </>
                          )}
                        </Button>
                      </div>

                      {!isPomodoroActive && pomodoroTimeLeft === 0 && selectedCourse && (
                        <Button
                          onClick={startNewStudySession}
                          className="mt-4 w-full text-sm sm:text-base py-5 bg-cyan-500 hover:bg-cyan-600 text-white shadow-sm font-medium"
                          disabled={!isFeaturesExtracted}
                        >
                          Iniciar nueva sesión
                        </Button>
                      )}

                      {!selectedCourse && (
                        <Alert className="mt-4 border-cyan-300 bg-cyan-50">
                          <AlertCircle className="h-4 w-4 text-cyan-600" />
                          <AlertDescription className="text-cyan-700">
                            Puedes activar la cámara, pero necesitas seleccionar un curso para iniciar el análisis.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                  )}

                  {isFeaturesExtracted && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card className="border-0 shadow-lg bg-white">
                        <CardHeader className="border-b bg-gray-50">
                          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-cyan-500" />
                            Atención en Tiempo Real
                          </CardTitle>
                          <CardDescription className="text-gray-500">Últimos 40 segundos</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={attentionHistory}>
                              <defs>
                                <linearGradient id="colorAttention" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#ff6b35" stopOpacity={0.1}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis 
                                dataKey="time" 
                                tick={{ fontSize: 12 }}
                                stroke="#6b7280"
                              />
                              <YAxis 
                                domain={[0, 100]}
                                tick={{ fontSize: 12 }}
                                stroke="#6b7280"
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#fff',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px'
                                }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="attention" 
                                stroke="#ff6b35" 
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorAttention)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {selectedCourse && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      <CourseMaterials 
                        courseId={selectedCourse.course_id}
                        onVideoSelect={(material) => setActiveVideo(material)}
                      />
                    </motion.div>
                  )}
                </div>

                <div className="space-y-6">
                  {!selectedCourse ? (
                    <Card className="border-0 shadow-lg bg-white">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="w-8 h-8 text-amber-600" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-800 mb-2">Sin curso seleccionado</h3>
                        <p className="text-sm text-gray-500 mb-6">
                          Selecciona un curso desde el Dashboard para iniciar.
                        </p>
                        <Button 
                          onClick={() => setCurrentView("dashboard")}
                          className="w-full bg-cyan-500 hover:bg-cyan-600 py-5"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Ir a Cursos
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <Card className="border-0 shadow-lg bg-white">
                        <CardHeader className="border-b bg-gray-50">
                          <CardTitle className="text-lg font-bold text-gray-800">Información de Sesión</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center py-2 border-b">
                              <span className="text-sm text-gray-600">Clase</span>
                              <span className="font-medium text-gray-800 text-sm">{selectedCourse.name}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                              <span className="text-sm text-gray-600">Profesor</span>
                              <span className="font-medium text-gray-800 text-sm">{selectedCourse.professor}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                              <span className="text-sm text-gray-600">Horario</span>
                              <span className="font-medium text-gray-800 text-sm">{selectedCourse.time}</span>
                            </div>
                          </div>
                          <div className="pt-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Cámara:</span>
                              <Badge className={isCameraActive ? "bg-green-500" : "bg-gray-400"}>
                                {isCameraActive ? "Activa" : "Inactiva"}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Features:</span>
                              <Badge className={isFeaturesExtracted ? "bg-cyan-500" : "bg-gray-400"}>
                                {isFeaturesExtracted ? "Extraídos" : "Pendiente"}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Análisis:</span>
                              <Badge className={isFeaturesExtracted ? "bg-cyan-500" : "bg-gray-400"}>
                                {isFeaturesExtracted ? "Activo" : "Inactivo"}
                              </Badge>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full mt-3 bg-cyan-500 hover:bg-cyan-600 py-4"
                            onClick={async () => {
                              if (!selectedCourse) return;
                              try {
                                const res = await api.get('/student/pomodoro-metrics/');
                                const d = res.data;
                                toast(`Eventos: ${d.total_events} · Pausas: ${d.auto_pauses} · Tiempo: ${Math.round(d.effective_seconds/60)} min`);
                              } catch (e) {
                                toast.error('Error al obtener métricas');
                              }
                            }}
                          >
                            Ver métricas
                          </Button>
                        </CardContent>
                      </Card>

                      {isFeaturesExtracted && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Card className={`border-0 shadow-lg ${
                            attentionLevel === "high" 
                              ? "bg-green-50" 
                              : attentionLevel === "medium" 
                              ? "bg-yellow-50" 
                              : "bg-red-50"
                          }`}>
                            <CardHeader className="border-b bg-white">
                              <CardTitle className="text-lg font-bold text-gray-800">Nivel de Atención</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                              <div className="text-center py-4">
                                <div className={`text-5xl font-bold mb-3 ${getAttentionColor()}`}>
                                  {attentionScore}%
                                </div>
                                <Badge 
                                  className={`text-base px-4 py-2 ${
                                    attentionLevel === "high" 
                                      ? "bg-green-500" 
                                      : attentionLevel === "medium" 
                                      ? "bg-yellow-500" 
                                      : "bg-red-500"
                                  } text-white font-medium`}
                                >
                                  {attentionLevel === "high" && "Atento"}
                                  {attentionLevel === "medium" && "Moderado"}
                                  {attentionLevel === "low" && "Distraído"}
                                </Badge>
                              </div>
                              <Progress 
                                value={attentionScore} 
                                className="mt-5 h-3"
                              />
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}

                      {showLowAttentionAlert && isFeaturesExtracted && (
                        <Alert className="border-l-4 border-l-red-500 bg-red-50 shadow-md">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800 text-sm">
                            <strong>Atención baja</strong> - Intenta concentrarte
                          </AlertDescription>
                        </Alert>
                      )}

                      {showMediumAttentionAlert && isFeaturesExtracted && (
                        <Alert className="border-l-4 border-l-yellow-500 bg-yellow-50 shadow-md">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800 text-sm">
                            <strong>Atención moderada</strong> - Mantén el enfoque
                          </AlertDescription>
                        </Alert>
                      )}

                      {autoPauseTriggered && (
                        <Alert className="border-l-4 border-l-cyan-500 bg-cyan-50 shadow-md">
                          <AlertCircle className="h-4 w-4 text-cyan-600" />
                          <AlertDescription className="text-cyan-800 text-sm">
                            <strong>Pausa automática</strong> - Distracción detectada
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}

                  <Card className="border-0 shadow-lg bg-white">
                    <CardHeader className="border-b bg-gray-50">
                      <CardTitle className="text-lg font-bold text-gray-800">Consejos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-gray-600 pt-4">
                      <div className="flex items-center gap-2 py-2 border-b">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                        <p>Mantén la cámara encendida</p>
                      </div>
                      <div className="flex items-center gap-2 py-2 border-b">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                        <p>Evita distracciones externas</p>
                      </div>
                      <div className="flex items-center gap-2 py-2 border-b">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                        <p>Mantén contacto visual</p>
                      </div>
                      <div className="flex items-center gap-2 py-2">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                        <p>Toma notas activamente</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {currentView === "stats" && (
            <div>
              <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Estadísticas</h1>
                <p className="text-sm sm:text-base text-gray-600">Tu rendimiento académico</p>
              </div>

              {/* Filtro de Período */}
              <div className="mb-6 flex flex-wrap gap-2">
                <Button
                  variant={statsPeriod === 'week' ? 'default' : 'outline'}
                  onClick={() => {
                    setStatsPeriod('week');
                    loadStatistics('week');
                  }}
                  className="text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Última Semana</span>
                  <span className="sm:hidden">Semana</span>
                </Button>
                <Button
                  variant={statsPeriod === 'month' ? 'default' : 'outline'}
                  onClick={() => {
                    setStatsPeriod('month');
                    loadStatistics('month');
                  }}
                  className="text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Último Mes</span>
                  <span className="sm:hidden">Mes</span>
                </Button>
                <Button
                  variant={statsPeriod === 'semester' ? 'default' : 'outline'}
                  onClick={() => {
                    setStatsPeriod('semester');
                    loadStatistics('semester');
                  }}
                  className="text-xs sm:text-sm"
                >
                  Semestre
                </Button>
              </div>

              {statsLoading ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  </CardContent>
                </Card>
              ) : statsData ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Tarjetas de Resumen */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Atención Promedio
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-600">
                          {statsData.summary.average_attention}%
                        </div>
                        <Progress value={statsData.summary.average_attention} className="mt-2" />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Sesiones Totales
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                          {statsData.summary.total_sessions}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">sesiones completadas</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Tiempo Total
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-purple-600">
                          {Math.floor(statsData.summary.total_minutes / 60)}h {statsData.summary.total_minutes % 60}m
                        </div>
                        <p className="text-sm text-gray-500 mt-2">de estudio</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gráfico de Timeline */}
                  {statsData.timeline.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Evolución de Atención</CardTitle>
                        <CardDescription>Últimas 50 sesiones</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={statsData.timeline}>
                            <defs>
                              <linearGradient id="colorAttention" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="timestamp" 
                              tickFormatter={(value) => {
                                const date = new Date(value);
                                return `${date.getDate()}/${date.getMonth() + 1}`;
                              }}
                            />
                            <YAxis domain={[0, 100]} />
                            <Tooltip 
                              labelFormatter={(value) => {
                                const date = new Date(value as string);
                                return date.toLocaleString();
                              }}
                              formatter={(value: number) => [`${value}%`, 'Atención']}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="attention" 
                              stroke="#3b82f6" 
                              fillOpacity={1} 
                              fill="url(#colorAttention)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* Gráfico por Hora del Día */}
                  {statsData.by_hour.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Atención por Hora del Día</CardTitle>
                        <CardDescription>Promedio de atención según la hora</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={statsData.by_hour}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="hour" 
                              tickFormatter={(hour) => `${hour}:00`}
                            />
                            <YAxis domain={[0, 100]} />
                            <Tooltip 
                              labelFormatter={(hour) => `Hora: ${hour}:00`}
                              formatter={(value: number) => [`${value}%`, 'Atención']}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="attention" 
                              stroke="#10b981" 
                              fill="#10b981" 
                              fillOpacity={0.6}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* Comparación con la Clase */}
                  {statsData.class_comparison.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Comparación con el Promedio de Clase</CardTitle>
                        <CardDescription>Tu rendimiento vs. promedio del curso</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {statsData.class_comparison.map((comp, idx) => (
                            <div key={idx} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{comp.course_name}</span>
                                <div className="flex gap-4 text-sm">
                                  <span className="text-blue-600">Tú: {comp.student_avg}%</span>
                                  <span className="text-gray-600">Clase: {comp.class_avg}%</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <Progress value={comp.student_avg} className="h-2" />
                                </div>
                                <div className="flex-1">
                                  <Progress value={comp.class_avg} className="h-2 bg-gray-200" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Métricas de Pomodoro */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Métricas Pomodoro</CardTitle>
                      <CardDescription>Tu técnica de estudio Pomodoro</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Eventos Totales</p>
                          <p className="text-2xl font-bold text-blue-600">{statsData.pomodoro_metrics.total_events}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Pausas Automáticas</p>
                          <p className="text-2xl font-bold text-orange-600">{statsData.pomodoro_metrics.auto_pauses}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Tiempo Efectivo</p>
                          <p className="text-2xl font-bold text-green-600">
                            {Math.floor(statsData.pomodoro_metrics.effective_minutes / 60)}h {statsData.pomodoro_metrics.effective_minutes % 60}m
                          </p>
                        </div>
                      </div>
                      {statsData.pomodoro_metrics.total_events > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Tasa de Éxito</span>
                            <span className="font-semibold text-green-600">
                              {Math.round(
                                ((statsData.pomodoro_metrics.total_events - statsData.pomodoro_metrics.auto_pauses) / 
                                statsData.pomodoro_metrics.total_events) * 100
                              )}%
                            </span>
                          </div>
                          <Progress 
                            value={
                              ((statsData.pomodoro_metrics.total_events - statsData.pomodoro_metrics.auto_pauses) / 
                              statsData.pomodoro_metrics.total_events) * 100
                            } 
                            className="mt-2" 
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Sin Datos</CardTitle>
                    <CardDescription>No hay estadísticas disponibles para el período seleccionado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Comienza a usar la plataforma para ver tus estadísticas aquí.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {currentView === "report" && (
            <StudentReport onBack={() => setCurrentView("dashboard")} />
          )}

          {currentView === "profile" && (
            <div>
              <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
                <p className="text-sm sm:text-base text-gray-600">Información de tu cuenta</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nombre Completo</label>
                    <p className="text-gray-900">{user ? (user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username) : '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{user ? user.email : '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">ID de Usuario</label>
                    <p className="text-gray-900">{user ? (user.user_code || `USR${String(user.id).padStart(3, '0')}`) : '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Rol</label>
                    <Badge>{user ? (user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Estudiante') : '—'}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
      
      {/* COMPONENTE MODAL PARA LA EVALUACIÓN CON IA */}
      <QuizModal 
        isOpen={isQuizOpen} 
        onClose={() => setIsQuizOpen(false)} 
        materialId={quizMaterialId} 
      />
    </div>
  );
}

export default StudentDashboard;