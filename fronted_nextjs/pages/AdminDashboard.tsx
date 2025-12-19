import { useState, useEffect } from "react";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Alert, AlertDescription } from "../components/ui/alert";
import { 
  Home,
  Users, 
  GraduationCap,
  BarChart3, 
  Settings,
  LogOut,
  Bell,
  UserPlus,
  UserX,
  Edit,
  Search,
  TrendingUp,
  Activity,
  Clock,
  AlertCircle,
  Shield
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner"; // Opcional: si usas sonner para notificaciones, si no, usa alert o console

type ViewType = "overview" | "users" | "sessions" | "stats" | "config";

type ActiveSession = {
  id: number;
  className: string;
  teacher: string;
  studentsCount: number;
  startTime: string;
  averageAttention: number;
};

type Course = {
  id: number;
  code: string;
  name: string;
  description: string;
  created_at: string;
};

interface User {
  id: number;              // ahora numérico
  userCode: string;
  name: string;
  email: string;
  role: "Student" | "Teacher" | "Admin";
  status: "active" | "inactive";
  lastConnection: string;
  registrationDate: string;
}

interface AdminDashboardProps {
  onLogout?: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState<ViewType>("overview");
  const [searchQuery, setSearchQuery] = useState("");

  // datos principales
  const [users, setUsers] = useState<User[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // dialogs / ui
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);

  // nuevo curso
  const [newCourse, setNewCourse] = useState({
    code: "",
    name: "",
    description: "",
  });

  // selección por curso
  const [selectedTeacherByCourse, setSelectedTeacherByCourse] = useState<
    Record<number, string | number>
  >({});
  const [selectedStudentByCourse, setSelectedStudentByCourse] = useState<
    Record<number, string | number>
  >({});

  console.log("USERS ADMIN:", users);

  // derivados de usuarios
  const teachers = users.filter((u) => u.role === "Teacher");
  const students = users.filter((u) => u.role === "Student");


  // carga inicial
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        const [usersRes, sessionsRes] = await Promise.all([
          api.get("/admin/users/"),
          api.get("/admin/active-sessions/"),
        ]);
        setUsers(usersRes.data);
        setActiveSessions(sessionsRes.data);

        const coursesRes = await api.get("/admin/courses/");
        setCourses(coursesRes.data);
      } catch (error) {
        console.error("Error loading admin data:", error);
      }
    };
    loadData();
  }, []);

  // crear curso
  const handleCreateCourse = async () => {
    if (!newCourse.code || !newCourse.name) return;
    try {
      const resp = await api.post("/admin/courses/", newCourse);
      setCourses((prev) => [...prev, resp.data]);
      setNewCourse({ code: "", name: "", description: "" });
      toast.success("Curso creado exitosamente");
    } catch (e) {
      console.error("Error creating course", e);
      toast.error("Error al crear curso");
    }
  };

  // asignar profesor
  const handleAssignTeacher = async (courseId: number) => {
    const teacherId = selectedTeacherByCourse[courseId];
    if (!teacherId) return;
    try {
      await api.post("/admin/assign-teacher/", {
        course_id: courseId,
        teacher_id: teacherId,
      });
      toast.success("Profesor asignado correctamente");
      setSelectedTeacherByCourse((prev) => ({ ...prev, [courseId]: "" }));
    } catch (e) {
      console.error(e);
      toast.error("Error al asignar profesor");
    }
  };

  // matricular estudiante
  const handleEnrollStudent = async (courseId: number) => {
    const studentId = selectedStudentByCourse[courseId];
    if (!studentId) return;
    try {
      await api.post("/admin/enroll-student/", {
        course_id: courseId,
        student_id: studentId,
      });
      toast.success("Estudiante matriculado correctamente");
      setSelectedStudentByCourse((prev) => ({ ...prev, [courseId]: "" }));
    } catch (e) {
      console.error(e);
      toast.error("Error al matricular estudiante");
    }
  };

  // gráficos mock
  const roleDistribution = [
    { name: "Estudiantes", value: students.length || 120, color: "#ff6b35" },
    { name: "Docentes", value: teachers.length || 15, color: "#2a2a2a" },
    {
      name: "Administradores",
      value: users.length - (students.length + teachers.length),
      color: "#6b7280",
    },
  ];

  const weeklyAttentionData = [
    { week: "Sem 1", attention: 78 },
    { week: "Sem 2", attention: 82 },
    { week: "Sem 3", attention: 85 },
    { week: "Sem 4", attention: 83 },
    { week: "Sem 5", attention: 88 },
  ];

  const globalAverageAttention = 82;

const filteredUsers = users.filter((user) =>
  user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
  String(user.id).includes(searchQuery) || // usar id numérico como string
  user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
  user.userCode.toLowerCase().includes(searchQuery.toLowerCase()) // opcional
);


  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const getRoleBadgeColor = (role: string) => {
    if (role === "Administrador") return "bg-purple-100 text-purple-600";
    if (role === "Docente") return "bg-blue-100 text-blue-600";
    return "bg-orange-100 text-orange-600";
  };

  const getStatusColor = (status: string) => {
    return status === "active"
      ? "text-green-600 bg-green-100"
      : "text-gray-600 bg-gray-100";
  };

  const getAttentionColor = (attention: number) => {
    if (attention >= 85) return "text-green-600";
    if (attention >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6 shadow-xl">
          <div className="mb-8">
            <h2 className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">FocusLearn</h2>
            <p className="text-gray-400 text-sm mt-1">Panel Administrador</p>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setCurrentView("overview")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === "overview" 
                  ? "bg-orange-500 text-white" 
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Resumen</span>
            </button>

            <button
              onClick={() => setCurrentView("users")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === "users" 
                  ? "bg-orange-500 text-white" 
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Gestión de Usuarios</span>
            </button>

            <button
              onClick={() => setCurrentView("sessions")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === "sessions" 
                  ? "bg-orange-500 text-white" 
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              <span>Sesiones Activas</span>
            </button>

            <button
              onClick={() => setCurrentView("stats")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === "stats" 
                  ? "bg-orange-500 text-white" 
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Estadísticas Globales</span>
            </button>

            <button
              onClick={() => setCurrentView("config")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === "config" 
                  ? "bg-orange-500 text-white" 
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Configuración</span>
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
        <main className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="bg-white border-b px-8 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-gray-900">Panel de Administración</h1>
                <p className="text-sm text-gray-600">Gestión completa del sistema FocusLearn</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notificationCount}
                    </span>
                  )}
                </button>

                <div className="flex items-center space-x-3 pl-4 border-l">
                  <div className="text-right">
                    <p className="text-sm text-gray-900">Carlos Admin</p>
                    <p className="text-xs text-gray-500">Administrador</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white">
                    <Shield className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 p-8 overflow-y-auto">
            {/* Resumen */}
            {currentView === "overview" && (
              <div>
                <div className="mb-8">
                  <h2 className="text-gray-900 mb-2">Resumen General</h2>
                  <p className="text-gray-600">Vista global del sistema</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-gray-600">Estudiantes Activos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-orange-600">{students.length}</span>
                        <Users className="w-5 h-5 text-orange-600" />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Total registrados</p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-gray-600">Docentes Registrados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-600">{teachers.length}</span>
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Activos</p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-gray-600">Atención Global</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-green-600">{globalAverageAttention}%</span>
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Promedio general</p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-gray-600">Sesiones Activas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-600">{activeSessions.length}</span>
                        <Activity className="w-5 h-5 text-purple-600" />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">En este momento</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Atención Promedio Semanal</CardTitle>
                      <CardDescription>Tendencia de las últimas 5 semanas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={weeklyAttentionData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{ 
                              backgroundColor: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px"
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="attention"
                            stroke="#ff6b35"
                            strokeWidth={3}
                            dot={{ fill: "#ff6b35", r: 5 }}
                            activeDot={{ r: 7 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Distribución de Roles</CardTitle>
                      <CardDescription>Usuarios por tipo de rol</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={roleDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.name}: ${entry.value}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {roleDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Últimos Usuarios Conectados</CardTitle>
                    <CardDescription>Actividad reciente en el sistema</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {users
                        .filter(u => u.status === "active")
                        .slice(0, 5)
                        .map(user => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white">
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-gray-900">{user.name}</p>
                                <p className="text-sm text-gray-600">{user.email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={getRoleBadgeColor(user.role)}>
                                {user.role}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">{user.lastConnection}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Gestión de usuarios */}
            {currentView === "users" && (
              <div>
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-gray-900 mb-2">Gestión de Usuarios</h2>
                    <p className="text-gray-600">Administra estudiantes, docentes y administradores</p>
                  </div>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Agregar Usuario
                  </Button>
                </div>

                <div className="mb-6 flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Buscar por nombre, email, ID o rol..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los roles</SelectItem>
                      <SelectItem value="student">Estudiantes</SelectItem>
                      <SelectItem value="teacher">Docentes</SelectItem>
                      <SelectItem value="admin">Administradores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm text-gray-600">ID</th>
                            <th className="px-6 py-4 text-left text-sm text-gray-600">Usuario</th>
                            <th className="px-6 py-4 text-left text-sm text-gray-600">Email</th>
                            <th className="px-6 py-4 text-left text-sm text-gray-600">Rol</th>
                            <th className="px-6 py-4 text-left text-sm text-gray-600">Estado</th>
                            <th className="px-6 py-4 text-left text-sm text-gray-600">Última Conexión</th>
                            <th className="px-6 py-4 text-left text-sm text-gray-600">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 text-sm text-gray-900">{user.id}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm">
                                    {user.name.charAt(0)}
                                  </div>
                                  <span className="text-sm text-gray-900">{user.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                              <td className="px-6 py-4">
                                <Badge className={getRoleBadgeColor(user.role)}>
                                  {user.role}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <Badge className={getStatusColor(user.status)}>
                                  {user.status === "active" ? "Activo" : "Inactivo"}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">{user.lastConnection}</td>
                              <td className="px-6 py-4">
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditUser(user)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteUser(user)}
                                  >
                                    <UserX className="w-4 h-4" />
                                  </Button>
                                </div>
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

            {/* Sesiones activas */}
            {currentView === "sessions" && (
              <div>
                <div className="mb-8">
                  <h2 className="text-gray-900 mb-2">Clases y Sesiones Activas</h2>
                  <p className="text-gray-600">Monitoreo en tiempo real</p>
                </div>

                <div className="grid gap-6">
                  {activeSessions.map(session => (
                    <Card key={session.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white">
                                <GraduationCap className="w-6 h-6" />
                              </div>
                              <div>
                                <h3 className="text-gray-900">{session.className}</h3>
                                <p className="text-sm text-gray-600">Prof. {session.teacher}</p>
                              </div>
                              <Badge className="bg-green-100 text-green-600">
                                En vivo
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 mt-4">
                              <div>
                                <p className="text-sm text-gray-600">Estudiantes</p>
                                <p className="text-gray-900">{session.studentsCount}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Hora de inicio</p>
                                <p className="text-gray-900">{session.startTime}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Atención promedio</p>
                                <p className={getAttentionColor(session.averageAttention)}>
                                  {session.averageAttention}%
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <Button variant="outline">
                            Ver detalles
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {activeSessions.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No hay sesiones activas en este momento</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Estadísticas */}
            {currentView === "stats" && (
              <div>
                <div className="mb-8">
                  <h2 className="text-gray-900 mb-2">Estadísticas Globales</h2>
                  <p className="text-gray-600">Análisis detallado del sistema</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Uso del Sistema</CardTitle>
                      <CardDescription>Próximamente</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Gráficos de uso diario, semanal y mensual del sistema
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Rendimiento del Sistema</CardTitle>
                      <CardDescription>Próximamente</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Métricas de rendimiento y tiempos de respuesta
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Configuración + Gestión de cursos */}
            {currentView === "config" && (
              <div>
                <div className="mb-8">
                  <h2 className="text-gray-900 mb-2">Configuración del Sistema</h2>
                  <p className="text-gray-600">Ajustes generales y gestión de cursos</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configuración General</CardTitle>
                      <CardDescription>Personaliza el comportamiento del sistema</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label>Nombre del Sistema</Label>
                        <Input defaultValue="FocusLearn" className="mt-2" />
                      </div>
                      <div>
                        <Label>Email de Contacto</Label>
                        <Input defaultValue="contacto@focuslearn.com" className="mt-2" />
                      </div>
                      <div>
                        <Label>Umbral de Atención Bajo (%)</Label>
                        <Input type="number" defaultValue="50" className="mt-2" />
                      </div>
                      <div>
                        <Label>Umbral de Atención Alto (%)</Label>
                        <Input type="number" defaultValue="80" className="mt-2" />
                      </div>
                      <Button>Guardar Cambios</Button>
                    </CardContent>
                  </Card>

                  {/* Gestión de cursos */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Gestión de Cursos</CardTitle>
                      <CardDescription>Crea y administra los cursos del sistema</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Formulario Crear Curso */}
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <Label>Código del curso</Label>
                          <Input
                            className="mt-1"
                            placeholder="CG101"
                            value={newCourse.code}
                            onChange={e =>
                              setNewCourse({ ...newCourse, code: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label>Nombre del curso</Label>
                          <Input
                            className="mt-1"
                            placeholder="Computación Gráfica"
                            value={newCourse.name}
                            onChange={e =>
                              setNewCourse({ ...newCourse, name: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label>Descripción</Label>
                          <Input
                            className="mt-1"
                            placeholder="Descripción breve del curso"
                            value={newCourse.description}
                            onChange={e =>
                              setNewCourse({ ...newCourse, description: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <Button onClick={handleCreateCourse}>
                        Crear curso
                      </Button>

                      <Separator className="my-4" />

                      {/* Lista de Cursos Existentes con Asignación */}
                      <div>
                        <h3 className="font-semibold mb-2 text-sm">
                          Cursos existentes
                        </h3>
                        {courses.length === 0 ? (
                          <p className="text-gray-500 text-sm">
                            Aún no hay cursos registrados.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {courses.map((c) => (
                              <div key={c.id} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {c.code} — {c.name}
                                  </p>
                                  <p className="text-xs text-gray-500">{c.description}</p>
                                </div>

                                {/* Asignar profesor */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-medium text-gray-700">Profesor asignado:</span>
                                  <select
                                    className="border border-gray-300 rounded px-2 py-1 text-xs"
                                    value={selectedTeacherByCourse[c.id] ?? ""}
                                    onChange={(e) =>
                                      setSelectedTeacherByCourse((prev) => ({
                                        ...prev,
                                        [c.id]: e.target.value,
                                      }))
                                    }
                                  >
                                    <option value="">Seleccionar docente…</option>
                                    {teachers.map((t) => (
                                      <option key={t.id} value={t.id}>
                                        {t.name} ({t.email})
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    className="inline-flex items-center rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                    disabled={!selectedTeacherByCourse[c.id]}
                                    onClick={() => handleAssignTeacher(c.id)}
                                  >
                                    Asignar profesor
                                  </button>
                                </div>

                                {/* Matricular estudiante */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-medium text-gray-700">Matricular estudiante:</span>
                                  <select
                                    className="border border-gray-300 rounded px-2 py-1 text-xs"
                                    value={selectedStudentByCourse[c.id] ?? ""}
                                    onChange={(e) =>
                                      setSelectedStudentByCourse((prev) => ({
                                        ...prev,
                                        [c.id]: e.target.value,
                                      }))
                                    }
                                  >
                                    <option value="">Seleccionar estudiante…</option>
                                    {students.map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.name} ({s.email})
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    className="inline-flex items-center rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                    disabled={!selectedStudentByCourse[c.id]}
                                    onClick={() => handleEnrollStudent(c.id)}
                                  >
                                    Matricular
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Diálogos de usuarios */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Completa los datos del nuevo usuario
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre Completo</Label>
              <Input placeholder="Juan Pérez" className="mt-2" />
            </div>
            <div>
              <Label>Email Institucional</Label>
              <Input type="email" placeholder="usuario@espe.edu.ec" className="mt-2" />
            </div>
            <div>
              <Label>ID de Usuario</Label>
              <Input placeholder="EST001, DOC001, ADM001" className="mt-2" />
            </div>
            <div>
              <Label>Rol</Label>
              <Select>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Estudiante</SelectItem>
                  <SelectItem value="teacher">Docente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contraseña Temporal</Label>
              <Input type="password" placeholder="••••••••" className="mt-2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              setShowAddDialog(false);
              // lógica para crear usuario
            }}>
              Agregar Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos de {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label>Nombre Completo</Label>
                <Input defaultValue={selectedUser.name} className="mt-2" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" defaultValue={selectedUser.email} className="mt-2" />
              </div>
              <div>
                <Label>Estado</Label>
                <Select defaultValue={selectedUser.status}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              setShowEditDialog(false);
              // lógica para actualizar usuario
            }}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Usuario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar a {selectedUser?.name}?
            </DialogDescription>
          </DialogHeader>
          <Alert className="border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              Esta acción no se puede deshacer. Se eliminarán todos los datos asociados al usuario.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => {
              setShowDeleteDialog(false);
              // lógica para eliminar usuario
            }}>
              Eliminar Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}