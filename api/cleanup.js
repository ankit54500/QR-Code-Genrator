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
        const now = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('qr_entries')
            .delete()
            .lt('expires_at', now);

        if (error) throw error;

        console.log('Cleanup completed:', data);
        res.status(200).json({ 
            success: true, 
            message: 'Cleanup completed',
            deleted: data?.length || 0
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({ error: 'Cleanup failed' });
    }
}