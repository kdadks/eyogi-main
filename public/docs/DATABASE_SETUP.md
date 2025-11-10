# Database Setup Instructions for Compliance Management System

## Step 1: Create the Database Tables

You need to run the SQL migration script in your Supabase dashboard to create the compliance tables.

### Instructions:

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Navigate to your project: `fxhmipivmuqgdtwzpeni`

2. **Access SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration**
   - Copy the entire content from `compliance_schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

4. **Verify Tables Created**
   After running the script, you should see these new tables in your database:
   - `compliance_items`
   - `compliance_forms`
   - `compliance_submissions`
   - `compliance_files`
   - `user_compliance_status`
   - `compliance_notifications`

## Step 2: Verify Foreign Key Relationships

The script creates proper foreign key relationships between:
- `compliance_submissions` → `auth.users` (user_id)
- `compliance_submissions` → `auth.users` (reviewed_by)
- `compliance_submissions` → `compliance_items`
- `compliance_submissions` → `compliance_forms`

## Step 3: Test the System

After creating the tables:
1. Restart your development server (`npm run dev`)
2. Login as admin and navigate to `/admin/compliance`
3. Login as teacher/parent/student and check the Settings section

## Troubleshooting

If you get permission errors after creating tables:
1. Check that Row Level Security (RLS) policies are created
2. Verify user roles are properly set in the `auth.users` table
3. Ensure the service role key has proper permissions

## Sample Data

The migration script includes sample compliance items and forms for testing:
- Emergency Contact Information (for students)
- Parent Consent Form (for parents)  
- Teaching Certification (for teachers)
- Code of Conduct Agreement (for teachers)
- Student Health Information (for students)
- Background Check Verification (for teachers)

You can test the system immediately after running the migration!