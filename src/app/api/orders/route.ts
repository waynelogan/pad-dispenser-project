import { NextResponse } from 'next/server';
import { fetchAllOrdersFromDB, createOrderInDB, resetAllOrdersDB } from '@/lib/orderStore';

// GET /api/orders
// Returns list of all orders stored in MongoDB
export async function GET() {
  try {
    const { orders, dbMode, isConnected } = await fetchAllOrdersFromDB();

    const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
    const dispensedCount = orders.filter((o) => o.status === 'DISPENSED').length;

    return NextResponse.json({
      success: true,
      orders,
      pendingCount,
      dispensedCount,
      dbMode,
      mongoConnected: isConnected,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders from MongoDB' },
      { status: 500 }
    );
  }
}

// POST /api/orders
// Create new order in MongoDB
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slotNumber, padId, padName, quantity, totalAmountKes, phoneNumber, mpesaReceipt, source } = body;

    const { order, dbMode } = await createOrderInDB({
      slotNumber: Number(slotNumber || 1),
      padId,
      padName,
      quantity: Number(quantity || 1),
      totalAmountKes: Number(totalAmountKes || 20),
      phoneNumber,
      mpesaReceipt,
      source: source || 'DASHBOARD_QUEUE'
    });

    return NextResponse.json({
      success: true,
      message: `Order ${order.orderId} created in MongoDB for ESP32 GET polling`,
      order,
      dbMode
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// DELETE /api/orders
// Clear order history in MongoDB
export async function DELETE() {
  try {
    const { dbMode } = await resetAllOrdersDB();
    return NextResponse.json({
      success: true,
      message: 'All order queue history cleared in MongoDB',
      dbMode
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to reset orders' },
      { status: 500 }
    );
  }
}
