import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdminUser() {
  const existingAdmin = await prisma.profile.findFirst({
    where: {
      role: 'ADMIN',
    },
  });

  if (!existingAdmin) {
    const adminUser = await prisma.profile.create({
      data: {
        name: 'Admin User',
        email: 'admin@exemplo.com',
        password: 'senha_secreta',
        role: 'ADMIN',
      },
    });

    console.log('Usuário admin criado:', adminUser);
  } else {
    console.log('Usuário admin já existe');
  }
}

createAdminUser()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
