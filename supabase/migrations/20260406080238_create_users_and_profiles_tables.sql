/*
  # Create Users and Profiles Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `role` (text) - 'applicant' or 'recruiter'
      - `name` (text)
      - `email` (text)
      - `whatsapp` (text, nullable)
      - `github` (text, nullable)
      - `experience` (text, nullable)
      - `skills` (text, nullable)
      - `projects` (text, nullable)
      - `country` (text, nullable)
      - `state` (text, nullable)
      - `city` (text, nullable)
      - `show_only_city_jobs` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `education_entries`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, references profiles)
      - `degree_type` (text) - 'bachelors', 'masters', 'certification', 'phd'
      - `degree_name` (text)
      - `certificate_url` (text, nullable) - storage URL for JPEG
      - `created_at` (timestamptz)

    - `previous_companies`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, references profiles)
      - `company_name` (text)
      - `role` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only read/update their own profile
    - Education and company entries follow same pattern
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('applicant', 'recruiter')),
  name text NOT NULL,
  email text NOT NULL,
  whatsapp text,
  github text,
  experience text,
  skills text,
  projects text,
  country text,
  state text,
  city text,
  show_only_city_jobs boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create education entries table
CREATE TABLE IF NOT EXISTS education_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  degree_type text NOT NULL CHECK (degree_type IN ('bachelors', 'masters', 'certification', 'phd')),
  degree_name text NOT NULL,
  certificate_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE education_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own education"
  ON education_entries FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own education"
  ON education_entries FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own education"
  ON education_entries FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete own education"
  ON education_entries FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- Create previous companies table
CREATE TABLE IF NOT EXISTS previous_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  role text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE previous_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own companies"
  ON previous_companies FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own companies"
  ON previous_companies FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own companies"
  ON previous_companies FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete own companies"
  ON previous_companies FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_education_profile ON education_entries(profile_id);
CREATE INDEX IF NOT EXISTS idx_companies_profile ON previous_companies(profile_id);
