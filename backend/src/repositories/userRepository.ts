import prisma from '../utils/prisma';

function findAll() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      leader: true,
      squadId: true,
      createdAt: true,
    },
  });
}

function findById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      leader: true,
      squadId: true,
      createdAt: true,
    },
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
  squadId?: string | null;
}) {
  return prisma.user.create({
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      leader: true,
      squadId: true,
      createdAt: true,
    },
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
    squadId?: string | null;
  }
) {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      leader: true,
      squadId: true,
      createdAt: true,
    },
  });
}

function remove(id: string) {
  return prisma.user.delete({ where: { id } });
}

const userRepository = { findAll, findById, findByEmail, create, update, remove };
export default userRepository;
