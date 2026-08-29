export default function handler(req, res) {
    // إعدادات آمنة من متغيرات البيئة
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    
    res.status(200).json({
        SUPABASE_URL: process.env.SUPABASE_URL || '',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
        BOT_TOKEN: process.env.BOT_TOKEN || '',
        CHANNEL_ID: process.env.CHANNEL_ID || ''
    });
}