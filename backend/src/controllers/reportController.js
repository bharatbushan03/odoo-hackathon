const prisma = require('../config/prisma');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

async function exportReport(req, res) {
  const { type, format = 'json', startDate, endDate, departmentId } = req.query;

  if (!type) {
    return res.status(400).json({ message: 'Report type is required' });
  }

  const where = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }
  if (departmentId) where.departmentId = departmentId;

  let data = [];
  let filename = `report-${type}-${Date.now()}`;

  switch (type) {
    case 'assets':
      data = await prisma.asset.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          allocations: { where: { status: 'ACTIVE' }, take: 1 },
        },
      });
      filename = `assets-report-${Date.now()}`;
      break;

    case 'allocations':
      data = await prisma.allocation.findMany({
        where,
        include: {
          asset: { select: { id: true, assetTag: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      filename = `allocations-report-${Date.now()}`;
      break;

    case 'bookings':
      data = await prisma.booking.findMany({
        where,
        include: {
          asset: { select: { id: true, assetTag: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { startTime: 'desc' },
      });
      filename = `bookings-report-${Date.now()}`;
      break;

    case 'maintenance':
      data = await prisma.maintenanceRequest.findMany({
        where,
        include: {
          asset: { select: { id: true, assetTag: true, name: true } },
          raisedBy: { select: { id: true, name: true } },
          technician: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      filename = `maintenance-report-${Date.now()}`;
      break;

    case 'audits':
      data = await prisma.audit.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      filename = `audits-report-${Date.now()}`;
      break;

    case 'transfers':
      data = await prisma.transferRequest.findMany({
        where,
        include: {
          asset: { select: { id: true, assetTag: true, name: true } },
          requestedBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      filename = `transfers-report-${Date.now()}`;
      break;

    case 'utilization':
      const assets = await prisma.asset.findMany({
        where: { ...where, status: { not: 'Disposed' } },
        include: {
          allocations: { where: { status: 'ACTIVE' } },
          bookings: { where: { status: { in: ['CONFIRMED', 'PENDING'] } } },
        },
      });

      data = assets.map(a => ({
        assetId: a.id,
        assetTag: a.assetTag,
        name: a.name,
        status: a.status,
        department: a.departmentId,
        activeAllocations: a.allocations.length,
        activeBookings: a.bookings.length,
        utilizationScore: a.allocations.length + a.bookings.length,
      }));

      filename = `utilization-report-${Date.now()}`;
      break;

    default:
      return res.status(400).json({ message: 'Invalid report type' });
  }

  if (format === 'json') {
    res.json({ type, count: data.length, data });
    return;
  }

  if (format === 'csv') {
    const fields = Object.keys(data[0] || {});
    const csv = [fields.join(',')];
    for (const row of data) {
      csv.push(fields.map(f => `"${String(row[f] ?? '').replace(/"/g, '""')}"`).join(','));
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    res.send(csv.join('\n'));
    return;
  }

  if (format === 'pdf') {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

    doc.pipe(res);

    doc.fontSize(20).text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.text(`Records: ${data.length}`, { align: 'center' });
    doc.moveDown();

    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      const colWidth = 500 / keys.length;

      doc.fontSize(8);
      keys.forEach((key, i) => {
        doc.text(key.toUpperCase(), 30 + i * colWidth, doc.y, { width: colWidth, align: 'left' });
      });
      doc.moveDown(0.5);

      for (const row of data.slice(0, 100)) {
        if (doc.y > 500) {
          doc.addPage();
        }
        keys.forEach((key, i) => {
          const val = String(row[key] ?? '');
          doc.text(val, 30 + i * colWidth, doc.y, { width: colWidth, align: 'left', ellipsis: true });
        });
        doc.moveDown(0.5);
      }
    }

    doc.end();
    return;
  }

  if (format === 'xlsx') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${type} Report`);

    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      worksheet.columns = keys.map(key => ({ header: key.toUpperCase(), key, width: 20 }));
      data.forEach(row => worksheet.addRow(row));
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    await workbook.xlsx.write(res);
    return;
  }

  res.status(400).json({ message: 'Unsupported format' });
}

async function getDashboardStats(req, res) {
  const organizationId = req.user.organizationId;

  const [
    totalAssets,
    availableAssets,
    allocatedAssets,
    maintenanceAssets,
    totalEmployees,
    pendingMaintenance,
    activeBookings,
    overdueAllocations,
  ] = await Promise.all([
    prisma.asset.count({ where: { organizationId: organizationId } }),
    prisma.asset.count({ where: { organizationId: organizationId, status: 'Available' } }),
    prisma.asset.count({ where: { organizationId: organizationId, status: 'Allocated' } }),
    prisma.asset.count({ where: { organizationId: organizationId, status: 'UnderMaintenance' } }),
    prisma.employee.count({ where: { organizationId: organizationId } }),
    prisma.maintenanceRequest.count({ where: { organizationId: organizationId, status: 'PENDING' } }),
    prisma.booking.count({ where: { organizationId: organizationId, status: { in: ['CONFIRMED', 'PENDING'] } } }),
    prisma.allocation.count({ where: { organizationId: organizationId, status: 'OVERDUE' } }),
  ]);

  res.json({
    totalAssets,
    availableAssets,
    allocatedAssets,
    maintenanceAssets,
    totalEmployees,
    pendingMaintenance,
    activeBookings,
    overdueAllocations,
  });
}

module.exports = { exportReport, getDashboardStats };