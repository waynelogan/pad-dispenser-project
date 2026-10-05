import { NextResponse } from 'next/server';
import { INITIAL_TELEMETRY } from '@/lib/dispenserData';

let currentTelemetry = { ...INITIAL_TELEMETRY };

export async function GET() {
  // Add small random noise to battery/signal to simulate live cellular telemetry updating
  const updated = {
    ...currentTelemetry,
    rssiDbm: -65 - Math.floor(Math.random() * 8),
    batteryVoltage: Number((4.05 + Math.random() * 0.1).toFixed(2)),
    temperatureC: Number((23.8 + Math.random() * 0.8).toFixed(1)),
    lastPingTime: new Date().toISOString()
  };

  return NextResponse.json({
    success: true,
    telemetry: updated
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    currentTelemetry = {
      ...currentTelemetry,
      ...body,
      lastPingTime: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'ESP32 Cellular Telemetry updated successfully',
      telemetry: currentTelemetry
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process ESP32 telemetry packet' },
      { status: 500 }
    );
  }
}
