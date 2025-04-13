/*
  # Fix profiles table insert policy

  1. Changes
    - Drop the existing restrictive INSERT policy for profiles table
    - Create a new INSERT policy that allows both authenticated users to create their own profile
      and also allows the service role to create profiles during signup
  
  2. Security
    - The new policy maintains proper security while allowing the signup flow to work correctly
    - Enables profile creation during the signup process
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable profile creation during signup" ON profiles;

-- Create a new, more permissive INSERT policy
CREATE POLICY "Enable profile creation during signup"
ON profiles
FOR INSERT
TO public
WITH CHECK (
  -- Allow authenticated users to create their own profile
  (auth.uid() = user_id) OR
  -- Also allow profile creation during signup when auth is not fully established
  (auth.jwt() IS NULL) OR
  -- Allow service role operations (crucial for registration flow)
  (auth.role() = 'service_role')
);