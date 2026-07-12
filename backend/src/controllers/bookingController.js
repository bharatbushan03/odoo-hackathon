const prisma = require('../config/prisma');

async function createBooking(req, res) {
  const { resourceId, resourceType, startTime, endTime, purpose } = req.body;
  const userId = req.user.id;

  if (!resourceId || !resourceType || !startTime || !endTime) {
    return res.status(400).json({ message: 'Validation error: resourceId, resourceType, startTime, endTime are required' });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (start >= end) {
    return res.status(400).json({ message: 'Start time must be before end time' });
  }

  const conflict = await prisma.booking.findFirst({
    where: {
      resourceId,
      resourceType,
      status: { in: ['CONFIRMED', 'PENDING'] },
      OR: [
        { startTime: { lt: end }, endTime: { gt: start } },
      ],
    },
  });

  if (conflict) {
    return res.status(409).json({ message: 'Resource already booked for this time slot' });
  }

  const booking = await prisma.booking.create({
    data: {
      resourceId,
      resourceType,
      startTime: start,
      endTime: end,
      purpose,
      userId,
      status: 'CONFIRMED',
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  res.status(201).json(booking);
}

async function listBookings(req, res) {
  const { resourceId, resourceType, startDate, endDate, status } = req.query;

  const where = {};
  if (resourceId) where.resourceId = resourceId;
  if (resourceType) where.resourceType = resourceType;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.startTime = {};
    if (startDate) where.startTime.gte = new Date(startDate);
    if (endDate) where.startTime.lte = new Date(endDate);
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { startTime: 'asc' },
  });

  res.json(bookings);
}

async function getBooking(req, res) {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  res.json(booking);
}

async function cancelBooking(req, res) {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  if (booking.userId !== req.user.id && !['ADMIN', 'ASSET_MANAGER'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Not authorized to cancel this booking' });
  }

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED' },
  });
  res.json(updated);
}

module.exports = { createBooking, listBookings, getBooking, cancelBooking };