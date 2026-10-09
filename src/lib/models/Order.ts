import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrder extends Document {
  orderId: string;
  slotNumber: number;
  padId: string;
  padName: string;
  quantity: number;
  totalAmountKes: number;
  phoneNumber?: string;
  mpesaReceipt?: string;
  status: 'PENDING' | 'DISPENSED' | 'FAILED' | 'CANCELLED';
  createdAt: Date;
  dispensedAt?: Date;
  deviceId?: string;
  polledCount?: number;
  source: 'MPESA_PURCHASE' | 'MANUAL_TEST' | 'DASHBOARD_QUEUE' | 'SIMULATION';
}

const OrderSchema: Schema<IOrder> = new Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    slotNumber: { type: Number, required: true, min: 1, max: 4 },
    padId: { type: String, required: true },
    padName: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    totalAmountKes: { type: Number, required: true, default: 0 },
    phoneNumber: { type: String, default: '' },
    mpesaReceipt: { type: String, default: '' },
    status: {
      type: String,
      enum: ['PENDING', 'DISPENSED', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    createdAt: { type: Date, default: Date.now, index: true },
    dispensedAt: { type: Date },
    deviceId: { type: String, default: 'ESP32-CELL-DISPENSER-01' },
    polledCount: { type: Number, default: 0 },
    source: {
      type: String,
      enum: ['MPESA_PURCHASE', 'MANUAL_TEST', 'DASHBOARD_QUEUE', 'SIMULATION'],
      default: 'DASHBOARD_QUEUE'
    }
  },
  { timestamps: true }
);

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
