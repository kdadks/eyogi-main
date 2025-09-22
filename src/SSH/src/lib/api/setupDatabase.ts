import { supabaseAdmin } from '../supabase'

// This function should be run once to set up the required database tables
export const setupDatabase = async () => {
  try {
    console.log('Setting up database tables...')

    // Create certificate_templates table
    const createTemplatesTable = `
      CREATE TABLE IF NOT EXISTS certificate_templates (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) CHECK (type IN ('student', 'teacher', 'participation', 'completion')) DEFAULT 'student',
        template_data JSONB NOT NULL DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_by UUID NOT NULL REFERENCES profiles(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const { error: templatesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createTemplatesTable
    })

    if (templatesError && !templatesError.message.includes('already exists')) {
      console.log('Templates table creation result:', templatesError)
    }

    // Create certificate_assignments table
    const createAssignmentsTable = `
      CREATE TABLE IF NOT EXISTS certificate_assignments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        template_id UUID NOT NULL REFERENCES certificate_templates(id) ON DELETE CASCADE,
        gurukul_id UUID REFERENCES gurukuls(id) ON DELETE CASCADE,
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        created_by UUID NOT NULL REFERENCES profiles(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT check_assignment_target CHECK (
          (gurukul_id IS NOT NULL) OR (course_id IS NOT NULL)
        )
      );
    `

    const { error: assignmentsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createAssignmentsTable
    })

    if (assignmentsError && !assignmentsError.message.includes('already exists')) {
      console.log('Assignments table creation result:', assignmentsError)
    }

    // Create indexes
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_certificate_assignments_template_id ON certificate_assignments(template_id);
      CREATE INDEX IF NOT EXISTS idx_certificate_assignments_gurukul_id ON certificate_assignments(gurukul_id);
      CREATE INDEX IF NOT EXISTS idx_certificate_assignments_course_id ON certificate_assignments(course_id);
      CREATE INDEX IF NOT EXISTS idx_certificate_templates_active ON certificate_templates(is_active);
    `

    const { error: indexError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createIndexes
    })

    if (indexError && !indexError.message.includes('already exists')) {
      console.log('Index creation result:', indexError)
    }

    // Create updated_at trigger function
    const createTriggerFunction = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `

    const { error: functionError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createTriggerFunction
    })

    if (functionError) {
      console.log('Trigger function creation result:', functionError)
    }

    // Create triggers
    const createTriggers = `
      DROP TRIGGER IF EXISTS update_certificate_templates_updated_at ON certificate_templates;
      CREATE TRIGGER update_certificate_templates_updated_at BEFORE UPDATE
      ON certificate_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_certificate_assignments_updated_at ON certificate_assignments;
      CREATE TRIGGER update_certificate_assignments_updated_at BEFORE UPDATE
      ON certificate_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `

    const { error: triggerError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createTriggers
    })

    if (triggerError) {
      console.log('Trigger creation result:', triggerError)
    }

    console.log('Database setup completed successfully!')
    return { success: true }

  } catch (error) {
    console.error('Error setting up database:', error)
    throw error
  }
}

// Alternative approach: Check if tables exist
export const checkTablesExist = async () => {
  try {
    // Try to query the tables to see if they exist
    const { error: templatesError } = await supabaseAdmin
      .from('certificate_templates')
      .select('id')
      .limit(1)

    const { error: assignmentsError } = await supabaseAdmin
      .from('certificate_assignments')
      .select('id')
      .limit(1)

    return {
      templatesExist: !templatesError,
      assignmentsExist: !assignmentsError,
      templatesError: templatesError?.message,
      assignmentsError: assignmentsError?.message
    }
  } catch (error) {
    console.error('Error checking tables:', error)
    return {
      templatesExist: false,
      assignmentsExist: false,
      error: error.message
    }
  }
}