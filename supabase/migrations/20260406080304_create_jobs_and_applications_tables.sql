/*
  # Create Jobs and Applications Schema

  1. New Tables
    - `jobs`
      - `id` (uuid, primary key)
      - `recruiter_id` (uuid, references profiles)
      - `title` (text)
      - `experience_needed` (text)
      - `salary_min` (integer)
      - `salary_max` (integer)
      - `country` (text)
      - `state` (text)
      - `city` (text)
      - `bachelor_required` (boolean)
      - `master_required` (boolean)
      - `phd_required` (boolean)
      - `requirements` (text)
      - `description` (text)
      - `is_active` (boolean, default true)
      - `expires_at` (timestamptz) - auto-expire after 60 days
      - `created_at` (timestamptz)

    - `applications`
      - `id` (uuid, primary key)
      - `job_id` (uuid, references jobs)
      - `applicant_id` (uuid, references profiles)
      - `status` (text) - 'pending', 'shortlisted', 'rejected'
      - `match_score` (integer) - BGE-3 match percentage
      - `created_at` (timestamptz)

    - `rejected_jobs`
      - `id` (uuid, primary key)
      - `job_id` (uuid, references jobs)
      - `applicant_id` (uuid, references profiles)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Recruiters can manage their own jobs
    - Applicants can apply and view their applications
    - Public can read active jobs
*/

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  experience_needed text,
  salary_min integer NOT NULL,
  salary_max integer NOT NULL,
  country text NOT NULL,
  state text NOT NULL,
  city text NOT NULL,
  bachelor_required boolean DEFAULT false,
  master_required boolean DEFAULT false,
  phd_required boolean DEFAULT false,
  requirements text,
  description text,
  is_active boolean DEFAULT true,
  expires_at timestamptz DEFAULT (now() + interval '60 days'),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (is_active = true AND expires_at > now());

CREATE POLICY "Recruiters can insert their jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can update their jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can view all their jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (recruiter_id = auth.uid());

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'shortlisted', 'rejected')),
  match_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants can view own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (applicant_id = auth.uid());

CREATE POLICY "Applicants can create applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Recruiters can view job applications"
  ON applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can update job applications"
  ON applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.recruiter_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.recruiter_id = auth.uid()
    )
  );

-- Create rejected jobs table
CREATE TABLE IF NOT EXISTS rejected_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

ALTER TABLE rejected_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants can manage rejected jobs"
  ON rejected_jobs FOR ALL
  TO authenticated
  USING (applicant_id = auth.uid())
  WITH CHECK (applicant_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs(city);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_rejected_jobs_applicant ON rejected_jobs(applicant_id);
