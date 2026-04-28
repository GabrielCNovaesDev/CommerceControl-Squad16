require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const squadRoutes = require('./routes/squadRoutes');
const storeRoutes = require('./routes/storeRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const roundRoutes = require('./routes/roundRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');

const prisma = new PrismaClient();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Simulador Estratégico de Loja - API running' });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/squads', squadRoutes);
app.use('/stores', storeRoutes);
app.use('/stores/:storeId/inventory', inventoryRoutes);
app.use('/rounds', roundRoutes);
app.use('/simulation', simulationRoutes);

// Deve ser o último middleware — captura todos os erros propagados por next(err)
app.use(errorMiddleware);

// ── Bootstrap: garante que sempre exista ao menos um GAME_MASTER ─────────────
async function bootstrapAdmin() {
  try {
    const count = await prisma.user.count({ where: { role: 'GAME_MASTER' } });
    if (count === 0) {
      const password = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          name: 'Admin',
          email: 'admin@simulador.com',
          password,
          role: 'GAME_MASTER',
          leader: false,
        },
      });
      console.log('✓ Conta admin padrão criada: admin@simulador.com / admin123');
    }
  } catch (err) {
    console.error('Aviso: não foi possível verificar/criar admin padrão:', err.message);
  }
}

const PORT = process.env.PORT || 3333;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await bootstrapAdmin();
  });
}

module.exports = app;
