import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
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
  Search
} from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";

type ViewType = "dashboard" | "students" | "stats" | "profile";

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

  // Mock data - Estudiantes
  const students: Student[] = [
    {
      id: "EST001",
      name: "Juan Pérez",
      email: "juan.perez@espe.edu.ec",
      averageAttention: 87,
      lastClass: "Hace 2 horas",
      status: "high",
      sessionsAttended: 12,
      totalSessions: 15,
    },
    {
      id: "EST002",
      name: "María García",
      email: "maria.garcia@espe.edu.ec",
      averageAttention: 92,
      lastClass: "Hace 2 horas",
      status: "high",
      sessionsAttended: 14,
      totalSessions: 15,
    },
    {
      id: "EST003",
      name: "Carlos Ruiz",
      email: "carlos.ruiz@espe.edu.ec",
      averageAttention: 65,
      lastClass: "Hace 2 horas",
      status: "medium",
      sessionsAttended: 11,
      totalSessions: 15,
    },
    {
      id: "EST004",
      name: "Ana Martínez",
      email: "ana.martinez@espe.edu.ec",
      averageAttention: 78,
      lastClass: "Hace 2 horas",
      status: "medium",
      sessionsAttended: 13,
      totalSessions: 15,
    },
    {
      id: "EST005",
      name: "Pedro López",
      email: "pedro.lopez@espe.edu.ec",
      averageAttention: 45,
      lastClass: "Hace 3 días",
      status: "low",
      sessionsAttended: 8,
      totalSessions: 15,
    },
    {
      id: "EST006",
      name: "Laura Sánchez",
      email: "laura.sanchez@espe.edu.ec",
      averageAttention: 89,
      lastClass: "Hace 2 horas",
      status: "high",
      sessionsAttended: 15,
      totalSessions: 15,
    },
    {
      id: "EST007",
      name: "Diego Torres",
      email: "diego.torres@espe.edu.ec",
      averageAttention: 58,
      lastClass: "Hace 1 día",
      status: "medium",
      sessionsAttended: 10,
      totalSessions: 15,
    },
    {
      id: "EST008",
      name: "Sofia Ramírez",
      email: "sofia.ramirez@espe.edu.ec",
      averageAttention: 94,
      lastClass: "Hace 2 horas",
      status: "high",
      sessionsAttended: 15,
      totalSessions: 15,
    },
  ];

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
    students.reduce((acc, student) => acc + student.averageAttention, 0) / students.length
  );

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
                      <span className="text-blue-600">{students.length}</span>
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
                      <span className="text-green-600">{averageClassAttention}%</span>
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
                      <span className="text-blue-600">15</span>
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

          {/* Students View */}
          {currentView === "students" && (
            <div>
              <div className="mb-8">
                <h1 className="text-gray-900 mb-2">Lista de Estudiantes</h1>
                <p className="text-gray-600">Gestión y seguimiento individual</p>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre, email o ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Students Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm text-gray-600">ID</th>
                          <th className="px-6 py-4 text-left text-sm text-gray-600">Estudiante</th>
                          <th className="px-6 py-4 text-left text-sm text-gray-600">Email</th>
                          <th className="px-6 py-4 text-left text-sm text-gray-600">Atención Promedio</th>
                          <th className="px-6 py-4 text-left text-sm text-gray-600">Asistencia</th>
                          <th className="px-6 py-4 text-left text-sm text-gray-600">Estado</th>
                          <th className="px-6 py-4 text-left text-sm text-gray-600">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900">{student.id}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm">
                                  {student.name.charAt(0)}
                                </div>
                                <span className="text-sm text-gray-900">{student.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                            <td className="px-6 py-4">
                              <span className={`${getAttentionColor(student.averageAttention)}`}>
                                {student.averageAttention}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {student.sessionsAttended}/{student.totalSessions}
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={getStatusColor(student.status)}>
                                {student.status === "high" && "Alto"}
                                {student.status === "medium" && "Medio"}
                                {student.status === "low" && "Bajo"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openStudentDetails(student)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver detalles
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                    <p className="text-gray-900">Prof. María García</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="text-gray-900">maria.garcia@espe.edu.ec</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">ID de Usuario</label>
                    <p className="text-gray-900">DOC001</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Rol</label>
                    <Badge>Docente</Badge>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Departamento</label>
                    <p className="text-gray-900">Ciencias de la Computación</p>
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
