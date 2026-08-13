const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  try {
    const u = await p.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    console.log('USERS:');
    console.log(JSON.stringify(u, null, 2));
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    await p.$disconnect();
  }
})();
