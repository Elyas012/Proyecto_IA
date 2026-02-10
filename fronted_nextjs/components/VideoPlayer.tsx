import { Download, Video, PlayCircle } from 'lucide-react';
import React, { useState } from 'react';
import { resolveApiUrl } from '../lib/api';
import dynamic from 'next/dynamic';

// Importar ReactPlayer dinámicamente para evitar problemas con SSR
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

interface VideoPlayerProps {
    material: {
        id: number;
        title: string;
        file_url?: string;
        video_url?: string;
    };
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ material }) => {
    const [playing, setPlaying] = useState(false);
    const [ready, setReady] = useState(false);

    console.log('VideoPlayer montado:', { 
        id: material.id, 
        title: material.title,
        video_url: material.video_url,
        file_url: material.file_url 
    });

    // Si hay video_url, usarlo (YouTube, Vimeo, etc.)
    if (material.video_url) {
        return (
            <div className="relative bg-black aspect-video rounded-lg overflow-hidden">
                {!ready && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <div className="text-white">Cargando video...</div>
                    </div>
                )}
                <ReactPlayer
                    url={material.video_url}
                    playing={false}
                    volume={0.8}
                    controls={true}
                    width="100%"
                    height="100%"
                    onReady={() => {
                        console.log('ReactPlayer listo');
                        setReady(true);
                    }}
                    onError={(e) => {
                        console.error('Error en ReactPlayer:', e);
                    }}
                />
            </div>
        );
    }

    // Si no hay video_url, usar el archivo subido (comportamiento original)
    if (!material.file_url) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-gray-100 rounded-md aspect-video">
                <Video className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No hay video disponible</p>
            </div>
        );
    }

    const isWmv = material.file_url.toLowerCase().endsWith('.wmv');
    const fileUrl = resolveApiUrl(material.file_url);

    return (
        <>
            {isWmv ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-gray-100 rounded-md">
                    <Video className="h-12 w-12 text-red-500 mb-4" />
                    <p className="text-lg font-semibold mb-2">Formato de video no compatible (.wmv)</p>
                    <p className="text-gray-700 mb-4">
                        Este formato de video (.wmv) puede no ser compatible con tu navegador.
                        Por favor, considera convertir el video a un formato más común como MP4,
                        o puedes descargarlo para verlo con un reproductor externo.
                    </p>
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar Video
                    </a>
                </div>
            ) : (
                <video controls src={fileUrl} className="w-full h-auto" />
            )}
        </>
    );
};

export default VideoPlayer;