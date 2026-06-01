import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Notification } from '../models/notification.entity';

/**
 * 通知服务接口
 * v1 实现系统内消息通知
 * v1.1 扩展：短信、微信推送
 */
export interface NotificationChannel {
  send(userId: string, message: string, type?: string, link?: string): Promise<void>;
}

/**
 * 系统内通知渠道（v1）
 */
class InAppNotificationChannel implements NotificationChannel {
  async send(userId: string, message: string, type: string = 'info', link?: string): Promise<void> {
    const notificationRepository = AppDataSource.getRepository(Notification);
    await notificationRepository.save({
      userId,
      message,
      type,
      link,
      isRead: false,
      createdAt: new Date(),
    });
  }
}

/**
 * 通知服务
 */
export class NotificationService {
  private channels: NotificationChannel[] = [];
  private notificationRepository: Repository<Notification>;

  constructor() {
    // v1 默认启用系统内通知
    this.channels.push(new InAppNotificationChannel());
    this.notificationRepository = AppDataSource.getRepository(Notification);
  }

  /**
   * 发送通知（支持多渠道）
   */
  async sendNotification(
    userId: string,
    message: string,
    options: { type?: string; link?: string; channels?: number[] } = {}
  ): Promise<void> {
    const { type = 'info', link, channels } = options;
    
    const targetChannels = channels
      ? channels.map(i => this.channels[i]).filter(Boolean)
      : this.channels;

    for (const channel of targetChannels) {
      try {
        await channel.send(userId, message, type, link);
      } catch (error) {
        console.error('[NOTIFICATION] Failed to send via channel:', error);
      }
    }
  }

  /**
   * 获取用户未读通知
   */
  async getUnreadNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 获取用户所有通知（分页）
   */
  async getAllNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: Notification[]; total: number }> {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { notifications, total };
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, userId },
      { isRead: true, readAt: new Date() }
    );
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  /**
   * 删除通知
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.delete({ id: notificationId, userId });
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * 注册新的通知渠道（v1.1 扩展用）
   */
  registerChannel(channel: NotificationChannel): void {
    this.channels.push(channel);
  }
}
