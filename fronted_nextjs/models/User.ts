    import mongoose, { Schema, models, model } from "mongoose";

    const UserSchema = new Schema(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        userId: { type: String, required: true, unique: true }, // EST001, DOC001, etc.
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ["Estudiante", "Docente", "Administrador"], required: true },
        lastLoginAt: { type: Date },
    },
    { timestamps: true }
    );

    export const User = models.User || model("User", UserSchema);
