import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.createMany({
    data: [
      {
        name: 'Tech',
        slug: 'tech',
      },
      {
        name: 'Next Js',
        slug: 'next-js',
      },
      {
        name: 'Nest Js',
        slug: 'nest-js',
      },
      {
        name: 'Prisma',
        slug: 'prisma',
      },
    ],
  });

  console.log(categories);
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.log(e);
    await prisma.$disconnect();
    process.exit(1);
  });
