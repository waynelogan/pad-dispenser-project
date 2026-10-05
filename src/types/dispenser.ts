export interface PadItem {
  id: string;
  slotNumber: number; // 1 to 4
  name: string;
  subtitle: string;
  absorbency: 'Light' | 'Regular' | 'Heavy' | 'Overnight';
  lengthMm: number;
  packSize: number;
  priceKes: number;
  currentStock: number;
  maxCapacity: number;
  lowStockThreshold: number;
  color: string;
  gradient: string;
  iconName: string;
  description: string;
}

export interface ESP32Telemetry {
  deviceId: string;
  firmwareVersion: string;
  status: 'ONLINE' | 'OFFLINE' | 'DISPENSING' | 'MAINTENANCE';
  cellularProvider: string;
  cellularNetwork: string; // e.g. "4G LTE", "NB-IoT", "EDGE"
  rssiDbm: number; // Signal strength e.g., -72
  csq: number; // 0-31 CSQ rating
  ipAddress: string;
  batteryPercentage: number;
  batteryVoltage: number;
  acPowerConnected: boolean;
  temperatureC: number;
  humidityPercent: number;
  doorStatus: 'CLOSED_LOCKED' | 'OPEN_ALERT' | 'TAMPER_DETECTED';
  lastPingTime: string;
  totalDispensedCount: number;
  activeMotors: { slot: number; status: 'IDLE' | 'MOTOR_DISPENSING' | 'FAULT' }[];
}

export interface MPesaPaymentRequest {
  id: string;
  checkoutRequestId: string;
  merchantRequestId: string;
  phoneNumber: string;
  padId: string;
  padName: string;
  slotNumber: number;
  quantity: number;
  totalAmountKes: number;
  timestamp: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  mpesaReceiptNumber?: string;
  resultCode?: number;
  resultDesc?: string;
}

export interface TelemetryLogEntry {
  id: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'CELLULAR';
  message: string;
  details?: string;
}
