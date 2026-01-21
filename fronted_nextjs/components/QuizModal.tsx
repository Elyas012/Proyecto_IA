    import { useState, useEffect } from 'react';
    import api from '../lib/api';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
    import { Button } from "@/components/ui/button";
    import { Label } from "@/components/ui/label";
    import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
    import { toast } from 'sonner';
    import { Loader2, CheckCircle, XCircle } from "lucide-react";

    // 1. Definimos la interfaz para las props
    interface QuizModalProps {
    materialId: number | null;
    isOpen: boolean;
    onClose: () => void;
    }

    // 2. Definimos interfaces para los datos
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
    passed: boolean;
    feedback: string;
    }

    export function QuizModal({ materialId, isOpen, onClose }: QuizModalProps) {
    const [quiz, setQuiz] = useState<QuizData | null>(null);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [result, setResult] = useState<QuizResult | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && materialId) {
        loadQuiz();
        } else {
        setQuiz(null);
        setResult(null);
        setAnswers({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, materialId]);
    
    const loadQuiz = async () => {
        if (!materialId) return;
        setLoading(true);
        try {
        // ✅ ESTA ES LA RUTA CORRECTA QUE COINCIDE CON TU URLS.PY
        const res = await api.get(`/course-materials/${materialId}/quiz/`); 
        setQuiz(res.data);
        } catch (e) {
        toast.error("Este material no tiene evaluación asignada.");
        onClose();
        } finally {
        setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!quiz) return;
        setLoading(true);
        try {
        const res = await api.post('/student/submit-quiz/', {
            quiz_id: quiz.quiz_id,
            answers: answers
        });
        setResult(res.data);
        } catch (e) {
        toast.error("Error al enviar respuestas.");
        } finally {
        setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
            <DialogTitle>{result ? "Resultados" : (quiz ? quiz.title : "Cargando...")}</DialogTitle>
            </DialogHeader>

            {loading && (
            <div className="flex justify-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
            </div>
            )}

            {!loading && quiz && !result && (
            <div className="space-y-6">
                {quiz.questions.map((q, idx) => (
                <div key={q.id} className="p-4 border rounded-lg bg-slate-50">
                    <p className="font-medium mb-3">{idx + 1}. {q.text}</p>
                    {/* Solución al error de tipo 'val' */}
                    <RadioGroup 
                    onValueChange={(val: string) => setAnswers(prev => ({...prev, [q.id]: parseInt(val)}))}
                    className="space-y-2"
                    >
                    {q.options.map((opt, optIdx) => (
                        <div className="flex items-center space-x-2" key={optIdx}>
                        <RadioGroupItem value={optIdx.toString()} id={`q${q.id}-${optIdx}`} />
                        <Label htmlFor={`q${q.id}-${optIdx}`} className="cursor-pointer">{opt}</Label>
                        </div>
                    ))}
                    </RadioGroup>
                </div>
                ))}
                <DialogFooter>
                <Button onClick={handleSubmit} className="w-full bg-cyan-600 hover:bg-cyan-700">
                    Finalizar Evaluación
                </Button>
                </DialogFooter>
            </div>
            )}

            {!loading && result && (
            <div className="text-center space-y-6 py-6">
                <div className="flex justify-center">
                {result.score >= 7 ? 
                    <CheckCircle className="w-20 h-20 text-green-500" /> : 
                    <XCircle className="w-20 h-20 text-red-500" />
                }
                </div>
                <div>
                <h2 className="text-4xl font-bold mb-2">{result.score}/10</h2>
                <p className="text-gray-500">{result.passed ? "¡Aprobado!" : "Necesitas reforzar"}</p>
                </div>
                
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 text-left">
                <h4 className="font-semibold text-blue-800 mb-2">Recomendación de la IA:</h4>
                <p className="text-blue-900 italic">"{result.feedback}"</p>
                </div>
                
                <Button onClick={onClose} variant="outline">Cerrar</Button>
            </div>
            )}
        </DialogContent>
        </Dialog>
    );
    }