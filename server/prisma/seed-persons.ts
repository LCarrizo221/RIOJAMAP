import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const persons = [
  { name: 'Pini Herrera',      table_name_alias: 'piniHerrera' },
  { name: 'Gabriela Pedrali',  table_name_alias: 'gabiPedrali' },
  { name: 'Teresita Madera',   table_name_alias: 'teresitaMadera' },
  { name: 'Florencia Lopez',   table_name_alias: 'florenciaLopez' },
  { name: 'Gury Caceres',      table_name_alias: 'guryCaceres' },
  { name: 'Dirigentes',        table_name_alias: 'dirigentes' },
  { name: 'Romina',            table_name_alias: 'romina' },
  { name: 'Misael',            table_name_alias: 'misael' },
];

async function main() {
  console.log('Seeding Person table…');

  await prisma.person.createMany({
    data: persons,
    skipDuplicates: true,
  });

  const count = await prisma.person.count();
  console.log(`Person table now has ${count} record(s).`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
