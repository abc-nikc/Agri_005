/**
 * MQTT 主题结构常量
 * 命名规则: farm/{plotId}/{deviceId}/{sensorType}/data
 */

export const MQTT_TOPICS = {
  // 传感器数据上报
  SENSOR_DATA: (plotId: string, deviceId: string, sensorType: string) =>
    `farm/${plotId}/${deviceId}/${sensorType}/data`,

  // 设备控制指令
  DEVICE_CONTROL: (plotId: string, deviceId: string) =>
    `farm/${plotId}/${deviceId}/control`,

  // 设备状态上报
  DEVICE_STATUS: (plotId: string, deviceId: string) =>
    `farm/${plotId}/${deviceId}/status`,

  // 设备告警
  DEVICE_ALERT: (plotId: string, deviceId: string) =>
    `farm/${plotId}/${deviceId}/alert`,

  // 系统广播
  SYSTEM_BROADCAST: 'farm/system/broadcast',

  // 通配符主题
  ALL_SENSOR_DATA: 'farm/+/+/+/data',
  ALL_DEVICE_CONTROL: 'farm/+/+/control',
  ALL_DEVICE_STATUS: 'farm/+/+/status',
  ALL_DEVICE_ALERT: 'farm/+/+/alert',
} as const;

export const SENSOR_TYPES = {
  TEMPERATURE: 'temperature',
  HUMIDITY: 'humidity',
  SOIL_MOISTURE: 'soil_moisture',
  LIGHT: 'light',
  PH: 'ph',
  CO2: 'co2',
} as const;

export const DEVICE_TYPES = {
  SENSOR: 'sensor',
  IRRIGATION: 'irrigation',
  VENTILATION: 'ventilation',
  PUMP: 'pump',
} as const;

export type SensorType = typeof SENSOR_TYPES[keyof typeof SENSOR_TYPES];
export type DeviceType = typeof DEVICE_TYPES[keyof typeof DEVICE_TYPES];
