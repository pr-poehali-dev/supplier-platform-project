-- Add payment fields for SBP (Faster Payment System) integration
ALTER TABLE t_p14287273_supplier_platform_pr.bookings 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_recipient_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_pending_confirmation BOOLEAN DEFAULT false;