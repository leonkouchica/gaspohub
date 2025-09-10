-- Confirm the user's email
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    updated_at = NOW()
WHERE email = 'gaspotechgraphic@gmail.com';

-- Add admin role to the user
INSERT INTO public.user_roles (user_id, role)
VALUES ('4f295d43-5749-4ece-aa9b-9907815871e9', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;