import { NextResponse } from 'next/server';
import { INITIAL_PADS } from '@/lib/dispenserData';

// Global in-memory fallback state for dev server instance
let inventoryState = [...INITIAL_PADS];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: inventoryState,
    updatedAt: new Date().toISOString()
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slotNumber, newStock, resetAll } = body;

    if (resetAll) {
      inventoryState = inventoryState.map((pad) => ({
        ...pad,
        currentStock: pad.maxCapacity
      }));
      return NextResponse.json({
        success: true,
        message: 'All pad slots fully refilled to 50 capacity.',
        data: inventoryState
      });
    }

    if (slotNumber && typeof newStock === 'number') {
      inventoryState = inventoryState.map((pad) => {
        if (pad.slotNumber === Number(slotNumber)) {
          return { ...pad, currentStock: Math.max(0, Math.min(pad.maxCapacity, newStock)) };
        }
        return pad;
      });

      return NextResponse.json({
        success: true,
        message: `Slot ${slotNumber} stock updated to ${newStock}`,
        data: inventoryState
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid parameters provided' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}
