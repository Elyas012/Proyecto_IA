import { Download, Video } from 'lucide-react';
import React from 'react';

interface VideoPlayerProps {
    material: {
        id: number;
        title: string;
        file: string;
    };
    API_URL: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ material, API_URL }) => {
    const isWmv = material.file.toLowerCase().endsWith('.wmv');

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
                        href={`${API_URL}${material.file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar Video
                    </a>
                </div>
            ) : (
                <video controls src={`${API_URL}${material.file}`} className="w-full h-auto" />
            )}
        </>
    );
};

export default VideoPlayer;