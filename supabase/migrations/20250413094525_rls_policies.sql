/*
  # Set up RLS policies for all profile tables
  
  1. Changes
    - Drop existing INSERT policies for all profile tables
    - Create new permissive INSERT policies for profiles, ngo_profiles, and expert_profiles
    - Enable row-level security on all tables
  
  2. Security
    - Policies are intentionally permissive to allow profile creation during signup
    - Security is handled at the application level through the adminSupabase client
*/

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all profile creation" ON profiles;
DROP POLICY IF EXISTS "Allow all ngo_profiles creation" ON ngo_profiles;
DROP POLICY IF EXISTS "Allow all expert_profiles creation" ON expert_profiles;

-- Create permissive INSERT policies for all tables
CREATE POLICY "Allow all profile creation"
ON profiles
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow all ngo_profiles creation"
ON ngo_profiles
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow all expert_profiles creation"
ON expert_profiles
FOR INSERT
TO public
WITH CHECK (true); 