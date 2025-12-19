import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dbConnect } from "../../../lib/mongodb";
import { User } from "../../../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-this";

const determineRole = (userId: string): string => {
  if (userId.startsWith("EST")) return "Estudiante";
  if (userId.startsWith("DOC")) return "Docente";
  if (userId.startsWith("ADM")) return "Administrador";
  return "No identificado";
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  await dbConnect();

  const { fullName, email, password, userId } = req.body;

  if (!fullName || !email || !password || !userId) {
    return res.status(400).json({ detail: "Todos los campos son obligatorios" });
  }

  const existingUserByEmail = await User.findOne({ email });
  if (existingUserByEmail) {
    return res.status(400).json({ detail: "El correo electrónico ya está en uso" });
  }

  const existingUserById = await User.findOne({ userId });
  if (existingUserById) {
    return res.status(400).json({ detail: "El ID de usuario ya existe" });
  }

  const role = determineRole(userId);
  if (role === "No identificado") {
      return res.status(400).json({ detail: "ID de usuario inválido. Debe comenzar con EST, DOC, o ADM." });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = new User({
    fullName,
    email,
    passwordHash,
    userId,
    role,
    lastLoginAt: new Date(),
  });

  await newUser.save();

  const token = jwt.sign(
    { sub: newUser._id.toString(), role: newUser.role, email: newUser.email },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  return res.status(201).json({
    token,
    user: {
      id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      userId: newUser.userId,
      role: newUser.role,
    },
  });
}
