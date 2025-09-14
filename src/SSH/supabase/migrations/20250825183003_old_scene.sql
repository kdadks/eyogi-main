/*
  # Seed Initial Data for eYogi Gurukul

  1. Insert default Gurukuls
  2. Insert sample certificate templates
  3. Insert sample courses
*/

-- Insert default Gurukuls
INSERT INTO gurukuls (name, slug, description, image_url) VALUES
('Hinduism Gurukul', 'hinduism', 'Explore the rich traditions, philosophy, and practices of Hinduism through comprehensive courses designed for all age groups.', 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800'),
('Mantra Gurukul', 'mantra', 'Learn the sacred science of mantras, their pronunciation, meanings, and transformative power in spiritual practice.', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'),
('Philosophy Gurukul', 'philosophy', 'Dive deep into ancient philosophical traditions and their relevance to modern life and spiritual growth.', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800'),
('Sanskrit Gurukul', 'sanskrit', 'Master the sacred language of Sanskrit through structured learning programs for beginners to advanced students.', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800'),
('Yoga & Wellness Gurukul', 'yoga-wellness', 'Integrate physical, mental, and spiritual wellness through traditional yoga practices and holistic health approaches.', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800');

-- Insert default certificate templates
INSERT INTO certificate_templates (name, type, template_data) VALUES
('Student Course Completion - Traditional', 'student', '{
  "layout": "traditional",
  "colors": {
    "primary": "#FF6B35",
    "secondary": "#004E89",
    "accent": "#FFD23F"
  },
  "fonts": {
    "title": "serif",
    "body": "sans-serif"
  },
  "elements": {
    "logo": true,
    "border": "ornate",
    "signature_lines": 2
  }
}'),
('Student Course Completion - Modern', 'student', '{
  "layout": "modern",
  "colors": {
    "primary": "#2E86AB",
    "secondary": "#A23B72",
    "accent": "#F18F01"
  },
  "fonts": {
    "title": "sans-serif",
    "body": "sans-serif"
  },
  "elements": {
    "logo": true,
    "border": "minimal",
    "signature_lines": 1
  }
}'),
('Teacher Qualification Certificate', 'teacher', '{
  "layout": "professional",
  "colors": {
    "primary": "#1B4332",
    "secondary": "#40916C",
    "accent": "#95D5B2"
  },
  "fonts": {
    "title": "serif",
    "body": "serif"
  },
  "elements": {
    "logo": true,
    "border": "professional",
    "signature_lines": 3
  }
}');

-- Get Gurukul IDs for course insertion
DO $$
DECLARE
  hinduism_id uuid;
  mantra_id uuid;
  philosophy_id uuid;
  sanskrit_id uuid;
  yoga_id uuid;
BEGIN
  SELECT id INTO hinduism_id FROM gurukuls WHERE slug = 'hinduism';
  SELECT id INTO mantra_id FROM gurukuls WHERE slug = 'mantra';
  SELECT id INTO philosophy_id FROM gurukuls WHERE slug = 'philosophy';
  SELECT id INTO sanskrit_id FROM gurukuls WHERE slug = 'sanskrit';
  SELECT id INTO yoga_id FROM gurukuls WHERE slug = 'yoga-wellness';

  -- Insert sample courses for Hinduism Gurukul
  INSERT INTO courses (gurukul_id, course_number, title, description, level, age_group_min, age_group_max, duration_weeks, fee, learning_outcomes, syllabus) VALUES
  (hinduism_id, 'C1001', 'Hinduism Basics for Young Minds', 'An introduction to Hindu traditions, festivals, and basic concepts designed for children aged 8-11 years.', 'basic', 8, 11, 6, 50.00, 
   ARRAY['Understand basic Hindu concepts', 'Learn about major festivals', 'Develop cultural awareness', 'Practice simple mantras'],
   '{
     "classes": [
       {
         "number": 1,
         "title": "What is Hinduism?",
         "topics": ["Introduction to Hinduism", "Basic concepts", "Diversity in practice"],
         "duration": "1 hour"
       },
       {
         "number": 2,
         "title": "Hindu Festivals",
         "topics": ["Diwali", "Holi", "Navratri", "Significance and celebrations"],
         "duration": "1 hour"
       },
       {
         "number": 3,
         "title": "Sacred Symbols",
         "topics": ["Om symbol", "Swastika", "Lotus", "Their meanings"],
         "duration": "1 hour"
       },
       {
         "number": 4,
         "title": "Simple Prayers",
         "topics": ["Basic mantras", "Prayer postures", "Daily practices"],
         "duration": "1 hour"
       },
       {
         "number": 5,
         "title": "Stories and Values",
         "topics": ["Moral stories", "Life lessons", "Character building"],
         "duration": "1 hour"
       },
       {
         "number": 6,
         "title": "Celebration and Reflection",
         "topics": ["Course review", "Certificate ceremony", "Future learning"],
         "duration": "1 hour"
       }
     ]
   }'),
  
  (hinduism_id, 'C2001', 'Hindu Philosophy for Teens', 'Explore deeper philosophical concepts of Hinduism suitable for teenagers aged 12-15 years.', 'intermediate', 12, 15, 8, 75.00,
   ARRAY['Understand key philosophical concepts', 'Explore different schools of thought', 'Develop critical thinking', 'Apply teachings to modern life'],
   '{
     "classes": [
       {
         "number": 1,
         "title": "Introduction to Hindu Philosophy",
         "topics": ["What is philosophy?", "Hindu philosophical traditions", "Key questions"],
         "duration": "1.5 hours"
       },
       {
         "number": 2,
         "title": "Dharma and Ethics",
         "topics": ["Concept of dharma", "Ethical living", "Modern applications"],
         "duration": "1.5 hours"
       },
       {
         "number": 3,
         "title": "Karma and Reincarnation",
         "topics": ["Law of karma", "Cycle of rebirth", "Personal responsibility"],
         "duration": "1.5 hours"
       },
       {
         "number": 4,
         "title": "The Four Goals of Life",
         "topics": ["Dharma, Artha, Kama, Moksha", "Balanced living", "Life priorities"],
         "duration": "1.5 hours"
       },
       {
         "number": 5,
         "title": "Yoga Philosophy",
         "topics": ["Eight limbs of yoga", "Mind-body connection", "Spiritual growth"],
         "duration": "1.5 hours"
       },
       {
         "number": 6,
         "title": "Vedanta Basics",
         "topics": ["Self-realization", "Unity consciousness", "Practical wisdom"],
         "duration": "1.5 hours"
       },
       {
         "number": 7,
         "title": "Modern Applications",
         "topics": ["Philosophy in daily life", "Stress management", "Decision making"],
         "duration": "1.5 hours"
       },
       {
         "number": 8,
         "title": "Integration and Practice",
         "topics": ["Personal philosophy", "Continued learning", "Certificate ceremony"],
         "duration": "1.5 hours"
       }
     ]
   }');

  -- Insert sample courses for other Gurukuls
  INSERT INTO courses (gurukul_id, course_number, title, description, level, age_group_min, age_group_max, duration_weeks, fee, learning_outcomes, syllabus) VALUES
  (mantra_id, 'M1001', 'Introduction to Sacred Mantras', 'Learn basic mantras and their proper pronunciation for beginners.', 'basic', 10, 14, 4, 40.00,
   ARRAY['Learn proper pronunciation', 'Understand mantra meanings', 'Develop concentration', 'Practice meditation'],
   '{"classes": [{"number": 1, "title": "What are Mantras?", "topics": ["Definition and purpose", "Types of mantras", "Benefits"], "duration": "1 hour"}]}'),
  
  (sanskrit_id, 'S1001', 'Sanskrit Alphabet and Basics', 'Master the Sanskrit alphabet and basic grammar for young learners.', 'basic', 8, 12, 6, 60.00,
   ARRAY['Learn Sanskrit alphabet', 'Understand basic grammar', 'Read simple words', 'Write in Devanagari'],
   '{"classes": [{"number": 1, "title": "Sanskrit Alphabet", "topics": ["Vowels and consonants", "Pronunciation", "Writing practice"], "duration": "1 hour"}]}'),
  
  (yoga_id, 'Y1001', 'Kids Yoga and Mindfulness', 'Fun and engaging yoga practices designed specifically for children.', 'elementary', 6, 10, 4, 35.00,
   ARRAY['Learn basic yoga poses', 'Develop flexibility', 'Practice mindfulness', 'Improve concentration'],
   '{"classes": [{"number": 1, "title": "Introduction to Yoga", "topics": ["What is yoga?", "Basic poses", "Breathing exercises"], "duration": "45 minutes"}]}');

END $$;