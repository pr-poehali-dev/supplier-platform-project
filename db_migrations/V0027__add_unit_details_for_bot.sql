-- Добавляем поля для описания объекта, фото и ссылки на карты
ALTER TABLE units 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS map_link TEXT;

COMMENT ON COLUMN units.description IS 'Описание объекта размещения для показа клиентам';
COMMENT ON COLUMN units.photo_urls IS 'Массив URL фотографий объекта (максимум 3)';
COMMENT ON COLUMN units.map_link IS 'Ссылка на карты (Яндекс/Google/2GIS) для навигации';