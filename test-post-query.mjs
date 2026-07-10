import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('community_posts')
    .select(`
      id, content, image_url, category, course_id, created_at, user_id,
      profiles (full_name, avatar_url),
      courses (title),
      community_post_likes (user_id)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase Error:', error);
  } else {
    console.log('Success!', data?.length, 'posts');
  }
}

test();
