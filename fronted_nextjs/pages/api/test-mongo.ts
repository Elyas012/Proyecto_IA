    // fronted_nextjs/pages/api/test-mongo.ts
    import type { NextApiRequest, NextApiResponse } from "next";
    import { dbConnect } from "../../lib/mongodb";
    import { Test } from "../../models/Test";


    export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
    ) {
    await dbConnect();
    // Mensajes de prueba para verificar la conexión a MongoDB Atlas
    if (req.method === "POST") {
        const doc = await Test.create({ message: "Hola Mongo Atlas" });
        return res.status(201).json(doc);
    }

    if (req.method === "GET") {
        const docs = await Test.find();
        return res.status(200).json(docs);
    }

    return res.status(405).end();
    }
