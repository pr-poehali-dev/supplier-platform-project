-- Update owner_id for bookings that have NULL owner_id
-- Get owner_id from units table
UPDATE t_p14287273_supplier_platform_pr.bookings b
SET owner_id = u.owner_id
FROM t_p14287273_supplier_platform_pr.units u
WHERE b.unit_id = u.id 
AND b.owner_id IS NULL;
