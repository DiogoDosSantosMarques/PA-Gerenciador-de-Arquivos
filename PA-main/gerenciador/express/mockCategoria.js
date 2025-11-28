import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createCategory() {
  // Verifica se já existe a categoria
  const existingCategory = await prisma.category.findFirst({
    where: {
      name: 'Categoria Exemplo', // Substitua pelo nome desejado
    },
  });

  if (!existingCategory) {
    const category = await prisma.category.create({
      data: {
        name: 'Categoria Exemplo', // Substitua pelo nome desejado
      },
    });

    console.log('Categoria criada:', category);
  } else {
    console.log('Categoria já existe');
  }
}

createCategory()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
