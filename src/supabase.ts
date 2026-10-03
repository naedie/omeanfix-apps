import { createClient } from '@supabase/supabase-js'

// Kita letakkan alamat dan kunci langsung di sini agar sistem tidak bingung
const supabaseUrl = 'https://bxjvjxaoinqpelxakvrq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4anZqeGFvaW5xcGVseGFrdnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1ODkwNjQsImV4cCI6MjEwNjE2NTA2NH0.s3GmoJ45qVxMLlTEWVxuRMcwgySLDRU9pDtseCVOrzE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)