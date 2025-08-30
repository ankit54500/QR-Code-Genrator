const crypto = require('crypto');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const body = JSON.stringify(req.body);
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        const actualSignature = req.headers['x-razorpay-signature'];

        if (expectedSignature !== actualSignature) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = req.body;
        
        if (event.event === 'payment.captured') {
            // Payment successful - update entry status
            const paymentId = event.payload.payment.entity.id;
            // You can update entry status here if needed
            console.log('Payment captured:', paymentId);
        }

        res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
