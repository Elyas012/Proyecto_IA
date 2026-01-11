import { useEffect, useState } from 'react';
import api, { getCourseMaterials } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Video, Eye, Trash2, ToggleRight, ToggleLeft, Sparkles, PlayCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import PdfViewer from './PdfViewer';
import VideoPlayer from './VideoPlayer';
import { Badge } from '@/components/ui/badge';

interface CourseMaterial {
    id: number;
    title: string;
    file: string;
    material_type: 'pdf' | 'video';
    is_active: boolean;
    has_quiz?: boolean;
}

interface CourseMaterialsProps {
    courseId: string | number | null;
    isTeacherView?: boolean; 
    userRole?: "student" | "teacher" | "admin";
    token?: string | null;
    onMaterialChange?: () => void;
    onOpenQuiz?: (materialId: number) => void;
}

const CourseMaterials = ({ 
    courseId, 
    isTeacherView = false, 
    userRole = "student",
    token, 
    onMaterialChange,
    onOpenQuiz 
}: CourseMaterialsProps) => {
    const [materials, setMaterials] = useState<CourseMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [generatingId, setGeneratingId] = useState<number | null>(null);

    // Lógica para determinar si es profesor
    const isTeacher = isTeacherView || userRole === 'teacher';

    const fetchMaterials = async () => {
        if (!courseId) {
            setLoading(false);
            setMaterials([]);
            return;
        };
        setLoading(true);
        try {
            const response = await getCourseMaterials(String(courseId));
            // Filtrar materiales si no es profesor
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

    const handleMaterialClick = (material: CourseMaterial) => {
        setSelectedMaterial(material);
        setIsDialogOpen(true);
    };

    const handleDeleteMaterial = async (materialId: number) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este material?')) return;
        
        try {
            await api.delete(`/course-materials/${materialId}/`, {
                headers: token ? { Authorization: `Token ${token}` } : {},
            });
            toast.success('Material eliminado correctamente.');
            onMaterialChange?.();
            fetchMaterials();
        } catch (err) {
            console.error(err);
            toast.error('Error al eliminar el material.');
        }
    };

    const handleToggleActive = async (material: CourseMaterial) => {
        try {
            await api.patch(`/course-materials/${material.id}/`, {
                is_active: !material.is_active,
            }, {
                headers: token ? { Authorization: `Token ${token}` } : {},
            });
            toast.success(`Material ${material.is_active ? 'desactivado' : 'activado'}.`);
            onMaterialChange?.();
            fetchMaterials();
        } catch (err) {
            console.error(err);
            toast.error('Error al cambiar estado.');
        }
    };

    const handleGenerateQuiz = async (materialId: number) => {
        setGeneratingId(materialId);
        toast.info("Gemini está leyendo el documento...");
        
        try {
            await api.post('/teacher/generate-quiz/', { material_id: materialId });
            toast.success("¡Evaluación generada con IA!");
            fetchMaterials(); 
        } catch (error) {
            toast.error("Error al generar evaluación. Verifica el contenido del archivo.");
        } finally {
            setGeneratingId(null);
        }
    };

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
    if (error) return <p className="text-red-500">{error}</p>;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const dialogClassName = selectedMaterial?.material_type === 'video' 
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
                                                onClick={() => onOpenQuiz && onOpenQuiz(material.id)}
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className={dialogClassName}>
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
        </>
    );
};

export default CourseMaterials;