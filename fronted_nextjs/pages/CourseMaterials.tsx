import { useState, useEffect } from "react";
import api, { BASE_URL } from 'matias/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "matias/components/ui/card";
import { Button } from "matias/components/ui/button";
import { FileText, Video, Download, ExternalLink } from "lucide-react";
import PdfViewerComponent from 'matias/components/PdfViewerComponent';

interface Material {
  id: number;
  title: string;
  description: string;
  file: string;
  material_type?: string;
  uploaded_at: string;
}

interface CourseMaterialsProps {
  courseId: string | null;
}

export default function CourseMaterials({ courseId }: CourseMaterialsProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchMaterials();
    }
  }, [courseId]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      // Usamos el endpoint que confirmaste que funciona en los logs
      const response = await api.get(`/course-materials/by-course/${courseId}/`);
      setMaterials(response.data);
      if (response.data.length > 0) {
        setSelectedMaterial(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      setLoading(false);
    }
  };

  const isPdf = (fileUrl: string) => {
    return fileUrl.toLowerCase().endsWith('.pdf');
  };

  const isVideo = (fileUrl: string) => {
    const ext = fileUrl.toLowerCase().split('.').pop();
    return ['mp4', 'webm', 'ogg', 'mov'].includes(ext || '');
  };

  if (!courseId) return null;

  return (
    <Card className="h-full flex flex-col mt-6">
      <CardHeader>
        <CardTitle>Materiales de Estudio</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-4">Cargando materiales...</div>
        ) : materials.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No hay materiales disponibles para este curso.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selector de materiales si hay más de uno */}
            {materials.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {materials.map((material) => (
                  <Button
                    key={material.id}
                    variant={selectedMaterial?.id === material.id ? "default" : "outline"}
                    onClick={() => setSelectedMaterial(material)}
                    className="whitespace-nowrap"
                    size="sm"
                  >
                    {isPdf(material.file) ? <FileText className="w-4 h-4 mr-2" /> : <Video className="w-4 h-4 mr-2" />}
                    {material.title || "Material"}
                  </Button>
                ))}
              </div>
            )}

            {/* Visualizador */}
            {selectedMaterial && (
              <div className="border rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                {isPdf(selectedMaterial.file) ? (
                  <div className="w-full h-auto">
                    <PdfViewerComponent file={BASE_URL + selectedMaterial.file} />
                  </div>
                ) : isVideo(selectedMaterial.file) ? (
                  <div className="bg-black flex justify-center">
                    <video 
                      src={BASE_URL + selectedMaterial.file} 
                      controls 
                      className="max-h-[500px] w-auto" 
                    />
                  </div>
                ) : (
                  <div className="p-12 text-center flex flex-col items-center justify-center">
                    <FileText className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="mb-4 text-gray-600">Este archivo no se puede previsualizar aquí.</p>
                    <Button asChild>
                      <a href={BASE_URL + selectedMaterial.file} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-2" />
                        Descargar {selectedMaterial.title}
                      </a>
                    </Button>
                  </div>
                )}
                
                <div className="p-4 bg-white border-t">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedMaterial.title}</h3>
                      {selectedMaterial.description && (
                        <p className="text-sm text-gray-600 mt-1">{selectedMaterial.description}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={BASE_URL + selectedMaterial.file} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}