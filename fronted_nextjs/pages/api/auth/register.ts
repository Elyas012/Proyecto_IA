    import type { NextApiRequest, NextApiResponse } from "next";
    import bcrypt from "bcryptjs";
    import jwt from "jsonwebtoken";
    import { dbConnect } from "../../../lib/mongodb";
    import { User } from "../../../models/User";
    import { determineRole } from "../../../lib/roles";

    const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-this";

    export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") return res.status(405).end();

    await dbConnect();

    const { fullName, email, password, userId } = req.body as {
        fullName?: string;
        email?: string;
        password?: string;
        userId?: string;
    };

    if (!fullName || !email || !password || !userId) {
        return res.status(400).json({ detail: "Faltan campos obligatorios" });
    }

    const role = determineRole(userId);
    if (role === "No identificado") {
        return res.status(400).json({ detail: "El ID de usuario no corresponde a ningún rol válido" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        return res.status(400).json({ detail: "El correo ya está registrado" });
    }

    const existingUserId = await User.findOne({ userId });
    if (existingUserId) {
        return res.status(400).json({ detail: "El ID de usuario ya está registrado" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
        fullName,
        email,
        userId,
        passwordHash,
        role,
    });

    const token = jwt.sign(
        { sub: user._id.toString(), role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: "1d" }
    );

    return res.status(201).json({
        token,
        user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        userId: user.userId,
        role: user.role,
        },
    });
    }
