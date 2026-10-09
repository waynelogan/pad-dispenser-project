import { NextResponse } from 'next/server';
import { pollAndDispenseOrderForESP32, createOrderInDB } from '@/lib/orderStore';

// GET /api/esp32/poll
// ESP32 sends GET requests every few seconds to poll for pending dispense orders stored in MongoDB
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId') || 'ESP32-CELL-DISPENSER-01';

    const result = await pollAndDispenseOrderForESP32(deviceId);

    return NextResponse.json({
      success: true,
      hasOrder: result.hasOrder,
      order: result.order,
      message: result.hasOrder
        ? `ESP32 Order Found! Dispense slot ${result.order?.slotNumber} (${result.order?.padName})`
        : 'No pending orders in MongoDB queue',
      pollTimestamp: new Date().toISOString(),
      dbMode: result.dbMode
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        hasOrder: false,
        order: null,
        error: 'ESP32 polling error occurred',
        pollTimestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST /api/esp32/poll
// Queue a new dispense order into MongoDB for ESP32 GET polling
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slotNumber, padId, padName, quantity = 1, totalAmountKes = 20, phoneNumber, mpesaReceipt, source = 'DASHBOARD_QUEUE' } = body;

    if (!slotNumber || slotNumber < 1 || slotNumber > 4) {
      return NextResponse.json(
        { success: false, error: 'Invalid slotNumber. Must be between 1 and 4.' },
        { status: 400 }
      );
    }

    const { order, dbMode } = await createOrderInDB({
      slotNumber: Number(slotNumber),
      padId: padId || `pad_slot_${slotNumber}`,
      padName: padName || `Slot ${slotNumber} Pad`,
      quantity: Number(quantity),
      totalAmountKes: Number(totalAmountKes),
      phoneNumber,
      mpesaReceipt,
      source
    });

    return NextResponse.json({
      success: true,
      message: `New dispense order ${order.orderId} added to MongoDB queue for ESP32 GET polling`,
      order,
      dbMode
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to queue order into MongoDB' },
      { status: 500 }
    );
  }
}
