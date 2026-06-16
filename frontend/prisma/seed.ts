/**
 * Seed completo para o CommerceControl
 *
 * Executar com: npx prisma db seed
 * Ou adicionar ao package.json: "prisma": { "seed": "ts-node prisma/seed.ts" }
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do CommerceControl...\n');

  // ============================================
  // 1. PRODUTOS (4 categorias do simulador)
  // ============================================
  console.log('📦 Criando produtos...');

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

  console.log(`   ✅ ${produtos.length} produtos criados:`);
  produtos.forEach(p => console.log(`      - ${p.name} (R$ ${p.purchasePrice})`));

  // ============================================
  // 2. ADMIN (GAME_MASTER)
  // ============================================
  console.log('\n👤 Criando admin...');

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

  console.log(`   ✅ Admin criado: ${admin.email}`);

  // ============================================
  // 3. SQUADS
  // ============================================
  console.log('\n👥 Criando squads...');

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

  console.log(`   ✅ Squads criados: ${squadAlpha.name}, ${squadBeta.name}`);

  // ============================================
  // 4. PLAYERS (Jogadores de teste)
  // ============================================
  console.log('\n🎮 Criando jogadores...');

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

  console.log(`   ✅ Jogadores criados:`);
  console.log(`      - ${jogadorAlpha.email} (líder ${squadAlpha.name})`);
  console.log(`      - ${jogadorBeta.email} (líder ${squadBeta.name})`);

  // ============================================
  // 5. LOJAS (Capital inicial R$ 700.000)
  // ============================================
  console.log('\n🏪 Criando lojas...');

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

  console.log(`   ✅ Lojas criadas:`);
  console.log(`      - ${lojaAlpha.name} (R$ ${CAPITAL_INICIAL.toLocaleString('pt-BR')})`);
  console.log(`      - ${lojaBeta.name} (R$ ${CAPITAL_INICIAL.toLocaleString('pt-BR')})`);

  // ============================================
  // 6. ESTOQUE INICIAL (zerado)
  // ============================================
  console.log('\n📊 Inicializando estoque...');

  const estoqueEntries = [];
  for (const loja of [lojaAlpha, lojaBeta]) {
    for (const produto of produtos) {
      estoqueEntries.push(
        prisma.inventory.upsert({
          where: {
            storeId_productId: {
              storeId: loja.id,
              productId: produto.id,
            },
          },
          update: {},
          create: {
            storeId: loja.id,
            productId: produto.id,
            quantity: 0,
          },
        })
      );
    }
  }
  await Promise.all(estoqueEntries);
  console.log(`   ✅ Estoque inicializado com 0 unidades para cada loja/produto`);

  // ============================================
  // 7. GAME SETTINGS (Configurações do jogo)
  // ============================================
  console.log('\n⚙️ Criando configurações do jogo...');

  const gameSettings = await prisma.gameSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      licenseSoPerUser: 120,
      licenseSoUsers: 5,
      licensePdvPerUnit: 80,
      licenseScoPerUnit: 80,
      licenseScoUnits: 4,
      licenseSiteBase: 500,
      licenseSiteCapex: 650,
      licenseSecurityBase: 500,
      licenseSecurityCapex: 600,
      maintenanceFee: 400,
    },
  });

  console.log(`   ✅ Configurações do jogo criadas`);

  // ============================================
  // RESUMO FINAL
  // ============================================
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ SEED CONCLUÍDO COM SUCESSO!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n📋 Credenciais de acesso:\n');
  console.log('   👑 ADMIN (Game Master):');
  console.log('      Email:    admin@simulador.com');
  console.log('      Senha:    admin123\n');
  console.log('   🎮 JOGADORES (Players):');
  console.log('      Email:    alpha@simulador.com');
  console.log('      Senha:    player123');
  console.log('      Squad:    Squad Alpha\n');
  console.log('      Email:    beta@simulador.com');
  console.log('      Senha:    player123');
  console.log('      Squad:    Squad Beta\n');
  console.log('═══════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
