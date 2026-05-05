import prisma from '../utils/prisma';
import { RoundStatus } from '@prisma/client';

const roundInclude = {
  _count: { select: { roundConfigs: true } },
} as const;

function findAll() {
  return prisma.round.findMany({
    orderBy: { number: 'desc' },
    include: roundInclude,
  });
}

function findPaginated(skip: number, take: number) {
  return Promise.all([
    prisma.round.findMany({
      orderBy: { number: 'desc' },
      include: roundInclude,
      skip,
      take,
    }),
    prisma.round.count(),
  ]);
}

function findById(id: string) {
  return prisma.round.findUnique({
    where: { id },
    include: {
      _count: { select: { roundConfigs: true } },
      roundConfigs: { select: { storeId: true } },
    },
  });
}

function findActive() {
  return prisma.round.findFirst({
    where: { status: { in: ['OPEN', 'PROCESSING'] } },
  });
}

function create(data: {
  number: number;
  durationHours: number;
  demandFactor: number;
  endsAt: Date;
  status: RoundStatus;
}) {
  return prisma.round.create({ data });
}

function updateStatus(id: string, status: RoundStatus) {
  return prisma.round.update({ where: { id }, data: { status } });
}

const roundRepository = { findAll, findPaginated, findById, findActive, create, updateStatus };
export default roundRepository;
