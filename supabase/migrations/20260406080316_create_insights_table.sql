/*
  # Create Insights Table

  1. New Tables
    - `insights`
      - `id` (uuid, primary key)
      - `applicant_id` (uuid, references profiles)
      - `insight_text` (text) - AI-generated insight
      - `generated_at` (timestamptz)
      - `can_regenerate_at` (timestamptz) - 24 hours after generation

  2. Security
    - Enable RLS
    - Applicants can only read their own insights
*/

CREATE TABLE IF NOT EXISTS insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insight_text text NOT NULL,
  generated_at timestamptz DEFAULT now(),
  can_regenerate_at timestamptz DEFAULT (now() + interval '24 hours'),
  UNIQUE(applicant_id)
);

ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants can read own insights"
  ON insights FOR SELECT
  TO authenticated
  USING (applicant_id = auth.uid());

CREATE POLICY "Applicants can insert own insights"
  ON insights FOR INSERT
  TO authenticated
  WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Applicants can update own insights"
  ON insights FOR UPDATE
  TO authenticated
  USING (applicant_id = auth.uid())
  WITH CHECK (applicant_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_insights_applicant ON insights(applicant_id);
