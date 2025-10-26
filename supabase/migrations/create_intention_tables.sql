-- Create intentions table for storing user's phone opening intentions
CREATE TABLE IF NOT EXISTS public.intentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'done', 'snoozed')),
  snooze_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT intentions_user_id_status_unique UNIQUE(user_id, status) WHERE status = 'active'
);

-- Create reminder_settings table for user notification preferences
CREATE TABLE IF NOT EXISTS public.reminder_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nudges_enabled boolean NOT NULL DEFAULT true,
  nudge_after_seconds integer NOT NULL DEFAULT 300,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create breath_sessions table for tracking unwind sessions
CREATE TABLE IF NOT EXISTS public.breath_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_seconds integer NOT NULL,
  completed_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create notifications table for push notification logging
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intention_id uuid REFERENCES public.intentions(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  clicked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.intentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breath_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for intentions table
CREATE POLICY "Users can view their own intentions"
  ON public.intentions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own intentions"
  ON public.intentions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own intentions"
  ON public.intentions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own intentions"
  ON public.intentions
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for reminder_settings table
CREATE POLICY "Users can view their own reminder settings"
  ON public.reminder_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminder settings"
  ON public.reminder_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminder settings"
  ON public.reminder_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for breath_sessions table
CREATE POLICY "Users can view their own breath sessions"
  ON public.breath_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own breath sessions"
  ON public.breath_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for notifications table
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_intentions_user_id_status ON public.intentions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_intentions_created_at ON public.intentions(created_at);
CREATE INDEX IF NOT EXISTS idx_breath_sessions_user_id ON public.breath_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON public.notifications(sent_at);
