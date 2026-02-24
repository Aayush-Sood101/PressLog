-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Universities Table
CREATE TABLE universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    admin_clerk_id VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Join Requests Table
CREATE TABLE join_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_clerk_id VARCHAR(255) NOT NULL,
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_clerk_id, university_id)
);

-- Newspapers Table
CREATE TABLE newspapers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    rate DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(university_id, month, day_of_week)
);

-- Newspaper Entries Table
CREATE TABLE newspaper_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    newspaper_id UUID REFERENCES newspapers(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'unmarked' CHECK (status IN ('received', 'not_received', 'unmarked')),
    marked_by_clerk_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(university_id, date)
);

-- Indexes for better query performance
CREATE INDEX idx_join_requests_university ON join_requests(university_id);
CREATE INDEX idx_join_requests_status ON join_requests(status);
CREATE INDEX idx_newspapers_university_month ON newspapers(university_id, month);
CREATE INDEX idx_newspaper_entries_university_date ON newspaper_entries(university_id, date);
CREATE INDEX idx_newspaper_entries_date ON newspaper_entries(date);

-- Enable Row Level Security
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE newspapers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newspaper_entries ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be managed through backend JWT verification
-- For now, we'll use the service_role key which bypasses RLS
