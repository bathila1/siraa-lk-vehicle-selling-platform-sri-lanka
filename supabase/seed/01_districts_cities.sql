-- =============================================================================
-- 01_districts_cities.sql
-- All 25 Sri Lankan districts and their major cities.
-- Names from user's provided list. Slugs auto-derived.
-- =============================================================================

-- ---------- Districts ----------
insert into districts (name_en, name_si, slug, sort_order) values
  ('Colombo',       'කොළඹ',           'colombo',       1),
  ('Gampaha',       'ගම්පහ',           'gampaha',       2),
  ('Kalutara',      'කළුතර',          'kalutara',      3),
  ('Kandy',         'මහනුවර',         'kandy',         4),
  ('Matale',        'මාතලේ',          'matale',        5),
  ('Nuwara Eliya',  'නුවරඑළිය',       'nuwara-eliya',  6),
  ('Galle',         'ගාල්ල',           'galle',         7),
  ('Matara',        'මාතර',           'matara',        8),
  ('Hambantota',    'හම්බන්තොට',      'hambantota',    9),
  ('Jaffna',        'යාපනය',          'jaffna',        10),
  ('Kilinochchi',   'කිලිනොච්චිය',     'kilinochchi',   11),
  ('Mannar',        'මන්නාරම',         'mannar',        12),
  ('Vavuniya',      'වවුනියාව',        'vavuniya',      13),
  ('Mullaitivu',    'මුලතිව්',         'mullaitivu',    14),
  ('Batticaloa',    'මඩකලපුව',        'batticaloa',    15),
  ('Ampara',        'අම්පාර',         'ampara',        16),
  ('Trincomalee',   'ත්‍රිකුණාමලය',   'trincomalee',   17),
  ('Kurunegala',    'කුරුණෑගල',       'kurunegala',    18),
  ('Puttalam',      'පුත්තලම',         'puttalam',      19),
  ('Anuradhapura',  'අනුරාධපුර',      'anuradhapura',  20),
  ('Polonnaruwa',   'පොලොන්නරුව',     'polonnaruwa',   21),
  ('Badulla',       'බදුල්ල',          'badulla',       22),
  ('Moneragala',    'මොණරාගල',        'moneragala',    23),
  ('Ratnapura',     'රත්නපුර',         'ratnapura',     24),
  ('Kegalle',       'කෑගල්ල',          'kegalle',       25)
on conflict (slug) do nothing;

-- ---------- Cities ----------
-- Helper: insert a city under a district by slug
do $$
declare
  d_id smallint;
begin
  -- Colombo
  select id into d_id from districts where slug = 'colombo';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Colombo', 'colombo', 1),
    (d_id, 'Dehiwala-Mount Lavinia', 'dehiwala-mount-lavinia', 2),
    (d_id, 'Moratuwa', 'moratuwa', 3),
    (d_id, 'Kotte', 'kotte', 4),
    (d_id, 'Battaramulla', 'battaramulla', 5),
    (d_id, 'Maharagama', 'maharagama', 6),
    (d_id, 'Kotikawatta', 'kotikawatta', 7),
    (d_id, 'Kolonnawa', 'kolonnawa', 8),
    (d_id, 'Keselwatta', 'keselwatta', 9),
    (d_id, 'Homagama', 'homagama', 10),
    (d_id, 'Mulleriyawa', 'mulleriyawa', 11),
    (d_id, 'Kesbewa', 'kesbewa', 12),
    (d_id, 'Avissawella', 'avissawella', 13),
    (d_id, 'Kaduwela', 'kaduwela', 14),
    (d_id, 'Boralesgamuwa', 'boralesgamuwa', 15),
    (d_id, 'Piliyandala', 'piliyandala', 16),
    (d_id, 'Nugegoda', 'nugegoda', 17),
    (d_id, 'Nawala', 'nawala', 18),
    (d_id, 'Padukka', 'padukka', 19),
    (d_id, 'Kottawa', 'kottawa', 20),
    (d_id, 'Pannipitiya', 'pannipitiya', 21),
    (d_id, 'Malabe', 'malabe', 22),
    (d_id, 'Hanwella', 'hanwella', 23),
    (d_id, 'Rajagiriya', 'rajagiriya', 24)
  on conflict do nothing;

  -- Gampaha
  select id into d_id from districts where slug = 'gampaha';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Gampaha', 'gampaha', 1),
    (d_id, 'Negombo', 'negombo', 2),
    (d_id, 'Katunayake', 'katunayake', 3),
    (d_id, 'Hendala', 'hendala', 4),
    (d_id, 'Welisara', 'welisara', 5),
    (d_id, 'Ragama', 'ragama', 6),
    (d_id, 'Kandana', 'kandana', 7),
    (d_id, 'Ja-Ela', 'ja-ela', 8),
    (d_id, 'Wattala', 'wattala', 9),
    (d_id, 'Kelaniya', 'kelaniya', 10),
    (d_id, 'Peliyagoda', 'peliyagoda', 11),
    (d_id, 'Minuwangoda', 'minuwangoda', 12),
    (d_id, 'Kadawatha', 'kadawatha', 13),
    (d_id, 'Dompe', 'dompe', 14),
    (d_id, 'Divulapitiya', 'divulapitiya', 15),
    (d_id, 'Nittambuwa', 'nittambuwa', 16),
    (d_id, 'Mirigama', 'mirigama', 17),
    (d_id, 'Kiribathgoda', 'kiribathgoda', 18),
    (d_id, 'Veyangoda', 'veyangoda', 19),
    (d_id, 'Ganemulla', 'ganemulla', 20)
  on conflict do nothing;

  -- Kandy
  select id into d_id from districts where slug = 'kandy';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Kandy', 'kandy', 1),
    (d_id, 'Gampola', 'gampola', 2),
    (d_id, 'Nawalapitiya', 'nawalapitiya', 3),
    (d_id, 'Wattegama', 'wattegama', 4),
    (d_id, 'Harispattuwa', 'harispattuwa', 5),
    (d_id, 'Kadugannawa', 'kadugannawa', 6)
  on conflict do nothing;

  -- Kurunegala
  select id into d_id from districts where slug = 'kurunegala';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Kurunegala', 'kurunegala', 1),
    (d_id, 'Kuliyapitiya', 'kuliyapitiya', 2),
    (d_id, 'Polgahawela', 'polgahawela', 3),
    (d_id, 'Pannala', 'pannala', 4)
  on conflict do nothing;

  -- Ratnapura
  select id into d_id from districts where slug = 'ratnapura';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Ratnapura', 'ratnapura', 1),
    (d_id, 'Balangoda', 'balangoda', 2),
    (d_id, 'Eheliyagoda', 'eheliyagoda', 3),
    (d_id, 'Kalawana', 'kalawana', 4),
    (d_id, 'Embilipitiya', 'embilipitiya', 5)
  on conflict do nothing;

  -- Kalutara
  select id into d_id from districts where slug = 'kalutara';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Kalutara', 'kalutara', 1),
    (d_id, 'Beruwala', 'beruwala', 2),
    (d_id, 'Panadura', 'panadura', 3),
    (d_id, 'Horana', 'horana', 4),
    (d_id, 'Matugama', 'matugama', 5),
    (d_id, 'Bandaragama', 'bandaragama', 6)
  on conflict do nothing;

  -- Puttalam
  select id into d_id from districts where slug = 'puttalam';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Puttalam', 'puttalam', 1),
    (d_id, 'Chilaw', 'chilaw', 2),
    (d_id, 'Nattandiya', 'nattandiya', 3),
    (d_id, 'Wennappuwa', 'wennappuwa', 4),
    (d_id, 'Marawila', 'marawila', 5),
    (d_id, 'Dankotuwa', 'dankotuwa', 6)
  on conflict do nothing;

  -- Kegalle
  select id into d_id from districts where slug = 'kegalle';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Kegalle', 'kegalle', 1),
    (d_id, 'Mawanella', 'mawanella', 2),
    (d_id, 'Warakapola', 'warakapola', 3)
  on conflict do nothing;

  -- Matale
  select id into d_id from districts where slug = 'matale';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Matale', 'matale', 1),
    (d_id, 'Dambulla', 'dambulla', 2),
    (d_id, 'Sigiriya', 'sigiriya', 3)
  on conflict do nothing;

  -- Badulla
  select id into d_id from districts where slug = 'badulla';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Badulla', 'badulla', 1),
    (d_id, 'Bandarawela', 'bandarawela', 2),
    (d_id, 'Haputale', 'haputale', 3),
    (d_id, 'Welimada', 'welimada', 4),
    (d_id, 'Mahiyanganaya', 'mahiyanganaya', 5)
  on conflict do nothing;

  -- Nuwara Eliya
  select id into d_id from districts where slug = 'nuwara-eliya';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Nuwara Eliya', 'nuwara-eliya', 1),
    (d_id, 'Hatton', 'hatton', 2),
    (d_id, 'Talawakele', 'talawakele', 3)
  on conflict do nothing;

  -- Galle
  select id into d_id from districts where slug = 'galle';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Galle', 'galle', 1),
    (d_id, 'Ambalangoda', 'ambalangoda', 2),
    (d_id, 'Bentota', 'bentota', 3),
    (d_id, 'Hikkaduwa', 'hikkaduwa', 4),
    (d_id, 'Elpitiya', 'elpitiya', 5),
    (d_id, 'Koggala', 'koggala', 6)
  on conflict do nothing;

  -- Matara
  select id into d_id from districts where slug = 'matara';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Matara', 'matara', 1),
    (d_id, 'Weligama', 'weligama', 2)
  on conflict do nothing;

  -- Hambantota
  select id into d_id from districts where slug = 'hambantota';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Hambantota', 'hambantota', 1),
    (d_id, 'Tangalle', 'tangalle', 2),
    (d_id, 'Middeniya', 'middeniya', 3)
  on conflict do nothing;

  -- Batticaloa
  select id into d_id from districts where slug = 'batticaloa';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Batticaloa', 'batticaloa', 1),
    (d_id, 'Kattankudy', 'kattankudy', 2),
    (d_id, 'Eravur', 'eravur', 3)
  on conflict do nothing;

  -- Ampara
  select id into d_id from districts where slug = 'ampara';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Ampara', 'ampara', 1),
    (d_id, 'Kalmunai', 'kalmunai', 2),
    (d_id, 'Sammanthurai', 'sammanthurai', 3)
  on conflict do nothing;

  -- Jaffna
  select id into d_id from districts where slug = 'jaffna';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Jaffna', 'jaffna', 1),
    (d_id, 'Chavakacheri', 'chavakacheri', 2),
    (d_id, 'Valvettithurai', 'valvettithurai', 3)
  on conflict do nothing;

  -- Single-city districts
  select id into d_id from districts where slug = 'anuradhapura';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Anuradhapura', 'anuradhapura', 1) on conflict do nothing;

  select id into d_id from districts where slug = 'polonnaruwa';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Polonnaruwa', 'polonnaruwa', 1) on conflict do nothing;

  select id into d_id from districts where slug = 'moneragala';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Moneragala', 'moneragala', 1),
    (d_id, 'Tanamalwila', 'tanamalwila', 2) on conflict do nothing;

  select id into d_id from districts where slug = 'trincomalee';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Trincomalee', 'trincomalee', 1) on conflict do nothing;

  select id into d_id from districts where slug = 'mannar';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Mannar', 'mannar', 1) on conflict do nothing;

  select id into d_id from districts where slug = 'vavuniya';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Vavuniya', 'vavuniya', 1) on conflict do nothing;

  select id into d_id from districts where slug = 'kilinochchi';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Kilinochchi', 'kilinochchi', 1) on conflict do nothing;

  select id into d_id from districts where slug = 'mullaitivu';
  insert into cities (district_id, name_en, slug, sort_order) values
    (d_id, 'Mullaitivu', 'mullaitivu', 1) on conflict do nothing;
end $$;
