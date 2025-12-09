    export function determineRole(userId: string): "Estudiante" | "Docente" | "Administrador" | "No identificado" {
    if (userId.startsWith("EST")) return "Estudiante";
    if (userId.startsWith("DOC")) return "Docente";
    if (userId.startsWith("ADM")) return "Administrador";
    return "No identificado";
    }
