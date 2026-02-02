import { useEffect, useState } from 'react';
import api, { getCourseMaterials } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileText, Video, Eye, Trash2, ToggleRight, ToggleLeft, Sparkles, PlayCircle, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import PdfViewer from './PdfViewer';
import VideoPlayer from './VideoPlayer';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// --- INTERFACES ---
interface CourseMaterial {
    id: number;
    title: string;
    file: string;
    material_type: 'pdf' | 'video';
    is_active: boolean;
    has_quiz?: boolean;
}

interface Question {
    id: number;
    text: string;
    options: string[];
}

interface QuizData {
    quiz_id: number;
    title: string;
    questions: Question[];
}

interface QuizResult {
    score: number;
    feedback: string;
    passed: boolean;
}

interface CourseMaterialsProps {
    courseId: string | number | null;
    isTeacherView?: boolean; 
    userRole?: "student" | "teacher" | "admin";
    token?: string | null;
    onMaterialChange?: () => void;
}

const CourseMaterials = ({ 
    courseId, 
    isTeacherView = false, 
    userRole = "student",
    token, 
    onMaterialChange
}: CourseMaterialsProps) => {
    // --- ESTADOS GENERALES ---
    const [materials, setMaterials] = useState<CourseMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // --- ESTADOS PARA EL VISOR DE PDF/VIDEO ---
    const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);

    // --- ESTADOS PARA EL QUIZ (NUEVO) ---
    const [isQuizOpen, setIsQuizOpen] = useState(false);
    const [quizData, setQuizData] = useState<QuizData | null>(null);
    const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
    const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
    const [loadingQuiz, setLoadingQuiz] = useState(false);
    const [submittingQuiz, setSubmittingQuiz] = useState(false);
    const [generatingId, setGeneratingId] = useState<number | null>(null);

    const isTeacher = isTeacherView || userRole === 'teacher';
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    // Cargar materiales
    const fetchMaterials = async () => {
        if (!courseId) {
            setLoading(false);
            setMaterials([]);
            return;
        };
        setLoading(true);
        try {
            const response = await getCourseMaterials(String(courseId));
            const filtered = isTeacher ? response : response.filter((mat: CourseMaterial) => mat.is_active);
            setMaterials(filtered);
            setError(null);
        } catch (err) {
            setError('No se pudo cargar el material del curso.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId, isTeacherView, userRole]); 

    // --- MANEJADORES DE MATERIALES ---
    const handleMaterialClick = (material: CourseMaterial) => {
        setSelectedMaterial(material);
        setIsViewerOpen(true);
    };

    const handleDeleteMaterial = async (materialId: number) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este material?')) return;
        try {
            await api.delete(`/course-materials/${materialId}/`);
            toast.success('Material eliminado correctamente.');
            onMaterialChange?.();
            fetchMaterials();
        } catch (err) {
            toast.error('Error al eliminar el material.');
        }
    };

    const handleToggleActive = async (material: CourseMaterial) => {
        try {
            await api.patch(`/course-materials/${material.id}/`, { is_active: !material.is_active });
            toast.success(`Material ${material.is_active ? 'desactivado' : 'activado'}.`);
            onMaterialChange?.();
            fetchMaterials();
        } catch (err) {
            toast.error('Error al cambiar estado.');
        }
    };

    const handleGenerateQuiz = async (materialId: number) => {
        setGeneratingId(materialId);
        toast.info("Gemini está leyendo el documento...");
        try {
            await api.post('/teacher/generate-quiz', { material_id: materialId });
            toast.success("¡Evaluación generada con IA!");
            fetchMaterials(); 
        } catch (error) {
            toast.error("Error al generar evaluación. Verifica el archivo.");
        } finally {
            setGeneratingId(null);
        }
    };

    // --- NUEVA LÓGICA: TOMAR QUIZ ---
    const handleTakeQuiz = async (materialId: number) => {
        setLoadingQuiz(true);
        setQuizResult(null); // Resetear resultados anteriores
        setQuizAnswers({});  // Resetear respuestas anteriores
        setIsQuizOpen(true); // Abrir modal inmediatamente para mostrar loading

        try {
            // Llamada a la ruta que corregimos en urls.py
            const response = await api.get(`/course-materials/${materialId}/quiz`);
            setQuizData(response.data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando la prueba.");
            setIsQuizOpen(false);
        } finally {
            setLoadingQuiz(false);
        }
    };

    const handleAnswerChange = (questionId: number, optionIndex: number) => {
        setQuizAnswers(prev => ({
            ...prev,
            [questionId]: optionIndex
        }));
    };

    const handleSubmitQuiz = async () => {
        if (!quizData) return;
        
        // Validación básica
        if (Object.keys(quizAnswers).length < quizData.questions.length) {
            toast.warning("Por favor responde todas las preguntas antes de enviar.");
            return;
        }

        setSubmittingQuiz(true);
        try {
            const response = await api.post('/student/submit-quiz', {
                quiz_id: quizData.quiz_id,
                answers: quizAnswers
            });
            setQuizResult(response.data);
        } catch (error) {
            console.error(error);
            toast.error("Error al calificar la prueba.");
        } finally {
            setSubmittingQuiz(false);
        }
    };

    // --- RENDER ---
    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
    if (error) return <p className="text-red-500">{error}</p>;

    const viewerDialogClass = selectedMaterial?.material_type === 'video' 
        ? "max-w-6xl h-[70vh] w-[800px]" 
        : "max-w-4xl h-[95vh]";

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Material del Curso</CardTitle>
                </CardHeader>
                <CardContent>
                    {materials.length === 0 ? (
                        <p className="text-gray-500 text-sm">No hay materiales disponibles.</p>
                    ) : (
                        <div className="space-y-3">
                            {materials.map((material) => (
                                <div key={material.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-lg border hover:border-slate-300 transition-colors gap-3">
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        <div className="bg-white p-2 rounded shadow-sm shrink-0">
                                            {material.material_type === 'pdf' 
                                                ? <FileText className="h-6 w-6 text-red-500" /> 
                                                : <Video className="h-6 w-6 text-blue-500" />
                                            }
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`font-medium truncate ${!material.is_active && isTeacher ? "line-through text-gray-400" : ""}`}>
                                                {material.title}
                                            </p>
                                            {isTeacher && !material.is_active && (
                                                <span className="text-xs text-red-500 font-semibold">(Oculto al estudiante)</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                        <Button size="sm" variant="ghost" onClick={() => handleMaterialClick(material)}>
                                            <Eye className="h-4 w-4 mr-2" /> Ver
                                        </Button>

                                        {isTeacher && (
                                            <>
                                                {!material.has_quiz ? (
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        className="border-violet-200 text-violet-700 hover:bg-violet-50"
                                                        onClick={() => handleGenerateQuiz(material.id)}
                                                        disabled={generatingId === material.id}
                                                    >
                                                        {generatingId === material.id 
                                                            ? <Loader2 className="w-3 h-3 animate-spin"/> 
                                                            : <Sparkles className="w-3 h-3 mr-1" />
                                                        }
                                                        IA Quiz
                                                    </Button>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                        Quiz Activo
                                                    </Badge>
                                                )}

                                                <Button size="sm" variant="ghost" onClick={() => handleToggleActive(material)}>
                                                    {material.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                                </Button>
                                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteMaterial(material.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}

                                        {!isTeacher && material.has_quiz && (
                                            <Button 
                                                size="sm" 
                                                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                                                onClick={() => handleTakeQuiz(material.id)} // <--- AHORA LLAMA A LA FUNCIÓN LOCAL
                                            >
                                                <PlayCircle className="w-3 h-3 mr-1" />
                                                Prueba
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* MODAL VISOR PDF/VIDEO */}
            <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
                <DialogContent className={viewerDialogClass}>
                    <DialogHeader>
                        <DialogTitle>{selectedMaterial?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="w-full h-full overflow-hidden rounded-md bg-black/5">
                        {selectedMaterial && (
                            selectedMaterial.material_type === 'pdf' ? (
                                <div className="h-full w-full min-h-[500px]">
                                    <PdfViewer material={selectedMaterial} API_URL={API_URL} />
                                </div>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                    <VideoPlayer material={selectedMaterial} API_URL={API_URL} />
                                </div>
                            )
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* MODAL DEL QUIZ (NUEVO) */}
            <Dialog open={isQuizOpen} onOpenChange={setIsQuizOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{loadingQuiz ? "Cargando..." : quizData?.title || "Evaluación"}</DialogTitle>
                    </DialogHeader>

                    {loadingQuiz ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-3">
                            <Loader2 className="w-10 h-10 animate-spin text-cyan-600" />
                            <p className="text-gray-500">Obteniendo preguntas...</p>
                        </div>
                    ) : quizResult ? (
                        // VISTA DE RESULTADOS
                        <div className="flex flex-col items-center space-y-6 py-6 text-center animate-in fade-in zoom-in">
                            {quizResult.passed ? (
                                <div className="bg-green-100 p-4 rounded-full">
                                    <CheckCircle className="w-16 h-16 text-green-600" />
                                </div>
                            ) : (
                                <div className="bg-red-100 p-4 rounded-full">
                                    <XCircle className="w-16 h-16 text-red-600" />
                                </div>
                            )}
                            
                            <div>
                                <h3 className="text-2xl font-bold mb-1">Tu calificación: {quizResult.score.toFixed(1)}/10</h3>
                                <p className={`text-lg font-medium ${quizResult.passed ? "text-green-600" : "text-red-600"}`}>
                                    {quizResult.passed ? "¡Aprobado!" : "Sigue intentando"}
                                </p>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg border w-full text-left">
                                <h4 className="font-semibold flex items-center gap-2 mb-2 text-slate-700">
                                    <Sparkles className="w-4 h-4 text-yellow-500" /> Feedback de IA:
                                </h4>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {quizResult.feedback}
                                </p>
                            </div>

                            <Button onClick={() => setIsQuizOpen(false)} className="w-full">
                                Cerrar y Continuar
                            </Button>
                        </div>
                    ) : (
                        // VISTA DEL EXAMEN
                        <div className="space-y-6">
                            {quizData?.questions.map((q, idx) => (
                                <div key={q.id} className="bg-slate-50 p-4 rounded-lg border">
                                    <h4 className="font-medium mb-3 text-slate-900 flex gap-2">
                                        <span className="font-bold text-cyan-600">{idx + 1}.</span> {q.text}
                                    </h4>
                                    <RadioGroup 
                                        onValueChange={(val) => handleAnswerChange(q.id, parseInt(val))}
                                        value={quizAnswers[q.id]?.toString()}
                                    >
                                        {q.options.map((opt, optIdx) => (
                                            <div key={optIdx} className="flex items-center space-x-2 mb-2">
                                                <RadioGroupItem value={optIdx.toString()} id={`q${q.id}-opt${optIdx}`} />
                                                <Label htmlFor={`q${q.id}-opt${optIdx}`} className="cursor-pointer font-normal text-slate-700">
                                                    {opt}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            ))}

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsQuizOpen(false)} disabled={submittingQuiz}>
                                    Cancelar
                                </Button>
                                <Button 
                                    onClick={handleSubmitQuiz} 
                                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                                    disabled={submittingQuiz}
                                >
                                    {submittingQuiz ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Calificando...
                                        </>
                                    ) : (
                                        "Enviar Respuestas"
                                    )}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default CourseMaterials;