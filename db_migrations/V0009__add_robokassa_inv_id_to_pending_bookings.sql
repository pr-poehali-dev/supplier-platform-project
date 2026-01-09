-- Add robokassa_inv_id column to pending_bookings table
ALTER TABLE t_p14287273_supplier_platform_pr.pending_bookings
ADD COLUMN IF NOT EXISTS robokassa_inv_id INTEGER UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_bookings_robokassa_inv_id 
ON t_p14287273_supplier_platform_pr.pending_bookings(robokassa_inv_id);