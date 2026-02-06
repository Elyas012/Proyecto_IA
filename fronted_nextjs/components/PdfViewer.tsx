import React from 'react';
import { resolveApiUrl } from '../lib/api';

interface PdfViewerProps {
    material: {
        id: number;
        title: string;
        file_url: string;
    };
}

const PdfViewer: React.FC<PdfViewerProps> = ({ material }) => {
    const fileUrl = resolveApiUrl(material.file_url);
    return (
        <>
            <iframe
                key={material.id}
                src={fileUrl}
                className="w-full h-[calc(100%-2rem)]"
                title={material.title}
            ></iframe>
            <div className="text-center text-sm mt-2">
                <span>¿Problemas para ver? </span>
                <a
                    href={fileUrl}
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