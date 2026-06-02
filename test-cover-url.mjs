import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
    console.log("No supabase url");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const { data, error } = await supabase.from('blog_posts').select('slug, cover_url').limit(3);
console.log(JSON.stringify(data, null, 2));
