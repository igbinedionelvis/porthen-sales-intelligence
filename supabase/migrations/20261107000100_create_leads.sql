-- Baseline migration for the existing Porthen leads table.
-- This migration documents the schema already present in production.

CREATE TABLE public.leads (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    industry TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'New',
    score INTEGER NOT NULL DEFAULT 0,
    source TEXT NOT NULL,
    date_added DATE NOT NULL DEFAULT CURRENT_DATE,
    contact_name TEXT NOT NULL,
    contact_role TEXT NOT NULL,
    website TEXT NOT NULL,
    employee_range TEXT NOT NULL,
    outreach_status TEXT NOT NULL DEFAULT 'Not Started',
    tags TEXT[] NOT NULL DEFAULT '{}',
    notes TEXT NOT NULL DEFAULT '',
    timeline JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security.
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Preserve the existing production policies.
CREATE POLICY "Allow public read leads"
ON public.leads
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow public insert leads"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (true);