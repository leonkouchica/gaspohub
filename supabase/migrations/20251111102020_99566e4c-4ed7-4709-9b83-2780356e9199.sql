-- Create admin audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_user_id UUID,
  target_resource_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
USING (is_admin());

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (is_admin() AND auth.uid() = admin_user_id);

-- Create index for faster queries
CREATE INDEX idx_admin_audit_log_admin_user ON public.admin_audit_log(admin_user_id);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_action_type ON public.admin_audit_log(action_type);