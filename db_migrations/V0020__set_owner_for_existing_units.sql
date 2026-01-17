-- Установить owner_id для существующих объектов
UPDATE t_p14287273_supplier_platform_pr.units 
SET owner_id = 1 
WHERE id IN (1, 3) AND owner_id IS NULL;