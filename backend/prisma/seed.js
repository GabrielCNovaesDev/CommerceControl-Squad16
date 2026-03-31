const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // 1. Produtos base
  const produtos = await Promise.all([
    prisma.product.upsert({
      where: { id: 'prod-arroz' },
      update: {},
      create: { id: 'prod-arroz', name: 'Arroz 5kg', purchasePrice: 12.00, salePrice: 18.00 },
    }),
    prisma.product.upsert({
      where: { id: 'prod-feijao' },
      update: {},
      create: { id: 'prod-feijao', name: 'Feijão 1kg', purchasePrice: 4.50, salePrice: 7.50 },
    }),
    prisma.product.upsert({
      where: { id: 'prod-macarrao' },
      update: {},
      create: { id: 'prod-macarrao', name: 'Macarrão 500g', purchasePrice: 2.80, salePrice: 4.90 },
    }),
    prisma.product.upsert({
      where: { id: 'prod-leite' },
      update: {},
      create: { id: 'prod-leite', name: 'Leite 1L', purchasePrice: 3.20, salePrice: 5.50 },
    }),
    prisma.product.upsert({
      where: { id: 'prod-oleo' },
      update: {},
      create: { id: 'prod-oleo', name: 'Óleo 900ml', purchasePrice: 5.00, salePrice: 8.00 },
    }),
  ]);
  console.log(`✓ ${produtos.length} produtos criados`);

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

  // 5. Lojas
  const [lojaAlpha, lojaBeta] = await Promise.all([
    prisma.store.upsert({
      where: { id: 'store-alpha' },
      update: {},
      create: {
        id: 'store-alpha',
        name: 'Loja Alpha',
        initialCapital: 10000.00,
        squadId: squadAlpha.id,
      },
    }),
    prisma.store.upsert({
      where: { id: 'store-beta' },
      update: {},
      create: {
        id: 'store-beta',
        name: 'Loja Beta',
        initialCapital: 10000.00,
        squadId: squadBeta.id,
      },
    }),
  ]);
  console.log(`✓ Lojas criadas: ${lojaAlpha.name}, ${lojaBeta.name}`);

  // 6. Estoque inicial (100 unidades de cada produto por loja)
  const estoqueEntries = [];
  for (const loja of [lojaAlpha, lojaBeta]) {
    for (const produto of produtos) {
      estoqueEntries.push(
        prisma.inventory.upsert({
          where: {
            storeId_productId: { storeId: loja.id, productId: produto.id },
          },
          update: {},
          create: {
            storeId: loja.id,
            productId: produto.id,
            quantity: 100,
          },
        })
      );
    }
  }
  const estoques = await Promise.all(estoqueEntries);
  console.log(`✓ ${estoques.length} registros de estoque criados (${estoques.length / 2} por loja)`);

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
