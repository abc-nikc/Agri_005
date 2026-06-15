import { ref, onUnmounted } from 'vue';

export interface SmartSuggestion {
  type: 'irrigation' | 'harvest' | 'pest' | 'maintenance';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
  plotId?: string;
  batchId?: string;
}

export interface SensorReading {
  id: string; plotId: string; deviceId: string; sensorType: string;
  value: number; unit: string; recordedAt: string;
}

export function useSSE() {
  const suggestions = ref<SmartSuggestion[]>([]);
  const unreadCount = ref(0);
  const connected = ref(false);
  const sensorData = ref<SensorReading[]>([]);
  let eventSource: EventSource | null = null;

  function connect() {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const url = `http://localhost:3001/api/v1/sse/stream?token=${encodeURIComponent(token)}`;
    eventSource = new EventSource(url);

    eventSource.onopen = () => { connected.value = true; };
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.suggestions) suggestions.value = data.suggestions;
        if (data.unreadCount !== undefined) unreadCount.value = data.unreadCount;
        if (data.sensorData) sensorData.value = data.sensorData;
      } catch {}
    };
    eventSource.onerror = () => { connected.value = false; };
  }

  function disconnect() {
    eventSource?.close();
    eventSource = null;
    connected.value = false;
  }

  onUnmounted(() => disconnect());
  connect();

  return { suggestions, unreadCount, connected, sensorData, reconnect: () => { disconnect(); connect(); } };
}
