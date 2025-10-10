const express = require("express");
const app = express();
const port = 3001;

// Temp Rezepte laden
const recipes = require("../assets/temp-data.json");

// URL: http://localhost:3000/api/recipes
app.get("/api/recipes", (req, res) => {
  res.json(recipes);
});

// URL: http://localhost:3000/api/recipes/1
// URL: http://localhost:3000/api/recipes/3
// URL: http://localhost:3000/api/recipes/10
app.get("/api/recipes/:id", (req, res) => {
  const id = req.params.id;
  console.log(id);

  const recipe = recipes.find((recipe) => recipe.id === id);

  if (!recipe) res.status(404).json({ message: "Recipe not found!" });

  res.json(recipe);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
