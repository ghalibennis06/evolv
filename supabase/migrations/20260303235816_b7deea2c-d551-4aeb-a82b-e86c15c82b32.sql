
ALTER TABLE admin_drinks 
  ADD COLUMN IF NOT EXISTS customizable boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS customization_options text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_seasonal boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_new boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_bestseller boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS special_label text,
  ADD COLUMN IF NOT EXISTS available_until date;

-- Add unique constraint on site_content.section for upsert
ALTER TABLE site_content ADD CONSTRAINT site_content_section_unique UNIQUE (section);
