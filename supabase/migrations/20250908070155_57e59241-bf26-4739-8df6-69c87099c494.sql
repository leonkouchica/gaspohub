-- Insert sample profiles for photographers
INSERT INTO public.profiles (id, email, first_name, last_name, bio, avatar_url, location, phone) VALUES
('11111111-1111-1111-1111-111111111111', 'john.doe@email.com', 'John', 'Doe', 'Professional wedding and portrait photographer with 8+ years of experience capturing life''s most precious moments.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face', 'New York, NY', '+1-555-0101'),
('22222222-2222-2222-2222-222222222222', 'sarah.smith@email.com', 'Sarah', 'Smith', 'Creative event photographer specializing in corporate events, concerts, and festivals. Award-winning photojournalism background.', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face', 'Los Angeles, CA', '+1-555-0102'),
('33333333-3333-3333-3333-333333333333', 'mike.johnson@email.com', 'Mike', 'Johnson', 'Nature and landscape photographer with a passion for outdoor adventures. Specializing in engagement and adventure sessions.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face', 'Denver, CO', '+1-555-0103'),
('44444444-4444-4444-4444-444444444444', 'emma.wilson@email.com', 'Emma', 'Wilson', 'Fashion and commercial photographer working with brands and models. Expert in studio lighting and creative direction.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face', 'Miami, FL', '+1-555-0104'),
('55555555-5555-5555-5555-555555555555', 'david.brown@email.com', 'David', 'Brown', 'Documentary and street photographer capturing authentic moments. Available for weddings, family portraits, and lifestyle shoots.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face', 'Chicago, IL', '+1-555-0105');

-- Insert corresponding user roles
INSERT INTO public.user_roles (user_id, role) VALUES
('11111111-1111-1111-1111-111111111111', 'photographer'),
('22222222-2222-2222-2222-222222222222', 'photographer'),
('33333333-3333-3333-3333-333333333333', 'photographer'),
('44444444-4444-4444-4444-444444444444', 'photographer'),
('55555555-5555-5555-5555-555555555555', 'photographer');

-- Insert photographer profiles
INSERT INTO public.photographer_profiles (user_id, specialties, gear, portfolio_images, is_approved, social_links) VALUES
('11111111-1111-1111-1111-111111111111', 
 ARRAY['Wedding', 'Portrait', 'Engagement'], 
 ARRAY['Canon EOS R5', 'Sony A7IV', 'Various Lenses'],
 ARRAY['https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop'],
 true,
 '{"instagram": "@johndoephoto", "website": "johndoephotography.com"}'::jsonb),
 
('22222222-2222-2222-2222-222222222222',
 ARRAY['Event', 'Corporate', 'Concert'],
 ARRAY['Nikon D850', 'Fuji X-T4', 'Professional Lighting'],
 ARRAY['https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop'],
 true,
 '{"instagram": "@sarahsmithphoto", "website": "sarahsmithevents.com"}'::jsonb),

('33333333-3333-3333-3333-333333333333',
 ARRAY['Nature', 'Adventure', 'Engagement'],
 ARRAY['Canon EOS R6', 'DJI Drone', 'Outdoor Equipment'],
 ARRAY['https://images.unsplash.com/photo-1464822759844-d150dd718d05?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop'],
 true,
 '{"instagram": "@mikejohnsonadventure", "website": "adventurephotomike.com"}'::jsonb),

('44444444-4444-4444-4444-444444444444',
 ARRAY['Fashion', 'Commercial', 'Beauty'],
 ARRAY['Hasselblad H6D', 'Profoto Lighting', 'Studio Equipment'],
 ARRAY['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=600&fit=crop'],
 true,
 '{"instagram": "@emmawilsonfashion", "website": "emmawilsonstudio.com"}'::jsonb),

('55555555-5555-5555-5555-555555555555',
 ARRAY['Documentary', 'Street', 'Family'],
 ARRAY['Leica M10', 'Sony A7III', 'Prime Lenses'],
 ARRAY['https://images.unsplash.com/photo-1556103255-4443dbae8e5a?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&h=600&fit=crop'],
 true,
 '{"instagram": "@davidbrownphoto", "website": "davidbrownstories.com"}'::jsonb);

-- Insert services
INSERT INTO public.services (photographer_id, title, description, price, duration_hours, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'Wedding Photography Package', 'Complete wedding day coverage including ceremony, reception, and getting ready shots. Includes 500+ edited photos and online gallery.', 2500.00, 8, true),
('11111111-1111-1111-1111-111111111111', 'Engagement Session', 'Romantic engagement photoshoot at location of your choice. Perfect for save-the-dates and wedding invitations.', 450.00, 2, true),
('22222222-2222-2222-2222-222222222222', 'Corporate Event Coverage', 'Professional documentation of your corporate event, conference, or business gathering. Same-day preview available.', 800.00, 4, true),
('22222222-2222-2222-2222-222222222222', 'Concert Photography', 'High-energy concert and music event photography. Experienced with low-light and fast-paced environments.', 600.00, 3, true),
('33333333-3333-3333-3333-333333333333', 'Adventure Engagement Session', 'Outdoor adventure engagement shoot in stunning natural locations. Perfect for adventurous couples.', 650.00, 4, true),
('33333333-3333-3333-3333-333333333333', 'Landscape Photography Workshop', 'Learn landscape photography techniques in the field with a professional photographer.', 300.00, 6, true),
('44444444-4444-4444-4444-444444444444', 'Fashion Portfolio Shoot', 'Professional fashion photography for models, actors, and influencers. Studio or location options available.', 750.00, 3, true),
('44444444-4444-4444-4444-444444444444', 'Brand Photography Session', 'Commercial photography for businesses, products, and marketing materials. Multiple looks and setups included.', 950.00, 4, true),
('55555555-5555-5555-5555-555555555555', 'Family Portrait Session', 'Natural, candid family photography session. Includes multiple outfit changes and locations.', 400.00, 2, true),
('55555555-5555-5555-5555-555555555555', 'Documentary Style Wedding', 'Photojournalistic approach to wedding photography, capturing authentic moments and emotions throughout your day.', 2200.00, 8, true);

-- Insert products
INSERT INTO public.products (photographer_id, title, description, price, category, images, inventory_count, is_digital, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'Wedding Album - Premium Leather', 'Hand-crafted premium leather wedding album with 50 pages. Professional printing on archival paper.', 450.00, 'Albums', ARRAY['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=400&fit=crop'], 15, false, true),
('11111111-1111-1111-1111-111111111111', 'Digital Wedding Gallery', 'Complete digital collection of your wedding photos in high resolution. Includes printing rights and online gallery.', 350.00, 'Digital', ARRAY['https://images.unsplash.com/photo-1522542550221-31fd19575a2d?w=600&h=400&fit=crop'], 999, true, true),
('22222222-2222-2222-2222-222222222222', 'Event Photography USB Drive', 'Professional USB drive with all event photos in high resolution, beautifully packaged in custom box.', 150.00, 'Digital', ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=400&fit=crop'], 50, false, true),
('33333333-3333-3333-3333-333333333333', 'Nature Print Collection', 'Set of 5 fine art nature prints, 16x20 inches, printed on premium paper and ready for framing.', 275.00, 'Prints', ARRAY['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop'], 25, false, true),
('44444444-4444-4444-4444-444444444444', 'Fashion Portfolio Package', 'Professional fashion photography session plus 20 edited high-resolution images for your portfolio.', 650.00, 'Sessions', ARRAY['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=400&fit=crop'], 10, true, true),
('55555555-5555-5555-5555-555555555555', 'Family Photo Session + Prints', 'Complete family photography session including 2-hour shoot and 5 professional prints of your choice.', 320.00, 'Sessions', ARRAY['https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=400&fit=crop'], 20, false, true);

-- Insert some sample reviews
INSERT INTO public.reviews (reviewer_id, photographer_id, rating, comment, is_public) VALUES
('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 5, 'John captured our wedding day perfectly! Every moment was beautifully documented and the photos exceeded our expectations.', true),
('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 5, 'Sarah did an amazing job at our corporate event. Professional, unobtrusive, and delivered stunning photos quickly.', true),
('88888888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333', 5, 'Mike made our engagement session an adventure! The mountain backdrop photos are absolutely breathtaking.', true),
('99999999-9999-9999-9999-999999999999', '44444444-4444-4444-4444-444444444444', 4, 'Emma has a great eye for fashion photography. The studio session was professional and the results were fantastic.', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 5, 'David captured our family dynamics perfectly. The photos feel natural and genuine, exactly what we wanted.', true);