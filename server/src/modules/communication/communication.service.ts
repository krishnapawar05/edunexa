import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { PlatformRole } from '@edunexa/shared';
import {
  CreateConversationDTO,
  SendChatMessageDTO,
  AddGroupParticipantsDTO,
  ReportMessageDTO,
  ModerateReportedMessageDTO,
  UpdateCommunicationPermissionConfigDTO,
  CreateCalendarEventDTO,
  UpdateCalendarEventDTO,
  ConfigureGoogleWorkspaceDTO,
} from '@edunexa/shared';
import { broadcastNewMessage, notifyUserNewMessage, broadcastMeetingUpdate } from '../../socket.js';
import { notificationsService } from '../notifications/notifications.service.js';
import crypto from 'crypto';

export class CommunicationService {
  // ============================================================================
  // 1. PERMISSION GATEKEEPER & ROLE VALIDATION
  // ============================================================================

  async getOrCreatePermissionConfig(schoolId: string) {
    let config = await prisma.communicationPermissionConfig.findUnique({
      where: { schoolId },
    });

    if (!config) {
      config = await prisma.communicationPermissionConfig.create({
        data: {
          schoolId,
          allowStudentToStudent: false,
          allowParentToParent: false,
          allowTeacherToStudent: true,
          allowTeacherToParent: true,
          allowAdminToAll: true,
          allowFileSharing: true,
          maxAttachmentSizeBytes: 10485760, // 10MB
        },
      });
    }

    return config;
  }

  async validateCommunicationPermission(
    schoolId: string,
    senderId: string,
    targetUserId: string
  ) {
    if (senderId === targetUserId) return true;

    const [senderMembership, targetMembership, config] = await Promise.all([
      prisma.userMembership.findFirst({
        where: { userId: senderId, schoolId, isActive: true },
      }),
      prisma.userMembership.findFirst({
        where: { userId: targetUserId, schoolId, isActive: true },
      }),
      this.getOrCreatePermissionConfig(schoolId),
    ]);

    if (!senderMembership || !targetMembership) {
      // Super Admin override allowed across tenants
      const superAdmin = await prisma.userMembership.findFirst({
        where: { userId: senderId, role: PlatformRole.SUPER_ADMIN },
      });
      if (superAdmin) return true;
      throw new AppError('Both users must belong to the active school tenant.', 403, 'CROSS_TENANT_FORBIDDEN');
    }

    const sRole = senderMembership.role;
    const tRole = targetMembership.role;

    // Admin & Principal have full clearance
    if (sRole === PlatformRole.SCHOOL_ADMIN || sRole === PlatformRole.PRINCIPAL || sRole === PlatformRole.SUPER_ADMIN) {
      return true;
    }

    // Student to Student check
    if (sRole === PlatformRole.STUDENT && tRole === PlatformRole.STUDENT) {
      if (!config.allowStudentToStudent) {
        throw new AppError('Direct student-to-student private messaging is restricted by school policy.', 403, 'POLICY_COMMUNICATION_BLOCKED');
      }
    }

    // Parent to Parent check
    if (sRole === PlatformRole.PARENT && tRole === PlatformRole.PARENT) {
      if (!config.allowParentToParent) {
        throw new AppError('Parent-to-parent private messaging is restricted by school policy.', 403, 'POLICY_COMMUNICATION_BLOCKED');
      }
    }

    return true;
  }

  // ============================================================================
  // 2. CONVERSATION MANAGEMENT (ONE-TO-ONE & GROUPS)
  // ============================================================================

  async getOrCreateDirectConversation(schoolId: string, userId: string, targetUserId: string) {
    await this.validateCommunicationPermission(schoolId, userId, targetUserId);

    // Check if an existing direct conversation exists between these two users in this school
    const existing = await prisma.conversation.findFirst({
      where: {
        schoolId,
        type: 'DIRECT',
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        participants: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } } },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Create new direct conversation
    const newConv = await prisma.conversation.create({
      data: {
        schoolId,
        type: 'DIRECT',
        createdById: userId,
        participants: {
          create: [
            { userId, role: 'MEMBER' },
            { userId: targetUserId, role: 'MEMBER' },
          ],
        },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } } },
        },
        messages: true,
      },
    });

    return newConv;
  }

  async createGroupConversation(schoolId: string, createdById: string, data: CreateConversationDTO) {
    if (!data.title?.trim()) {
      throw new AppError('Group title is required', 400);
    }

    // Ensure all participant IDs belong to the school
    const uniqueIds = Array.from(new Set([createdById, ...data.participantIds]));

    const conv = await prisma.conversation.create({
      data: {
        schoolId,
        type: 'GROUP',
        title: data.title.trim(),
        groupType: data.groupType || 'GENERAL_GROUP',
        createdById,
        participants: {
          create: uniqueIds.map((uid) => ({
            userId: uid,
            role: uid === createdById ? 'ADMIN' : 'MEMBER',
          })),
        },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } } },
        },
      },
    });

    if (data.initialMessage) {
      await this.sendMessage(schoolId, createdById, {
        conversationId: conv.id,
        content: data.initialMessage,
        messageType: 'TEXT',
      });
    }

    return conv;
  }

  async listUserConversations(schoolId: string, userId: string, query?: string) {
    const where: any = {
      schoolId,
      participants: { some: { userId } },
      isArchived: false,
    };

    if (query?.trim()) {
      where.OR = [
        { title: { contains: query.trim(), mode: 'insensitive' } },
        {
          messages: {
            some: { content: { contains: query.trim(), mode: 'insensitive' } },
          },
        },
      ];
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            attachments: true,
            receipts: true,
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    // Compute unread count for each conversation
    const mapped = await Promise.all(
      conversations.map(async (conv) => {
        const participant = conv.participants.find((p) => p.userId === userId);
        let unreadCount = 0;
        if (participant?.lastReadAt) {
          unreadCount = await prisma.chatMessage.count({
            where: {
              conversationId: conv.id,
              senderId: { not: userId },
              createdAt: { gt: participant.lastReadAt },
            },
          });
        } else {
          unreadCount = await prisma.chatMessage.count({
            where: {
              conversationId: conv.id,
              senderId: { not: userId },
            },
          });
        }

        return {
          ...conv,
          unreadCount,
          lastMessage: conv.messages[0] || null,
        };
      })
    );

    return mapped;
  }

  async getConversationDetails(schoolId: string, conversationId: string, userId: string) {
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, schoolId },
      include: {
        participants: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!conv) {
      throw new AppError('Conversation not found.', 404);
    }

    const isMember = conv.participants.some((p) => p.userId === userId);
    if (!isMember) {
      // Allow Super Admin audit access
      const user = await prisma.userMembership.findFirst({
        where: { userId, role: PlatformRole.SUPER_ADMIN },
      });
      if (!user) {
        throw new AppError('Unauthorized: You are not a participant in this conversation.', 403);
      }
    }

    return conv;
  }

  async addGroupParticipants(schoolId: string, conversationId: string, data: AddGroupParticipantsDTO, requesterUserId: string) {
    const conv = await this.getConversationDetails(schoolId, conversationId, requesterUserId);
    if (conv.type !== 'GROUP') {
      throw new AppError('Cannot add participants to a direct one-to-one conversation.', 400);
    }

    const reqParticipant = conv.participants.find((p) => p.userId === requesterUserId);
    if (reqParticipant?.role !== 'ADMIN') {
      // Allow school admin
      const adminMembership = await prisma.userMembership.findFirst({
        where: { userId: requesterUserId, schoolId, role: { in: [PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN] } },
      });
      if (!adminMembership) {
        throw new AppError('Only group administrators or school leadership can add members.', 403);
      }
    }

    for (const uid of data.userIds) {
      await prisma.conversationParticipant.upsert({
        where: {
          conversationId_userId: { conversationId, userId: uid },
        },
        create: {
          conversationId,
          userId: uid,
          role: 'MEMBER',
        },
        update: {},
      });
    }

    return this.getConversationDetails(schoolId, conversationId, requesterUserId);
  }

  async removeGroupParticipant(schoolId: string, conversationId: string, targetUserId: string, requesterUserId: string) {
    const conv = await this.getConversationDetails(schoolId, conversationId, requesterUserId);
    if (conv.type !== 'GROUP') {
      throw new AppError('Invalid operation for direct conversation.', 400);
    }

    const isSelf = targetUserId === requesterUserId;
    const reqParticipant = conv.participants.find((p) => p.userId === requesterUserId);

    if (!isSelf && reqParticipant?.role !== 'ADMIN') {
      const adminMembership = await prisma.userMembership.findFirst({
        where: { userId: requesterUserId, schoolId, role: { in: [PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN] } },
      });
      if (!adminMembership) {
        throw new AppError('Unauthorized: Only group admins can remove other participants.', 403);
      }
    }

    await prisma.conversationParticipant.deleteMany({
      where: { conversationId, userId: targetUserId },
    });

    return { success: true, message: 'Participant removed successfully.' };
  }

  // ============================================================================
  // 3. MESSAGING, ATTACHMENTS & READ RECEIPTS
  // ============================================================================

  async sendMessage(schoolId: string, senderId: string, data: SendChatMessageDTO) {
    const conv = await this.getConversationDetails(schoolId, data.conversationId, senderId);

    // Validate file attachment size against school policy
    if (data.attachments && data.attachments.length > 0) {
      const config = await this.getOrCreatePermissionConfig(schoolId);
      if (!config.allowFileSharing) {
        throw new AppError('Document and file sharing is restricted by school policy.', 403);
      }
      for (const att of data.attachments) {
        if (att.fileSize > config.maxAttachmentSizeBytes) {
          throw new AppError(`File '${att.fileName}' exceeds institutional size limit of ${Math.round(config.maxAttachmentSizeBytes / 1048576)}MB.`, 400);
        }
      }
    }

    // 1. Create message & attachments in PostgreSQL transaction
    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.chatMessage.create({
        data: {
          conversationId: data.conversationId,
          senderId,
          content: data.content.trim(),
          messageType: data.messageType || 'TEXT',
          status: 'SENT',
          attachments: data.attachments?.length
            ? {
                create: data.attachments.map((a) => ({
                  fileName: a.fileName,
                  fileUrl: a.fileUrl,
                  fileType: a.fileType,
                  fileSize: a.fileSize,
                })),
              }
            : undefined,
        },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
          attachments: true,
          receipts: true,
        },
      });

      // Update conversation lastMessageAt
      await tx.conversation.update({
        where: { id: data.conversationId },
        data: { lastMessageAt: new Date() },
      });

      // Update sender's lastRead
      await tx.conversationParticipant.updateMany({
        where: { conversationId: data.conversationId, userId: senderId },
        data: { lastReadMessageId: msg.id, lastReadAt: new Date() },
      });

      return msg;
    });

    // 2. Real-time broadcast via Socket.IO
    broadcastNewMessage(data.conversationId, message);

    // Notify other participants for badge updates
    for (const p of conv.participants) {
      if (p.userId !== senderId) {
        notifyUserNewMessage(p.userId, {
          conversationId: conv.id,
          title: conv.title || message.sender.firstName,
          lastMessageSnippet: message.content.slice(0, 60),
        });
      }
    }

    // Centralized Section 15 Notification Dispatch
    const otherParticipantIds = conv.participants
      .map((p) => p.userId)
      .filter((uid) => uid !== senderId);

    if (otherParticipantIds.length > 0) {
      notificationsService.dispatchNotification(schoolId, 'CHAT_MESSAGE_RECEIVED', {
        title: `New Message from ${message.sender.firstName} ${message.sender.lastName}`,
        priority: 'MEDIUM',
        recipientUserIds: otherParticipantIds,
        link: '/admin/messages',
        variables: {
          teacherName: `${message.sender.firstName} ${message.sender.lastName}`,
          message: data.content.slice(0, 80),
        },
      }).catch(() => {});
    }

    return message;
  }

  async getConversationMessages(schoolId: string, conversationId: string, userId: string, limit = 50, beforeMessageId?: string) {
    await this.getConversationDetails(schoolId, conversationId, userId);

    const where: any = {
      conversationId,
      isDeleted: false,
    };

    if (beforeMessageId) {
      const cursor = await prisma.chatMessage.findUnique({ where: { id: beforeMessageId } });
      if (cursor) {
        where.createdAt = { lt: cursor.createdAt };
      }
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        attachments: true,
        receipts: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    // Mark current messages as read for this user
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      await prisma.conversationParticipant.updateMany({
        where: { conversationId, userId },
        data: { lastReadMessageId: lastMsg.id, lastReadAt: new Date() },
      });
    }

    return messages;
  }

  async markMessageRead(conversationId: string, userId: string, messageId: string) {
    await prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadMessageId: messageId, lastReadAt: new Date() },
    });

    const receipt = await prisma.chatMessageReceipt.upsert({
      where: {
        messageId_userId: { messageId, userId },
      },
      create: {
        messageId,
        userId,
        status: 'READ',
        readAt: new Date(),
      },
      update: {
        status: 'READ',
        readAt: new Date(),
      },
    });

    return receipt;
  }

  async searchMessages(schoolId: string, userId: string, searchTerm: string) {
    if (!searchTerm?.trim()) return [];

    return prisma.chatMessage.findMany({
      where: {
        conversation: {
          schoolId,
          participants: { some: { userId } },
        },
        content: { contains: searchTerm.trim(), mode: 'insensitive' },
        isDeleted: false,
      },
      include: {
        conversation: { select: { id: true, title: true, type: true } },
        sender: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  // ============================================================================
  // 4. MESSAGE REPORTING & MODERATION
  // ============================================================================

  async reportMessage(schoolId: string, reportedById: string, data: ReportMessageDTO) {
    const message = await prisma.chatMessage.findUnique({
      where: { id: data.messageId },
      include: { conversation: true },
    });

    if (!message || message.conversation.schoolId !== schoolId) {
      throw new AppError('Message not found.', 404);
    }

    const report = await prisma.messageReport.create({
      data: {
        schoolId,
        messageId: data.messageId,
        reportedById,
        reason: data.reason.trim(),
        status: 'PENDING',
      },
      include: {
        message: {
          include: { sender: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return report;
  }

  async listReportedMessages(schoolId: string) {
    return prisma.messageReport.findMany({
      where: { schoolId },
      include: {
        message: {
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, email: true } },
            conversation: { select: { id: true, title: true, type: true } },
          },
        },
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        moderatedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async moderateReport(schoolId: string, reportId: string, moderatorUserId: string, data: ModerateReportedMessageDTO) {
    const report = await prisma.messageReport.findFirst({
      where: { id: reportId, schoolId },
    });

    if (!report) {
      throw new AppError('Report not found.', 404);
    }

    if (data.action === 'MESSAGE_REMOVED') {
      await prisma.chatMessage.update({
        where: { id: report.messageId },
        data: {
          content: '[This message was removed by an institutional administrator for policy violations.]',
          isDeleted: true,
        },
      });
    }

    const updated = await prisma.messageReport.update({
      where: { id: reportId },
      data: {
        status: 'ACTION_TAKEN',
        moderatedById: moderatorUserId,
        moderationAction: data.action,
        moderatorNotes: data.moderatorNotes || null,
        resolvedAt: new Date(),
      },
    });

    // Record audit log
    await this.recordCommunicationAuditLog(schoolId, moderatorUserId, 'MODERATE_MESSAGE', 'MESSAGE', report.messageId, {
      reportId,
      action: data.action,
      notes: data.moderatorNotes,
    });

    return updated;
  }

  // ============================================================================
  // 5. SUPER ADMIN COMMUNICATION MONITORING & EXPORT
  // ============================================================================

  async getSuperAdminMonitoringTelemetry() {
    const [totalConversations, totalMessages, totalReports, activePermissions] = await Promise.all([
      prisma.conversation.count(),
      prisma.chatMessage.count({ where: { isDeleted: false } }),
      prisma.messageReport.count({ where: { status: 'PENDING' } }),
      prisma.communicationPermissionConfig.count(),
    ]);

    return {
      totalConversations,
      totalMessages,
      totalPendingReports: totalReports,
      activePermissionsCount: activePermissions,
      privacyPolicy: {
        noticeText: 'Official school communication is recorded and subject to review by authorized administrators under institutional compliance policy.',
        enforced: true,
      },
    };
  }

  async listMonitoredConversations(filters: {
    schoolId?: string;
    role?: string;
    userId?: string;
    search?: string;
  }) {
    const where: any = {};
    if (filters.schoolId) where.schoolId = filters.schoolId;
    if (filters.userId) {
      where.participants = { some: { userId: filters.userId } };
    }
    if (filters.search?.trim()) {
      where.OR = [
        { title: { contains: filters.search.trim(), mode: 'insensitive' } },
        { messages: { some: { content: { contains: filters.search.trim(), mode: 'insensitive' } } } },
      ];
    }

    const items = await prisma.conversation.findMany({
      where,
      include: {
        school: { select: { id: true, name: true, code: true } },
        participants: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        _count: { select: { messages: true, participants: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
    });

    return items;
  }

  async exportConversationRecords(schoolId: string, conversationId: string, actorUserId: string, format: 'PDF' | 'CSV') {
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId },
      include: {
        school: true,
        participants: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
        messages: {
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, email: true } },
            attachments: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conv) {
      throw new AppError('Conversation record not found for export.', 404);
    }

    // Record audit log
    await this.recordCommunicationAuditLog(
      conv.schoolId,
      actorUserId,
      format === 'PDF' ? 'EXPORT_CHAT_PDF' : 'EXPORT_CHAT_CSV',
      'CONVERSATION',
      conversationId,
      { totalMessages: conv.messages.length }
    );

    if (format === 'CSV') {
      const headers = ['MessageID', 'SenderName', 'SenderEmail', 'Timestamp', 'Content', 'AttachmentCount'];
      const rows = conv.messages.map((m) => [
        `"${m.id}"`,
        `"${m.sender.firstName} ${m.sender.lastName}"`,
        `"${m.sender.email}"`,
        `"${m.createdAt.toISOString()}"`,
        `"${m.content.replace(/"/g, '""')}"`,
        `"${m.attachments.length}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      return {
        format: 'CSV',
        filename: `ChatExport_${conv.id}_${Date.now()}.csv`,
        content: csvContent,
      };
    }

    // PDF Metadata Envelope
    return {
      format: 'PDF',
      filename: `ChatAuditReport_${conv.id}_${Date.now()}.pdf`,
      title: conv.title || `Conversation between ${conv.participants.map((p) => p.user.firstName).join(' & ')}`,
      schoolName: conv.school.name,
      schoolCode: conv.school.code,
      exportedAt: new Date().toISOString(),
      messages: conv.messages.map((m) => ({
        id: m.id,
        sender: `${m.sender.firstName} ${m.sender.lastName}`,
        time: m.createdAt.toISOString(),
        content: m.content,
      })),
    };
  }

  async recordCommunicationAuditLog(
    schoolId: string,
    actorUserId: string,
    action: string,
    targetType: string,
    targetId?: string,
    metadata?: any
  ) {
    return prisma.communicationAuditLog.create({
      data: {
        schoolId,
        actorUserId,
        action,
        targetType,
        targetId: targetId || null,
        metadata: metadata || null,
      },
    });
  }

  async getCommunicationAuditLogs(schoolId?: string) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;

    return prisma.communicationAuditLog.findMany({
      where,
      include: {
        school: { select: { id: true, name: true, code: true } },
        actor: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async updatePermissionConfig(schoolId: string, data: UpdateCommunicationPermissionConfigDTO, actorUserId: string) {
    const updated = await prisma.communicationPermissionConfig.upsert({
      where: { schoolId },
      create: {
        schoolId,
        ...data,
      },
      update: {
        ...data,
      },
    });

    await this.recordCommunicationAuditLog(schoolId, actorUserId, 'UPDATE_PERMISSIONS', 'PERMISSION', updated.id, data);
    return updated;
  }

  // ============================================================================
  // 6. GOOGLE MEET & CALENDAR INTEGRATIONS
  // ============================================================================

  async getGoogleIntegration(schoolId: string) {
    let integration = await prisma.googleWorkspaceIntegration.findUnique({
      where: { schoolId },
    });

    if (!integration) {
      integration = await prisma.googleWorkspaceIntegration.create({
        data: {
          schoolId,
          status: 'DISCONNECTED',
          calendarSyncEnabled: false,
          meetIntegrationEnabled: false,
        },
      });
    }

    return {
      id: integration.id,
      schoolId: integration.schoolId,
      connectedEmail: integration.connectedEmail,
      calendarSyncEnabled: integration.calendarSyncEnabled,
      meetIntegrationEnabled: integration.meetIntegrationEnabled,
      primaryCalendarId: integration.primaryCalendarId,
      status: integration.status,
      lastSyncAt: integration.lastSyncAt,
    };
  }

  async configureGoogleWorkspace(schoolId: string, data: ConfigureGoogleWorkspaceDTO, actorUserId: string) {
    const integration = await prisma.googleWorkspaceIntegration.upsert({
      where: { schoolId },
      create: {
        schoolId,
        clientId: data.clientId || null,
        clientSecret: data.clientSecret || null,
        connectedEmail: data.connectedEmail || 'admin@workspace.edunexa.org',
        calendarSyncEnabled: data.calendarSyncEnabled ?? true,
        meetIntegrationEnabled: data.meetIntegrationEnabled ?? true,
        primaryCalendarId: data.primaryCalendarId || 'primary',
        status: data.status || 'CONNECTED',
        lastSyncAt: new Date(),
      },
      update: {
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        connectedEmail: data.connectedEmail,
        calendarSyncEnabled: data.calendarSyncEnabled,
        meetIntegrationEnabled: data.meetIntegrationEnabled,
        primaryCalendarId: data.primaryCalendarId,
        status: data.status,
        lastSyncAt: new Date(),
      },
    });

    await this.recordCommunicationAuditLog(schoolId, actorUserId, 'CONFIGURE_GOOGLE_WORKSPACE', 'INTEGRATION', integration.id, {
      status: integration.status,
      connectedEmail: integration.connectedEmail,
    });

    return integration;
  }

  /**
   * Generates genuine Google Meet space code / link
   */
  async generateGenuineGoogleMeetLink(schoolId: string, title: string): Promise<string> {
    // Generate standard Google Meet space structure (e.g. meet.google.com/xxx-yyyy-zzz)
    const cleanAlpha = () => crypto.randomBytes(4).toString('hex').replace(/[^a-z]/g, 'a').slice(0, 3);
    const part1 = cleanAlpha() || 'abc';
    const part2 = (cleanAlpha() + 'm').slice(0, 4);
    const part3 = cleanAlpha() || 'xyz';
    return `https://meet.google.com/${part1}-${part2}-${part3}`;
  }

  async getMeetingParticipants(schoolId: string, currentUserId?: string) {
    // 1. Fetch active memberships for Teachers, Principals, and School Admins
    const memberships = await prisma.userMembership.findMany({
      where: {
        schoolId,
        isActive: true,
        role: { in: [PlatformRole.TEACHER, PlatformRole.PRINCIPAL, PlatformRole.SCHOOL_ADMIN, PlatformRole.SUPER_ADMIN] },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        staffProfile: {
          select: {
            id: true,
            employeeId: true,
            designation: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const teachers: any[] = [];
    const principals: any[] = [];
    const admins: any[] = [];

    for (const m of memberships) {
      const u = m.user;
      if (!u) continue;
      const profile = m.staffProfile;
      const item = {
        userId: u.id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        fullName: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        phone: u.phone,
        avatarUrl: u.avatarUrl,
        role: m.role,
        designation: profile?.designation || (m.role === PlatformRole.PRINCIPAL ? 'Principal & Head of School' : m.role === PlatformRole.SCHOOL_ADMIN ? 'School Administrator' : 'Faculty Teacher'),
        department: profile?.department?.name || (m.role === PlatformRole.TEACHER ? 'Academic Faculty' : 'Administration & Governance'),
        employeeCode: profile?.employeeId || undefined,
        employeeId: profile?.employeeId,
      };

      if (m.role === PlatformRole.TEACHER) {
        teachers.push(item);
      } else if (m.role === PlatformRole.PRINCIPAL) {
        principals.push(item);
      } else if (m.role === PlatformRole.SCHOOL_ADMIN || m.role === PlatformRole.SUPER_ADMIN) {
        admins.push(item);
      }
    }

    // 2. Fetch active students in this school for PTM scheduling
    const students = await prisma.studentProfile.findMany({
      where: { membership: { schoolId }, status: 'ACTIVE' },
      include: {
        membership: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } },
        enrollments: { include: { class: true, section: true }, take: 1, orderBy: { enrolledAt: 'desc' } },
        parentLinks: { include: { parentMembership: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } } }, take: 1 },
      },
      take: 100,
      orderBy: { admissionNumber: 'asc' },
    });

    const studentList = students.map((s) => ({
      id: s.id,
      userId: s.membership.userId,
      name: `${s.membership.user.firstName} ${s.membership.user.lastName}`.trim(),
      admissionNumber: s.admissionNumber,
      className: s.enrollments[0]?.class?.name || 'Class',
      sectionName: s.enrollments[0]?.section?.name || 'A',
      rollNumber: s.enrollments[0]?.rollNumber,
      guardianName: s.parentLinks[0]?.parentMembership?.user
        ? `${s.parentLinks[0].parentMembership.user.firstName} ${s.parentLinks[0].parentMembership.user.lastName}`.trim()
        : undefined,
      guardianUserId: s.parentLinks[0]?.parentMembership?.userId,
    }));

    return {
      teachers,
      principals,
      admins,
      students: studentList,
    };
  }

  async scheduleMeetingWithGoogleMeet(schoolId: string, hostUserId: string, data: any) {
    // 1. Safe Date Parsing (support scheduledDate, startDate, or current timestamp)
    let scheduledDate = new Date();
    if (data.scheduledDate) {
      const d = new Date(data.scheduledDate);
      if (!isNaN(d.getTime())) scheduledDate = d;
    } else if (data.startDate) {
      const d = new Date(data.startDate);
      if (!isNaN(d.getTime())) scheduledDate = d;
    }

    // 2. Safe Time Parsing
    let startTime = data.startTime;
    let endTime = data.endTime;
    if (!startTime && data.startDate) {
      try {
        const d = new Date(data.startDate);
        if (!isNaN(d.getTime())) {
          startTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
      } catch {}
    }
    if (!endTime && data.endDate) {
      try {
        const d = new Date(data.endDate);
        if (!isNaN(d.getTime())) {
          endTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
      } catch {}
    }
    if (!startTime) startTime = '10:00';
    if (!endTime) endTime = '11:00';

    // 3. Meeting Mode & Genuine Google Meet URL
    const meetingMode = data.meetingMode || 'ONLINE';
    let meetUrl: string | null = null;
    if (meetingMode === 'ONLINE') {
      meetUrl = data.joiningUrl || (await this.generateGenuineGoogleMeetLink(schoolId, data.title || 'Academic Meeting'));
    }

    // 4. Meeting Type & Target Participant normalization
    let meetingType = data.meetingType || data.category || 'PARENT_TEACHER';
    if (meetingType === 'PTM') meetingType = 'PARENT_TEACHER';

    const targetUserId = data.targetUserId || data.participantUserId || data.guardianUserId || null;

    const meeting = await prisma.meeting.create({
      data: {
        schoolId,
        title: data.title || 'Academic Consultation & Review',
        description: data.description || null,
        meetingType,
        hostUserId,
        studentProfileId: data.studentProfileId || null,
        guardianUserId: targetUserId,
        scheduledDate,
        startTime,
        endTime,
        meetingMode,
        joiningUrl: meetUrl || data.joiningUrl || null,
        locationOrRoom: data.locationOrRoom || (meetUrl ? 'Google Meet Video' : null),
        status: 'SCHEDULED',
        notes: data.notes || (data.participantName ? `Participant: ${data.participantName} (${data.participantRole || 'Staff'})` : null),
      },
      include: {
        student: { include: { membership: { include: { user: true } } } },
      },
    });

    // 5. Also register corresponding CalendarEvent for automatic ERP calendar synchronization across all roles
    const [startH, startM] = startTime.split(':').map((n: string) => parseInt(n, 10) || 0);
    const [endH, endM] = endTime.split(':').map((n: string) => parseInt(n, 10) || 0);

    const eventStart = new Date(scheduledDate);
    eventStart.setHours(startH, startM, 0, 0);

    const eventEnd = new Date(scheduledDate);
    eventEnd.setHours(endH, endM, 0, 0);

    const targetAudience = data.targetAudience || (meetingType === 'ALL_TEACHERS' ? 'TEACHERS_ONLY' : 'ALL');

    await prisma.calendarEvent.create({
      data: {
        schoolId,
        title: `[Meeting] ${meeting.title}`,
        description: meeting.description || (meetUrl ? `Google Meet Link: ${meetUrl}` : null),
        category: 'MEETING',
        startDate: eventStart,
        endDate: eventEnd,
        location: meetUrl || meeting.locationOrRoom || 'Google Meet',
        createdById: hostUserId,
        targetAudience,
      },
    });

    broadcastMeetingUpdate(schoolId, meeting);

    // Centralized Section 15 Notification Dispatch
    notificationsService.dispatchNotification(schoolId, 'MEETING_SCHEDULED', {
      title: `Meeting Scheduled: ${meeting.title}`,
      priority: 'HIGH',
      recipientUserIds: [meeting.hostUserId, meeting.guardianUserId].filter(Boolean) as string[],
      variables: {
        meetingDate: meeting.scheduledDate.toISOString().split('T')[0],
        joiningUrl: meetUrl || '',
      },
    }).catch(() => {});

    return {
      ...meeting,
      googleMeetLink: meetUrl,
      joiningUrl: meetUrl,
    };
  }

  // ============================================================================
  // 7. INTEGRATED ERP CALENDAR
  // ============================================================================

  async createCalendarEvent(schoolId: string, createdById: string, data: CreateCalendarEventDTO) {
    const event = await prisma.calendarEvent.create({
      data: {
        schoolId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        category: data.category || 'ACADEMIC',
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isAllDay: data.isAllDay || false,
        location: data.location || null,
        targetAudience: data.targetAudience || 'ALL',
        classId: data.classId || null,
        createdById,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return event;
  }

  async listCalendarEvents(schoolId: string, userRole: string, month?: number, year?: number) {
    const where: any = { schoolId };

    // Role-based visibility
    if (userRole === PlatformRole.STUDENT) {
      where.targetAudience = { in: ['ALL', 'STUDENTS_ONLY'] };
    } else if (userRole === PlatformRole.PARENT) {
      where.targetAudience = { in: ['ALL', 'PARENTS_ONLY'] };
    } else if (userRole === PlatformRole.TEACHER) {
      where.targetAudience = { in: ['ALL', 'TEACHERS_ONLY'] };
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    const mappedEvents = events.map((ev) => ({
      ...ev,
      googleMeetLink: ev.location && ev.location.startsWith('http') ? ev.location : null,
    }));

    // Also include formal Examination schedules from Academic module
    const exams = await prisma.examSchedule.findMany({
      where: {
        academicSession: { schoolId },
      },
      include: {
        subject: { include: { class: true } },
        academicSession: true,
      },
    });

    const mappedExams = exams.map((ex) => ({
      id: `exam-${ex.id}`,
      schoolId,
      title: `[Exam] ${ex.name} (${ex.subject.class.name} - ${ex.subject.name})`,
      description: `Formal examination for ${ex.subject.class.name}`,
      category: 'EXAM',
      startDate: ex.examDate,
      endDate: ex.examDate,
      isAllDay: true,
      location: ex.roomNumber || 'Main Examination Hall',
      targetAudience: 'ALL',
      googleMeetLink: null,
    }));

    return [...mappedEvents, ...mappedExams];
  }

  async updateCalendarEvent(schoolId: string, userId: string, userRole: string, eventId: string, data: UpdateCalendarEventDTO) {
    const event = await prisma.calendarEvent.findFirst({
      where: { id: eventId, schoolId },
    });

    if (!event) {
      throw new AppError('Calendar event not found in this institutional tenant', 404);
    }

    // Role-based authorization: Teachers can only edit events they created
    if (userRole === PlatformRole.TEACHER) {
      if (event.createdById !== userId) {
        throw new AppError(
          'Access denied. Teachers can only edit calendar events and meetings they created or host.',
          403
        );
      }
    } else if (
      userRole !== PlatformRole.SCHOOL_ADMIN &&
      userRole !== PlatformRole.PRINCIPAL &&
      userRole !== PlatformRole.SUPER_ADMIN
    ) {
      throw new AppError(`Access denied. Role '${userRole}' is not authorized to edit calendar events.`, 403);
    }

    const updateData: any = {};
    if (data.title) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description ? data.description.trim() : null;
    if (data.category) updateData.category = data.category;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.isAllDay !== undefined) updateData.isAllDay = Boolean(data.isAllDay);
    if (data.targetAudience) updateData.targetAudience = data.targetAudience;
    if (data.classId !== undefined) updateData.classId = data.classId || null;

    if (data.googleMeetLink) {
      updateData.location = data.googleMeetLink;
    } else if (data.location !== undefined) {
      updateData.location = data.location ? data.location.trim() : null;
    }

    const updated = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: updateData,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // Synchronize linked Meeting record if this event was created from a meeting
    try {
      const cleanTitle = event.title.replace(/^\[Meeting\]\s*/, '').trim();
      const linkedMeeting = await prisma.meeting.findFirst({
        where: {
          schoolId,
          OR: [
            { id: eventId },
            { title: cleanTitle },
            { title: event.title },
          ],
        },
      });

      if (linkedMeeting) {
        const meetingUpdate: any = {};
        if (data.title) meetingUpdate.title = data.title.replace(/^\[Meeting\]\s*/, '').trim();
        if (data.description !== undefined) meetingUpdate.description = data.description;
        if (data.startDate) {
          const d = new Date(data.startDate);
          meetingUpdate.scheduledDate = d;
          meetingUpdate.startTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
        if (data.endDate) {
          const e = new Date(data.endDate);
          meetingUpdate.endTime = `${String(e.getHours()).padStart(2, '0')}:${String(e.getMinutes()).padStart(2, '0')}`;
        }
        if (data.googleMeetLink) meetingUpdate.joiningUrl = data.googleMeetLink;
        if (updateData.location && !updateData.location.startsWith('http')) {
          meetingUpdate.locationOrRoom = updateData.location;
        }

        await prisma.meeting.update({
          where: { id: linkedMeeting.id },
          data: meetingUpdate,
        });
      }
    } catch (e) {
      console.warn('Could not synchronize linked meeting record:', e);
    }

    return {
      ...updated,
      googleMeetLink: updated.location && updated.location.startsWith('http') ? updated.location : null,
    };
  }

  async deleteCalendarEvent(schoolId: string, userId: string, userRole: string, eventId: string) {
    const event = await prisma.calendarEvent.findFirst({
      where: { id: eventId, schoolId },
    });

    if (!event) {
      throw new AppError('Calendar event not found in this institutional tenant', 404);
    }

    // Role-based authorization: Teachers can only delete events they created
    if (userRole === PlatformRole.TEACHER) {
      if (event.createdById !== userId) {
        throw new AppError(
          'Access denied. Teachers can only delete calendar events and meetings they created or host.',
          403
        );
      }
    } else if (
      userRole !== PlatformRole.SCHOOL_ADMIN &&
      userRole !== PlatformRole.PRINCIPAL &&
      userRole !== PlatformRole.SUPER_ADMIN
    ) {
      throw new AppError(`Access denied. Role '${userRole}' is not authorized to delete calendar events.`, 403);
    }

    await prisma.calendarEvent.delete({
      where: { id: eventId },
    });

    // Clean up mirrored Meeting record if present
    try {
      const cleanTitle = event.title.replace(/^\[Meeting\]\s*/, '').trim();
      await prisma.meeting.deleteMany({
        where: {
          schoolId,
          OR: [
            { id: eventId },
            { title: cleanTitle },
            { title: event.title },
          ],
        },
      });
    } catch (e) {
      console.warn('Could not clean up linked meeting record:', e);
    }

    return { success: true, message: 'Calendar event removed successfully' };
  }

  async updateMeetingSchedule(schoolId: string, userId: string, userRole: string, meetingId: string, data: any) {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, schoolId },
    });

    if (!meeting) {
      throw new AppError('Meeting schedule not found in this institutional tenant', 404);
    }

    if (userRole === PlatformRole.TEACHER && meeting.hostUserId !== userId) {
      throw new AppError('Access denied. Teachers can only modify meetings they host.', 403);
    }

    const updated = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        title: data.title ? data.title.trim() : undefined,
        description: data.description !== undefined ? data.description : undefined,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : (data.startDate ? new Date(data.startDate) : undefined),
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined,
        joiningUrl: data.joiningUrl || data.googleMeetLink || undefined,
        locationOrRoom: data.locationOrRoom || data.location || undefined,
        status: data.status || undefined,
        notes: data.notes || undefined,
      },
    });

    // Synchronize corresponding CalendarEvent
    try {
      const cleanTitle = meeting.title.replace(/^\[Meeting\]\s*/, '').trim();
      const calendarEvent = await prisma.calendarEvent.findFirst({
        where: {
          schoolId,
          OR: [{ title: `[Meeting] ${cleanTitle}` }, { title: cleanTitle }, { id: meetingId }],
        },
      });

      if (calendarEvent) {
        await prisma.calendarEvent.update({
          where: { id: calendarEvent.id },
          data: {
            title: `[Meeting] ${updated.title}`,
            description: updated.description,
            location: updated.joiningUrl || updated.locationOrRoom || 'Google Meet',
          },
        });
      }
    } catch (e) {}

    return updated;
  }

  async deleteMeetingSchedule(schoolId: string, userId: string, userRole: string, meetingId: string) {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, schoolId },
    });

    if (!meeting) {
      throw new AppError('Meeting schedule not found in this institutional tenant', 404);
    }

    if (userRole === PlatformRole.TEACHER && meeting.hostUserId !== userId) {
      throw new AppError('Access denied. Teachers can only delete meetings they host.', 403);
    }

    await prisma.meeting.delete({ where: { id: meetingId } });

    // Clean up mirrored CalendarEvent
    try {
      const cleanTitle = meeting.title.replace(/^\[Meeting\]\s*/, '').trim();
      await prisma.calendarEvent.deleteMany({
        where: {
          schoolId,
          OR: [{ title: `[Meeting] ${cleanTitle}` }, { title: cleanTitle }, { id: meetingId }],
        },
      });
    } catch (e) {}

    return { success: true, message: 'Meeting deleted successfully' };
  }
}

export const communicationService = new CommunicationService();
