import { useState, useEffect, useRef } from "react";
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

  // Student info (fetched)
  const [user, setUser] = useState<any | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>({ name: 'Estudiante', career: '-', semester: '-' });

  // Report state
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState<any | null>(null);
  const [generalMetrics, setGeneralMetrics] = useState<any>({
    averageAttention: 0,
    totalSessions: 0,
    attendedSessions: 0,
    totalMinutes: 0,
    trend: 'stable',
  });
  const [attentionTimeline, setAttentionTimeline] = useState<any[]>([]);
  const [attentionByHour, setAttentionByHour] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [classComparison, setClassComparison] = useState<any[]>([]);
  const [pomodoroMetrics, setPomodoroMetrics] = useState<any>({});

  // PDF generation
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement | null>(null);

  const fetchUserAndCourses = async () => {
    const token = (typeof window !== 'undefined') ? localStorage.getItem('authToken') : null;
    if (!token) {
      setUser(null);
      setCourses([]);
      return;
    }

    try {
      const resp = await (await import('../lib/api')).default.get('/auth/me/');
      setUser(resp.data);
      setStudentInfo({
        name: `${resp.data.first_name || resp.data.username || resp.data.email}`,
        career: resp.data.career || '-',
        semester: resp.data.semester || '-',
      });
    } catch (err) {
      setUser(null);
    }

    try {
      const resp2 = await (await import('../lib/api')).default.get('/student/courses/');
      setCourses(resp2.data);
      if (resp2.data && resp2.data.length > 0) {
        setSelectedSubject(String(resp2.data[0].id));
      }
    } catch (err) {
      setCourses([]);
    }
  };

  const fetchReport = async () => {
    setReportLoading(true);
    try {
      const api = (await import('../lib/api')).default;
      const resp = await api.get('/student/report/', { params: { period: selectedPeriod, subject: selectedSubject } });
      setReportData(resp.data);

      // Map to UI state with safe fallbacks and camelCase conversion
      const s = resp.data.summary || {};
      setGeneralMetrics({
        averageAttention: s.average_attention || 0,
        totalSessions: s.total_sessions || 0,
        attendedSessions: s.attended_sessions || s.total_sessions || 0,
        totalMinutes: s.total_minutes || 0,
        trend: s.trend || 'stable',
        period: s.period || selectedPeriod
      });
      setAttentionTimeline(resp.data.timeline || []);
      setAttentionByHour((resp.data.by_hour || []).map((h: any) => ({ hour: `${h.hour}:00`, attention: h.attention })));
      setHeatmapData(resp.data.heatmap || []);
      setClassComparison(resp.data.class_comparison || []);
      setPomodoroMetrics(resp.data.pomodoro_metrics || {});
    } catch (err) {
      // If API fails, keep previous or default/mock data
      console.error('Failed to load report', err);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    // fetch on mount
    fetchUserAndCourses();
  }, []);

  useEffect(() => {
    // refetch report when period or subject changes
    fetchReport();
  }, [selectedPeriod, selectedSubject]);

  // Fallbacks for heatmap and classComparison when not provided
  useEffect(() => {
    if (!heatmapData || heatmapData.length === 0) {
      setHeatmapData([
        { day: "Lun", morning: 75, afternoon: 82, evening: 70 },
        { day: "Mar", morning: 80, afternoon: 85, evening: 78 },
        { day: "Mié", morning: 72, afternoon: 88, evening: 75 },
        { day: "Jue", morning: 85, afternoon: 90, evening: 82 },
        { day: "Vie", morning: 88, afternoon: 86, evening: 80 },
      ]);
    }

    if (!classComparison || classComparison.length === 0) {
      setClassComparison([
        { metric: "Atención", student: 78, classAvg: 75 },
        { metric: "Asistencia", student: 92, classAvg: 85 },
        { metric: "Participación", student: 70, classAvg: 72 },
      ]);
    }
  }, []);

  const generateReportHTML = (data: any) => {
    const s = data.summary || {};
    const timeline = data.timeline || [];
    const byHour = data.by_hour || [];
    const classComp = data.class_comparison || [];
    const pom = data.pomodoro_metrics || {};

    const formatMinutes = (mins: number) => `${Math.floor(mins/60)}h ${mins%60}m`;

    return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Reporte de Atención</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #111827; padding: 28px; }
          .header { display:flex; justify-content:space-between; align-items:center; border-bottom: 4px solid #ff7a34; padding-bottom:12px; margin-bottom:18px }
          .title { font-size:20px; font-weight:700 }
          .badge { background: linear-gradient(90deg,#f97316,#fb923c); color: white; padding:6px 10px; border-radius:8px; font-weight:600 }
          .section { margin-top:18px }
          .grid { display:grid; grid-template-columns: repeat(2,1fr); gap:12px }
          .card { border:1px solid #e6e6e6; padding:12px; border-radius:8px; background: #fff }
          table { width:100%; border-collapse:collapse; margin-top:8px }
          th, td { padding:8px; text-align:left; border-bottom:1px solid #f0f0f0 }
          th { background:#fafafa; font-weight:600 }
          .small { font-size:12px; color:#6b7280 }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Reporte Individual de Atención</div>
            <div class="small">Generado: ${new Date().toLocaleString()}</div>
          </div>
          <div class="badge">Periodo: ${s.period || selectedPeriod}</div>
        </div>

        <div class="section grid">
          <div class="card">
            <h3>Resumen</h3>
            <p><strong>Atención promedio:</strong> ${s.average_attention || s.averageAttention || 0}%</p>
            <p><strong>Sesiones:</strong> ${s.total_sessions || s.totalSessions || 0}</p>
            <p><strong>Tiempo efectivo:</strong> ${formatMinutes(s.total_minutes || s.totalMinutes || 0)}</p>
          </div>

          <div class="card">
            <h3>Pomodoro</h3>
            <p><strong>Eventos:</strong> ${pom.total_events || 0}</p>
            <p><strong>Pausas automáticas:</strong> ${pom.auto_pauses || 0}</p>
            <p><strong>Tiempo efectivo:</strong> ${formatMinutes(pom.effective_minutes || pom.effective_seconds || 0)}</p>
          </div>
        </div>

        <div class="section card">
          <h3>Evolución temporal (últimas sesiones)</h3>
          <table>
            <thead><tr><th>Fecha / Hora</th><th>Atención</th></tr></thead>
            <tbody>
              ${timeline.map((t: any) => `<tr><td>${new Date(t.timestamp).toLocaleString()}</td><td>${t.attention}%</td></tr>`).join('')}
            </tbody>
          </table>
        </div>

        <div class="section grid">
          <div class="card">
            <h3>Atención por hora</h3>
            <table>
              <thead><tr><th>Hora</th><th>Atención</th></tr></thead>
              <tbody>${byHour.map((h: any) => `<tr><td>${h.hour}:00</td><td>${h.attention}%</td></tr>`).join('')}</tbody>
            </table>
          </div>

          <div class="card">
            <h3>Comparación con grupo</h3>
            <table>
              <thead><tr><th>Curso</th><th>Tu promedio</th><th>Promedio grupo</th></tr></thead>
              <tbody>${classComp.map((c: any) => `<tr><td>${c.course_name || c.course}</td><td>${c.student_avg}%</td><td>${c.class_avg}%</td></tr>`).join('')}</tbody>
            </table>
          </div>
        </div>

        <div class="small" style="margin-top:18px;">Reporte generado por Proyecto_IA — usa estos datos para mejorar tu desempeño.</div>
      </body>
      </html>
    `;
  };

  const downloadReport = () => {
    const data = reportData || {
      summary: generalMetrics,
      timeline: attentionTimeline,
      by_hour: attentionByHour,
      class_comparison: classComparison,
      pomodoro_metrics: pomodoroMetrics,
    };

    // Abrir nueva ventana con HTML listo para imprimir -> guardar como PDF desde el diálogo de impresión
    try {
      const html = generateReportHTML(data);
      const w = window.open('', '_blank', 'noopener');
      if (!w) throw new Error('Win blocked');
      w.document.open();
      w.document.write(html);
      w.document.close();

      // Esperar un breve momento para que el navegador renderice, luego lanzar impresión
      setTimeout(() => {
        w.focus();
        w.print();
        // No cerrar automáticamente — algunos navegadores bloquean close(). Dejar en manos del usuario.
      }, 600);
    } catch (err) {
      console.error('Error generando PDF, se descargará JSON como fallback', err);
      // fallback JSON
      try {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `student_report_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error('Error descargando fallback JSON', e);
      }
    }
  };

  // New: PDF generation using html2canvas + jsPDF
  const downloadPDF = async () => {
    setPdfGenerating(true);
    const data = reportData || {
      summary: generalMetrics,
      timeline: attentionTimeline,
      by_hour: attentionByHour,
      class_comparison: classComparison,
      pomodoro_metrics: pomodoroMetrics,
    };

    try {
      // Ensure the report DOM is updated (we render a hidden copy below)
      await new Promise((r) => setTimeout(r, 120));
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      if (!reportRef.current) throw new Error('Elemento de reporte no encontrado');
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`student_report_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      console.error('Error generando PDF, abriendo impresión como fallback', err);
      // fallback a imprimir o JSON
      downloadReport();
    } finally {
      setPdfGenerating(false);
    }
  };

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

    // Análisis de horarios (protegido contra arrays vacíos)
    if (Array.isArray(attentionByHour) && attentionByHour.length > 0) {
      const bestHour = attentionByHour.reduce((prev, current) => 
        prev.attention > current.attention ? prev : current
      );
      recommendations.push({
        type: "info",
        title: "Horario óptimo identificado",
        text: `Tu mejor rendimiento se registra a las ${bestHour.hour} con un ${bestHour.attention}% de atención. Intenta programar actividades importantes en este horario.`,
      });
    } else {
      recommendations.push({
        type: "info",
        title: "Horario óptimo no disponible",
        text: "Aún no hay datos suficientes por horario. Asiste a más sesiones para que el sistema identifique tu mejor franja horaria.",
      });
    }

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
          <Button variant="outline" onClick={() => downloadPDF()} disabled={reportLoading || pdfGenerating}>
            <Download className="w-4 h-4 mr-2" />
            {pdfGenerating ? 'Generando PDF...' : (reportLoading ? 'Generando...' : 'Descargar Reporte')}
          </Button>
        </div>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-gray-900 mb-2">Reporte Individual de Atención</h1>
            <p className="text-gray-600">
              {user ? `${user.first_name || user.username || user.email} • ${user.user_code || `USR${String(user.id).padStart(3,'0')}`} • Estudiante` : 'Usuario no autenticado'}
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            Período: {reportData?.summary?.period || (selectedPeriod === 'month' ? 'Último mes' : selectedPeriod)}
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
                {courses.map((subject: any) => (
                  <SelectItem key={subject.id} value={String(subject.id)}>
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
                  {courses.find((s: any) => String(s.id) === selectedSubject)?.name}
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
                <p className="text-gray-900">{new Date().toLocaleDateString()}</p>
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

        {/* Hidden printable report area (off-screen for PDF capture) */}
        <div ref={reportRef as any} style={{ position: 'absolute', left: -9999, top: 0, width: 800, background: '#fff', padding: 24 }} aria-hidden>
          <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial', color: '#111827' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #ff7a34', paddingBottom: 12, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>Reporte Individual de Atención</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Generado: {new Date().toLocaleString()}</div>
              </div>
              <div style={{ background: 'linear-gradient(90deg,#f97316,#fb923c)', color: 'white', padding: '6px 10px', borderRadius: 8, fontWeight: 600 }}>Periodo: {generalMetrics.period || selectedPeriod}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ border: '1px solid #e6e6e6', padding: 12, borderRadius: 8 }}>
                <h3>Resumen</h3>
                <p><strong>Atención promedio:</strong> {generalMetrics.averageAttention}%</p>
                <p><strong>Sesiones:</strong> {generalMetrics.totalSessions}</p>
                <p><strong>Tiempo efectivo:</strong> {Math.floor(generalMetrics.totalMinutes/60)}h {generalMetrics.totalMinutes%60}m</p>
              </div>

              <div style={{ border: '1px solid #e6e6e6', padding: 12, borderRadius: 8 }}>
                <h3>Pomodoro</h3>
                <p><strong>Eventos:</strong> {pomodoroMetrics.total_events || 0}</p>
                <p><strong>Pausas automáticas:</strong> {pomodoroMetrics.auto_pauses || 0}</p>
                <p><strong>Tiempo efectivo:</strong> {Math.floor((pomodoroMetrics.effective_minutes||pomodoroMetrics.effective_seconds||0)/60)}h {(pomodoroMetrics.effective_minutes||pomodoroMetrics.effective_seconds||0)%60}m</p>
              </div>
            </div>

            <div style={{ border: '1px solid #e6e6e6', padding: 12, borderRadius: 8, marginTop: 12 }}>
              <h3>Evolución temporal (últimas sesiones)</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                <thead><tr style={{ background: '#fafafa', fontWeight: 600 }}><th style={{ padding: 8, textAlign: 'left' }}>Fecha / Hora</th><th style={{ padding: 8, textAlign: 'left' }}>Atención</th></tr></thead>
                <tbody>{attentionTimeline.map((t, i) => <tr key={'r-'+i}><td style={{ padding:8 }}>{new Date(t.timestamp).toLocaleString()}</td><td style={{ padding:8 }}>{t.attention}%</td></tr>)}</tbody>
              </table>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div style={{ border: '1px solid #e6e6e6', padding: 12, borderRadius: 8 }}>
                <h3>Atención por hora</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                  <thead><tr style={{ background: '#fafafa', fontWeight: 600 }}><th style={{ padding:8 }}>Hora</th><th style={{ padding:8 }}>Atención</th></tr></thead>
                  <tbody>{(attentionByHour||[]).map((h, idx) => <tr key={'h-'+idx}><td style={{ padding:8 }}>{String(h.hour)}:00</td><td style={{ padding:8 }}>{h.attention}%</td></tr>)}</tbody>
                </table>
              </div>

              <div style={{ border: '1px solid #e6e6e6', padding: 12, borderRadius: 8 }}>
                <h3>Comparación con grupo</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                  <thead><tr style={{ background: '#fafafa', fontWeight: 600 }}><th style={{ padding:8 }}>Curso</th><th style={{ padding:8 }}>Tu promedio</th><th style={{ padding:8 }}>Promedio grupo</th></tr></thead>
                  <tbody>{(classComparison||[]).map((c,idx) => <tr key={'c-'+idx}><td style={{ padding:8 }}>{c.course_name || c.course}</td><td style={{ padding:8 }}>{c.student_avg}%</td><td style={{ padding:8 }}>{c.class_avg}%</td></tr>)}</tbody>
                </table>
              </div>
            </div>

            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 12 }}>Reporte generado por Proyecto_IA — usa estos datos para mejorar tu desempeño.</div>
          </div>
        </div>

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
