import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dbConnect } from "../../../lib/mongodb";
import { User } from "../../../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-this";

const generateUserId = async (): Promise<string> => {
  let userId = "";
  let exists = true;

  while (exists) {
    const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
    userId = `EST${suffix}`;
    exists = !!(await User.findOne({ userId }));
  }

  return userId;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  await dbConnect();

  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ detail: "Todos los campos son obligatorios" });
  }

  const existingUserByEmail = await User.findOne({ email });
  if (existingUserByEmail) {
    return res.status(400).json({ detail: "El correo electrónico ya está en uso" });
  }

  const userId = await generateUserId();
  const role = "Estudiante";

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
