const { PrismaClient } = require('../node_modules/.prisma/client-local');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed local (SQLite)...');

  // 1. Produtos com todos os campos necessários
  const produtos = await Promise.all([
    prisma.product.upsert({
      where: { id: 'cat-pereciveis' },
      update: { taxRate: 0.12, breakageRate: 0.05, agingRate: 0.08, mixAvailable: 5000 },
      create: {
        id: 'cat-pereciveis',
        name: 'Perecíveis',
        purchasePrice: 20.00,
        taxRate: 0.12,
        breakageRate: 0.05,
        agingRate: 0.08,
        mixAvailable: 5000,
      },
    }),
    prisma.product.upsert({
      where: { id: 'cat-mercearia' },
      update: { taxRate: 0.10, breakageRate: 0.02, agingRate: 0.03, mixAvailable: 8000 },
      create: {
        id: 'cat-mercearia',
        name: 'Mercearia',
        purchasePrice: 30.00,
        taxRate: 0.10,
        breakageRate: 0.02,
        agingRate: 0.03,
        mixAvailable: 8000,
      },
    }),
    prisma.product.upsert({
      where: { id: 'cat-eletro' },
      update: { taxRate: 0.15, breakageRate: 0.01, agingRate: 0.02, mixAvailable: 500 },
      create: {
        id: 'cat-eletro',
        name: 'Eletro',
        purchasePrice: 500.00,
        taxRate: 0.15,
        breakageRate: 0.01,
        agingRate: 0.02,
        mixAvailable: 500,
      },
    }),
    prisma.product.upsert({
      where: { id: 'cat-hipel' },
      update: { taxRate: 0.08, breakageRate: 0.03, agingRate: 0.04, mixAvailable: 3000 },
      create: {
        id: 'cat-hipel',
        name: 'Hipel',
        purchasePrice: 45.00,
        taxRate: 0.08,
        breakageRate: 0.03,
        agingRate: 0.04,
        mixAvailable: 3000,
      },
    }),
  ]);
  console.log(`✓ ${produtos.length} produtos criados`);

  // 2. Usuário GAME_MASTER (admin)
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
  console.log(`✓ GAME_MASTER criado: ${admin.email} / senha: admin123`);

  // 3. Squads Alpha e Beta
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

  // 4. Players (um líder por squad)
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
  console.log(`✓ Players criados: ${jogadorAlpha.email}, ${jogadorBeta.email} / senha: player123`);

  // 5. Lojas com currentCash = initialCapital
  const CAPITAL_INICIAL = 700000.00;
  const [lojaAlpha, lojaBeta] = await Promise.all([
    prisma.store.upsert({
      where: { id: 'store-alpha' },
      update: {},
      create: {
        id: 'store-alpha',
        name: 'Loja Alpha',
        initialCapital: CAPITAL_INICIAL,
        currentCash: CAPITAL_INICIAL,
        squadId: squadAlpha.id,
      },
    }),
    prisma.store.upsert({
      where: { id: 'store-beta' },
      update: {},
      create: {
        id: 'store-beta',
        name: 'Loja Beta',
        initialCapital: CAPITAL_INICIAL,
        currentCash: CAPITAL_INICIAL,
        squadId: squadBeta.id,
      },
    }),
  ]);
  console.log(`✓ Lojas criadas: ${lojaAlpha.name}, ${lojaBeta.name}`);

  // 6. Estoque inicial zerado
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
  console.log('✓ Estoque inicial zerado');

  console.log('\n========================================');
  console.log('Seed local concluído! Credenciais:');
  console.log('  Admin:  admin@simulador.com / admin123');
  console.log('  Alpha:  alpha@simulador.com / player123');
  console.log('  Beta:   beta@simulador.com  / player123');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

