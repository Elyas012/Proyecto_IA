import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { 
  ArrowLeft,
  Download,
  Calendar,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Award,
  Lightbulb,
  Eye,
  Clock,
  Target,
  CheckCircle2,
  AlertCircle,
  Activity
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface StudentReportProps {
  onBack: () => void;
}

export function StudentReport({ onBack }: StudentReportProps) {
  const [selectedSubject, setSelectedSubject] = useState("algorithms");
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  // Mock data - Información del estudiante
  const studentInfo = {
    name: "Juan Pérez",
    id: "EST001",
    email: "juan.perez@espe.edu.ec",
    semester: "5to Semestre",
    career: "Ingeniería en Software",
  };

  // Mock data - Métricas generales
  const generalMetrics = {
    averageAttention: 78,
    totalSessions: 24,
    attendedSessions: 22,
    totalMinutes: 1440,
    trend: "up", // up, down, stable
  };

  // Mock data - Materias
  const subjects = [
    { id: "algorithms", name: "Algoritmos y Estructuras de Datos" },
    { id: "databases", name: "Bases de Datos" },
    { id: "networks", name: "Redes de Computadoras" },
    { id: "ai", name: "Inteligencia Artificial" },
  ];

  // Mock data - Evolución temporal de atención
  const attentionTimeline = [
    { date: "01/10", attention: 72, sessions: 1 },
    { date: "03/10", attention: 75, sessions: 1 },
    { date: "05/10", attention: 68, sessions: 1 },
    { date: "08/10", attention: 82, sessions: 1 },
    { date: "10/10", attention: 85, sessions: 1 },
    { date: "12/10", attention: 79, sessions: 1 },
    { date: "15/10", attention: 88, sessions: 1 },
    { date: "17/10", attention: 86, sessions: 1 },
    { date: "19/10", attention: 90, sessions: 1 },
    { date: "22/10", attention: 84, sessions: 1 },
  ];

  // Mock data - Atención por hora del día
  const attentionByHour = [
    { hour: "8:00", attention: 65 },
    { hour: "9:00", attention: 72 },
    { hour: "10:00", attention: 85 },
    { hour: "11:00", attention: 88 },
    { hour: "12:00", attention: 75 },
    { hour: "14:00", attention: 70 },
    { hour: "15:00", attention: 82 },
    { hour: "16:00", attention: 90 },
  ];

  // Mock data - Heatmap por día de la semana y hora
  const heatmapData = [
    { day: "Lun", morning: 75, afternoon: 82, evening: 70 },
    { day: "Mar", morning: 80, afternoon: 85, evening: 78 },
    { day: "Mié", morning: 72, afternoon: 88, evening: 75 },
    { day: "Jue", morning: 85, afternoon: 90, evening: 82 },
    { day: "Vie", morning: 88, afternoon: 86, evening: 80 },
  ];

  // Mock data - Comparación con el promedio de clase
  const classComparison = [
    { metric: "Atención", student: 78, classAvg: 75 },
    { metric: "Asistencia", student: 92, classAvg: 85 },
    { metric: "Participación", student: 70, classAvg: 72 },
  ];

  const getPerformanceColor = (value: number) => {
    if (value >= 85) return "text-green-600 bg-green-50 border-green-200";
    if (value >= 70) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getPerformanceBadge = (value: number) => {
    if (value >= 85) return { label: "Excelente", color: "bg-green-100 text-green-600" };
    if (value >= 70) return { label: "Bueno", color: "bg-yellow-100 text-yellow-600" };
    return { label: "Requiere Mejora", color: "bg-red-100 text-red-600" };
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (trend === "down") return <TrendingDown className="w-5 h-5 text-red-600" />;
    return <Activity className="w-5 h-5 text-yellow-600" />;
  };

  // Generar recomendaciones personalizadas
  const generateRecommendations = () => {
    const recommendations = [];
    
    if (generalMetrics.averageAttention < 80) {
      recommendations.push({
        type: "warning",
        title: "Nivel de atención mejorable",
        text: "Tu nivel de atención promedio fue del 78%. Considera mejorar las condiciones de tu espacio de estudio: iluminación adecuada, minimizar distracciones y mantener contacto visual con la cámara.",
      });
    } else {
      recommendations.push({
        type: "success",
        title: "Excelente nivel de atención",
        text: "Mantén tu nivel de atención actual. Tu promedio de 78% está por encima del estándar.",
      });
    }

    // Análisis de horarios
    const bestHour = attentionByHour.reduce((prev, current) => 
      prev.attention > current.attention ? prev : current
    );
    recommendations.push({
      type: "info",
      title: "Horario óptimo identificado",
      text: `Tu mejor rendimiento se registra a las ${bestHour.hour} con un ${bestHour.attention}% de atención. Intenta programar actividades importantes en este horario.`,
    });

    // Tendencia
    if (generalMetrics.trend === "up") {
      recommendations.push({
        type: "success",
        title: "Tendencia positiva",
        text: "Has mostrado una mejora constante en tu nivel de atención durante las últimas sesiones. ¡Sigue así!",
      });
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case "info":
        return <Lightbulb className="w-5 h-5 text-orange-600" />;
      default:
        return <Lightbulb className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRecommendationStyle = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "info":
        return "bg-orange-50 border-orange-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Descargar Reporte
          </Button>
        </div>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-gray-900 mb-2">Reporte Individual de Atención</h1>
            <p className="text-gray-600">
              {studentInfo.name} • {studentInfo.id} • {studentInfo.career}
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            Período: Octubre 2025
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-gray-500" />
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-64 bg-white">
                <SelectValue placeholder="Seleccionar materia" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48 bg-white">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
                <SelectItem value="semester">Semestre actual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Student Info Card */}
        <Card className="mb-8 border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Estudiante</p>
                <p className="text-gray-900">{studentInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Materia</p>
                <p className="text-gray-900">
                  {subjects.find(s => s.id === selectedSubject)?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Carrera</p>
                <p className="text-gray-900">{studentInfo.career}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Semestre</p>
                <p className="text-gray-900">{studentInfo.semester}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Fecha de generación</p>
                <p className="text-gray-900">24 Oct 2025</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className={`border-2 ${getPerformanceColor(generalMetrics.averageAttention)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Atención Promedio</CardTitle>
                {getTrendIcon(generalMetrics.trend)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <span className="text-orange-600">{generalMetrics.averageAttention}%</span>
              </div>
              <Badge className={getPerformanceBadge(generalMetrics.averageAttention).color}>
                {getPerformanceBadge(generalMetrics.averageAttention).label}
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-blue-900">Sesiones Asistidas</CardTitle>
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <span className="text-blue-600">
                  {generalMetrics.attendedSessions}/{generalMetrics.totalSessions}
                </span>
              </div>
              <p className="text-sm text-blue-700">
                {Math.round((generalMetrics.attendedSessions / generalMetrics.totalSessions) * 100)}% de asistencia
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-purple-900">Tiempo Total</CardTitle>
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <span className="text-purple-600">
                  {Math.floor(generalMetrics.totalMinutes / 60)}h {generalMetrics.totalMinutes % 60}m
                </span>
              </div>
              <p className="text-sm text-purple-700">En sesiones</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-green-900">Logros</CardTitle>
                <Award className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <span className="text-green-600">3</span>
              </div>
              <p className="text-sm text-green-700">Insignias obtenidas</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Timeline Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Evolución Temporal de Atención</CardTitle>
              <CardDescription>Nivel de atención por sesión (último mes)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={attentionTimeline}>
                  <defs>
                    <linearGradient id="colorAttention" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ff6b35" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
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
                    fill="url(#colorAttention)"
                    dot={{ fill: '#ff6b35', r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Attention by Hour */}
          <Card>
            <CardHeader>
              <CardTitle>Atención por Horario</CardTitle>
              <CardDescription>Tu rendimiento según la hora del día</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attentionByHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="attention" fill="#ff6b35" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Heatmap Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Mapa de Calor Semanal</CardTitle>
            <CardDescription>Patrones de atención por día y período del día</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm text-gray-600">Día</th>
                    <th className="px-4 py-3 text-center text-sm text-gray-600">Mañana (8-12)</th>
                    <th className="px-4 py-3 text-center text-sm text-gray-600">Tarde (14-17)</th>
                    <th className="px-4 py-3 text-center text-sm text-gray-600">Noche (18-20)</th>
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.map((row) => (
                    <tr key={row.day} className="border-b">
                      <td className="px-4 py-3 text-gray-900">{row.day}</td>
                      <td className="px-4 py-3">
                        <div 
                          className={`text-center py-2 rounded ${
                            row.morning >= 85 ? 'bg-green-100 text-green-700' :
                            row.morning >= 70 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}
                        >
                          {row.morning}%
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div 
                          className={`text-center py-2 rounded ${
                            row.afternoon >= 85 ? 'bg-green-100 text-green-700' :
                            row.afternoon >= 70 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}
                        >
                          {row.afternoon}%
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div 
                          className={`text-center py-2 rounded ${
                            row.evening >= 85 ? 'bg-green-100 text-green-700' :
                            row.evening >= 70 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}
                        >
                          {row.evening}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-green-100"></div>
                <span className="text-gray-600">Excelente (85-100%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-yellow-100"></div>
                <span className="text-gray-600">Bueno (70-84%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-red-100"></div>
                <span className="text-gray-600">Mejorar (&lt;70%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison with Class Average */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Comparación con el Promedio del Grupo</CardTitle>
            <CardDescription>Tu desempeño vs. el promedio de la clase</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={classComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="student" name="Tu desempeño" fill="#ff6b35" radius={[8, 8, 0, 0]} />
                <Bar dataKey="classAvg" name="Promedio del grupo" fill="#2a2a2a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recommendations Section */}
        <Card className="border-2 border-orange-200">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-6 h-6 text-orange-600" />
              <CardTitle>Recomendaciones Personalizadas</CardTitle>
            </div>
            <CardDescription>
              Sugerencias basadas en tu desempeño y patrones de atención
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-2 ${getRecommendationStyle(rec.type)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getRecommendationIcon(rec.type)}
                    <div className="flex-1">
                      <h4 className="text-gray-900 mb-1">{rec.title}</h4>
                      <p className="text-sm text-gray-700">{rec.text}</p>
                    </div>
                  </div>
                </div>
              ))}

              <Separator className="my-4" />

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                <h4 className="text-gray-900 mb-2 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-orange-600" />
                  Consejos Generales para Mejorar tu Atención
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-orange-600 mr-2">•</span>
                    <span>Asegúrate de tener una buena iluminación en tu espacio de estudio</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-600 mr-2">•</span>
                    <span>Mantén contacto visual con la cámara durante las explicaciones</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-600 mr-2">•</span>
                    <span>Minimiza las distracciones: cierra pestañas innecesarias y silencia notificaciones</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-600 mr-2">•</span>
                    <span>Toma descansos breves cada 50 minutos para mantener la concentración</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-600 mr-2">•</span>
                    <span>Participa activamente en clase tomando notas y haciendo preguntas</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
