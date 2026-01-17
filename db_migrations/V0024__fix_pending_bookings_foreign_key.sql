-- Исправление foreign key в pending_bookings: должен ссылаться на units, а не на booking_units
ALTER TABLE t_p14287273_supplier_platform_pr.pending_bookings 
DROP CONSTRAINT IF EXISTS pending_bookings_unit_id_fkey;

ALTER TABLE t_p14287273_supplier_platform_pr.pending_bookings
ADD CONSTRAINT pending_bookings_unit_id_fkey 
FOREIGN KEY (unit_id) REFERENCES t_p14287273_supplier_platform_pr.units(id);