import express from "express";
import { PrismaClient } from "@prisma/client";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /profile
 * 
 * Geschützte Route – nur für eingeloggte User.
 * Gibt die Profildaten des authentifizierten Users zurück.
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        // password wird NICHT zurückgegeben!
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User nicht gefunden." });
    }

    res.json({ user });
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({ error: "Interner Serverfehler." });
  }
});

export default router;