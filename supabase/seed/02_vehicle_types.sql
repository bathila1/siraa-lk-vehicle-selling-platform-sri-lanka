-- =============================================================================
-- 02_vehicle_types.sql
-- The 10 vehicle types confirmed for launch.
-- Icons reference lucide-react icon names.
-- =============================================================================

insert into vehicle_types (name_en, name_si, slug, icon, sort_order, active) values
  ('Car',              'කාර්',              'car',              'car',         1, true),
  ('SUV / Jeep',       'SUV / ජීප්',         'suv-jeep',         'car-front',   2, true),
  ('Van',              'වෑන්',              'van',              'truck',       3, true),
  ('Motorcycle',       'යතුරුපැදි',         'motorcycle',       'bike',        4, true),
  ('Three-wheeler',    'ත්‍රී වීලර්',         'three-wheeler',    'rotate-3d',   5, true),
  ('Lorry / Truck',    'ලොරි / ට්‍රක්',      'lorry-truck',      'truck',       6, true),
  ('Bus',              'බස්',                'bus',              'bus',         7, true),
  ('Tractor',          'ට්‍රැක්ටර්',          'tractor',          'tractor',     8, true),
  ('Heavy Machinery',  'බර වාහන',           'heavy-machinery',  'construction', 9, true),
  ('Bicycle / E-bike', 'බයිසිකලය',          'bicycle-ebike',    'bike',        10, true)
on conflict (slug) do nothing;
