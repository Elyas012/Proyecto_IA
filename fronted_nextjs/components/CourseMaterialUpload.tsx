import { useState } from 'react';
import api from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';

interface CourseMaterialUploadProps {
  courseId: number;
  token: string | null;
  onUploadSuccess: () => void;
}

export default function CourseMaterialUpload({ courseId, token, onUploadSuccess }: CourseMaterialUploadProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState('other');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
        if (selectedFile.type.startsWith('video/')) {
            setFileType('video');
        } else if (selectedFile.type === 'application/pdf') {
            setFileType('pdf');
        } else {
            setFileType('other');
        }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!file || !title) {
      toast.error('Por favor, selecciona un archivo y añade un título.');
      return;
    }

    if (!token) {
        toast.error('No estás autenticado.');
        return;
    }

    const formData = new FormData();
    formData.append('course', String(courseId));
    formData.append('title', title);
    formData.append('description', description);
    formData.append('file', file);
    formData.append('file_type', fileType);

    setUploading(true);

    try {
      await api.post('/course-materials/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Token ${token}`,
        },
      });

      toast.success('Material subido exitosamente.');
      onUploadSuccess();
      // Reset form
      setTitle('');
      setDescription('');
      setFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Hubo un error al subir el material.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir Nuevo Material al Curso</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título del Material</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Guía de Estudio - Semana 3"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción del contenido del material"
            />
          </div>
          <div>
            <Label htmlFor="file">Archivo (PDF o Video)</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,video/*"
              required
            />
          </div>
          <Button type="submit" disabled={uploading}>
            {uploading ? 'Subiendo...' : 'Subir Material'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
