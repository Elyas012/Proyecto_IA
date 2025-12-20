import { useEffect, useState } from 'react';
import api, { getCourseMaterials } from '../lib/api'; // Import api for delete/update calls
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { FileText, Video, Eye, Download, Trash2, ToggleRight, ToggleLeft } from 'lucide-react'; // Added Trash2, ToggleRight, ToggleLeft icons
import { toast } from 'sonner'; // For notifications
import PdfViewer from './PdfViewer'; // Import new PdfViewer component
import VideoPlayer from './VideoPlayer'; // Import new VideoPlayer component

interface CourseMaterial {
    id: number;
    title: string;
    file: string;
    material_type: 'pdf' | 'video';
    is_active: boolean; // Added is_active field
}

interface CourseMaterialsProps {
    courseId: string | number | null;
    isTeacherView?: boolean; // New prop to enable teacher-specific actions
    token?: string | null; // Token for authenticated API calls
    onMaterialChange?: () => void; // Callback for when materials are changed (deleted/toggled)
}

const CourseMaterials = ({ courseId, isTeacherView = false, token, onMaterialChange }: CourseMaterialsProps) => {
    const [materials, setMaterials] = useState<CourseMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchMaterials = async () => {
        if (!courseId) {
            setLoading(false);
            setMaterials([]);
            return;
        };
        setLoading(true);
        try {
            const response = await getCourseMaterials(String(courseId));
            // Filter materials if not in teacher view
            setMaterials(isTeacherView ? response : response.filter((mat: CourseMaterial) => mat.is_active));
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
    }, [courseId, isTeacherView]); // Re-fetch when courseId or view type changes

    const handleMaterialClick = (material: CourseMaterial) => {
        setSelectedMaterial(material);
        setIsDialogOpen(true);
    };

    const handleDeleteMaterial = async (materialId: number) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este material?')) {
            return;
        }
        if (!token) {
            toast.error("No autorizado para eliminar material.");
            return;
        }

        try {
            await api.delete(`/course-materials/${materialId}/`, {
                headers: {
                    Authorization: `Token ${token}`,
                },
            });
            toast.success('Material eliminado correctamente.');
            onMaterialChange?.(); // Notify parent component
            fetchMaterials(); // Re-fetch materials to update the list
        } catch (err) {
            console.error('Error deleting material:', err);
            toast.error('Error al eliminar el material.');
        }
    };

    const handleToggleActive = async (material: CourseMaterial) => {
        if (!token) {
            toast.error("No autorizado para modificar material.");
            return;
        }

        try {
            await api.patch(`/course-materials/${material.id}/`, {
                is_active: !material.is_active,
            }, {
                headers: {
                    Authorization: `Token ${token}`,
                },
            });
            toast.success(`Material ${material.is_active ? 'desactivado' : 'activado'} correctamente.`);
            onMaterialChange?.(); // Notify parent component
            fetchMaterials(); // Re-fetch materials to update the list
        } catch (err) {
            console.error('Error toggling material status:', err);
            toast.error('Error al cambiar el estado del material.');
        }
    };

    if (loading) return <p>Cargando materiales...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    const dialogClassName = selectedMaterial?.material_type === 'video' 
        ? "max-w-6xl h-[70vh] w-[800px]" // Wider for videos
        : "max-w-4xl h-[95vh]"; // Keep existing for PDFs and others

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Material del Curso</CardTitle>
                </CardHeader>
                <CardContent>
                    {materials.length === 0 ? (
                        <p>No hay materiales para este curso.</p>
                    ) : (
                        <ul className="space-y-3">
                            {materials.map((material) => (
                                <li key={material.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100">
                                    <div className="flex items-center space-x-3">
                                        {material.material_type === 'pdf' ? <FileText className="h-6 w-6 text-blue-500" /> : <Video className="h-6 w-6 text-green-500" />}
                                        <span className={!material.is_active && isTeacherView ? "line-through text-gray-500" : ""}>{material.title}</span>
                                        {isTeacherView && !material.is_active && (
                                            <span className="text-sm text-red-500 ml-2">(Inactivo)</span>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {isTeacherView && (
                                            <>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    onClick={() => handleToggleActive(material)}
                                                    title={material.is_active ? "Desactivar material" : "Activar material"}
                                                >
                                                    {material.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="destructive" 
                                                    onClick={() => handleDeleteMaterial(material.id)}
                                                    title="Eliminar material"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                        <Button size="sm" onClick={() => handleMaterialClick(material)}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            Ver
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className={dialogClassName}>
                    <DialogHeader>
                        <DialogTitle>{selectedMaterial?.title}</DialogTitle>
                    </DialogHeader>
                    <div>
                        {selectedMaterial && (
                            selectedMaterial.material_type === 'pdf' ? (
                                <div className="h-150 w-full">
                                    <PdfViewer material={selectedMaterial} API_URL={API_URL} />
                                </div>
                            ) : (
                                <div className="h-full w-117">
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


