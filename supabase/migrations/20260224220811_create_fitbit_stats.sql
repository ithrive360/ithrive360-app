-- Create the fitbit_stats table for background syncing
CREATE TABLE public.fitbit_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    steps INTEGER DEFAULT 0,
    distance_km NUMERIC DEFAULT 0,
    calories_out INTEGER DEFAULT 0,
    active_zone_minutes INTEGER DEFAULT 0,
    resting_heart_rate INTEGER,
    hrv NUMERIC,
    sleep_minutes_asleep INTEGER,
    sleep_time_in_bed INTEGER,
    weight_kg NUMERIC,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure only one record per user per day
    UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.fitbit_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies to ensure users can only access their own data
CREATE POLICY "Users can view their own fitbit stats"
    ON public.fitbit_stats
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fitbit stats"
    ON public.fitbit_stats
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fitbit stats"
    ON public.fitbit_stats
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fitbit stats"
    ON public.fitbit_stats
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create a function to automatically delete records older than 1 year (365 days)
CREATE OR REPLACE FUNCTION delete_old_fitbit_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete records older than exactly 365 days ago from the current date
    DELETE FROM public.fitbit_stats WHERE date < (CURRENT_DATE - INTERVAL '365 days');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that fires AFTER INSERT to clean up old records
CREATE TRIGGER trigger_delete_old_fitbit_stats
    AFTER INSERT ON public.fitbit_stats
    FOR EACH STATEMENT
    EXECUTE FUNCTION delete_old_fitbit_stats();
