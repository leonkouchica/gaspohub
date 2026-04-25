import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  gateway: string;
  customerEmail: string;
  metadata?: Record<string, any>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, amount, currency, gateway, customerEmail, metadata }: PaymentRequest = await req.json();

    console.log(`Processing payment for order ${orderId}:`, { amount, currency, gateway, customerEmail });

    // Validate required fields
    if (!orderId || !amount || !gateway) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: orderId, amount, gateway' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get gateway settings
    const { data: gatewaySettings, error: gatewayError } = await supabase
      .from('payment_gateway_settings')
      .select('*')
      .eq('gateway_name', gateway)
      .eq('is_active', true)
      .maybeSingle();

    if (gatewayError || !gatewaySettings) {
      console.error('Gateway not found or inactive:', gatewayError);
      return new Response(
        JSON.stringify({ error: `Payment gateway "${gateway}" is not available` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let paymentResult;

    // Process based on gateway type
    switch (gateway) {
      case 'stripe':
        // In production, this would integrate with Stripe API
        // For now, simulate successful payment in test mode
        if (gatewaySettings.test_mode) {
          paymentResult = {
            success: true,
            transactionId: `stripe_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'completed',
            gateway: 'stripe',
            message: 'Payment processed successfully (test mode)',
          };
        } else {
          // Would integrate with real Stripe API here
          paymentResult = {
            success: false,
            error: 'Stripe live mode requires API keys to be configured',
          };
        }
        break;

      case 'paystack':
        // In production, this would integrate with Paystack API
        if (gatewaySettings.test_mode) {
          paymentResult = {
            success: true,
            transactionId: `paystack_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'completed',
            gateway: 'paystack',
            message: 'Payment processed successfully (test mode)',
          };
        } else {
          paymentResult = {
            success: false,
            error: 'Paystack live mode requires API keys to be configured',
          };
        }
        break;

      case 'flutterwave':
        // In production, this would integrate with Flutterwave API
        if (gatewaySettings.test_mode) {
          paymentResult = {
            success: true,
            transactionId: `flw_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'completed',
            gateway: 'flutterwave',
            message: 'Payment processed successfully (test mode)',
          };
        } else {
          paymentResult = {
            success: false,
            error: 'Flutterwave live mode requires API keys to be configured',
          };
        }
        break;

      case 'manual':
        // Manual payments are always "pending" until admin confirms
        paymentResult = {
          success: true,
          transactionId: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'pending_confirmation',
          gateway: 'manual',
          message: 'Order placed. Please follow the payment instructions.',
          instructions: gatewaySettings.settings?.instructions || 'Contact us for payment details',
        };
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown payment gateway: ${gateway}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // If payment was successful, update the order status
    if (paymentResult.success) {
      const orderStatus = paymentResult.status === 'completed' ? 'paid' : 'pending_payment';
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: orderStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Failed to update order status:', updateError);
      } else {
        console.log(`Order ${orderId} status updated to ${orderStatus}`);
      }
    }

    console.log('Payment result:', paymentResult);

    return new Response(
      JSON.stringify(paymentResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Payment processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
