const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed local (SQLite)...');

  // 1. Produtos (schema.local.prisma não tem taxRate/breakageRate/agingRate/mixAvailable)
  const produtos = await Promise.all([
    prisma.product.upsert({
      where: { id: 'cat-pereciveis' },
      update: {},
      create: {
        id: 'cat-pereciveis',
        name: 'Perecíveis',
        purchasePrice: 20.00,
        salePrice: 28.00,
      },
    }),
    prisma.product.upsert({
      where: { id: 'cat-mercearia' },
      update: {},
      create: {
        id: 'cat-mercearia',
        name: 'Mercearia',
        purchasePrice: 30.00,
        salePrice: 42.00,
      },
    }),
    prisma.product.upsert({
      where: { id: 'cat-eletro' },
      update: {},
      create: {
        id: 'cat-eletro',
        name: 'Eletro',
        purchasePrice: 500.00,
        salePrice: 700.00,
      },
    }),
    prisma.product.upsert({
      where: { id: 'cat-hipel' },
      update: {},
      create: {
        id: 'cat-hipel',
        name: 'Hipel',
        purchasePrice: 45.00,
        salePrice: 63.00,
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

  // 5. Lojas (schema.local.prisma não tem currentCash)
  const [lojaAlpha, lojaBeta] = await Promise.all([
    prisma.store.upsert({
      where: { id: 'store-alpha' },
      update: {},
      create: {
        id: 'store-alpha',
        name: 'Loja Alpha',
        initialCapital: 700000.00,
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
  console.log('✓ Estoque inicial zerado (times compram na 1ª Configuração)');

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
