/*
  # Initial database schema for NGO-Expert Connect

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users.id)
      - `role` (enum: 'ngo', 'expert')
      - `full_name` (text)
      - `bio` (text)
      - `avatar_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
    - `ngo_profiles`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, references profiles.id)
      - `organization_name` (text)
      - `website` (text)
      - `mission_statement` (text)
      - `founded_year` (int4)
      - `country` (text)
      - `city` (text)
      - `verified` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
    - `expert_profiles`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, references profiles.id)
      - `expertise_areas` (text[])
      - `years_experience` (int4)
      - `education` (jsonb)
      - `certifications` (jsonb)
      - `location` (jsonb - lat/long)
      - `availability` (jsonb)
      - `hourly_rate` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
    - `opportunities`
      - `id` (uuid, primary key)
      - `ngo_id` (uuid, references ngo_profiles.id)
      - `title` (text)
      - `description` (text)
      - `required_expertise` (text[])
      - `location` (jsonb - lat/long)
      - `location_name` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `compensation` (jsonb)
      - `status` (enum: 'draft', 'open', 'in_progress', 'closed')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
    - `applications`
      - `id` (uuid, primary key)
      - `opportunity_id` (uuid, references opportunities.id)
      - `expert_id` (uuid, references expert_profiles.id)
      - `message` (text)
      - `status` (enum: 'pending', 'accepted', 'rejected', 'withdrawn')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
    - `messages`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references profiles.id)
      - `receiver_id` (uuid, references profiles.id)
      - `content` (text)
      - `read` (boolean)
      - `created_at` (timestamp)
      
    - `reviews`
      - `id` (uuid, primary key)
      - `opportunity_id` (uuid, references opportunities.id)
      - `reviewer_id` (uuid, references profiles.id)
      - `reviewee_id` (uuid, references profiles.id)
      - `rating` (int2)
      - `comment` (text)
      - `created_at` (timestamp)
      
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('ngo', 'expert');
CREATE TYPE opportunity_status AS ENUM ('draft', 'open', 'in_progress', 'closed');
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

-- Create profiles table (shared between NGOs and Experts)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_user_id UNIQUE (user_id)
);

-- Create NGO profiles table
CREATE TABLE IF NOT EXISTS ngo_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  organization_name TEXT NOT NULL,
  website TEXT,
  mission_statement TEXT,
  founded_year INT,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  verified BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_profile_id UNIQUE (profile_id)
);

-- Create Expert profiles table
CREATE TABLE IF NOT EXISTS expert_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  expertise_areas TEXT[] NOT NULL,
  years_experience INT,
  education JSONB DEFAULT '[]'::jsonb NOT NULL,
  certifications JSONB DEFAULT '[]'::jsonb NOT NULL,
  location JSONB DEFAULT '{"latitude": 0, "longitude": 0}'::jsonb NOT NULL,
  availability JSONB DEFAULT '{}'::jsonb NOT NULL,
  hourly_rate NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_profile_id UNIQUE (profile_id)
);

-- Create Opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID REFERENCES ngo_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_expertise TEXT[] NOT NULL,
  location JSONB DEFAULT '{"latitude": 0, "longitude": 0}'::jsonb NOT NULL,
  location_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  compensation JSONB NOT NULL,
  status opportunity_status DEFAULT 'draft' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create Applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  expert_id UUID REFERENCES expert_profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status application_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_application UNIQUE (opportunity_id, expert_id)
);

-- Create Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_review UNIQUE (opportunity_id, reviewer_id, reviewee_id)
);

-- Create saved_opportunities table
CREATE TABLE IF NOT EXISTS saved_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES expert_profiles(id) ON DELETE CASCADE NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_saved_opportunity UNIQUE (expert_id, opportunity_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view other public profiles"
  ON profiles
  FOR SELECT
  USING (true);

-- NGO profiles policies
CREATE POLICY "NGOs can view their own organization profile"
  ON ngo_profiles
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = ngo_profiles.profile_id
    AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "NGOs can update their own organization profile"
  ON ngo_profiles
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = ngo_profiles.profile_id
    AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Anyone can view NGO profiles"
  ON ngo_profiles
  FOR SELECT
  USING (true);

-- Expert profiles policies
CREATE POLICY "Experts can view their own profile"
  ON expert_profiles
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = expert_profiles.profile_id
    AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Experts can update their own profile"
  ON expert_profiles
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = expert_profiles.profile_id
    AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Anyone can view expert profiles"
  ON expert_profiles
  FOR SELECT
  USING (true);

-- Opportunities policies
CREATE POLICY "NGOs can create opportunities"
  ON opportunities
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM ngo_profiles
    JOIN profiles ON ngo_profiles.profile_id = profiles.id
    WHERE ngo_profiles.id = opportunities.ngo_id
    AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "NGOs can update their own opportunities"
  ON opportunities
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM ngo_profiles
    JOIN profiles ON ngo_profiles.profile_id = profiles.id
    WHERE ngo_profiles.id = opportunities.ngo_id
    AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Anyone can view opportunities"
  ON opportunities
  FOR SELECT
  USING (true);

-- Applications policies
CREATE POLICY "Experts can create applications"
  ON applications
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM expert_profiles
    JOIN profiles ON expert_profiles.profile_id = profiles.id
    WHERE expert_profiles.id = applications.expert_id
    AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Experts can update their own applications"
  ON applications
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM expert_profiles
    JOIN profiles ON expert_profiles.profile_id = profiles.id
    WHERE expert_profiles.id = applications.expert_id
    AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "NGOs can update application statuses"
  ON applications
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM opportunities
    JOIN ngo_profiles ON opportunities.ngo_id = ngo_profiles.id
    JOIN profiles ON ngo_profiles.profile_id = profiles.id
    WHERE opportunities.id = applications.opportunity_id
    AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can view their own applications"
  ON applications
  FOR SELECT
  USING (
    -- Experts can see their own applications
    EXISTS (
      SELECT 1 FROM expert_profiles
      JOIN profiles ON expert_profiles.profile_id = profiles.id
      WHERE expert_profiles.id = applications.expert_id
      AND profiles.user_id = auth.uid()
    )
    OR
    -- NGOs can see applications for their opportunities
    EXISTS (
      SELECT 1 FROM opportunities
      JOIN ngo_profiles ON opportunities.ngo_id = ngo_profiles.id
      JOIN profiles ON ngo_profiles.profile_id = profiles.id
      WHERE opportunities.id = applications.opportunity_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY "Users can create messages"
  ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE id = sender_id
    )
  );

CREATE POLICY "Users can view their own messages"
  ON messages
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE id IN (sender_id, receiver_id)
    )
  );

CREATE POLICY "Users can update message read status"
  ON messages
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE id = receiver_id
    )
  );

-- Reviews policies
CREATE POLICY "Users can create reviews for completed opportunities"
  ON reviews
  FOR INSERT
  WITH CHECK (
    -- The user must be associated with the opportunity
    (
      -- As an NGO
      EXISTS (
        SELECT 1 FROM opportunities o
        JOIN ngo_profiles n ON o.ngo_id = n.id
        JOIN profiles p ON n.profile_id = p.id
        WHERE o.id = reviews.opportunity_id
        AND p.user_id = auth.uid()
        AND p.id = reviews.reviewer_id
      )
      OR
      -- As an Expert
      EXISTS (
        SELECT 1 FROM applications a
        JOIN expert_profiles e ON a.expert_id = e.id
        JOIN profiles p ON e.profile_id = p.id
        WHERE a.opportunity_id = reviews.opportunity_id
        AND p.user_id = auth.uid()
        AND p.id = reviews.reviewer_id
        AND a.status = 'accepted'
      )
    )
    AND
    -- The opportunity must be completed
    EXISTS (
      SELECT 1 FROM opportunities o
      WHERE o.id = reviews.opportunity_id
      AND o.status = 'closed'
    )
  );

CREATE POLICY "Anyone can view reviews"
  ON reviews
  FOR SELECT
  USING (true);

-- Saved opportunities policies
CREATE POLICY "Experts can save opportunities"
  ON saved_opportunities
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM expert_profiles
    JOIN profiles ON expert_profiles.profile_id = profiles.id
    WHERE expert_profiles.id = saved_opportunities.expert_id
    AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Experts can delete saved opportunities"
  ON saved_opportunities
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM expert_profiles
    JOIN profiles ON expert_profiles.profile_id = profiles.id
    WHERE expert_profiles.id = saved_opportunities.expert_id
    AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Experts can view their saved opportunities"
  ON saved_opportunities
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM expert_profiles
    JOIN profiles ON expert_profiles.profile_id = profiles.id
    WHERE expert_profiles.id = saved_opportunities.expert_id
    AND profiles.user_id = auth.uid()
  ));

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_ngo_profiles_modtime
BEFORE UPDATE ON ngo_profiles
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_expert_profiles_modtime
BEFORE UPDATE ON expert_profiles
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_opportunities_modtime
BEFORE UPDATE ON opportunities
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_applications_modtime
BEFORE UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION update_modified_column();