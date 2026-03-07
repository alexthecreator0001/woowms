-- Reset bin capacities that match old item-count defaults to NULL
-- so they pick up the new volume-based defaults from code.
-- Bins with custom capacity overrides are left untouched.

UPDATE bins SET capacity = NULL WHERE bin_size = 'SMALL' AND capacity = 25;
UPDATE bins SET capacity = NULL WHERE bin_size = 'MEDIUM' AND capacity = 50;
UPDATE bins SET capacity = NULL WHERE bin_size = 'LARGE' AND capacity = 100;
UPDATE bins SET capacity = NULL WHERE bin_size = 'XLARGE' AND capacity = 200;
