import { createClient } from '@supabase/supabase-js';

const url = "https://vzvcztcxxwxmlilmoyxf.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6dmN6dGN4eHd4bWxpbG1veXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDYxNTksImV4cCI6MjA4NjEyMjE1OX0.8JmPcpwwzN57ZAUVGi6AYzTt2vBav9cgeawOyITcAVk";
const supabase = createClient(url, key);

async function test() {
  console.log("Checking storage connection...");
  const { data, error } = await supabase.storage.from('documents').list();
  console.log("Root content:", data, error);
}

test();
