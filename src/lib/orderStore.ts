import dbConnect from '@/lib/mongodb';
import Order, { IOrder } from '@/lib/models/Order';
import { DispenseOrder } from '@/types/dispenser';

// In-memory fallback queue if MongoDB server is offline
let inMemoryOrders: DispenseOrder[] = [
  {
    id: 'ord_demo_1',
    orderId: 'ORD-99481',
    slotNumber: 1,
    padId: 'pad_slot_1',
    padName: 'Regular Ultra-Thin',
    quantity: 1,
    totalAmountKes: 20,
    phoneNumber: '0722123456',
    mpesaReceipt: 'QKS849102A',
    status: 'DISPENSED',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    dispensedAt: new Date(Date.now() - 29 * 60 * 1000).toISOString(),
    deviceId: 'ESP32-CELL-DISPENSER-01',
    polledCount: 1,
    source: 'MPESA_PURCHASE'
  }
];

export async function createOrderInDB(data: {
  slotNumber: number;
  padId: string;
  padName: string;
  quantity?: number;
  totalAmountKes?: number;
  phoneNumber?: string;
  mpesaReceipt?: string;
  deviceId?: string;
  source?: 'MPESA_PURCHASE' | 'MANUAL_TEST' | 'DASHBOARD_QUEUE' | 'SIMULATION';
}): Promise<{ order: DispenseOrder; dbMode: 'MongoDB' | 'InMemoryFallback' }> {
  const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date();

  const newOrder: DispenseOrder = {
    id: orderId,
    orderId,
    slotNumber: Number(data.slotNumber),
    padId: data.padId || `pad_slot_${data.slotNumber}`,
    padName: data.padName || `Slot ${data.slotNumber} Pad`,
    quantity: Number(data.quantity || 1),
    totalAmountKes: Number(data.totalAmountKes || 20),
    phoneNumber: data.phoneNumber || '',
    mpesaReceipt: data.mpesaReceipt || '',
    status: 'PENDING',
    createdAt: now.toISOString(),
    deviceId: data.deviceId || 'ESP32-CELL-DISPENSER-01',
    polledCount: 0,
    source: data.source || 'DASHBOARD_QUEUE'
  };

  const { isConnected } = await dbConnect();

  if (isConnected) {
    try {
      const doc = await Order.create({
        orderId: newOrder.orderId,
        slotNumber: newOrder.slotNumber,
        padId: newOrder.padId,
        padName: newOrder.padName,
        quantity: newOrder.quantity,
        totalAmountKes: newOrder.totalAmountKes,
        phoneNumber: newOrder.phoneNumber,
        mpesaReceipt: newOrder.mpesaReceipt,
        status: 'PENDING',
        createdAt: now,
        deviceId: newOrder.deviceId,
        polledCount: 0,
        source: newOrder.source
      });

      return {
        order: {
          id: doc._id.toString(),
          orderId: doc.orderId,
          slotNumber: doc.slotNumber,
          padId: doc.padId,
          padName: doc.padName,
          quantity: doc.quantity,
          totalAmountKes: doc.totalAmountKes,
          phoneNumber: doc.phoneNumber,
          mpesaReceipt: doc.mpesaReceipt,
          status: doc.status as any,
          createdAt: doc.createdAt.toISOString(),
          dispensedAt: doc.dispensedAt ? doc.dispensedAt.toISOString() : undefined,
          deviceId: doc.deviceId,
          polledCount: doc.polledCount,
          source: doc.source as any
        },
        dbMode: 'MongoDB'
      };
    } catch (e) {
      console.warn('MongoDB create order failed, falling back to memory queue:', e);
    }
  }

  // Fallback memory
  inMemoryOrders.unshift(newOrder);
  return { order: newOrder, dbMode: 'InMemoryFallback' };
}

export async function pollAndDispenseOrderForESP32(deviceId: string = 'ESP32-CELL-DISPENSER-01'): Promise<{
  hasOrder: boolean;
  order: DispenseOrder | null;
  dbMode: 'MongoDB' | 'InMemoryFallback';
}> {
  const { isConnected } = await dbConnect();

  if (isConnected) {
    try {
      // Find oldest pending order for device
      const pendingDoc = await Order.findOne({ status: 'PENDING' }).sort({ createdAt: 1 });

      if (pendingDoc) {
        pendingDoc.status = 'DISPENSED';
        pendingDoc.dispensedAt = new Date();
        pendingDoc.polledCount = (pendingDoc.polledCount || 0) + 1;
        await pendingDoc.save();

        const formattedOrder: DispenseOrder = {
          id: pendingDoc._id.toString(),
          orderId: pendingDoc.orderId,
          slotNumber: pendingDoc.slotNumber,
          padId: pendingDoc.padId,
          padName: pendingDoc.padName,
          quantity: pendingDoc.quantity,
          totalAmountKes: pendingDoc.totalAmountKes,
          phoneNumber: pendingDoc.phoneNumber,
          mpesaReceipt: pendingDoc.mpesaReceipt,
          status: 'DISPENSED',
          createdAt: pendingDoc.createdAt.toISOString(),
          dispensedAt: pendingDoc.dispensedAt.toISOString(),
          deviceId: pendingDoc.deviceId,
          polledCount: pendingDoc.polledCount,
          source: pendingDoc.source as any
        };

        return { hasOrder: true, order: formattedOrder, dbMode: 'MongoDB' };
      }

      return { hasOrder: false, order: null, dbMode: 'MongoDB' };
    } catch (e) {
      console.warn('MongoDB poll order error, using fallback:', e);
    }
  }

  // Fallback memory
  const pendingIndex = inMemoryOrders.findIndex((o) => o.status === 'PENDING');
  if (pendingIndex !== -1) {
    const order = inMemoryOrders[pendingIndex];
    order.status = 'DISPENSED';
    order.dispensedAt = new Date().toISOString();
    order.polledCount = (order.polledCount || 0) + 1;
    inMemoryOrders[pendingIndex] = order;

    return { hasOrder: true, order, dbMode: 'InMemoryFallback' };
  }

  return { hasOrder: false, order: null, dbMode: 'InMemoryFallback' };
}

export async function fetchAllOrdersFromDB(): Promise<{
  orders: DispenseOrder[];
  dbMode: 'MongoDB' | 'InMemoryFallback';
  isConnected: boolean;
}> {
  const { isConnected } = await dbConnect();

  if (isConnected) {
    try {
      const docs = await Order.find().sort({ createdAt: -1 }).limit(100);
      const orders: DispenseOrder[] = docs.map((doc) => ({
        id: doc._id.toString(),
        orderId: doc.orderId,
        slotNumber: doc.slotNumber,
        padId: doc.padId,
        padName: doc.padName,
        quantity: doc.quantity,
        totalAmountKes: doc.totalAmountKes,
        phoneNumber: doc.phoneNumber,
        mpesaReceipt: doc.mpesaReceipt,
        status: doc.status as any,
        createdAt: doc.createdAt.toISOString(),
        dispensedAt: doc.dispensedAt ? doc.dispensedAt.toISOString() : undefined,
        deviceId: doc.deviceId,
        polledCount: doc.polledCount,
        source: doc.source as any
      }));

      return { orders, dbMode: 'MongoDB', isConnected: true };
    } catch (e) {
      console.warn('MongoDB fetch orders error:', e);
    }
  }

  return { orders: [...inMemoryOrders], dbMode: 'InMemoryFallback', isConnected: false };
}

export async function resetAllOrdersDB(): Promise<{ success: boolean; dbMode: 'MongoDB' | 'InMemoryFallback' }> {
  const { isConnected } = await dbConnect();

  if (isConnected) {
    try {
      await Order.deleteMany({});
      return { success: true, dbMode: 'MongoDB' };
    } catch (e) {
      console.warn('MongoDB reset orders error:', e);
    }
  }

  inMemoryOrders = [];
  return { success: true, dbMode: 'InMemoryFallback' };
}
