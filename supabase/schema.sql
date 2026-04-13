-- VORA Database Schema Phase 6

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: public.profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    current_level TEXT DEFAULT 'Intermediate',
    interests TEXT[] DEFAULT '{}',
    xp INTEGER DEFAULT 0,
    streak_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: public.progress
CREATE TABLE IF NOT EXISTS public.progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    word_id TEXT NOT NULL,
    success_rate INTEGER DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,
    last_practiced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, word_id)
);

-- Setup Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile."
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile."
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Progress Policies
CREATE POLICY "Users can view their own progress."
    ON public.progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress."
    ON public.progress FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress."
    ON public.progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Optional: Function to automatically create profile on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, current_level, interests)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'Intermediate', '{}');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
