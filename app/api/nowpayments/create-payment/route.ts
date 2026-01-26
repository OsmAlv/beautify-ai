import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { price_amount, price_currency, order_id, order_description } = await request.json();

    console.log('📝 Creating payment:', { price_amount, price_currency, order_id });

    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    
    if (!apiKey) {
      console.error('❌ API key not found');
      return NextResponse.json({ error: 'NOWPayments API key not configured' }, { status: 500 });
    }

    console.log('✅ API key found:', apiKey.substring(0, 10) + '...');

    const requestBody = {
      price_amount,
      price_currency,
      pay_currency: 'usdttrc20',
      order_id,
      order_description,
      ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/nowpayments/callback`,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
    };

    console.log('📤 Request to NOWPayments:', requestBody);

    // Создаем инвойс в NOWPayments (вместо прямого платежа)
    const response = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    console.log('📥 Response from NOWPayments:', { status: response.status, data });

    if (!response.ok) {
      console.error('❌ NOWPayments error:', data);
      return NextResponse.json({ error: data.message || JSON.stringify(data) }, { status: response.status });
    }

    return NextResponse.json({
      payment_id: data.id,
      payment_status: data.payment_status,
      invoice_url: data.invoice_url,
    });
  } catch (error) {
    console.error('❌ Payment creation error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
