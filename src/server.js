// const express = require("express");
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import { mkdirSync } from "fs";
import { unlink } from "fs/promises";
import multer from "multer";

const app = express();
const port = 3001;

// Statische Bilder bereitstellen
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure images directory exists and serve it statically
const imagesDir = path.join(__dirname, "../assets/images");
mkdirSync(imagesDir, { recursive: true });
app.use("/images", express.static(imagesDir));

const prisma = new PrismaClient();

// Multer storage for optional image uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, imagesDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `image-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Helper: only use multer if the request is multipart/form-data
const maybeUploadImage = (req, res, next) => {
  if (req.is("multipart/form-data")) {
    // Key field must be match image
    return upload.single("image")(req, res, next);
  }
  next();
};

// CORS public
app.use(cors());
// JSON-Body Parser application/json
app.use(express.json());
// URL-encoded Body Parser application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// POST /api/recipes - create recipe (image optional, default: placeholder.png)
// Middleware maybeUploadImage checks if multipart/form-data
app.post("/api/recipes", maybeUploadImage, async (req, res) => {
  try {
    // Accept both JSON and multipart/form-data
    const parseArray = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string" && val.trim()) {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return [];
    };

    console.log("Request body:", req.body);
    const title = (req.body.title || "").trim();
    const description = req.body.description ?? null;
    const instructions = req.body.instructions ?? null;
    const duration =
      req.body.duration === undefined ||
      req.body.duration === null ||
      req.body.duration === ""
        ? null
        : Number(req.body.duration);
    if (!title) {
      return res.status(400).json({ message: "title is required" });
    }
    if (duration !== null && Number.isNaN(duration)) {
      return res.status(400).json({ message: "duration must be a number" });
    }
    const ingredientsInput = parseArray(req.body.ingredients)
      .map((i) => ({
        name: i?.name ?? "",
        quantity: i?.quantity ?? "",
      }))
      .filter((i) => i.name); // drop empty items
    const image = req.file ? `${req.file.filename}` : "placeholder.png";
    
    const created = await prisma.recipe.create({
      data: {
        title,
        description,
        duration,
        instructions,
        image,
        ingredients: ingredientsInput.length
          ? { create: ingredientsInput }
          : undefined,
      },
      include: { ingredients: true },
    });
    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating recipe:", error);
    res.status(500).json({ message: "Error creating recipe" });
  }
});

// URL: http://localhost:3000/api/recipes
app.get("/api/recipes", async (req, res) => {
  const data = await prisma.recipe.findMany({
    include: { ingredients: true },
  });
  res.json(data);
});

// URL: http://localhost:3000/api/recipes/1
// URL: http://localhost:3000/api/recipes/3
// URL: http://localhost:3000/api/recipes/10
app.get("/api/recipes/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

    const recipe = await prisma.recipe.findUnique({
      where: { id: id },
      include: { ingredients: true },
    });

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found!" });
    }

    res.json(recipe);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({ message: `Error fetching recipe: ${id}` });
  }
});

// DELETE /api/recipes/:id
app.delete("/api/recipes/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

  try {
    // Transaktion für konsistente Löschung
    const recipe = await prisma.$transaction(async (tx) => {
      const r = await tx.recipe.findUnique({ where: { id } });
      if (!r) return null;

      // Falls keine Cascade-Relation:
      await tx.ingredient.deleteMany({ where: { recipeId: id } });
      await tx.recipe.delete({ where: { id } });
      return r;
    });

    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    res.json({ message: "Recipe deleted successfully" });

    // Bilddatei löschen, wenn nicht Placeholder
    if (recipe.image && recipe.image !== "placeholder.png") {
      const imagePath = path.join(imagesDir, recipe.image);
      // Löscht die Bilddatei vom Dateisystem
      unlink(imagePath).catch(err => console.error("Image delete error:", err));
    }
  } catch (e) {
    console.error("Error deleting recipe:", e);
    res.status(500).json({ message: "Error deleting recipe" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
