// fronted_nextjs/models/Test.ts
    import mongoose, { Schema, models, model } from "mongoose";

    const TestSchema = new Schema(
    {
        message: { type: String, required: true },
    },
    { timestamps: true }
    );

    export const Test = models.Test || model("Test", TestSchema);