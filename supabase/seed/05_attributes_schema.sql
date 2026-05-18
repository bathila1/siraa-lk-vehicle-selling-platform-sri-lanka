-- =============================================================================
-- 05_attributes_schema.sql
-- Default custom fields. Admin can add or hide via admin panel.
-- Built-in vehicle fields (mileage, year, transmission, etc.) are columns
-- on the vehicles table. This table is for EXTRA fields per vehicle type.
-- =============================================================================

-- Examples of admin-editable extras per vehicle type.
-- vehicle_type_id = NULL means "applies to all types".

do $$
declare
  car_id    smallint;
  suv_id    smallint;
  moto_id   smallint;
  van_id    smallint;
  bus_id    smallint;
  tractor_id smallint;
begin
  select id into car_id     from vehicle_types where slug = 'car';
  select id into suv_id     from vehicle_types where slug = 'suv-jeep';
  select id into moto_id    from vehicle_types where slug = 'motorcycle';
  select id into van_id     from vehicle_types where slug = 'van';
  select id into bus_id     from vehicle_types where slug = 'bus';
  select id into tractor_id from vehicle_types where slug = 'tractor';

  -- Car-specific
  insert into vehicle_attributes_schema
    (vehicle_type_id, field_key, label_en, label_si, field_type, options, required, sort_order, active)
  values
    (car_id, 'features', 'Features', 'විශේෂාංග', 'multiselect',
      '[
        {"value":"ac","label_en":"Air Conditioning","label_si":"වායු සමීකරණය"},
        {"value":"power_steering","label_en":"Power Steering","label_si":"බල සුක්කානම"},
        {"value":"power_windows","label_en":"Power Windows","label_si":"බල කවුළු"},
        {"value":"central_locking","label_en":"Central Locking","label_si":"මධ්‍ය අගුළු"},
        {"value":"abs","label_en":"ABS","label_si":"ABS"},
        {"value":"airbags","label_en":"Airbags","label_si":"වායු බෑග්"},
        {"value":"alloy_wheels","label_en":"Alloy Wheels","label_si":"මිශ්‍ර ලෝහ රෝද"},
        {"value":"reverse_camera","label_en":"Reverse Camera","label_si":"පසුපස කැමරාව"},
        {"value":"navigation","label_en":"Navigation System","label_si":"සංචාලන පද්ධතිය"},
        {"value":"sunroof","label_en":"Sunroof","label_si":"සන්රූෆ්"},
        {"value":"leather_seats","label_en":"Leather Seats","label_si":"සම් ආසන"}
      ]'::jsonb,
      false, 1, true),
    (car_id, 'seating_capacity', 'Seating Capacity', 'ආසන ධාරිතාව', 'number',
      null, false, 2, true)
  on conflict (vehicle_type_id, field_key) do nothing;

  -- Same features set for SUV
  insert into vehicle_attributes_schema
    (vehicle_type_id, field_key, label_en, label_si, field_type, options, required, sort_order, active)
  values
    (suv_id, 'features', 'Features', 'විශේෂාංග', 'multiselect',
      '[
        {"value":"ac","label_en":"Air Conditioning","label_si":"වායු සමීකරණය"},
        {"value":"4wd","label_en":"4WD / AWD","label_si":"4WD / AWD"},
        {"value":"abs","label_en":"ABS","label_si":"ABS"},
        {"value":"airbags","label_en":"Airbags","label_si":"වායු බෑග්"},
        {"value":"reverse_camera","label_en":"Reverse Camera","label_si":"පසුපස කැමරාව"},
        {"value":"sunroof","label_en":"Sunroof","label_si":"සන්රූෆ්"},
        {"value":"leather_seats","label_en":"Leather Seats","label_si":"සම් ආසන"}
      ]'::jsonb,
      false, 1, true)
  on conflict (vehicle_type_id, field_key) do nothing;

  -- Motorcycle-specific
  insert into vehicle_attributes_schema
    (vehicle_type_id, field_key, label_en, label_si, field_type, options, required, sort_order, active)
  values
    (moto_id, 'bike_style', 'Bike Style', 'බයික් වර්ගය', 'select',
      '[
        {"value":"scooter","label_en":"Scooter","label_si":"ස්කූටර්"},
        {"value":"sports","label_en":"Sports","label_si":"ස්පෝර්ට්ස්"},
        {"value":"cruiser","label_en":"Cruiser","label_si":"කෘසර්"},
        {"value":"naked","label_en":"Naked / Standard","label_si":"සාමාන්‍ය"},
        {"value":"offroad","label_en":"Off-road / Dirt","label_si":"ඕෆ්-රෝඩ්"},
        {"value":"electric","label_en":"Electric","label_si":"විදුලි"}
      ]'::jsonb,
      false, 1, true),
    (moto_id, 'starter', 'Starter', 'ආරම්භකය', 'select',
      '[
        {"value":"electric","label_en":"Electric Start","label_si":"විදුලි ආරම්භක"},
        {"value":"kick","label_en":"Kick Start","label_si":"කික් ආරම්භක"},
        {"value":"both","label_en":"Both","label_si":"දෙකම"}
      ]'::jsonb,
      false, 2, true)
  on conflict (vehicle_type_id, field_key) do nothing;

  -- Van-specific
  insert into vehicle_attributes_schema
    (vehicle_type_id, field_key, label_en, label_si, field_type, options, required, sort_order, active)
  values
    (van_id, 'seating_capacity', 'Seating Capacity', 'ආසන ධාරිතාව', 'number',
      null, true, 1, true),
    (van_id, 'roof_height', 'Roof Type', 'වහල වර්ගය', 'select',
      '[
        {"value":"standard","label_en":"Standard Roof","label_si":"සාමාන්‍ය වහල"},
        {"value":"high","label_en":"High Roof","label_si":"උස් වහල"}
      ]'::jsonb,
      false, 2, true)
  on conflict (vehicle_type_id, field_key) do nothing;

  -- Bus-specific
  insert into vehicle_attributes_schema
    (vehicle_type_id, field_key, label_en, label_si, field_type, options, required, sort_order, active)
  values
    (bus_id, 'seating_capacity', 'Seating Capacity', 'ආසන ධාරිතාව', 'number',
      null, true, 1, true)
  on conflict (vehicle_type_id, field_key) do nothing;

  -- Tractor-specific
  insert into vehicle_attributes_schema
    (vehicle_type_id, field_key, label_en, label_si, field_type, options, required, sort_order, active)
  values
    (tractor_id, 'horsepower', 'Horsepower (HP)', 'අශ්වශක්තිය', 'number',
      null, false, 1, true),
    (tractor_id, 'wheel_drive', 'Wheel Drive', 'රෝද ධාවනය', 'select',
      '[
        {"value":"2wd","label_en":"2WD","label_si":"2WD"},
        {"value":"4wd","label_en":"4WD","label_si":"4WD"}
      ]'::jsonb,
      false, 2, true)
  on conflict (vehicle_type_id, field_key) do nothing;

  -- Applies-to-all extras (vehicle_type_id = NULL)
  insert into vehicle_attributes_schema
    (vehicle_type_id, field_key, label_en, label_si, field_type, options, required, sort_order, active)
  values
    (null, 'accident_free', 'Accident-free', 'අනතුරුවලින් තොර', 'boolean',
      null, false, 90, true),
    (null, 'negotiable', 'Price Negotiable', 'මිල සාකච්ඡා කළ හැක', 'boolean',
      null, false, 91, true),
    (null, 'exchange_ok', 'Exchange Considered', 'හුවමාරුව සලකා බැලේ', 'boolean',
      null, false, 92, true)
  on conflict (vehicle_type_id, field_key) do nothing;
end $$;
