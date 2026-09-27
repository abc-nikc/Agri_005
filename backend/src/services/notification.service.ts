import { Repository } from 'typeorm';
import nodemailer from 'nodemailer';
import { AppDataSource } from '../config/database';
import { Notification } from '../models/notification.entity';
import { mqttService } from './mqtt.service';

export type NotificationChannelName = 'in_app' | 'email' | 'wechat' | 'mqtt';

export interface NotificationPayload {
  type?: string;
  link?: string;
  email?: string;
}

export interface NotificationChannel {
  readonly name: NotificationChannelName;
  isConfigured(): boolean;
  send(userId: string, message: string, payload?: NotificationPayload): Promise<void>;
}

class InAppNotificationChannel implements NotificationChannel {
  readonly name = 'in_app' as const;
  isConfigured() { return true; }

  async send(userId: string, message: string, payload: NotificationPayload = {}): Promise<void> {
    const repository = AppDataSource.getRepository(Notification);
    await repository.save({
      userId: userId || undefined,
      message,
      type: payload.type || 'info',
      link: payload.link,
      isRead: false,
      createdAt: new Date(),
    });
  }
}

class EmailNotificationChannel implements NotificationChannel {
  readonly name = 'email' as const;
  isConfigured() { return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM && process.env.SMTP_TO); }

  async send(_userId: string, message: string, payload: NotificationPayload = {}): Promise<void> {
    const recipient = payload.email || process.env.SMTP_TO;
    if (!this.isConfigured() || !recipient) throw new Error('邮件通知未配置 SMTP_HOST、SMTP_FROM、SMTP_TO');
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: process.env.SMTP_SECURE !== 'false',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM,
      to: recipient,
      subject: `[农场管家] ${payload.type === 'error' ? '紧急通知' : '系统通知'}`,
      text: `${message}${payload.link ? `\n\n查看详情：${payload.link}` : ''}`,
    });
  }
}

class WechatNotificationChannel implements NotificationChannel {
  readonly name = 'wechat' as const;
  isConfigured() { return Boolean(process.env.WECHAT_WEBHOOK_URL); }

  async send(_userId: string, message: string, payload: NotificationPayload = {}): Promise<void> {
    if (!this.isConfigured()) throw new Error('微信通知未配置 WECHAT_WEBHOOK_URL');
    const response = await fetch(process.env.WECHAT_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msgtype: 'text', text: { content: `【农场管家】${message}${payload.link ? `\n${payload.link}` : ''}` } }),
    });
    if (!response.ok) throw new Error(`微信机器人返回 HTTP ${response.status}`);
    const result: any = await response.json();
    if (result.errcode !== undefined && result.errcode !== 0) throw new Error(result.errmsg || '微信通知发送失败');
  }
}

class MqttNotificationChannel implements NotificationChannel {
  readonly name = 'mqtt' as const;
  isConfigured() { return Boolean(process.env.MQTT_BROKER_URL); }

  async send(userId: string, message: string, payload: NotificationPayload = {}): Promise<void> {
    if (!this.isConfigured()) throw new Error('MQTT 通知未配置 MQTT_BROKER_URL');
    await mqttService.publish(`farm/notifications/${userId || 'broadcast'}`, {
      userId: userId || null,
      message,
      type: payload.type || 'info',
      link: payload.link,
      timestamp: new Date().toISOString(),
    }, { qos: 1 });
  }
}

export class NotificationService {
  private channels = new Map<NotificationChannelName, NotificationChannel>();
  private notificationRepository: Repository<Notification>;

  constructor() {
    [new InAppNotificationChannel(), new EmailNotificationChannel(), new WechatNotificationChannel(), new MqttNotificationChannel()]
      .forEach(channel => this.channels.set(channel.name, channel));
    this.notificationRepository = AppDataSource.getRepository(Notification);
  }

  async sendNotification(
    userId: string,
    message: string,
    options: NotificationPayload & { channels?: NotificationChannelName[] } = {}
  ): Promise<void> {
    const configuredDefaults = (process.env.NOTIFICATION_CHANNELS || 'in_app')
      .split(',').map(v => v.trim()).filter(Boolean) as NotificationChannelName[];
    const names = options.channels || configuredDefaults;

    for (const name of names) {
      const channel = this.channels.get(name);
      if (!channel || !channel.isConfigured()) continue;
      try {
        await channel.send(userId, message, options);
      } catch (error: any) {
        console.error(`[NOTIFICATION] ${name} 发送失败:`, error.message || error);
      }
    }
  }

  getChannelStatus() {
    const enabled = (process.env.NOTIFICATION_CHANNELS || 'in_app').split(',').map(v => v.trim());
    return [...this.channels.values()].map(channel => ({
      name: channel.name,
      configured: channel.isConfigured(),
      enabled: enabled.includes(channel.name),
    }));
  }

  async getUnreadNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
    return await this.notificationRepository.createQueryBuilder('n')
      .where('(n.user_id = :userId OR n.user_id IS NULL)', { userId })
      .andWhere('n.is_read = false')
      .orderBy('n.created_at', 'DESC')
      .take(limit)
      .getMany();
  }

  async getAllNotifications(userId: string, page: number = 1, limit: number = 20) {
    const qb = this.notificationRepository.createQueryBuilder('n')
      .where('(n.user_id = :userId OR n.user_id IS NULL)', { userId })
      .orderBy('n.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [notifications, total] = await qb.getManyAndCount();
    return { notifications, total };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.createQueryBuilder()
      .update(Notification)
      .set({ isRead: true, readAt: new Date() })
      .where('id = :id AND (user_id = :userId OR user_id IS NULL)', { id: notificationId, userId })
      .execute();
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.createQueryBuilder()
      .update(Notification)
      .set({ isRead: true, readAt: new Date() })
      .where('(user_id = :userId OR user_id IS NULL) AND is_read = false', { userId })
      .execute();
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.createQueryBuilder()
      .delete().from(Notification)
      .where('id = :id AND (user_id = :userId OR user_id IS NULL)', { id: notificationId, userId })
      .execute();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.createQueryBuilder('n')
      .where('(n.user_id = :userId OR n.user_id IS NULL)', { userId })
      .andWhere('n.is_read = false')
      .getCount();
  }

  registerChannel(channel: NotificationChannel): void {
    this.channels.set(channel.name, channel);
  }
}
