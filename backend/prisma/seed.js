const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed não deve ser executado em produção. Use variáveis de ambiente para criar o primeiro admin.');
  }

  console.log('Iniciando seed...');

  // 1. Categorias de produtos conforme regra do cliente
  const produtos = await Promise.all([
    prisma.product.upsert({
      where: { id: 'cat-pereciveis' },
      update: {},
      create: {
        id: 'cat-pereciveis',
        name: 'Perecíveis',
        purchasePrice: 20.00,
        taxRate: 0.12,
        breakageRate: 0.02,
        agingRate: 0.0583,
        mixAvailable: 4000,
      },
    }),
    prisma.product.upsert({
      where: { id: 'cat-mercearia' },
      update: {},
      create: {
        id: 'cat-mercearia',
        name: 'Mercearia',
        purchasePrice: 30.00,
        taxRate: 0.07,
        breakageRate: 0.015,
        agingRate: 0.0083,
        mixAvailable: 6000,
      },
    }),
    prisma.product.upsert({
      where: { id: 'cat-eletro' },
      update: {},
      create: {
        id: 'cat-eletro',
        name: 'Eletro',
        purchasePrice: 500.00,
        taxRate: 0.25,
        breakageRate: 0,
        agingRate: 0.0133,
        mixAvailable: 700,
      },
    }),
    prisma.product.upsert({
      where: { id: 'cat-hipel' },
      update: {},
      create: {
        id: 'cat-hipel',
        name: 'Hipel',
        purchasePrice: 45.00,
        taxRate: 0.17,
        breakageRate: 0.01,
        agingRate: 0.0108,
        mixAvailable: 5000,
      },
    }),
  ]);
  console.log(`✓ ${produtos.length} categorias de produto criadas`);

  // 2. Usuário GAME_MASTER
  const senhaAdmin = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@simulador.com' },
    update: {},
    create: {
      id: 'user-admin',
      name: 'Admin',
      email: 'admin@simulador.com',
      password: senhaAdmin,
      role: 'GAME_MASTER',
      leader: false,
    },
  });
  console.log(`✓ GAME_MASTER criado: ${admin.email}`);

  // 3. Squads
  const squadAlpha = await prisma.squad.upsert({
    where: { id: 'squad-alpha' },
    update: {},
    create: { id: 'squad-alpha', name: 'Squad Alpha' },
  });
  const squadBeta = await prisma.squad.upsert({
    where: { id: 'squad-beta' },
    update: {},
    create: { id: 'squad-beta', name: 'Squad Beta' },
  });
  console.log(`✓ Squads criados: ${squadAlpha.name}, ${squadBeta.name}`);

  // 4. Players
  const senhaPlayer = await bcrypt.hash('player123', 10);
  const [jogadorAlpha, jogadorBeta] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alpha@simulador.com' },
      update: {},
      create: {
        id: 'user-alpha',
        name: 'Jogador Alpha',
        email: 'alpha@simulador.com',
        password: senhaPlayer,
        role: 'PLAYER',
        leader: true,
        squadId: squadAlpha.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'beta@simulador.com' },
      update: {},
      create: {
        id: 'user-beta',
        name: 'Jogador Beta',
        email: 'beta@simulador.com',
        password: senhaPlayer,
        role: 'PLAYER',
        leader: true,
        squadId: squadBeta.id,
      },
    }),
  ]);
  console.log(`✓ Players criados: ${jogadorAlpha.email}, ${jogadorBeta.email}`);

  // 5. Lojas — capital inicial R$ 700.000 conforme regra do cliente
  const [lojaAlpha, lojaBeta] = await Promise.all([
    prisma.store.upsert({
      where: { id: 'store-alpha' },
      update: {},
      create: {
        id: 'store-alpha',
        name: 'Loja Alpha',
        initialCapital: 700000.00,
        currentCash:    700000.00,
        squadId: squadAlpha.id,
      },
    }),
    prisma.store.upsert({
      where: { id: 'store-beta' },
      update: {},
      create: {
        id: 'store-beta',
        name: 'Loja Beta',
        initialCapital: 700000.00,
        currentCash:    700000.00,
        squadId: squadBeta.id,
      },
    }),
  ]);
  console.log(`✓ Lojas criadas: ${lojaAlpha.name}, ${lojaBeta.name}`);

  // 6. Estoque inicial zerado — times compram estoque na 1ª Configuração
  const estoqueEntries = [];
  for (const loja of [lojaAlpha, lojaBeta]) {
    for (const produto of produtos) {
      estoqueEntries.push(
        prisma.inventory.upsert({
          where: { storeId_productId: { storeId: loja.id, productId: produto.id } },
          update: {},
          create: { storeId: loja.id, productId: produto.id, quantity: 0 },
        })
      );
    }
  }
  await Promise.all(estoqueEntries);
  console.log('✓ Registros de estoque inicializados com 0 unidades (times compram na 1ª Configuração)');

  console.log('\nSeed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
