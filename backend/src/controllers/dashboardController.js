const prisma = require('../config/prisma');
const { isoDate } = require('../utils/format');

async function kpis(req, res) {
  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const [assetsAvailable, assetsAllocated, maintenanceToday, activeBookings, pendingTransfers, upcomingReturns, overdue] = await prisma.$transaction([
    prisma.asset.count({ where: { status: 'Available' } }),
    prisma.asset.count({ where: { status: 'Allocated' } }),
    prisma.asset.count({ where: { status: 'UnderMaintenance' } }),
    prisma.booking.count({ where: { status: { in: ['UPCOMING', 'ONGOING'] } } }),
    prisma.allocation.count({ where: { status: 'ACTIVE', expectedReturnDate: { gt: now } } }),
    prisma.allocation.count({ where: { status: 'ACTIVE', expectedReturnDate: { gte: now, lte: in7 } } }),
    prisma.allocation.findMany({
      where: { status: 'ACTIVE', expectedReturnDate: { lt: now } },
      include: { asset: true },
      orderBy: { expectedReturnDate: 'asc' },
    }),
  ]);
  res.json({
    assetsAvailable,
    assetsAllocated,
    maintenanceToday,
    activeBookings,
    pendingTransfers,
    upcomingReturns,
    overdueReturns: overdue.map((a) => ({
      allocationId: a.id,
      assetTag: a.asset.assetTag,
      assetName: a.asset.name,
      holderType: a.holderType,
      holderName: a.holderName,
      expectedReturnDate: isoDate(a.expectedReturnDate),
      daysOverdue: Math.floor((now - a.expectedReturnDate) / 86400000),
    })),
  });
}

module.exports = { kpis };
