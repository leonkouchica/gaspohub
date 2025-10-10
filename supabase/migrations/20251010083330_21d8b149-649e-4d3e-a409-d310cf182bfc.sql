-- Add admin role to gaspotechgraphic@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('4f295d43-5749-4ece-aa9b-9907815871e9', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;