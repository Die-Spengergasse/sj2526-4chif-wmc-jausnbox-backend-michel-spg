import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /auth/register
 * 
 * Neuen User registrieren.
 * Body: { email, password, name? }
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validierung
    if (!email || !password) {
      return res.status(400).json({ error: "Email und Passwort sind erforderlich." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Passwort muss mindestens 6 Zeichen lang sein." });
    }

    // Prüfen ob User bereits existiert
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "Ein User mit dieser Email existiert bereits." });
    }

    // Passwort hashen (Salt Rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // User in DB anlegen
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
    });

    // Passwort nicht in Response zurückgeben!
    res.status(201).json({
      message: "User erfolgreich registriert.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: "Interner Serverfehler." });
  }
});

/**
 * POST /auth/login
 * 
 * User einloggen und JWT zurückgeben.
 * Body: { email, password }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validierung
    if (!email || !password) {
      return res.status(400).json({ error: "Email und Passwort sind erforderlich." });
    }

    // 1. User anhand der Email suchen
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Absichtlich vage Fehlermeldung (Security Best Practice)
      return res.status(401).json({ error: "Ungültige Anmeldedaten." });
    }

    // 2. Passwort mit bcrypt vergleichen
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Ungültige Anmeldedaten." });
    }

    // 3. JWT erstellen
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });

    // 4. Token zurückgeben
    res.json({
      message: "Login erfolgreich.",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Interner Serverfehler." });
  }
});

export default router;