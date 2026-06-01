import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { config } from 'dotenv';
import { EventEmitter } from 'events';

config();

export interface MqttMessage {
  topic: string;
  payload: any;
  timestamp: Date;
  qos: 0 | 1 | 2;
  retained: boolean;
}

export class MqttService extends EventEmitter {
  private client: MqttClient | null = null;
  private isConnected: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.connect();
  }

  /**
   * 连接到 MQTT Broker
   */
  private connect(): void {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    const options: IClientOptions = {
      clientId: `farm-backend-${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
      reconnectPeriod: 5000, // 5秒重连
      connectTimeout: 10000,
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      protocolVersion: 5, // 使用 MQTT 5.0
    };

    try {
      this.client = mqtt.connect(brokerUrl, options);

      this.client.on('connect', () => {
        console.log('[MQTT] Connected to broker');
        this.isConnected = true;
        this.emit('connected');
      });

      this.client.on('message', (topic: string, payload: Buffer) => {
        this.handleMessage(topic, payload);
      });

      this.client.on('error', (error: any) => {
        const msg = error?.message || error?.toString() || 'MQTT error';
        console.warn('[MQTT] Connection error (broker may be offline):', msg);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('[MQTT] Disconnected');
        this.isConnected = false;
        this.emit('disconnected');
      });

      this.client.on('reconnect', () => {
        console.log('[MQTT] Reconnecting...');
        this.emit('reconnecting');
      });

    } catch (error) {
      console.error('[MQTT] Failed to connect:', error);
    }
  }

  /**
   * 订阅主题
   * @param topic 主题（支持通配符）
   * @param qos QoS 等级 (0, 1, 2)
   */
  subscribe(topic: string, qos: 0 | 1 | 2 = 1): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.isConnected) {
        reject(new Error('MQTT client not connected'));
        return;
      }

      this.client.subscribe(topic, { qos }, (err: Error | null) => {
        if (err) {
          console.error(`[MQTT] Subscribe failed: ${topic}`, err);
          reject(err);
        } else {
          console.log(`[MQTT] Subscribed to: ${topic} (QoS ${qos})`);
          resolve();
        }
      });
    });
  }

  /**
   * 发布消息
   * @param topic 主题
   * @param payload 消息内容
   * @param options 发布选项
   */
  publish(
    topic: string,
    payload: any,
    options: { qos?: 0 | 1 | 2; retain?: boolean } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.isConnected) {
        reject(new Error('MQTT client not connected'));
        return;
      }

      const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const qos = options.qos || 1;
      const retain = options.retain || false;

      this.client.publish(topic, message, { qos, retain }, (err: Error | null) => {
        if (err) {
          console.error(`[MQTT] Publish failed: ${topic}`, err);
          reject(err);
        } else {
          console.log(`[MQTT] Published to: ${topic}`);
          resolve();
        }
      });
    });
  }

  /**
   * 取消订阅
   * @param topic 主题
   */
  unsubscribe(topic: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error('MQTT client not initialized'));
        return;
      }

      this.client.unsubscribe(topic, (err: Error | null) => {
        if (err) {
          console.error(`[MQTT] Unsubscribe failed: ${topic}`, err);
          reject(err);
        } else {
          console.log(`[MQTT] Unsubscribed from: ${topic}`);
          resolve();
        }
      });
    });
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(topic: string, payload: Buffer): void {
    try {
      const messageStr = payload.toString();
      let parsedPayload: any;

      try {
        parsedPayload = JSON.parse(messageStr);
      } catch {
        parsedPayload = messageStr;
      }

      const message: MqttMessage = {
        topic,
        payload: parsedPayload,
        timestamp: new Date(),
        qos: 1,
        retained: false,
      };

      console.log(`[MQTT] Received: ${topic}`, parsedPayload);

      // 发射消息事件
      this.emit('message', message);
      
      // 根据主题分发消息
      this.dispatchMessage(topic, parsedPayload);
    } catch (error) {
      console.error('[MQTT] Message handling error:', error);
    }
  }

  /**
   * 根据主题分发消息到对应的处理器
   */
  private dispatchMessage(topic: string, payload: any): void {
    // 主题结构: farm/{plotId}/{deviceId}/{sensorType}/data
    const topicParts = topic.split('/');

    if (topicParts.length >= 5 && topicParts[4] === 'data') {
      const [, plotId, deviceId, sensorType] = topicParts;
      
      // 验证必需字段
      if (!payload.value || !payload.timestamp) {
        console.warn('[MQTT] Invalid message format, missing required fields');
        return;
      }

      // 发射特定类型的消息事件
      this.emit('sensorData', {
        plotId,
        deviceId,
        sensorType,
        value: payload.value,
        unit: payload.unit,
        timestamp: payload.timestamp,
        batteryLevel: payload.battery_level,
      });
    }
  }

  /**
   * 断开连接
   */
  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.client) {
        this.client.end(true, () => {
          console.log('[MQTT] Disconnected gracefully');
          this.isConnected = false;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * 获取连接状态
   */
  isClientConnected(): boolean {
    return this.isConnected;
  }
}

// 导出单例
export const mqttService = new MqttService();
