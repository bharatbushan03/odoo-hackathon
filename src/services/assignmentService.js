const ApiError = require('../utils/ApiError');
const prisma = require('../config/database');

class AssignmentService {
  constructor(assignmentRepository, notificationService, dbClient = prisma) {
    this.assignmentRepository = assignmentRepository;
    this.notificationService = notificationService;
    this.db = dbClient;
  }

  assignAsset = async (data) => {
    return this.db.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({ where: { id: data.assetId } });
      if (!asset) {
        throw ApiError.notFound('Asset not found');
      }

      if (asset.status !== 'AVAILABLE') {
        throw ApiError.conflict('Asset is not available for assignment');
      }

      const user = await tx.user.findUnique({ where: { id: data.userId } });
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      const assignment = await tx.assetAssignment.create({
        data: {
          assetId: data.assetId,
          userId: data.userId,
          notes: data.notes,
          assignedAt: data.assignedAt ? new Date(data.assignedAt) : new Date(),
          acceptanceStatus: 'PENDING',
        },
      });

      await tx.asset.update({
        where: { id: data.assetId },
        data: { status: 'ASSIGNED' },
      });

      await this.notificationService.createNotification(
        data.userId,
        'Asset Assigned',
        `Asset "${asset.name}" has been assigned to you. Please review and sign to accept.`
      );

      return assignment;
    });
  };

  acceptAssignment = async (id, userId, signature) => {
    return this.db.$transaction(async (tx) => {
      const assignment = await tx.assetAssignment.findUnique({
        where: { id },
        include: { asset: true, user: true },
      });

      if (!assignment) {
        throw ApiError.notFound('Assignment record not found');
      }

      if (assignment.userId !== userId) {
        throw ApiError.forbidden('You do not have permission to accept this assignment');
      }

      if (assignment.acceptanceStatus !== 'PENDING') {
        throw ApiError.badRequest(`Cannot accept assignment in '${assignment.acceptanceStatus}' status`);
      }

      const updated = await tx.assetAssignment.update({
        where: { id },
        data: {
          acceptanceStatus: 'ACCEPTED',
          signature,
          signedAt: new Date(),
        },
      });

      await tx.asset.update({
        where: { id: assignment.assetId },
        data: { assignedToId: userId },
      });

      await this.notificationService.createNotification(
        userId,
        'Asset Assignment Accepted',
        `You have successfully accepted and signed for "${assignment.asset.name}".`
      );

      return updated;
    });
  };

  rejectAssignment = async (id, userId, notes) => {
    return this.db.$transaction(async (tx) => {
      const assignment = await tx.assetAssignment.findUnique({
        where: { id },
        include: { asset: true },
      });

      if (!assignment) {
        throw ApiError.notFound('Assignment record not found');
      }

      if (assignment.userId !== userId) {
        throw ApiError.forbidden('You do not have permission to reject this assignment');
      }

      if (assignment.acceptanceStatus !== 'PENDING') {
        throw ApiError.badRequest(`Cannot reject assignment in '${assignment.acceptanceStatus}' status`);
      }

      const updated = await tx.assetAssignment.update({
        where: { id },
        data: {
          acceptanceStatus: 'REJECTED',
          notes: notes || assignment.notes,
        },
      });

      await tx.asset.update({
        where: { id: assignment.assetId },
        data: { status: 'AVAILABLE' },
      });

      await this.notificationService.createNotification(
        userId,
        'Asset Assignment Rejected',
        `You have rejected the assignment of "${assignment.asset.name}".`
      );

      return updated;
    });
  };

  returnAsset = async (id, data) => {
    return this.db.$transaction(async (tx) => {
      const assignment = await tx.assetAssignment.findUnique({
        where: { id },
        include: { asset: true },
      });

      if (!assignment) {
        throw ApiError.notFound('Assignment record not found');
      }

      if (assignment.acceptanceStatus !== 'ACCEPTED') {
        throw ApiError.badRequest('Can only return assets for accepted assignments');
      }

      if (assignment.returnedAt) {
        throw ApiError.badRequest('Asset has already been returned');
      }

      const returnedAtDate = data.returnedAt ? new Date(data.returnedAt) : new Date();

      const updated = await tx.assetAssignment.update({
        where: { id },
        data: {
          returnedAt: returnedAtDate,
          notes: data.notes ? `${assignment.notes || ''}\nReturn Notes: ${data.notes}` : assignment.notes,
        },
      });

      await tx.asset.update({
        where: { id: assignment.assetId },
        data: {
          status: 'AVAILABLE',
          assignedToId: null,
        },
      });

      await this.notificationService.createNotification(
        assignment.userId,
        'Asset Returned',
        `Asset "${assignment.asset.name}" has been successfully marked as returned.`
      );

      return updated;
    });
  };

  transferAsset = async (data) => {
    return this.db.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({ where: { id: data.assetId } });
      if (!asset) {
        throw ApiError.notFound('Asset not found');
      }

      const toUser = await tx.user.findUnique({ where: { id: data.toUserId } });
      if (!toUser) {
        throw ApiError.notFound('Destination user not found');
      }

      const fromUser = await tx.user.findUnique({ where: { id: data.fromUserId } });
      if (!fromUser) {
        throw ApiError.notFound('Origin user not found');
      }

      const activeAssignment = await tx.assetAssignment.findFirst({
        where: {
          assetId: data.assetId,
          userId: data.fromUserId,
          returnedAt: null,
          acceptanceStatus: 'ACCEPTED',
        },
      });

      if (!activeAssignment) {
        throw ApiError.notFound('No active accepted assignment found for this asset and origin user');
      }

      await tx.assetAssignment.update({
        where: { id: activeAssignment.id },
        data: {
          returnedAt: new Date(),
          notes: `${activeAssignment.notes || ''}\nTransferred to ${toUser.firstName} ${toUser.lastName} on ${new Date().toISOString()}.`,
        },
      });

      const newAssignment = await tx.assetAssignment.create({
        data: {
          assetId: data.assetId,
          userId: data.toUserId,
          notes: data.notes ? `Transferred from ${fromUser.firstName} ${fromUser.lastName}. Notes: ${data.notes}` : `Transferred from ${fromUser.firstName} ${fromUser.lastName}.`,
          acceptanceStatus: 'PENDING',
        },
      });

      await tx.asset.update({
        where: { id: data.assetId },
        data: {
          status: 'ASSIGNED',
          assignedToId: null,
        },
      });

      await this.notificationService.createNotification(
        data.fromUserId,
        'Asset Transferred',
        `Asset "${asset.name}" has been transferred to ${toUser.firstName} ${toUser.lastName}.`
      );

      await this.notificationService.createNotification(
        data.toUserId,
        'Asset Transfer Pending',
        `Asset "${asset.name}" has been transferred to you from ${fromUser.firstName} ${fromUser.lastName}. Please sign to accept.`
      );

      return newAssignment;
    });
  };

  getHistory = async (params) => {
    return this.assignmentRepository.findHistory(params);
  };
}

module.exports = AssignmentService;
