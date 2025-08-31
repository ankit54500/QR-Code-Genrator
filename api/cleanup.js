import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
    // Allow GET requests for manual cleanup trigger
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const now = new Date().toISOString();
        
        // Only delete expired entries that are not lifetime plans
        const { data, error } = await supabase
            .from('qr_entries')
            .delete()
            .neq('plan', 'lifetime')  // Don't delete lifetime entries
            .lt('expires_at', now);

        if (error) {
            console.error('Cleanup error:', error);
            throw error;
        }

        const deletedCount = data?.length || 0;
        console.log('Cleanup completed. Deleted entries:', deletedCount);
        
        res.status(200).json({ 
            success: true, 
            message: 'Cleanup completed successfully',
            deleted: deletedCount,
            timestamp: now
        });

    } catch (error) {
        console.error('Cleanup failed:', error);
        res.status(500).json({ 
            error: 'Cleanup failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
