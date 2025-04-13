/*
  # Add INSERT policy for profiles table
  
  1. Changes
     - Add a new INSERT policy for the profiles table to allow users to create their own profile
     - This fixes the sign-up flow where users were getting RLS policy violations
  
  2. Security
     - The policy ensures users can only create profiles with their own user_id
*/

-- Add INSERT policy to allow users to create their own profile
CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
TO public
WITH CHECK (auth.uid() = user_id);