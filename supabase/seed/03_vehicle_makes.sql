-- =============================================================================
-- 03_vehicle_makes.sql
-- All 130+ vehicle makes from user's provided list.
-- type_ids: which vehicle_types this make applies to.
-- Admin can edit these later via the admin panel.
--
-- Common type ID mapping (after seed 02 runs):
--   1=Car, 2=SUV/Jeep, 3=Van, 4=Motorcycle, 5=Three-wheeler,
--   6=Lorry/Truck, 7=Bus, 8=Tractor, 9=Heavy Machinery, 10=Bicycle/E-bike
--
-- We look these up by slug to be resilient to ID changes.
-- =============================================================================

do $$
declare
  car_id        smallint;
  suv_id        smallint;
  van_id        smallint;
  moto_id       smallint;
  three_id      smallint;
  lorry_id      smallint;
  bus_id        smallint;
  tractor_id    smallint;
  heavy_id      smallint;
  bicycle_id    smallint;
begin
  select id into car_id     from vehicle_types where slug = 'car';
  select id into suv_id     from vehicle_types where slug = 'suv-jeep';
  select id into van_id     from vehicle_types where slug = 'van';
  select id into moto_id    from vehicle_types where slug = 'motorcycle';
  select id into three_id   from vehicle_types where slug = 'three-wheeler';
  select id into lorry_id   from vehicle_types where slug = 'lorry-truck';
  select id into bus_id     from vehicle_types where slug = 'bus';
  select id into tractor_id from vehicle_types where slug = 'tractor';
  select id into heavy_id   from vehicle_types where slug = 'heavy-machinery';
  select id into bicycle_id from vehicle_types where slug = 'bicycle-ebike';

  -- Helper inline: insert make with type_ids array
  -- Cars & SUVs & Vans (mainstream passenger brands)
  insert into vehicle_makes (name, slug, type_ids) values
    ('Acura',          'acura',          array[car_id, suv_id]),
    ('Alfa-Romeo',     'alfa-romeo',     array[car_id, suv_id]),
    ('Aston',          'aston',          array[car_id]),
    ('Audi',           'audi',           array[car_id, suv_id]),
    ('Austin',         'austin',         array[car_id]),
    ('Baic',           'baic',           array[car_id, suv_id, van_id]),
    ('Bentley',        'bentley',        array[car_id]),
    ('BMW',            'bmw',            array[car_id, suv_id, moto_id]),
    ('Borgward',       'borgward',       array[car_id, suv_id]),
    ('BYD',            'byd',            array[car_id, suv_id]),
    ('Cadillac',       'cadillac',       array[car_id, suv_id]),
    ('Cal',            'cal',            array[car_id]),
    ('Ceygra',         'ceygra',         array[car_id]),
    ('Changan',        'changan',        array[car_id, suv_id, van_id]),
    ('Chery',          'chery',          array[car_id, suv_id]),
    ('Chevrolet',      'chevrolet',      array[car_id, suv_id, van_id]),
    ('Chrysler',       'chrysler',       array[car_id, suv_id]),
    ('Citroen',        'citroen',        array[car_id, suv_id, van_id]),
    ('Corvette',       'corvette',       array[car_id]),
    ('Daewoo',         'daewoo',         array[car_id]),
    ('Daihatsu',       'daihatsu',       array[car_id, suv_id, van_id]),
    ('Datsun',         'datsun',         array[car_id]),
    ('DFSK',           'dfsk',           array[car_id, suv_id, van_id, lorry_id]),
    ('Fiat',           'fiat',           array[car_id, van_id]),
    ('Ford',           'ford',           array[car_id, suv_id, van_id, lorry_id]),
    ('GAC',            'gac',            array[car_id, suv_id]),
    ('Gallant',        'gallant',        array[car_id]),
    ('Haval',          'haval',          array[car_id, suv_id]),
    ('Hillman',        'hillman',        array[car_id]),
    ('Holden',         'holden',         array[car_id, suv_id]),
    ('Honda',          'honda',          array[car_id, suv_id, van_id, moto_id]),
    ('Hummer',         'hummer',         array[suv_id]),
    ('Hyundai',        'hyundai',        array[car_id, suv_id, van_id]),
    ('Isuzu',          'isuzu',          array[car_id, suv_id, van_id, lorry_id]),
    ('Jaecoo',         'jaecoo',         array[car_id, suv_id]),
    ('Jaguar',         'jaguar',         array[car_id, suv_id]),
    ('Jeep',           'jeep',           array[suv_id]),
    ('Jetour',         'jetour',         array[car_id, suv_id]),
    ('JMC',            'jmc',            array[suv_id, van_id, lorry_id]),
    ('Kia',            'kia',            array[car_id, suv_id, van_id]),
    ('Lamborghini',    'lamborghini',    array[car_id, suv_id]),
    ('Land-Rover',     'land-rover',     array[suv_id]),
    ('Lexus',          'lexus',          array[car_id, suv_id]),
    ('Lotus',          'lotus',          array[car_id]),
    ('Mahindra',       'mahindra',       array[car_id, suv_id, van_id, three_id, tractor_id]),
    ('Maserati',       'maserati',       array[car_id, suv_id]),
    ('Maxus',          'maxus',          array[van_id, lorry_id]),
    ('Mazda',          'mazda',          array[car_id, suv_id, van_id]),
    ('Mercedes-Benz',  'mercedes-benz',  array[car_id, suv_id, van_id, lorry_id, bus_id]),
    ('Metrocab',       'metrocab',       array[car_id]),
    ('MG',             'mg',             array[car_id, suv_id]),
    ('Mg-Rover',       'mg-rover',       array[car_id]),
    ('Micro',          'micro',          array[car_id, suv_id, van_id]),
    ('Mini',           'mini',           array[car_id]),
    ('Minnelli',       'minnelli',       array[car_id]),
    ('Mitsubishi',     'mitsubishi',     array[car_id, suv_id, van_id, lorry_id]),
    ('Morgan',         'morgan',         array[car_id]),
    ('Morris',         'morris',         array[car_id]),
    ('Nissan',         'nissan',         array[car_id, suv_id, van_id, lorry_id]),
    ('Opel',           'opel',           array[car_id, van_id]),
    ('Perodua',        'perodua',        array[car_id]),
    ('Peugeot',        'peugeot',        array[car_id, suv_id, van_id]),
    ('Porsche',        'porsche',        array[car_id, suv_id]),
    ('Proton',         'proton',         array[car_id]),
    ('Range-Rover',    'range-rover',    array[suv_id]),
    ('Renault',        'renault',        array[car_id, suv_id, van_id]),
    ('Rolls-Royce',    'rolls-royce',    array[car_id]),
    ('Saab',           'saab',           array[car_id]),
    ('Seat',           'seat',           array[car_id]),
    ('Singer',         'singer',         array[car_id]),
    ('Skoda',          'skoda',          array[car_id, suv_id]),
    ('Smart',          'smart',          array[car_id]),
    ('Subaru',         'subaru',         array[car_id, suv_id]),
    ('Suzuki',         'suzuki',         array[car_id, suv_id, van_id, moto_id]),
    ('Tata',           'tata',           array[car_id, suv_id, van_id, lorry_id, bus_id]),
    ('Tesla',          'tesla',          array[car_id, suv_id]),
    ('Toyota',         'toyota',         array[car_id, suv_id, van_id, lorry_id, bus_id]),
    ('Vauxhall',       'vauxhall',       array[car_id, van_id]),
    ('Volkswagen',     'volkswagen',     array[car_id, suv_id, van_id]),
    ('Volvo',          'volvo',          array[car_id, suv_id, lorry_id, bus_id]),
    ('Willys',         'willys',         array[suv_id]),
    ('Wuling',         'wuling',         array[car_id, van_id]),
    ('Zotye',          'zotye',          array[car_id, suv_id])
  on conflict (slug) do nothing;

  -- Motorcycles
  insert into vehicle_makes (name, slug, type_ids) values
    ('Aprilia',     'aprilia',     array[moto_id]),
    ('ATHER',       'ather',       array[moto_id]),
    ('Bajaj',       'bajaj',       array[moto_id, three_id]),
    ('Daido',       'daido',       array[moto_id]),
    ('Demak',       'demak',       array[moto_id]),
    ('Ducati',      'ducati',      array[moto_id]),
    ('Dyno',        'dyno',        array[moto_id, bicycle_id]),
    ('Hero',        'hero',        array[moto_id]),
    ('Hero-Honda',  'hero-honda',  array[moto_id]),
    ('Jonway',      'jonway',      array[moto_id]),
    ('KAPLA',       'kapla',       array[moto_id, bicycle_id]),
    ('Kawasaki',    'kawasaki',    array[moto_id]),
    ('Kinetic',     'kinetic',     array[moto_id]),
    ('KTM',         'ktm',         array[moto_id]),
    ('Loncin',      'loncin',      array[moto_id]),
    ('Longjia',     'longjia',     array[moto_id]),
    ('Piaggio',     'piaggio',     array[moto_id, three_id]),
    ('Ranomoto',    'ranomoto',    array[moto_id]),
    ('Reva',        'reva',        array[moto_id, bicycle_id]),
    ('REVOLT',      'revolt',      array[moto_id]),
    ('Senaro',      'senaro',      array[moto_id]),
    ('Sonca',       'sonca',       array[moto_id, bicycle_id]),
    ('Syuk',        'syuk',        array[moto_id]),
    ('TAILG',       'tailg',       array[moto_id, bicycle_id]),
    ('Triumph',     'triumph',     array[moto_id]),
    ('TVS',         'tvs',         array[moto_id, three_id]),
    ('Vespa',       'vespa',       array[moto_id]),
    ('Wave',        'wave',        array[moto_id, bicycle_id]),
    ('Yadea',       'yadea',       array[moto_id, bicycle_id]),
    ('Yamaha',      'yamaha',      array[moto_id]),
    ('Zongshen',    'zongshen',    array[moto_id, three_id]),
    ('JiaLing',     'jialing',     array[moto_id, three_id])
  on conflict (slug) do nothing;

  -- Three-wheelers (Bajaj/TVS/Piaggio above also cover this)
  insert into vehicle_makes (name, slug, type_ids) values
    ('NWOW',  'nwow',  array[three_id, moto_id])
  on conflict (slug) do nothing;

  -- Lorry/Truck/Bus brands
  insert into vehicle_makes (name, slug, type_ids) values
    ('Ashok-Leyland', 'ashok-leyland', array[lorry_id, bus_id, three_id]),
    ('BAW',           'baw',           array[lorry_id, van_id]),
    ('DAF',           'daf',           array[lorry_id]),
    ('Dfac',          'dfac',          array[lorry_id, van_id]),
    ('Eicher',        'eicher',        array[lorry_id, bus_id]),
    ('FAW',           'faw',           array[lorry_id, bus_id, car_id]),
    ('Force',         'force',         array[lorry_id, van_id, suv_id]),
    ('Foton',         'foton',         array[lorry_id, van_id, bus_id]),
    ('Higer',         'higer',         array[bus_id]),
    ('HINO',          'hino',          array[lorry_id, bus_id]),
    ('Iveco',         'iveco',         array[lorry_id, bus_id, van_id]),
    ('JAC',           'jac',           array[lorry_id, van_id, suv_id]),
    ('KMC',           'kmc',           array[lorry_id, van_id]),
    ('Lti',           'lti',           array[car_id]),
    ('Yuejin',        'yuejin',        array[lorry_id])
  on conflict (slug) do nothing;

  -- Tractors & farm
  insert into vehicle_makes (name, slug, type_ids) values
    ('Massey-Ferguson', 'massey-ferguson', array[tractor_id]),
    ('John-Deere',      'john-deere',      array[tractor_id]),
    ('New-Holland',     'new-holland',     array[tractor_id]),
    ('Sonalika',        'sonalika',        array[tractor_id]),
    ('Swaraj',          'swaraj',          array[tractor_id]),
    ('TAFE',            'tafe',            array[tractor_id]),
    ('Powertrac',       'powertrac',       array[tractor_id]),
    ('Kubota',          'kubota',          array[tractor_id, heavy_id]),
    ('Yanmar',          'yanmar',          array[tractor_id, heavy_id])
  on conflict (slug) do nothing;

  -- Heavy machinery / construction
  insert into vehicle_makes (name, slug, type_ids) values
    ('Atco',     'atco',     array[heavy_id]),
    ('CAT',      'cat',      array[heavy_id]),
    ('Hitachi',  'hitachi',  array[heavy_id]),
    ('IHI',      'ihi',      array[heavy_id]),
    ('JCB',      'jcb',      array[heavy_id]),
    ('Kobelco',  'kobelco',  array[heavy_id]),
    ('Komatsu',  'komatsu',  array[heavy_id]),
    ('Sakai',    'sakai',    array[heavy_id])
  on conflict (slug) do nothing;

  -- Misc / fallback
  insert into vehicle_makes (name, slug, type_ids) values
    ('Ferrari', 'ferrari', array[car_id]),
    ('Other',   'other',   array[car_id, suv_id, van_id, moto_id, three_id, lorry_id, bus_id, tractor_id, heavy_id, bicycle_id])
  on conflict (slug) do nothing;
end $$;
