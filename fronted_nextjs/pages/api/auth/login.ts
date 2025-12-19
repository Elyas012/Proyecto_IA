import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dbConnect } from "../../../lib/mongodb";
import { User } from "../../../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-this";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  await dbConnect();

  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ detail: "Correo y contraseña son obligatorios" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ detail: "Credenciales inválidas" });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ detail: "Credenciales inválidas" });
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  return res.status(200).json({
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