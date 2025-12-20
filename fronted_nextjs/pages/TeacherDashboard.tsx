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
  Upload
} from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";

type ViewType = "dashboard" | "students" | "stats" | "profile" | "materials";

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
  const [teacherCourses, setTeacherCourses] = useState<any[]>([]);
  
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6 shadow-xl">
          <div className="mb-8">
            <h2 className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">FocusLearn</h2>
            <p className="text-gray-400 text-sm mt-1">Panel Docente</p>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setCurrentView("dashboard")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === "dashboard" 
                  ? "bg-blue-500 text-white" 
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentView("students")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === "students" 
                  ? "bg-blue-500 text-white" 
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Estudiantes</span>
            </button>

            <button
              onClick={() => setCurrentView("stats")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === "stats" 
                  ? "bg-blue-500 text-white" 
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Estadísticas</span>
            </button>

            <button
              onClick={() => setCurrentView("materials")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === "materials"
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <Upload className="w-5 h-5" />
              <span>Materiales</span>
            </button>

            <button
              onClick={() => setCurrentView("profile")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === "profile" 
                  ? "bg-blue-500 text-white" 
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <User className="w-5 h-5" />
              <span>Mi Perfil</span>
            </button>
          </nav>

          <div className="mt-auto pt-8">
            <Separator className="mb-4 bg-gray-700" />
            <button 
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Dashboard View */}
          {currentView === "dashboard" && (
            <div>
              <div className="mb-8">
                <h1 className="text-gray-900 mb-2">Dashboard del Docente</h1>
                <p className="text-gray-600">Resumen general de la atención estudiantil</p>
                {teacherProfile && (
                  <div className="mt-3 text-sm text-gray-700">
                    <strong>{teacherProfile.name}</strong> — <span className="text-gray-500">{teacherProfile.email}</span>
                  </div>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-8">
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Total Estudiantes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-600">{overview ? overview.total_students : students.length}</span>
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Activos</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Atención Promedio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-green-600">{overview ? overview.average_attention + '%' : averageClassAttention + '%'}</span>
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Esta semana</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Clases Impartidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-600">{overview ? overview.total_classes : 15}</span>
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Este mes</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Alertas Atención</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-red-600">3</span>
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Requieren seguimiento</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Atención Promedio por Clase</CardTitle>
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
                        <Bar dataKey="promedio" fill="#ff6b35" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de Niveles de Atención</CardTitle>
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
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Evolución Semanal de Atención</CardTitle>
                  <CardDescription>Tendencia del grupo durante la semana</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={weeklyEvolution}>
                      <defs>
                        <linearGradient id="colorWeekly" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ff6b35" stopOpacity={0.1}/>
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
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Estudiantes Destacados</CardTitle>
                      <CardDescription>Top 3 con mejor atención</CardDescription>
                    </div>
                    <Button onClick={() => setCurrentView("students")} variant="outline">
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
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-orange-200"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                              #{index + 1}
                            </div>
                            <div>
                              <p className="text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-600">{student.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`${getAttentionColor(student.averageAttention)}`}>
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
            <section className="mt-8 bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Lista de Estudiantes
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Gestión y seguimiento individual.
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">ID</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Estudiante</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">% Atención</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Asistencia</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Estado</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td className="px-3 py-2 text-xs text-gray-500">{student.id}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-900">
                                {student.name}
                              </p>
                              <p className="text-xs text-gray-500">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-900">
                          {student.averageAttention}%
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-900">
                          {student.sessionsAttended}/{student.totalSessions}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <Badge className={getStatusColor(student.status)}>
                            {student.status === "high" && "Alto"}
                            {student.status === "medium" && "Medio"}
                            {student.status === "low" && "Bajo"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <button 
                            className="text-indigo-600 hover:text-indigo-800 font-medium"
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
            <div>
              <div className="mb-8">
                <h1 className="text-gray-900 mb-2">Estadísticas Avanzadas</h1>
                <p className="text-gray-600">Análisis detallado del rendimiento</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Análisis por Período</CardTitle>
                    <CardDescription>Próximamente</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Gráficos comparativos entre diferentes períodos académicos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Correlaciones</CardTitle>
                    <CardDescription>Próximamente</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Relación entre atención y rendimiento académico
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Materials View */}
          {currentView === "materials" && (
            <div>
              <div className="mb-8">
                <h1 className="text-gray-900 mb-2">Gestión de Materiales</h1>
                <p className="text-gray-600">Sube y gestiona los materiales para tus cursos</p>
              </div>

              <div className="flex items-center space-x-2 mb-8">
                <BookOpen className="w-5 h-5 text-gray-500" />
                <Select
                  onValueChange={(value) => setSelectedCourseForMaterials(parseInt(value))}
                >
                  <SelectTrigger className="w-96 bg-white">
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
                <h1 className="text-gray-900 mb-2">Mi Perfil</h1>
                <p className="text-gray-600">Información de tu cuenta</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">Nombre Completo</label>
                    <p className="text-gray-900">{(
                          (teacherProfile &&
                            `${teacherProfile.first_name || ''} ${teacherProfile.last_name || ''}`.trim()) ||
                          teacherProfile?.username ||
                          '—'
                        )}
                      </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="text-gray-900">{teacherProfile?.email || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">ID de Usuario</label>
                    <p className="text-gray-900">{teacherProfile?.user_code || `USR${String(teacherProfile?.id || '').padStart(3,'0')}` || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Rol</label>
                    <Badge>{(teacherProfile?.role || 'Docente').charAt(0).toUpperCase() + (teacherProfile?.role || 'Docente').slice(1)}</Badge>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Departamento</label>
                    <p className="text-gray-900">Docencia</p>
                  </div>
                </CardContent>
              </Card>
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
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">ID</p>
                  <p className="text-gray-900">{selectedStudent.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-900">{selectedStudent.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Atención Promedio</p>
                  <p className={getAttentionColor(selectedStudent.averageAttention)}>
                    {selectedStudent.averageAttention}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Asistencia</p>
                  <p className="text-gray-900">
                    {selectedStudent.sessionsAttended}/{selectedStudent.totalSessions}
                  </p>
                </div>
              </div>

              {/* Evolution Chart */}
              <div>
                <h3 className="text-gray-900 mb-4">Evolución del Nivel de Atención</h3>
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
                      stroke="#ff6b35" 
                      strokeWidth={3}
                      dot={{ fill: '#ff6b35', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Recommendations */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-gray-900 mb-2">💡 Recomendaciones</h3>
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