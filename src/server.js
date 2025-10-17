// const express = require("express");
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
const app = express();
const port = 3001;

// Statische Bilder bereitstellen
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/images", express.static(path.join(__dirname,
"../assets/images")));

const prisma = new PrismaClient();

// CORS public
app.use(cors());

// Temp Rezepte laden
// const recipes = require("../assets/temp-data.json");

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
  const id = parseInt(req.params.id);
  console.log(id);

  // const recipe = recipes.find((recipe) => recipe.id === id);
  const recipe = await prisma.recipe.findUnique({
    where: { id: id },
    include: { ingredients: true },
  });

  if (!recipe) res.status(404).json({ message: "Recipe not found!" });

  res.json(recipe);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
