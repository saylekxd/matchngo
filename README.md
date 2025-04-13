# NGO Expert Connect

A platform connecting NGOs with experts for collaboration on projects.

## Supabase Setup :)

### Managing RLS Policies

If you encounter issues with Row-Level Security (RLS) policies, you can:

1. **Access the Supabase Dashboard**:
   - Go to [https://app.supabase.io](https://app.supabase.io)
   - Navigate to your project: `zabkdqubotsrmnxglaap`
   - Go to Authentication > Policies

2. **Modify the Profiles Table Policy**:
   - Find the "profiles" table
   - Check the INSERT policy
   - Make sure it includes this condition:
     ```sql
     ((auth.uid() = user_id) OR (auth.role() = 'service_role'))
     ```

3. **Alternative Solution (Already Implemented)**:
   - The application uses a service role bypass for profile creation during signup
   - This is implemented by using the `adminSupabase` client with the `x-supabase-auth-override` header

## Troubleshooting

If you continue to see RLS policy errors:

1. Make sure your Supabase project is properly initialized
2. Verify that all migrations have been applied
3. Check if you need to restart your application after making changes
4. Consider updating your Supabase client to the latest version 