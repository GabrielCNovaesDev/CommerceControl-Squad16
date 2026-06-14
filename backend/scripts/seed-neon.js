// Script de seed para criar usuários de teste no Neon
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_EQM7PyvpfkB0@ep-young-breeze-aq2dq5fk-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    },
  },
});

async function main() {
  console.log('🌱 Iniciando seed no Neon...\n');

  // 1) Criar Squads
  const squadAlpha = await prisma.squad.upsert({
    where: { id: '0192a000-0000-7000-8000-000000000001' },
    update: {},
    create: {
      id: '0192a000-0000-7000-8000-000000000001',
      name: 'Alpha',
    },
  });
  console.log('✅ Squad Alpha criado:', squadAlpha.id);

  const squadBeta = await prisma.squad.upsert({
    where: { id: '0192a000-0000-7000-8000-000000000002' },
    update: {},
    create: {
      id: '0192a000-0000-7000-8000-000000000002',
      name: 'Beta',
    },
  });
  console.log('✅ Squad Beta criado:', squadBeta.id);

  // 2) Gerar hashes
  const adminHash = await bcrypt.hash('admin123', 10);
  const playerHash = await bcrypt.hash('player123', 10);

  // 3) Criar/Atualizar usuários
  const admin = await prisma.user.upsert({
    where: { email: 'admin@simulador.com' },
    update: { password: adminHash, role: 'GAME_MASTER', name: 'Game Master' },
    create: {
      id: '0192a000-0000-7000-8000-000000000010',
      email: 'admin@simulador.com',
      name: 'Game Master',
      password: adminHash,
      role: 'GAME_MASTER',
      leader: true,
    },
  });
  console.log('✅ Usuário admin criado:', admin.email);

  const alpha = await prisma.user.upsert({
    where: { email: 'alpha@simulador.com' },
    update: { password: playerHash, role: 'PLAYER', squadId: squadAlpha.id, name: 'Player Alpha' },
    create: {
      id: '0192a000-0000-7000-8000-000000000020',
      email: 'alpha@simulador.com',
      name: 'Player Alpha',
      password: playerHash,
      role: 'PLAYER',
      leader: true,
      squadId: squadAlpha.id,
    },
  });
  console.log('✅ Usuário alpha criado:', alpha.email);

  const beta = await prisma.user.upsert({
    where: { email: 'beta@simulador.com' },
    update: { password: playerHash, role: 'PLAYER', squadId: squadBeta.id, name: 'Player Beta' },
    create: {
      id: '0192a000-0000-7000-8000-000000000030',
      email: 'beta@simulador.com',
      name: 'Player Beta',
      password: playerHash,
      role: 'PLAYER',
      leader: true,
      squadId: squadBeta.id,
    },
  });
  console.log('✅ Usuário beta criado:', beta.email);

  // 4) Criar GameSettings singleton
  const settings = await prisma.gameSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });
  console.log('✅ GameSettings inicializado:', settings.id);

  console.log('\n🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
