const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://zvhjzecttjjyacafwldq.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2aGp6ZWN0dGpqeWFjYWZ3bGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NzM0NjAsImV4cCI6MjA3MDU0OTQ2MH0.ZDkhmsd-xbsA5ZnBsp47w99UIvWBug1XKr7JkJxaJK4';

// ใช้ Service Role Key ถ้ามี (จะ bypass RLS)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const keyToUse = supabaseServiceKey || supabaseAnonKey;

// Create Supabase client
const supabase = createClient(supabaseUrl, keyToUse);

// Test connection function
const testConnection = async () => {
  try {
    // ทดสอบการเชื่อมต่อโดยเรียก Supabase REST API โดยตรง
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': keyToUse,
        'Authorization': `Bearer ${keyToUse}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Supabase connection successful');
      
      // ลองทดสอบเข้าถึงตาราง uat_Liv
      try {
        const { data, error } = await supabase
          .from('uat_Liv')
          .select('*')
          .limit(1);
        
        if (error) {
          console.log('⚠️  Table access limited:', error.message);
          console.log('💡 Note: You may need to configure RLS policies in Supabase');
          console.log('💡 Or use service role key to bypass RLS');
          return true; // ยังถือว่าเชื่อมต่อได้
        } else {
          console.log(`📊 Table access OK - Found ${data ? data.length : 0} records`);
          return true;
        }
      } catch (tableError) {
        console.log('⚠️  Table access error:', tableError.message);
        return true; // ยังถือว่าเชื่อมต่อได้
      }
    } else {
      console.error('❌ Supabase connection failed: HTTP', response.status);
      return false;
    }
  } catch (err) {
    console.error('❌ Supabase connection error:', err.message);
    return false;
  }
};

module.exports = {
  supabase,
  testConnection
};
