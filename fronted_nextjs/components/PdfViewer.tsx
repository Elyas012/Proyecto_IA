import { Download } from 'lucide-react';
import React from 'react';

interface PdfViewerProps {
    material: {
        id: number;
        title: string;
        file: string;
    };
    API_URL: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ material, API_URL }) => {
    return (
        <>
            <iframe
                key={material.id}
                src={`${API_URL}${material.file}`}
                className="w-full h-[calc(100%-2rem)]"
                title={material.title}
            ></iframe>
            <div className="text-center text-sm mt-2">
                <span>¿Problemas para ver? </span>
                <a
                    href={`${API_URL}${material.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                >
                    Abrir en una nueva pestaña
                </a>
            </div>
        </>
    );
};

export default PdfViewer;