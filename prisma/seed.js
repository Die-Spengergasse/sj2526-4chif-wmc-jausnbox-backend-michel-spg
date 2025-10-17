import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  await prisma.recipe.create({
    data: {
      title: "Spaghetti Bolognese",
      description: "Ein klassisches italienisches Gericht.",
      duration: 45,
      instructions: "Zuerst die Spaghetti kochen …",
      image: "spaghetti_bolognese.jpg",
      ingredients: {
        create: [
          { name: "Spaghetti", quantity: "200g" },
          { name: "Hackfleisch", quantity: "300g" },
          { name: "Tomatensauce", quantity: "400ml" },
        ],
      },
    },
  });
  await prisma.recipe.create({
    data: {
      title: "Pancakes",
      description: "Weiche und fluffige Pfannkuchen.",
      duration: 20,
      instructions: "Alle Zutaten verrühren …",
      image: "pancakes.jpg",
      ingredients: {
        create: [
          { name: "Mehl", quantity: "200g" },
          { name: "Milch", quantity: "300ml" },
          { name: "Eier", quantity: "2 Stück" },
          { name: "Zucker", quantity: "2 EL" },
        ],
      },
    },
  });
}
main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
