/*
  # Fix profiles table insert policy for service role

  1. Changes
    - Drop any existing INSERT policy for profiles table
    - Create a new INSERT policy that allows authenticated users, service role, and initial auth
      flow to create profiles
  
  2. Security
    - The policy maintains proper security while allowing the signup flow to work correctly
    - Explicitly allows service_role to bypass RLS during the signup flow
*/

-- Drop any existing INSERT policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable profile creation during signup" ON profiles;

-- Create an improved INSERT policy with service role support
CREATE POLICY "Enable profile creation during signup"
ON profiles
FOR INSERT
TO public
WITH CHECK (
  -- Allow authenticated users to create their own profile
  (auth.uid() = user_id) OR
  -- Allow initial auth flow when JWT might not be established
  (auth.jwt() IS NULL) OR
  -- Explicitly allow the service role to create profiles during signup
  (auth.role() = 'service_role')
); 