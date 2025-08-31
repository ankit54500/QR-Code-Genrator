import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify Razorpay webhook signature
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
            console.error('Webhook secret not configured');
            return res.status(500).json({ error: 'Webhook secret not configured' });
        }

        const body = JSON.stringify(req.body);
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');
        
        const actualSignature = req.headers['x-razorpay-signature'];
        
        if (expectedSignature !== actualSignature) {
            console.error('Invalid webhook signature');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = req.body;
        console.log('Webhook event received:', event.event);
        
        if (event.event === 'payment.captured') {
            // Payment successful
            const payment = event.payload.payment.entity;
            const paymentId = payment.id;
            const amount = payment.amount / 100; // Convert from paise to rupees
            
            console.log('Payment captured:', {
                paymentId,
                amount,
                status: payment.status
            });

            // You can store payment records in Supabase if needed
            const paymentRecord = {
                payment_id: paymentId,
                amount: amount,
                currency: payment.currency,
                status: payment.status,
                method: payment.method,
                created_at: new Date(payment.created_at * 1000).toISOString(),
                received_at: new Date().toISOString()
            };

            // Optional: Save payment record to database
            const { data, error } = await supabase
                .from('payments')
                .insert([paymentRecord]);

            if (error) {
                console.error('Failed to save payment record:', error);
                // Don't fail the webhook for this
            } else {
                console.log('Payment record saved:', data);
            }

        } else if (event.event === 'payment.failed') {
            // Payment failed
            const payment = event.payload.payment.entity;
            console.log('Payment failed:', payment.id, payment.error_description);
            
        } else {
            console.log('Unhandled webhook event:', event.event);
        }

        res.status(200).json({ 
            status: 'ok',
            event: event.event,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
