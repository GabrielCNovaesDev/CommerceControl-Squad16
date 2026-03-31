const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SELECT_WITHOUT_PASSWORD = {
  id: true,
  name: true,
  email: true,
  role: true,
  leader: true,
  squadId: true,
  createdAt: true,
};

function findAll() {
  return prisma.user.findMany({ select: SELECT_WITHOUT_PASSWORD });
}

function findById(id) {
  return prisma.user.findUnique({ where: { id }, select: SELECT_WITHOUT_PASSWORD });
}

function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

function create(data) {
  return prisma.user.create({ data, select: SELECT_WITHOUT_PASSWORD });
}

function update(id, data) {
  return prisma.user.update({ where: { id }, data, select: SELECT_WITHOUT_PASSWORD });
}

function remove(id) {
  return prisma.user.delete({ where: { id } });
}

module.exports = { findAll, findById, findByEmail, create, update, remove };
