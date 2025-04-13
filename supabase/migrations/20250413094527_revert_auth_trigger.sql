-- Drop the trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the trigger function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop the policies we added
DROP POLICY IF EXISTS "Allow users to read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow service role full access" ON profiles;
DROP POLICY IF EXISTS "Allow all profile creation" ON profiles;

-- Restore the original INSERT policy
CREATE POLICY "Allow all profile creation"
ON profiles
FOR INSERT
TO public
WITH CHECK (true); 