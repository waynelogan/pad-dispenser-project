import { PadItem, ESP32Telemetry, MPesaPaymentRequest, TelemetryLogEntry } from '@/types/dispenser';

export const INITIAL_PADS: PadItem[] = [
  {
    id: 'pad_slot_1',
    slotNumber: 1,
    name: 'Regular Ultra-Thin',
    subtitle: 'Day Use Wings (240mm)',
    absorbency: 'Regular',
    lengthMm: 240,
    packSize: 1,
    priceKes: 20,
    currentStock: 42,
    maxCapacity: 50,
    lowStockThreshold: 10,
    color: '#ec4899', // Pink
    gradient: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)',
    iconName: 'Sun',
    description: 'Soft cottony cover with ultra-absorbent core. Ideal for medium flow day wear.'
  },
  {
    id: 'pad_slot_2',
    slotNumber: 2,
    name: 'Super Maxi Wings',
    subtitle: 'Heavy Flow Defense (280mm)',
    absorbency: 'Heavy',
    lengthMm: 280,
    packSize: 1,
    priceKes: 25,
    currentStock: 28,
    maxCapacity: 50,
    lowStockThreshold: 10,
    color: '#8b5cf6', // Purple
    gradient: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
    iconName: 'Shield',
    description: 'Extra width and double leak-guards designed for high activity and heavy flow days.'
  },
  {
    id: 'pad_slot_3',
    slotNumber: 3,
    name: 'Night-Guard Extra Long',
    subtitle: 'Overnight 360° Shield (320mm)',
    absorbency: 'Overnight',
    lengthMm: 320,
    packSize: 1,
    priceKes: 30,
    currentStock: 8, // Low stock on purpose to demonstrate alert system
    maxCapacity: 50,
    lowStockThreshold: 10,
    color: '#6366f1', // Indigo
    gradient: 'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)',
    iconName: 'Moon',
    description: 'Extended back coverage with dual channel absorbency for comfortable sleep.'
  },
  {
    id: 'pad_slot_4',
    slotNumber: 4,
    name: 'Daily Fresh Organic',
    subtitle: 'Breathable Panty Liners (155mm)',
    absorbency: 'Light',
    lengthMm: 155,
    packSize: 1,
    priceKes: 15,
    currentStock: 45,
    maxCapacity: 50,
    lowStockThreshold: 10,
    color: '#14b8a6', // Teal
    gradient: 'linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)',
    iconName: 'Sparkles',
    description: '100% organic cotton top sheet. Ultra thin for everyday freshness and confidence.'
  }
];

export const INITIAL_TELEMETRY: ESP32Telemetry = {
  deviceId: 'ESP32-CELL-DISPENSER-01',
  firmwareVersion: 'v2.4.1-SIM7000G',
  status: 'ONLINE',
  cellularProvider: 'Safaricom 4G LTE',
  cellularNetwork: '4G LTE (Band 20 / 800MHz)',
  rssiDbm: -68, // dBm
  csq: 24, // 0-31 CSQ scale
  ipAddress: '102.140.231.45',
  batteryPercentage: 94,
  batteryVoltage: 4.12,
  acPowerConnected: true,
  temperatureC: 24.2,
  humidityPercent: 48.5,
  doorStatus: 'CLOSED_LOCKED',
  lastPingTime: new Date().toISOString(),
  totalDispensedCount: 342,
  activeMotors: [
    { slot: 1, status: 'IDLE' },
    { slot: 2, status: 'IDLE' },
    { slot: 3, status: 'IDLE' },
    { slot: 4, status: 'IDLE' }
  ]
};

export const INITIAL_TRANSACTIONS: MPesaPaymentRequest[] = [
  {
    id: 'TXN-984210',
    checkoutRequestId: 'ws_CO_02102026091200123',
    merchantRequestId: 'MR-29381-88',
    phoneNumber: '0722123456',
    padId: 'pad_slot_1',
    padName: 'Regular Ultra-Thin',
    slotNumber: 1,
    quantity: 1,
    totalAmountKes: 20,
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'COMPLETED',
    mpesaReceiptNumber: 'QKS849102A',
    resultCode: 0,
    resultDesc: 'The service request is processed successfully.'
  },
  {
    id: 'TXN-984209',
    checkoutRequestId: 'ws_CO_02102026090100456',
    merchantRequestId: 'MR-29381-87',
    phoneNumber: '0711987654',
    padId: 'pad_slot_3',
    padName: 'Night-Guard Extra Long',
    slotNumber: 3,
    quantity: 2,
    totalAmountKes: 60,
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: 'COMPLETED',
    mpesaReceiptNumber: 'QKS848991B',
    resultCode: 0,
    resultDesc: 'The service request is processed successfully.'
  },
  {
    id: 'TXN-984208',
    checkoutRequestId: 'ws_CO_02102026084000789',
    merchantRequestId: 'MR-29381-86',
    phoneNumber: '0733555111',
    padId: 'pad_slot_2',
    padName: 'Super Maxi Wings',
    slotNumber: 2,
    quantity: 1,
    totalAmountKes: 25,
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    status: 'COMPLETED',
    mpesaReceiptNumber: 'QKS847801C',
    resultCode: 0,
    resultDesc: 'The service request is processed successfully.'
  }
];

export const INITIAL_LOGS: TelemetryLogEntry[] = [
  {
    id: 'log-1',
    timestamp: new Date().toISOString(),
    type: 'CELLULAR',
    message: 'Registered on Safaricom 4G LTE network',
    details: 'CSQ: 24/31, RSSI: -68 dBm, IP: 102.140.231.45'
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    type: 'INFO',
    message: 'Firebase Realtime Sync heartbeat ping OK',
    details: 'Latency: 42ms'
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    type: 'SUCCESS',
    message: 'Dispensed 1 unit from Slot 1 (Regular Ultra-Thin)',
    details: 'Motor #1 rotated 360° - IR optical sensor verified ejection'
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    type: 'WARN',
    message: 'Slot 3 stock below threshold (8 units left)',
    details: 'Refill notification sent to administrator'
  }
];
