import { useState } from 'react';
import api from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { toast } from 'sonner';
import { Upload, Link as LinkIcon } from 'lucide-react';

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
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file'); // Nuevo: modo de subida
  const [videoUrl, setVideoUrl] = useState(''); // Nuevo: URL del video

  const normalizeVideoUrl = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return '';

    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    try {
      const parsed = new URL(withProtocol);
      const host = parsed.hostname.replace(/^www\./, '');

      if (host === 'youtu.be') {
        const id = parsed.pathname.replace('/', '');
        if (id) return `https://www.youtube.com/watch?v=${id}`;
      }

      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
        if (parsed.pathname.startsWith('/shorts/')) {
          const id = parsed.pathname.split('/')[2];
          if (id) return `https://www.youtube.com/watch?v=${id}`;
        }
      }

      return withProtocol;
    } catch {
      return '';
    }
  };

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

    // Validación según el modo
    if (uploadMode === 'file' && (!file || !title)) {
      toast.error('Por favor, selecciona un archivo y añade un título.');
      return;
    }

    if (uploadMode === 'url' && (!videoUrl || !title)) {
      toast.error('Por favor, ingresa una URL de video y un título.');
      return;
    }

    const normalizedVideoUrl = uploadMode === 'url' ? normalizeVideoUrl(videoUrl) : '';

    if (uploadMode === 'url' && !normalizedVideoUrl) {
      toast.error('La URL del video no es válida.');
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
    
    if (uploadMode === 'file' && file) {
      formData.append('file', file);
      formData.append('file_type', fileType);
    } else if (uploadMode === 'url') {
      formData.append('video_url', normalizedVideoUrl);
      formData.append('file_type', 'link'); // Tipo especial para videos con URL
    }

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
      setVideoUrl('');
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
          {/* Selector de modo: Archivo o URL */}
          <div className="space-y-3">
            <Label>Tipo de Material</Label>
            <RadioGroup value={uploadMode} onValueChange={(value: 'file' | 'url') => setUploadMode(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="file" id="file-mode" />
                <Label htmlFor="file-mode" className="flex items-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Subir Archivo (PDF o Video)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="url" id="url-mode" />
                <Label htmlFor="url-mode" className="flex items-center gap-2 cursor-pointer">
                  <LinkIcon className="w-4 h-4" />
                  URL de Video (YouTube, Vimeo, etc.)
                </Label>
              </div>
            </RadioGroup>
          </div>

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

          {/* Campo de archivo (solo si modo = file) */}
          {uploadMode === 'file' && (
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
          )}

          {/* Campo de URL (solo si modo = url) */}
          {uploadMode === 'url' && (
            <div>
              <Label htmlFor="videoUrl">URL del Video</Label>
              <Input
                id="videoUrl"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=xxxxx"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Soporta: YouTube, Vimeo, Dailymotion, SoundCloud y más
              </p>
            </div>
          )}

          <Button type="submit" disabled={uploading} className="w-full">
            {uploading ? 'Subiendo...' : uploadMode === 'file' ? 'Subir Material' : 'Agregar Video'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
