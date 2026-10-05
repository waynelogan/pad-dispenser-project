import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slotNumber, quantity = 1, transactionId } = body;

    if (!slotNumber || slotNumber < 1 || slotNumber > 4) {
      return NextResponse.json(
        { success: false, error: 'Invalid pad slot number. Must be between 1 and 4.' },
        { status: 400 }
      );
    }

    // Generate ESP32 SIM7000G cellular command packet
    const hardwareCommand = {
      cmd: 'ACTUATE_SLOT_MOTOR',
      slot: Number(slotNumber),
      qty: Number(quantity),
      pulseDurationMs: 850,
      sensorVerification: true,
      transactionRef: transactionId || `MANUAL-${Date.now()}`
    };

    // Simulated cellular response from ESP32
    return NextResponse.json({
      success: true,
      message: `ESP32 Cellular command issued: Dispense ${quantity} pad(s) from Slot ${slotNumber}`,
      hardwareResponse: {
        status: 'DISPENSED_SUCCESS',
        slotActuated: Number(slotNumber),
        sensorTriggered: true,
        motorPulseMs: 850,
        firmwareAck: 'ACK_DISPENSE_OK_OPTICAL_VERIFIED',
        timestamp: new Date().toISOString()
      },
      commandPayload: hardwareCommand
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to trigger ESP32 dispensation command' },
      { status: 500 }
    );
  }
}
