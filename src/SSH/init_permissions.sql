-- Insert initial permissions into the permissions table
INSERT INTO permissions (name, description, resource, action) VALUES
-- User Management Permissions
('View Users', 'View user profiles and basic information', 'users', 'view'),
('Create Users', 'Create new user accounts', 'users', 'create'),
('Update Users', 'Edit user profiles and information', 'users', 'update'),
('Delete Users', 'Remove user accounts', 'users', 'delete'),

-- Course Management Permissions
('View Courses', 'View course information and details', 'courses', 'view'),
('Create Courses', 'Create new courses', 'courses', 'create'),
('Update Courses', 'Edit course content and settings', 'courses', 'update'),
('Delete Courses', 'Remove courses from the system', 'courses', 'delete'),

-- Enrollment Management Permissions
('View Enrollments', 'View student enrollment information', 'enrollments', 'view'),
('Create Enrollments', 'Enroll students in courses', 'enrollments', 'create'),
('Update Enrollments', 'Modify enrollment details', 'enrollments', 'update'),
('Delete Enrollments', 'Remove student enrollments', 'enrollments', 'delete'),

-- Settings Permissions
('View Settings', 'View system configuration', 'settings', 'view'),
('Update Settings', 'Modify system configuration', 'settings', 'update'),

-- Permission Management Permissions
('View Permissions', 'View role permissions', 'permissions', 'view'),
('Update Permissions', 'Modify role permissions', 'permissions', 'update');

-- Set up default role permissions
-- Admin gets all permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions;

-- Teacher gets limited permissions (using 'teacher' instead of 'instructor')
INSERT INTO role_permissions (role, permission_id)
SELECT 'teacher', id FROM permissions 
WHERE (resource = 'users' AND action = 'view')
   OR (resource = 'courses')
   OR (resource = 'enrollments' AND action IN ('view', 'create', 'update'));

-- Student gets minimal permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'student', id FROM permissions 
WHERE (resource = 'courses' AND action = 'view')
   OR (resource = 'enrollments' AND action = 'view');