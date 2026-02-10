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
  Shield,
  Menu,
  X,
  Brain,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell , Legend} from "recharts";
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

type UserFormState = {
  name: string;
  email: string;
  userCode?: string;
  role: "student" | "teacher" | "admin";
  password?: string;
  status?: "active" | "inactive";
};

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
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
  const [currentUser, setCurrentUser] = useState<{
    first_name?: string;
    last_name?: string;
    username?: string;
    email?: string;
    role?: string;
  } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // datos principales
  const [users, setUsers] = useState<User[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // dialogs / ui
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCourseDetailsDialog, setShowCourseDetailsDialog] = useState(false);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState<Course | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 1,
      title: "Sesiones activas",
      message: "Hay sesiones en vivo por revisar.",
      time: "Ahora",
      read: false,
    },
    {
      id: 2,
      title: "Usuarios nuevos",
      message: "Se registraron nuevos usuarios hoy.",
      time: "Hoy",
      read: false,
    },
    {
      id: 3,
      title: "Cursos pendientes",
      message: "Revisa cursos sin profesor asignado.",
      time: "Hoy",
      read: false,
    },
  ]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [newUserForm, setNewUserForm] = useState<UserFormState>({
    name: "",
    email: "",
    userCode: "",
    role: "student",
    password: "",
  });
  const [editUserForm, setEditUserForm] = useState<UserFormState>({
    name: "",
    email: "",
    role: "student",
    status: "active",
  });

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
  const [selectedStudentsByCourse, setSelectedStudentsByCourse] = useState<
    Record<number, number[]>
  >({});
  const [enrolledStudentIdsByCourse, setEnrolledStudentIdsByCourse] = useState<
    Record<number, number[]>
  >({});
  const [enrollmentLoadingByCourse, setEnrollmentLoadingByCourse] = useState<
    Record<number, boolean>
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

        const [usersRes, sessionsRes, coursesRes] = await Promise.allSettled([
          api.get("/admin/users/"),
          api.get("/admin/active-sessions/"),
          api.get("/admin/courses/"),
        ]);

        if (usersRes.status === "fulfilled") {
          setUsers(usersRes.value.data);
        }

        if (sessionsRes.status === "fulfilled") {
          setActiveSessions(sessionsRes.value.data);
        }

        if (coursesRes.status === "fulfilled") {
          setCourses(coursesRes.value.data);
        }
      } catch (error) {
        console.error("Error loading admin data:", error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    courses.forEach((course) => {
      if (!enrolledStudentIdsByCourse[course.id]) {
        loadEnrolledStudents(course.id);
      }
    });
  }, [courses]);

  useEffect(() => {
    const loadCurrentUser = async () => {
      let storedUser: any = null;
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("user");
        if (raw) {
          try {
            storedUser = JSON.parse(raw);
          } catch {
            storedUser = null;
          }
        }
      }

      if (storedUser) {
        setCurrentUser({
          first_name: storedUser.first_name,
          last_name: storedUser.last_name,
          username: storedUser.username,
          email: storedUser.email,
          role: storedUser.role,
        });
      }

      try {
        const meRes = await api.get("/auth/me/");
        setCurrentUser(meRes.data);
      } catch (error) {
        console.error("Error loading current user:", error);
      }
    };

    loadCurrentUser();
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

  const handleDeleteCourse = async (courseId: number) => {
    const confirmed = typeof window !== "undefined" && window.confirm("¿Eliminar este curso?");
    if (!confirmed) return;
    try {
      await api.delete(`/admin/courses/${courseId}/`);
      setCourses((prev) => prev.filter((course) => course.id !== courseId));
      setSelectedTeacherByCourse((prev) => {
        const updated = { ...prev };
        delete updated[courseId];
        return updated;
      });
      setSelectedStudentByCourse((prev) => {
        const updated = { ...prev };
        delete updated[courseId];
        return updated;
      });
      toast.success("Curso eliminado correctamente");
    } catch (e) {
      console.error("Error deleting course", e);
      toast.error("Error al eliminar curso");
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
      setEnrolledStudentIdsByCourse((prev) => ({
        ...prev,
        [courseId]: Array.from(new Set([...(prev[courseId] ?? []), Number(studentId)])),
      }));
      toast.success("Estudiante matriculado correctamente");
      setSelectedStudentByCourse((prev) => ({ ...prev, [courseId]: "" }));
    } catch (e) {
      console.error(e);
      toast.error("Error al matricular estudiante");
    }
  };

  const loadEnrolledStudents = async (courseId: number) => {
    if (enrolledStudentIdsByCourse[courseId] || enrollmentLoadingByCourse[courseId]) return;
    setEnrollmentLoadingByCourse((prev) => ({ ...prev, [courseId]: true }));
    try {
      const resp = await api.get(`/admin/courses/${courseId}/students/`);
      setEnrolledStudentIdsByCourse((prev) => ({
        ...prev,
        [courseId]: resp.data?.student_ids ?? [],
      }));
    } catch (e) {
      console.error("Error loading enrolled students", e);
      toast.error("No se pudo cargar los matriculados");
    } finally {
      setEnrollmentLoadingByCourse((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const handleBulkEnrollStudents = async (courseId: number) => {
    const selected = selectedStudentsByCourse[courseId] ?? [];
    if (selected.length === 0) {
      toast.error("Selecciona estudiantes para matricular");
      return;
    }
    try {
      const resp = await api.post("/admin/enroll-students-bulk/", {
        course_id: courseId,
        student_ids: selected,
      });
      const enrolledIds = resp.data?.enrolled_ids ?? [];
      const alreadyIds = resp.data?.already_enrolled_ids ?? [];
      setEnrolledStudentIdsByCourse((prev) => ({
        ...prev,
        [courseId]: Array.from(new Set([...(prev[courseId] ?? []), ...enrolledIds, ...alreadyIds])),
      }));
      setSelectedStudentsByCourse((prev) => ({ ...prev, [courseId]: [] }));
      toast.success(`Matriculados: ${enrolledIds.length}. Ya inscritos: ${alreadyIds.length}.`);
    } catch (e) {
      console.error("Error bulk enrolling students", e);
      toast.error("Error al matricular en masa");
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

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(user.id).includes(searchQuery) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.userCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role.toLowerCase() === roleFilter;
    return matchesSearch && matchesRole;
  });


  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUserForm({
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase() as UserFormState["role"],
      status: user.status,
    });
    setShowEditDialog(true);
  };

  const handleOpenDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleCreateUser = async () => {
    if (!newUserForm.name || !newUserForm.email || !newUserForm.password) {
      toast.error("Completa nombre, email y contrasena");
      return;
    }
    try {
      const resp = await api.post("/admin/users/", {
        name: newUserForm.name,
        email: newUserForm.email,
        userCode: newUserForm.userCode,
        role: newUserForm.role,
        password: newUserForm.password,
      });
      setUsers((prev) => [resp.data, ...prev]);
      setShowAddDialog(false);
      setNewUserForm({ name: "", email: "", userCode: "", role: "student", password: "" });
      toast.success("Usuario creado correctamente");
    } catch (error) {
      console.error("Error creating user", error);
      toast.error("No se pudo crear el usuario");
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      const resp = await api.patch(`/admin/users/${selectedUser.id}/`, {
        name: editUserForm.name,
        email: editUserForm.email,
        role: editUserForm.role,
        status: editUserForm.status,
      });
      setUsers((prev) => prev.map((user) => (user.id === selectedUser.id ? resp.data : user)));
      setShowEditDialog(false);
      toast.success("Usuario actualizado");
    } catch (error) {
      console.error("Error updating user", error);
      toast.error("No se pudo actualizar el usuario");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await api.delete(`/admin/users/${selectedUser.id}/`);
      setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id));
      setShowDeleteDialog(false);
      toast.success("Usuario eliminado");
    } catch (error) {
      console.error("Error deleting user", error);
      toast.error("No se pudo eliminar el usuario");
    }
  };

  const handleOpenCourseDetails = async (course: Course) => {
    setSelectedCourseDetails(course);
    setShowCourseDetailsDialog(true);
    await loadEnrolledStudents(course.id);
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

  const displayName =
    [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(" ").trim() ||
    currentUser?.username ||
    currentUser?.email ||
    "Administrador";

  const displayRole =
    currentUser?.role === "admin"
      ? "Administrador"
      : currentUser?.role === "teacher"
      ? "Docente"
      : currentUser?.role === "student"
      ? "Estudiante"
      : "Administrador";

  const unreadNotifications = notifications.filter((notification) => !notification.read).length;

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-[#1a1a1a] text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">FocusLearn</h2>
            <p className="text-gray-500 text-xs">Panel Administrador</p>
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">FocusLearn</h2>
                <p className="text-gray-500 text-xs">Panel Administrador</p>
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
                setCurrentView("overview");
                setIsMobileMenuOpen(false);
                if (isSidebarCollapsed) setIsSidebarCollapsed(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 group ${
                currentView === "overview" 
                  ? "bg-gray-800 text-white border-l-4 border-blue-500" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent"
              }`}
              title="Resumen"
            >
              <Home className={`w-5 h-5 flex-shrink-0 ${
                currentView === "overview" ? "text-blue-500" : "group-hover:text-blue-500"
              }`} />
              <span className={`${isSidebarCollapsed ? 'hidden' : 'block'} text-sm font-medium`}>Resumen</span>
            </button>

            <button
              onClick={() => {
                setCurrentView("users");
                setIsMobileMenuOpen(false);
                if (isSidebarCollapsed) setIsSidebarCollapsed(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 group ${
                currentView === "users" 
                  ? "bg-gray-800 text-white border-l-4 border-blue-500" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent"
              }`}
              title="Gestión de Usuarios"
            >
              <Users className={`w-5 h-5 flex-shrink-0 ${
                currentView === "users" ? "text-blue-500" : "group-hover:text-blue-500"
              }`} />
              <span className={`${isSidebarCollapsed ? 'hidden' : 'block'} text-sm font-medium`}>Gestión de Usuarios</span>
            </button>

            <button
              onClick={() => {
                setCurrentView("sessions");
                setIsMobileMenuOpen(false);
                if (isSidebarCollapsed) setIsSidebarCollapsed(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 group ${
                currentView === "sessions" 
                  ? "bg-gray-800 text-white border-l-4 border-blue-500" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent"
              }`}
              title="Sesiones Activas"
            >
              <GraduationCap className={`w-5 h-5 flex-shrink-0 ${
                currentView === "sessions" ? "text-blue-500" : "group-hover:text-blue-500"
              }`} />
              <span className={`${isSidebarCollapsed ? 'hidden' : 'block'} text-sm font-medium`}>Sesiones Activas</span>
            </button>

            <button
              onClick={() => {
                setCurrentView("stats");
                setIsMobileMenuOpen(false);
                if (isSidebarCollapsed) setIsSidebarCollapsed(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 group ${
                currentView === "stats" 
                  ? "bg-gray-800 text-white border-l-4 border-blue-500" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent"
              }`}
              title="Estadísticas Globales"
            >
              <BarChart3 className={`w-5 h-5 flex-shrink-0 ${
                currentView === "stats" ? "text-blue-500" : "group-hover:text-blue-500"
              }`} />
              <span className={`${isSidebarCollapsed ? 'hidden' : 'block'} text-sm font-medium`}>Estadísticas Globales</span>
            </button>

            <button
              onClick={() => {
                setCurrentView("config");
                setIsMobileMenuOpen(false);
                if (isSidebarCollapsed) setIsSidebarCollapsed(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 group ${
                currentView === "config" 
                  ? "bg-gray-800 text-white border-l-4 border-blue-500" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent"
              }`}
              title="Configuración"
            >
              <Settings className={`w-5 h-5 flex-shrink-0 ${
                currentView === "config" ? "text-blue-500" : "group-hover:text-blue-500"
              }`} />
              <span className={`${isSidebarCollapsed ? 'hidden' : 'block'} text-sm font-medium`}>Configuración</span>
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
        <main className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="bg-white border-b px-4 sm:px-6 lg:px-8 py-3 sm:py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl text-gray-900">Panel de Administración</h1>
                <p className="text-xs sm:text-sm text-gray-600">Gestión completa del sistema FocusLearn</p>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
                  <button
                    className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => setIsNotificationsOpen(true)}
                    aria-label="Ver notificaciones"
                  >
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                        {unreadNotifications}
                      </span>
                    )}
                  </button>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Notificaciones</DialogTitle>
                      <DialogDescription>Actividad reciente del panel</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      {notifications.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
                          No hay notificaciones nuevas.
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${
                              notification.read ? "bg-gray-50 border-gray-100" : "bg-white border-gray-200"
                            }`}
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                              <p className="text-xs text-gray-600">{notification.message}</p>
                            </div>
                            <span className="text-[10px] text-gray-400">{notification.time}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <DialogFooter className="sm:justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setNotifications([])}
                        disabled={notifications.length === 0}
                      >
                        Limpiar
                      </Button>
                      <Button
                        onClick={markAllNotificationsAsRead}
                        disabled={unreadNotifications === 0}
                      >
                        Marcar todo como leido
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="hidden sm:flex items-center space-x-3 pl-4 border-l">
                  <div className="text-right">
                    <p className="text-sm text-gray-900">{displayName}</p>
                    <p className="text-xs text-gray-500">{displayRole}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {/* Resumen */}
            {currentView === "overview" && (
              <div>
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Resumen General</h2>
                  <p className="text-sm sm:text-base text-gray-600">Vista global del sistema</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-gray-600">Estudiantes Activos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold text-blue-600">{students.length}</span>
                        <Users className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Total registrados</p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-gray-600">Docentes Registrados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold text-purple-600">{teachers.length}</span>
                        <GraduationCap className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Activos</p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-gray-600">Atención Global</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold text-green-600">{globalAverageAttention}%</span>
                        <TrendingUp className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Promedio general</p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-cyan-500 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-gray-600">Sesiones Activas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold text-cyan-600">{activeSessions.length}</span>
                        <Activity className="w-8 h-8 text-cyan-600" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">En este momento</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Atención Promedio Semanal</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Tendencia de las últimas 5 semanas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
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
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Gestión de Usuarios</h2>
                    <p className="text-gray-600">Administra estudiantes, docentes y administradores</p>
                  </div>
                  <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
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
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
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
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                                    {user.name.charAt(0)}
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">{user.name}</span>
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
                                      onClick={() => handleOpenDeleteUser(user)}
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
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Clases y Sesiones Activas</h2>
                  <p className="text-sm sm:text-base text-gray-600">Monitoreo en tiempo real</p>
                </div>

                <div className="grid gap-4 sm:gap-6">
                  {activeSessions.map(session => (
                    <Card key={session.id} className="border-l-4 border-l-blue-500 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                                <GraduationCap className="w-6 h-6" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{session.className}</h3>
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
              <div className="animate-in zoom-in-95 duration-500">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Métricas del Sistema</h2>
                  <p className="text-gray-600">Salud de la plataforma y distribución de usuarios</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Distribución de Roles Real */}
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-blue-700">Composición de Usuarios</CardTitle>
                      <CardDescription>Distribución actual de roles en la plataforma</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Estudiantes', value: users.filter(u => u.role === 'Student').length, fill: '#ff6b35' },
                              { name: 'Docentes', value: users.filter(u => u.role === 'Teacher').length, fill: '#3b82f6' },
                              { name: 'Admins', value: users.filter(u => u.role === 'Admin').length, fill: '#64748b' }
                            ]}
                            cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label
                          >
                            {roleDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom"/>
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Carga del Sistema (Sesiones vs Cursos) */}
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-blue-700">Carga Actual del Sistema</CardTitle>
                      <CardDescription>Sesiones activas respecto al total de cursos</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex flex-col justify-center items-center">
                      <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="80" cy="80" r="70" stroke="#e5e7eb" strokeWidth="10" fill="transparent" />
                          <circle 
                            cx="80" cy="80" r="70" stroke="#3b82f6" strokeWidth="10" fill="transparent"
                            strokeDasharray={440}
                            strokeDashoffset={440 - (440 * (activeSessions.length / (courses.length || 1)))}
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute text-3xl font-bold text-gray-800">
                          {Math.round((activeSessions.length / (courses.length || 1)) * 100)}%
                        </div>
                      </div>
                      <p className="mt-4 text-gray-500 text-center">
                        {activeSessions.length} sesiones activas de {courses.length} cursos registrados.
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
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Configuración del Sistema</h2>
                  <p className="text-gray-600">Ajustes generales y gestión de cursos</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-blue-700">Configuración General</CardTitle>
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
                      <Button className="bg-blue-600 hover:bg-blue-700">Guardar Cambios</Button>
                    </CardContent>
                  </Card>

                  {/* Gestión de cursos */}
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-blue-700">Gestión de Cursos</CardTitle>
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
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {c.code} — {c.name}
                                    </p>
                                    <p className="text-xs text-gray-500">{c.description}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      className="inline-flex items-center rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                                      onClick={() => handleOpenCourseDetails(c)}
                                    >
                                      Ver detalles
                                    </button>
                                    <button
                                      className="inline-flex items-center rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                                      onClick={() => handleDeleteCourse(c.id)}
                                    >
                                      Eliminar
                                    </button>
                                  </div>
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

                                {/* Matricular en masa */}
                                <div className="rounded-md border border-gray-200 p-3 bg-gray-50">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-700">Matricular en masa</span>
                                    <button
                                      className="text-xs text-blue-600 hover:underline"
                                      onClick={() => loadEnrolledStudents(c.id)}
                                    >
                                      {enrollmentLoadingByCourse[c.id] ? "Cargando..." : "Actualizar inscritos"}
                                    </button>
                                  </div>
                                  <div className="mt-2 max-h-40 overflow-auto space-y-1">
                                    {students.map((s) => {
                                      const enrolledIds = enrolledStudentIdsByCourse[c.id] ?? [];
                                      const isEnrolled = enrolledIds.includes(s.id);
                                      const selectedIds = selectedStudentsByCourse[c.id] ?? [];
                                      const isChecked = selectedIds.includes(s.id);
                                      return (
                                        <label
                                          key={s.id}
                                          className={`flex items-center justify-between gap-2 rounded px-2 py-1 text-xs ${isEnrolled ? 'opacity-50' : ''}`}
                                        >
                                          <span className="flex items-center gap-2">
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              disabled={isEnrolled}
                                              onChange={(e) => {
                                                const checked = e.target.checked;
                                                setSelectedStudentsByCourse((prev) => {
                                                  const current = prev[c.id] ?? [];
                                                  const next = checked
                                                    ? Array.from(new Set([...current, s.id]))
                                                    : current.filter((id) => id !== s.id);
                                                  return { ...prev, [c.id]: next };
                                                });
                                              }}
                                            />
                                            <span>
                                              {s.name} ({s.email})
                                            </span>
                                          </span>
                                          {isEnrolled && (
                                            <span className="rounded bg-gray-200 px-2 py-0.5 text-[10px] text-gray-600">
                                              Ya matriculado
                                            </span>
                                          )}
                                        </label>
                                      );
                                    })}
                                  </div>
                                  <div className="mt-2 flex justify-end">
                                    <button
                                      className="inline-flex items-center rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                      disabled={(selectedStudentsByCourse[c.id] ?? []).length === 0}
                                      onClick={() => handleBulkEnrollStudents(c.id)}
                                    >
                                      Matricular seleccionados
                                    </button>
                                  </div>
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
              <Input
                placeholder="Juan Perez"
                className="mt-2"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Email Institucional</Label>
              <Input
                type="email"
                placeholder="usuario@espe.edu.ec"
                className="mt-2"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label>ID de Usuario</Label>
              <Input
                placeholder="EST001, DOC001, ADM001"
                className="mt-2"
                value={newUserForm.userCode}
                onChange={(e) => setNewUserForm((prev) => ({ ...prev, userCode: e.target.value }))}
              />
            </div>
            <div>
              <Label>Rol</Label>
              <Select
                value={newUserForm.role}
                onValueChange={(value) =>
                  setNewUserForm((prev) => ({ ...prev, role: value as UserFormState["role"] }))
                }
              >
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
              <Input
                type="password"
                placeholder="••••••••"
                className="mt-2"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser}>
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
                <Input
                  className="mt-2"
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  className="mt-2"
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label>Rol</Label>
                <Select
                  value={editUserForm.role}
                  onValueChange={(value) =>
                    setEditUserForm((prev) => ({ ...prev, role: value as UserFormState["role"] }))
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Estudiante</SelectItem>
                    <SelectItem value="teacher">Docente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select
                  value={editUserForm.status}
                  onValueChange={(value) =>
                    setEditUserForm((prev) => ({ ...prev, status: value as UserFormState["status"] }))
                  }
                >
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
            <Button onClick={handleUpdateUser}>
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
            <Button variant="destructive" onClick={handleDeleteUser}>
              Eliminar Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCourseDetailsDialog} onOpenChange={setShowCourseDetailsDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles del curso</DialogTitle>
            <DialogDescription>Informacion general e inscritos</DialogDescription>
          </DialogHeader>
          {selectedCourseDetails ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedCourseDetails.code} - {selectedCourseDetails.name}
                </p>
                <p className="text-xs text-gray-500">{selectedCourseDetails.description || "Sin descripcion"}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs font-semibold text-gray-700">Estudiantes inscritos</p>
                {enrollmentLoadingByCourse[selectedCourseDetails.id] ? (
                  <p className="text-xs text-gray-500 mt-2">Cargando...</p>
                ) : (
                  <div className="mt-2 space-y-2 max-h-40 overflow-auto">
                    {(enrolledStudentIdsByCourse[selectedCourseDetails.id] ?? []).length === 0 ? (
                      <p className="text-xs text-gray-500">Sin estudiantes inscritos.</p>
                    ) : (
                      students
                        .filter((student) =>
                          (enrolledStudentIdsByCourse[selectedCourseDetails.id] ?? []).includes(student.id)
                        )
                        .map((student) => (
                          <div key={student.id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-700">{student.name}</span>
                            <span className="text-gray-400">{student.email}</span>
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Selecciona un curso para ver detalles.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCourseDetailsDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminDashboard;