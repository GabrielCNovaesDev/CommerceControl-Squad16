import prisma from '../utils/prisma';

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  cargo: true,
  leader: true,
  squadId: true,
  createdAt: true,
} as const;

function findAll() {
  return prisma.user.findMany({ select: userSelect });
}

function findPaginated(skip: number, take: number) {
  return Promise.all([
    prisma.user.findMany({ select: userSelect, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.user.count(),
  ]);
}

function findById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });
}

function findByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

function create(data: {
  name: string;
  email: string;
  password: string;
  role: 'GAME_MASTER' | 'PLAYER' | 'OBSERVER';
  cargo?: string | null;
  squadId?: string | null;
}) {
  return prisma.user.create({
    data,
    select: userSelect,
  });
}

function update(
  id: string,
  data: {
    name?: string;
    email?: string;
    password?: string;
    role?: 'GAME_MASTER' | 'PLAYER' | 'OBSERVER';
    leader?: boolean;
    cargo?: string | null;
    squadId?: string | null;
  }
) {
  return prisma.user.update({
    where: { id },
    data,
    select: userSelect,
  });
}

function remove(id: string) {
  return prisma.user.delete({ where: { id } });
}

const userRepository = { findAll, findPaginated, findById, findByEmail, create, update, remove };
export default userRepository;
