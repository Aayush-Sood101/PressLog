-- MIGRATION V2: Redesign newspaper schema to support named newspapers
-- This script drops the old schema and creates the new one
-- WARNING: This will delete all existing newspaper and entry data!

-- Step 1: Drop old tables (in reverse dependency order)
DROP TABLE IF EXISTS newspaper_entries CASCADE;
DROP TABLE IF EXISTS newspapers CASCADE;

-- Step 2: Create new newspapers table (stores newspaper names)
CREATE TABLE newspapers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(university_id, name)
);

-- Step 3: Create newspaper_rates table (day-wise rates per newspaper per month)
CREATE TABLE newspaper_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    newspaper_id UUID NOT NULL REFERENCES newspapers(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    rate DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(newspaper_id, month, day_of_week)
);

-- Step 4: Create newspaper_entries table (daily entries per newspaper)
CREATE TABLE newspaper_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    newspaper_id UUID NOT NULL REFERENCES newspapers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'unmarked' CHECK (status IN ('received', 'not_received', 'unmarked')),
    marked_by_clerk_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(newspaper_id, date)
);

-- Step 5: Create indexes
CREATE INDEX idx_newspapers_university ON newspapers(university_id);
CREATE INDEX idx_newspaper_rates_newspaper_month ON newspaper_rates(newspaper_id, month);  
CREATE INDEX idx_newspaper_entries_newspaper ON newspaper_entries(newspaper_id);
CREATE INDEX idx_newspaper_entries_date ON newspaper_entries(date);

-- Step 6: Enable RLS
ALTER TABLE newspapers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newspaper_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE newspaper_entries ENABLE ROW LEVEL SECURITY;

-- Done! Schema v2 is now active.
