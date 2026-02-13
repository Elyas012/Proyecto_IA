import { useState, useEffect } from "react";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import CourseMaterialUpload from "../components/CourseMaterialUpload";
import CourseMaterials from "../components/CourseMaterials";
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  User, 
  LogOut,
  TrendingUp,
  TrendingDown,
  Calendar,
  BookOpen,
  Eye,
  Filter,
  Search,
  Upload,
  Menu,
  X,
  Brain,
  ChevronLeft,
  ChevronRight,
  Settings,
  Clock
} from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";

type ViewType = "dashboard" | "students" | "stats" | "profile" | "materials" | "pomodoro-config";

interface Student {
  id: string;
  name: string;
  email: string;
  averageAttention: number;
  lastClass: string;
  status: "high" | "medium" | "low";
  sessionsAttended: number;
  totalSessions: number;
}

interface AttentionHistory {
  date: string;
  attention: number;
}

interface TeacherDashboardProps {
  onLogout?: () => void;
}

export function TeacherDashboard({ onLogout }: TeacherDashboardProps) {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedDate, setSelectedDate] = useState("week");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [selectedCourseForMaterials, setSelectedCourseForMaterials] = useState<number | null>(null);
  const [materialChangeCounter, setMaterialChangeCounter] = useState(0); // Added for re-rendering materials
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [teacherProfile, setTeacherProfile] = useState<{
    id?: number;
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    user_code?: string;
    name?: string;
  } | null>(null);
  const [overview, setOverview] = useState<{ total_students: number; total_classes: number; average_attention: number } | null>(null);

  // Pomodoro Configuration State
  const [pomodoroConfig, setPomodoroConfig] = useState({
    initial_work_duration: 5,
    short_break_duration: 2,
    long_break_duration: 5,
    attention_threshold: 85,
    time_extension: 3,
    max_work_duration: 20,
    cycles_before_reset: 4,
    distraction_tolerance_seconds: 30,
    low_attention_threshold: 50,
  });
  const [selectedCourseForConfig, setSelectedCourseForConfig] = useState<number | null>(null);
  const [teacherCourses, setTeacherCourses] = useState<any[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);

  // Cargar perfil del docente y estudiantes desde la API
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        setToken(token);
        // Perfil autoritativo desde el backend (MySQL)
        const meResp = await api.get('/auth/me/');
        setTeacherProfile(meResp.data);

        // Overview: números agregados (clases, estudiantes, atención promedio)
        const ov = await api.get('/teacher/overview/');
        setOverview(ov.data);

        // Lista de estudiantes detallada
        const response = await api.get('/teacher/students/');
        setStudents(response.data);
      } catch (error) {
        console.error('Error loading teacher data:', error);
        // Fallback a datos estáticos si hay error
        setStudents([]);
      }
    };
    loadData();
  }, []);

  // Mock data - Distribución de atención del grupo
  const attentionDistribution = [
    { name: "Alta (80-100%)", value: 4, color: "#22c55e" },
    { name: "Media (50-79%)", value: 3, color: "#eab308" },
    { name: "Baja (0-49%)", value: 1, color: "#ef4444" },
  ];

  // Mock data - Atención promedio por clase
  const classAttentionData = [
    { clase: "Algoritmos", promedio: 78 },
    { clase: "Bases Datos", promedio: 85 },
    { clase: "Redes", promedio: 72 },
    { clase: "IA", promedio: 81 },
    { clase: "Web", promedio: 88 },
  ];

  // Mock data - Evolución semanal
  const weeklyEvolution = [
    { day: "Lun", attention: 75 },
    { day: "Mar", attention: 78 },
    { day: "Mié", attention: 82 },
    { day: "Jue", attention: 80 },
    { day: "Vie", attention: 85 },
  ];

  // Mock data - Historial individual (para diálogo de detalles)
  const studentHistory: AttentionHistory[] = [
    { date: "2025-10-17", attention: 82 },
    { date: "2025-10-18", attention: 85 },
    { date: "2025-10-19", attention: 78 },
    { date: "2025-10-20", attention: 88 },
    { date: "2025-10-21", attention: 90 },
    { date: "2025-10-22", attention: 87 },
    { date: "2025-10-23", attention: 92 },
  ];

  const getStatusColor = (status: string) => {
    if (status === "high") return "text-green-600 bg-green-100";
    if (status === "medium") return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getAttentionColor = (attention: number) => {
    if (attention >= 80) return "text-green-600";
    if (attention >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const openStudentDetails = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailDialog(true);
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const averageClassAttention = Math.round(
    students.reduce((acc, student) => acc + student.averageAttention, 0) / (students.length || 1)
  );

  const [sessions, setSessions] = useState<any[]>([]);
  
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const resp = await api.get('/teacher/class-sessions/');
        setSessions(resp.data);
        const byCourse: Record<number, any> = {};
        resp.data.forEach((s: any) => {
          if (!byCourse[s.course.id]) byCourse[s.course.id] = s.course;
        });
        setTeacherCourses(Object.values(byCourse));
      } catch (e) {
        console.error(e);
      }
    };
    loadSessions();
  }, []);

  // Load Pomodoro Configuration
  const loadPomodoroConfig = async (courseId: number) => {
    setConfigLoading(true);
    try {
      const response = await api.get(`/teacher/pomodoro-config/?course_id=${courseId}`);
      setPomodoroConfig(response.data);
    } catch (error) {
      console.error('Error loading pomodoro config:', error);
    } finally {
      setConfigLoading(false);
    }
  };

  // Save Pomodoro Configuration
  const savePomodoroConfig = async () => {
    if (!selectedCourseForConfig) {
      alert('Selecciona un curso primero');
      return;
    }
    setConfigSaving(true);
    try {
      await api.post('/teacher/pomodoro-config/', {
        course_id: selectedCourseForConfig,
        ...pomodoroConfig
      });
      alert('✅ Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving pomodoro config:', error);
      alert('❌ Error al guardar la configuración');
    } finally {
      setConfigSaving(false);
    }
  };

  useEffect(() => {
    if (selectedCourseForConfig) {
      loadPomodoroConfig(selectedCourseForConfig);
    }
  }, [selectedCourseForConfig]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-[#1a1a1a] text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">FocusLearn</h2>
            <p className="text-gray-500 text-xs">Panel Docente</p>
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
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">FocusLearn</h2>
                <p className="text-gray-500 text-xs">Panel Docente</p>
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
                  ? "bg-gray-800 text-white border-l-4 border-orange-500" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent"
              }`}
              title="Dashboard"
            >
              <LayoutDashboard className={`w-5 h-5 flex-shrink-0 ${
                currentView === "dashboard" ? "text-orange-500" : "group-hover:text-orange-500"
              }`} />
              <span className={`${isSidebarCollapsed ? 'hidden' : 'block'} text-sm font-medium`}>Dashboard</span>
            </button>

            <button
              onClick={() => {
                setCurrentView("students");
                setIsMobileMenuOpen(false);
                if (isSidebarCollapsed) setIsSidebarCollapsed(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 group ${
                currentView === "students" 
                  ? "bg-gray-800 text-white border-l-4 border-orange-500" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent"
              }`}
              title="Estudiantes"
            >
              <Users className={`w-5 h-5 flex-shrink-0 ${
                currentView === "students" ? "text-orange-500" : "group-hover:text-orange-500"
              }`} />
              <span className={`${isSidebarCollapsed ? 'hidden' : 'block'} text-sm font-medium`}>Estudiantes</span>
            </button>

            <button
              onClick={() => {
                setCurrentView("stats");
                setIsMobileMenuOpen(false);
                if (isSidebarCollapsed) setIsSidebarCollapsed(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 group ${
                currentView === "stats" 
                  ? "bg-gray-800 text-white border-l-4 border-orange-500" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent"
              }`}
              title="Estadísticas"
            >
              <BarChart3 className={`w-5 h-5 flex-shrink-0 ${
                currentView === "stats" ? "text-orange-500" : "group-hover:text-orange-500"
              }`} />
              <span className={`${isSidebarCollapsed ? 'hidden' : 'block'} text-sm font-medium`}>Estadísticas</span>
            </button>

            <button
              onClick={() => {
                setCurrentView("materials");
                setIsMobileMenuOpen(false);
                if (isSidebarCollapsed) setIsSidebarCollapsed(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 group ${
                currentView === "materials"
                  ? "bg-gray-800 text-white border-l-4 border-orange-500"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent"
              }`}
              title="Materiales"
            >
              <Upload className={`w-5 h-5 flex-shrink-0 ${
                currentView === "materials" ? "text-orange-500" : "group-hover:text-orange-500"
              }`} />
              <span className={`${isSidebarCollapsed ? 'hidden' : 'block'} text-sm font-medium`}>Materiales</span>
            </button>

            <button
              onClick={() => {
                setCurrentView("pomodoro-config");
                setIsMobileMenuOpen(false);
                if (isSidebarCollapsed) setIsSidebarCollapsed(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 group ${
                currentView === "pomodoro-config"
                  ? "bg-gray-800 text-white border-l-4 border-orange-500"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent"
              }`}
              title="Config. Pomodoro"
            >
              <Clock className={`w-5 h-5 flex-shrink-0 ${
                currentView === "pomodoro-config" ? "text-orange-500" : "group-hover:text-orange-500"
              }`} />
              <span className={`${isSidebarCollapsed ? 'hidden' : 'block'} text-sm font-medium`}>Config. Pomodoro</span>
            </button>

            <button
              onClick={() => {
                setCurrentView("profile");
                setIsMobileMenuOpen(false);
                if (isSidebarCollapsed) setIsSidebarCollapsed(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 group ${
                currentView === "profile" 
                  ? "bg-gray-800 text-white border-l-4 border-orange-500" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent"
              }`}
              title="Mi Perfil"
            >
              <User className={`w-5 h-5 flex-shrink-0 ${
                currentView === "profile" ? "text-orange-500" : "group-hover:text-orange-500"
              }`} />
              <span className={`${isSidebarCollapsed ? 'hidden' : 'block'} text-sm font-medium`}>Mi Perfil</span>
            </button>
          </nav>

          {/* Divider */}
          <div className="my-4 border-t border-gray-800"></div>

          <div className="mt-auto pt-4">
            <button 
              onClick={() => {
                onLogout?.();
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

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Dashboard View */}
          {currentView === "dashboard" && (
            <div>
              <div className="mb-6 sm:mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">Dashboard del Docente</h1>
                <p className="text-sm sm:text-base text-gray-600">Resumen general de la atención estudiantil</p>
                {teacherProfile && (
                  <div className="mt-3 text-xs sm:text-sm text-gray-700">
                    <strong>{teacherProfile.name}</strong> — <span className="text-gray-500">{teacherProfile.email}</span>
                  </div>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-gray-500" />
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Seleccionar clase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las clases</SelectItem>
                      <SelectItem value="algorithms">Algoritmos</SelectItem>
                      <SelectItem value="databases">Bases de Datos</SelectItem>
                      <SelectItem value="networks">Redes</SelectItem>
                      <SelectItem value="ai">Inteligencia Artificial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Hoy</SelectItem>
                      <SelectItem value="week">Esta semana</SelectItem>
                      <SelectItem value="month">Este mes</SelectItem>
                      <SelectItem value="semester">Este semestre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Total Estudiantes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-orange-600">{overview ? overview.total_students : students.length}</span>
                      <Users className="w-8 h-8 text-orange-600" />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Activos</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Atención Promedio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-green-600">{overview ? overview.average_attention + '%' : averageClassAttention + '%'}</span>
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Esta semana</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Clases Impartidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-amber-600">{overview ? overview.total_classes : 15}</span>
                      <BookOpen className="w-8 h-8 text-amber-600" />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Este mes</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Alertas Atención</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-red-600">3</span>
                      <TrendingDown className="w-8 h-8 text-red-600" />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Requieren seguimiento</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Bar Chart */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-orange-700">Atención Promedio por Clase</CardTitle>
                    <CardDescription>Comparación entre materias</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={classAttentionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="clase" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="promedio" fill="#ea580c" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Pie Chart */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-orange-700">Distribución de Niveles de Atención</CardTitle>
                    <CardDescription>Clasificación del grupo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={attentionDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {attentionDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Weekly Evolution Chart */}
              <Card className="mb-8 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-orange-700">Evolución Semanal de Atención</CardTitle>
                  <CardDescription>Tendencia del grupo durante la semana</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={weeklyEvolution}>
                      <defs>
                        <linearGradient id="colorWeekly" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ea580c" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ea580c" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
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
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorWeekly)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Students Preview */}
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-orange-700">Estudiantes Destacados</CardTitle>
                      <CardDescription>Top 3 con mejor atención</CardDescription>
                    </div>
                    <Button onClick={() => setCurrentView("students")} variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                      Ver todos
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {students
                      .sort((a, b) => b.averageAttention - a.averageAttention)
                      .slice(0, 3)
                      .map((student, index) => (
                        <div 
                          key={student.id}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold shadow-md">
                              #{index + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-600">{student.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${getAttentionColor(student.averageAttention)}`}>
                              {student.averageAttention}%
                            </p>
                            <p className="text-sm text-gray-500">Atención promedio</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Students View (TABLA ACTUALIZADA) */}
          {currentView === "students" && (
            <section className="mt-8 bg-white shadow-lg rounded-lg p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
                  Lista de Estudiantes
                </h2>
                <p className="text-sm text-gray-500">
                  Gestión y seguimiento individual.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gradient-to-r from-orange-50 to-amber-50">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold text-orange-700">ID</th>
                      <th className="px-3 py-3 text-left font-semibold text-orange-700">Estudiante</th>
                      <th className="px-3 py-3 text-left font-semibold text-orange-700">% Atención</th>
                      <th className="px-3 py-3 text-left font-semibold text-orange-700">Asistencia</th>
                      <th className="px-3 py-3 text-left font-semibold text-orange-700">Estado</th>
                      <th className="px-3 py-3 text-left font-semibold text-orange-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-orange-50 transition-colors">
                        <td className="px-3 py-3 text-xs text-gray-500">{student.id}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-xs font-semibold text-white shadow-sm">
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {student.name}
                              </p>
                              <p className="text-xs text-gray-500">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-gray-900">
                          {student.averageAttention}%
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-900">
                          {student.sessionsAttended}/{student.totalSessions}
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <Badge className={getStatusColor(student.status)}>
                            {student.status === "high" && "Alto"}
                            {student.status === "medium" && "Medio"}
                            {student.status === "low" && "Bajo"}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <button 
                            className="text-orange-600 hover:text-orange-800 font-medium transition-colors"
                            onClick={() => openStudentDetails(student)}
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Stats View */}
          {currentView === "stats" && (
            <div className="animate-in slide-in-from-bottom-5 duration-500">
              <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">Análisis del Grupo</h1>
                <p className="text-gray-600">Rendimiento comparativo de los estudiantes</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Ranking de Atención */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-orange-700">Ranking de Atención</CardTitle>
                    <CardDescription>Estudiantes con mejor promedio</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        layout="vertical" 
                        data={[...students].sort((a,b) => b.averageAttention - a.averageAttention).slice(0, 7)}
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} />
                        <Tooltip />
                        <Bar dataKey="averageAttention" fill="#ea580c" radius={[0, 4, 4, 0]} name="% Atención" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Relación Asistencia vs Atención */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-orange-700">Asistencia vs. Atención</CardTitle>
                    <CardDescription>Correlación entre participación y enfoque</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[...students].sort((a,b) => a.sessionsAttended - b.sessionsAttended)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="sessionsAttended" name="Sesiones" />
                        <YAxis domain={[0, 100]} name="% Atención" />
                        <Tooltip labelFormatter={(v) => `Sesiones: ${v}`} />
                        <Legend />
                        <Line type="monotone" dataKey="averageAttention" stroke="#ea580c" strokeWidth={2} dot={{r:4}} name="Atención Promedio" />
                      </LineChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-center mt-2 text-gray-500">Eje X: Clases Asistidas | Eje Y: % Atención</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Materials View */}
          {currentView === "materials" && (
            <div>
              <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">Gestión de Materiales</h1>
                <p className="text-gray-600">Sube y gestiona los materiales para tus cursos</p>
              </div>

              <div className="flex items-center space-x-2 mb-8">
                <BookOpen className="w-5 h-5 text-orange-600" />
                <Select
                  onValueChange={(value) => setSelectedCourseForMaterials(parseInt(value))}
                >
                  <SelectTrigger className="w-96 bg-white border-orange-200 focus:ring-orange-500">
                    <SelectValue placeholder="Selecciona un curso para gestionar sus materiales" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherCourses.map((course: any) => (
                      <SelectItem key={course.id} value={String(course.id)}>
                        {course.name} ({course.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCourseForMaterials && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <CourseMaterialUpload
                      courseId={selectedCourseForMaterials}
                      token={token}
                      onUploadSuccess={() => {
                        // Force a re-render of CourseMaterials by changing the key or resetting state
                        const current = selectedCourseForMaterials;
                        setSelectedCourseForMaterials(null);
                        setTimeout(() => setSelectedCourseForMaterials(current), 50);
                      }}
                    />
                  </div>
                  <div>
                    <CourseMaterials
                      key={selectedCourseForMaterials ? `${selectedCourseForMaterials}-${materialChangeCounter}` : 'no-course'} // Re-mount when course changes or materials are modified
                      courseId={selectedCourseForMaterials}
                      token={token}
                      isTeacherView={true} // Enable teacher view
                      onMaterialChange={() => setMaterialChangeCounter(prev => prev + 1)} // Callback to trigger re-fetch
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile View */}
          {currentView === "profile" && (
            <div>
              <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">Mi Perfil</h1>
                <p className="text-gray-600">Información de tu cuenta</p>
              </div>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-orange-700">Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nombre Completo</label>
                    <p className="text-lg text-gray-900 font-semibold">{(
                          (teacherProfile &&
                            `${teacherProfile.first_name || ''} ${teacherProfile.last_name || ''}`.trim()) ||
                          teacherProfile?.username ||
                          '—'
                        )}
                      </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-lg text-gray-900">{teacherProfile?.email || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">ID de Usuario</label>
                    <p className="text-lg text-gray-900">{teacherProfile?.user_code || `USR${String(teacherProfile?.id || '').padStart(3,'0')}` || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Rol</label>
                    <Badge className="bg-orange-500">{(teacherProfile?.role || 'Docente').charAt(0).toUpperCase() + (teacherProfile?.role || 'Docente').slice(1)}</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Departamento</label>
                    <p className="text-lg text-gray-900">Docencia</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pomodoro Configuration View */}
          {currentView === "pomodoro-config" && (
            <div>
              <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
                  <Clock className="w-8 h-8 inline-block mr-2" />
                  Configuración Pomodoro Adaptativo
                </h1>
                <p className="text-gray-600">Personaliza los parámetros del sistema Pomodoro para tus cursos</p>
              </div>

              {/* Course Selector */}
              <Card className="mb-6 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-orange-700">1. Selecciona un Curso</CardTitle>
                  <CardDescription>Elige el curso que deseas configurar</CardDescription>
                </CardHeader>
                <CardContent>
                  {teacherCourses.length > 0 ? (
                    <Select value={selectedCourseForConfig?.toString() || ""} onValueChange={(val) => setSelectedCourseFor Config(parseInt(val))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un curso..." />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherCourses.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.code} - {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-gray-500">No tienes cursos asignados aún</p>
                  )}
                </CardContent>
              </Card>

              {/* Configuration Form */}
              {selectedCourseForConfig && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Duraciones Básicas */}
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-orange-700">⏱️ Duraciones Básicas</CardTitle>
                      <CardDescription>Tiempos iniciales para trabajo y descansos</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Duración Inicial de Trabajo (minutos)
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="60"
                          value={pomodoroConfig.initial_work_duration}
                          onChange={(e) => setPomodoroConfig({...pomodoroConfig, initial_work_duration: parseInt(e.target.value) || 5})}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">Valor por defecto: 5 minutos</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Duración Descanso Corto (minutos)
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="30"
                          value={pomodoroConfig.short_break_duration}
                          onChange={(e) => setPomodoroConfig({...pomodoroConfig, short_break_duration: parseInt(e.target.value) || 2})}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">Valor por defecto: 2 minutos</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Duración Descanso Largo (minutos)
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="60"
                          value={pomodoroConfig.long_break_duration}
                          onChange={(e) => setPomodoroConfig({...pomodoroConfig, long_break_duration: parseInt(e.target.value) || 5})}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">Valor por defecto: 5 minutos</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Configuración Adaptativa */}
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-orange-700">🎯 Sistema Adaptativo</CardTitle>
                      <CardDescription>Parámetros para recompensas por atención</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Umbral de Atención (%)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={pomodoroConfig.attention_threshold}
                          onChange={(e) => setPomodoroConfig({...pomodoroConfig, attention_threshold: parseInt(e.target.value) || 85})}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">Atención mínima para ganar tiempo extra. Defecto: 85%</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Extensión de Tiempo (minutos)
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="15"
                          value={pomodoroConfig.time_extension}
                          onChange={(e) => setPomodoroConfig({...pomodoroConfig, time_extension: parseInt(e.target.value) || 3})}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">Minutos adicionales por buena atención. Defecto: 3 min</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Duración Máxima (minutos)
                        </label>
                        <Input
                          type="number"
                          min="5"
                          max="60"
                          value={pomodoroConfig.max_work_duration}
                          onChange=(e) => setPomodoroConfig({...pomodoroConfig, max_work_duration: parseInt(e.target.value) || 20})}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">Tiempo máximo con extensiones. Defecto: 20 min</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Ciclos Antes de Reset
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={pomodoroConfig.cycles_before_reset}
                          onChange={(e) => setPomodoroConfig({...pomodoroConfig, cycles_before_reset: parseInt(e.target.value) || 4})}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">Ciclos antes de volver a duración inicial. Defecto: 4 (0=nunca)</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Configuración de Distracciones */}
                  <Card className="shadow-lg lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-orange-700">⚠️ Control de Distracciones</CardTitle>
                      <CardDescription>Parámetros para detección y manejo de distracciones</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Tolerancia en Descanso (segundos)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="120"
                          value={pomodoroConfig.distraction_tolerance_seconds}
                          onChange={(e) => setPomodoroConfig({...pomodoroConfig, distraction_tolerance_seconds: parseInt(e.target.value) || 30})}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">Segundos permitidos de distracción en pausas. Defecto: 30s</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Umbral Atención Baja (%)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={pomodoroConfig.low_attention_threshold}
                          onChange={(e) => setPomodoroConfig({...pomodoroConfig, low_attention_threshold: parseInt(e.target.value) || 50})}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">Atención mínima para que el tiempo corra. Defecto: 50%</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Save Button */}
                  <div className="lg:col-span-2">
                    <Card className="shadow-lg bg-gradient-to-r from-orange-50 to-amber-50">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-1">¿Listo para guardar?</h3>
                            <p className="text-sm text-gray-600">Los cambios se aplicarán inmediatamente para todos los estudiantes</p>
                          </div>
                          <Button 
                            onClick={savePomodoroConfig}
                            disabled={configSaving}
                            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-6 text-lg font-semibold shadow-lg"
                          >
                            {configSaving ? 'Guardando...' : '💾 Guardar Configuración'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {!selectedCourseForConfig && (
                <Card className="shadow-lg">
                  <CardContent className="p-12 text-center">
                    <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Selecciona un curso para configurar</h3>
                    <p className="text-gray-500">Elige un curso del menú superior para personalizar su configuración Pomodoro</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Student Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Estudiante</DialogTitle>
            <DialogDescription>
              Análisis detallado de {selectedStudent?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                <div>
                  <p className="text-sm font-medium text-gray-600">ID</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedStudent.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-lg text-gray-900">{selectedStudent.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Atención Promedio</p>
                  <p className={`text-lg font-bold ${getAttentionColor(selectedStudent.averageAttention)}`}>
                    {selectedStudent.averageAttention}%
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Asistencia</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedStudent.sessionsAttended}/{selectedStudent.totalSessions}
                  </p>
                </div>
              </div>

              {/* Evolution Chart */}
              <div>
                <h3 className="text-xl font-semibold text-orange-700 mb-4">Evolución del Nivel de Atención</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={studentHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(date) => {
                        const d = new Date(date);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(date) => {
                        const d = new Date(date);
                        return d.toLocaleDateString('es-ES');
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="attention" 
                      stroke="#ea580c" 
                      strokeWidth={3}
                      dot={{ fill: '#ea580c', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Recommendations */}
              <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                <h3 className="text-lg font-semibold text-orange-700 mb-2">💡 Recomendaciones</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• El estudiante muestra una tendencia positiva en su atención</li>
                  <li>• Se recomienda mantener el seguimiento continuo</li>
                  <li>• Considerar incentivos por el buen desempeño</li>
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TeacherDashboard;