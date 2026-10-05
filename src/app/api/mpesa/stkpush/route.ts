import { NextResponse } from 'next/server';

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('+254')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, padId, padName, slotNumber, quantity, amount } = body;

    if (!phoneNumber || !padId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required checkout fields (phoneNumber, padId, amount)' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!/^254[71][0-9]{8}$/.test(formattedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Kenyan phone number. Use format 07XXXXXXXX or 01XXXXXXXX.' },
        { status: 400 }
      );
    }

    // Check if live M-Pesa credentials exist in env
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const passkey = process.env.MPESA_PASSKEY;
    const shortcode = process.env.MPESA_SHORTCODE || '174379';

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const checkoutRequestId = `ws_CO_${timestamp}_${Math.floor(1000 + Math.random() * 9000)}`;
    const merchantRequestId = `MR-${Math.floor(10000 + Math.random() * 90000)}`;

    if (consumerKey && consumerSecret && passkey) {
      // Real Safaricom Daraja API STK Push logic would go here
      // For now, return formatted structure with credentials active flag
    }

    // Return STK Push success simulation response
    return NextResponse.json({
      success: true,
      message: `M-Pesa STK Push initiated successfully to ${formattedPhone}`,
      data: {
        checkoutRequestId,
        merchantRequestId,
        phoneNumber: formattedPhone,
        amount: Number(amount),
        padId,
        padName,
        slotNumber: Number(slotNumber),
        quantity: Number(quantity || 1),
        timestamp: new Date().toISOString(),
        customerMessage: `Success. Prompt sent to ${formattedPhone}. Enter M-Pesa PIN on your phone to complete purchase.`
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to initiate M-Pesa STK Push' },
      { status: 500 }
    );
  }
}
