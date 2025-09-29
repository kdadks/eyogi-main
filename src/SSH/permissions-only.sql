-- Simple permissions insert - adapt columns based on your table structure
-- Run \d permissions to see your exact column names first

-- Option 1: Handle duplicates with ON CONFLICT on name column
INSERT INTO public.permissions (name, description, resource, action) VALUES
('Batch Management - Create', 'Create new batches', 'batches', 'create'),
('Batch Management - Read', 'View batch information', 'batches', 'read'),
('Batch Management - Update', 'Update batch information', 'batches', 'update'),
('Batch Management - Delete', 'Delete batches', 'batches', 'delete'),
('Student Assignment - Create', 'Assign students to batches', 'batch_students', 'create'),
('Student Assignment - Read', 'View student assignments', 'batch_students', 'read'),
('Student Assignment - Update', 'Update student assignments', 'batch_students', 'update'),
('Student Assignment - Delete', 'Remove student assignments', 'batch_students', 'delete')
ON CONFLICT (name) DO NOTHING;

-- Option 2: If your permissions table has different columns, uncomment and modify:
-- INSERT INTO public.permissions (column1, column2, column3) VALUES
-- ('value1', 'value2', 'value3'),
-- ('value1', 'value2', 'value3');