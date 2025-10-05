import { supabaseAdmin } from '../supabase'
import { Permission, UserPermission } from '../../types'

// Permission Management Functions

export async function getPermissions(filters?: {
  resource?: string
  action?: string
  is_active?: boolean
}): Promise<Permission[]> {
  try {
    let query = supabaseAdmin.from('permissions').select(`
        *,
        profiles!permissions_created_by_fkey (
          id,
          full_name,
          email,
          role
        )
      `)

    if (filters?.resource) {
      query = query.eq('resource', filters.resource)
    }
    if (filters?.action) {
      query = query.eq('action', filters.action)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query.order('resource', { ascending: true })

    if (error) {
      console.error('Error fetching permissions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getPermissions:', error)
    return []
  }
}

export async function getPermission(id: string): Promise<Permission | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('permissions')
      .select(
        `
        *,
        profiles!permissions_created_by_fkey (
          id,
          full_name,
          email,
          role
        )
      `,
      )
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching permission:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getPermission:', error)
    return null
  }
}

export async function createPermission(
  permission: Omit<Permission, 'id' | 'created_at' | 'updated_at'>,
): Promise<Permission> {
  try {
    const { data, error } = await supabaseAdmin
      .from('permissions')
      .insert({
        ...permission,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        profiles!permissions_created_by_fkey (
          id,
          full_name,
          email,
          role
        )
      `,
      )
      .single()

    if (error) {
      console.error('Error creating permission:', error)
      throw new Error('Failed to create permission')
    }

    return data
  } catch (error) {
    console.error('Error in createPermission:', error)
    throw error
  }
}

export async function updatePermission(
  id: string,
  updates: Partial<Permission>,
): Promise<Permission> {
  try {
    const { data, error } = await supabaseAdmin
      .from('permissions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        profiles!permissions_created_by_fkey (
          id,
          full_name,
          email,
          role
        )
      `,
      )
      .single()

    if (error) {
      console.error('Error updating permission:', error)
      throw new Error('Failed to update permission')
    }

    return data
  } catch (error) {
    console.error('Error in updatePermission:', error)
    throw error
  }
}

export async function deletePermission(id: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('permissions')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error deleting permission:', error)
      throw new Error('Failed to delete permission')
    }
  } catch (error) {
    console.error('Error in deletePermission:', error)
    throw error
  }
}

// User Permission Management Functions

export async function getUserPermissions(userId: string): Promise<UserPermission[]> {
  try {
    console.log('getUserPermissions called with userId:', userId)

    // First, get the user's role
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || !userProfile) {
      console.error('Error fetching user profile:', userError)
      return []
    }

    console.log('User role found:', userProfile.role)

    // Then get permissions for that role from role_permissions table
    const { data: rolePermissions, error: roleError } = await supabaseAdmin
      .from('role_permissions')
      .select(
        `
        id,
        role,
        permission_id,
        permissions (
          id,
          name,
          description,
          resource,
          action
        )
      `,
      )
      .eq('role', userProfile.role)

    console.log('Database query result:', { data: rolePermissions, error: roleError })

    if (roleError) {
      console.error('Error fetching role permissions:', roleError)
      return []
    }

    // Filter and convert role_permissions format to UserPermission format for compatibility
    const userPermissions: UserPermission[] = (rolePermissions || [])
      .filter((rolePerm) => {
        // Check if permissions exist (since all role permissions are assumed active)
        const permission = Array.isArray(rolePerm.permissions)
          ? rolePerm.permissions[0]
          : rolePerm.permissions
        return permission && permission.resource && permission.action
      })
      .map((rolePerm) => ({
        id: rolePerm.id,
        user_id: userId,
        permission_id: rolePerm.permission_id,
        permission: {
          ...(Array.isArray(rolePerm.permissions) ? rolePerm.permissions[0] : rolePerm.permissions),
          is_active: true, // Default all role permissions to active
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        granted_at: new Date().toISOString(),
        granted_by: 'system', // Role-based permissions are system-granted
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

    console.log('Returning converted permissions data:', userPermissions)
    return userPermissions
  } catch (error) {
    console.error('Error in getUserPermissions:', error)
    return []
  }
}

export async function grantPermissionToUser(
  userId: string,
  permissionId: string,
  grantedBy: string,
): Promise<UserPermission> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_permissions')
      .insert({
        id: crypto.randomUUID(),
        user_id: userId,
        permission_id: permissionId,
        granted_by: grantedBy,
        granted_at: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        profiles!user_permissions_user_id_fkey (
          id,
          full_name,
          email,
          role
        ),
        permissions (
          id,
          name,
          description,
          resource,
          action,
          is_active
        ),
        profiles!user_permissions_granted_by_fkey (
          id,
          full_name,
          email,
          role
        )
      `,
      )
      .single()

    if (error) {
      console.error('Error granting permission to user:', error)
      throw new Error('Failed to grant permission to user')
    }

    return data
  } catch (error) {
    console.error('Error in grantPermissionToUser:', error)
    throw error
  }
}

export async function revokePermissionFromUser(
  userId: string,
  permissionId: string,
): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('user_permissions')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('permission_id', permissionId)

    if (error) {
      console.error('Error revoking permission from user:', error)
      throw new Error('Failed to revoke permission from user')
    }
  } catch (error) {
    console.error('Error in revokePermissionFromUser:', error)
    throw error
  }
}

export async function getAllUserPermissions(): Promise<UserPermission[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_permissions')
      .select(
        `
        *,
        profiles!user_permissions_user_id_fkey (
          id,
          full_name,
          email,
          role
        ),
        permissions (
          id,
          name,
          description,
          resource,
          action,
          is_active
        ),
        profiles!user_permissions_granted_by_fkey (
          id,
          full_name,
          email,
          role
        )
      `,
      )
      .eq('is_active', true)
      .order('granted_at', { ascending: false })

    if (error) {
      console.error('Error fetching all user permissions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getAllUserPermissions:', error)
    return []
  }
}

// Permission Check Functions

export async function checkUserPermission(
  userId: string,
  resource: string,
  action: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_permissions')
      .select(
        `
        permissions!inner (
          resource,
          action,
          is_active
        )
      `,
      )
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('permissions.resource', resource)
      .eq('permissions.action', action)
      .eq('permissions.is_active', true)

    if (error) {
      console.error('Error checking user permission:', error)
      return false
    }

    return (data || []).length > 0
  } catch (error) {
    console.error('Error in checkUserPermission:', error)
    return false
  }
}

export async function getPermissionsByResource(resource: string): Promise<Permission[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('permissions')
      .select(
        `
        *,
        profiles!permissions_created_by_fkey (
          id,
          full_name,
          email,
          role
        )
      `,
      )
      .eq('resource', resource)
      .eq('is_active', true)
      .order('action', { ascending: true })

    if (error) {
      console.error('Error fetching permissions by resource:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getPermissionsByResource:', error)
    return []
  }
}

// Batch permission operations

export async function grantBatchPermissions(
  userIds: string[],
  permissionIds: string[],
  grantedBy: string,
): Promise<UserPermission[]> {
  try {
    const insertData = []

    for (const userId of userIds) {
      for (const permissionId of permissionIds) {
        insertData.push({
          id: crypto.randomUUID(),
          user_id: userId,
          permission_id: permissionId,
          granted_by: grantedBy,
          granted_at: new Date().toISOString(),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    }

    const { data, error } = await supabaseAdmin.from('user_permissions').insert(insertData).select(`
        *,
        profiles!user_permissions_user_id_fkey (
          id,
          full_name,
          email,
          role
        ),
        permissions (
          id,
          name,
          description,
          resource,
          action,
          is_active
        ),
        profiles!user_permissions_granted_by_fkey (
          id,
          full_name,
          email,
          role
        )
      `)

    if (error) {
      console.error('Error granting batch permissions:', error)
      throw new Error('Failed to grant batch permissions')
    }

    return data || []
  } catch (error) {
    console.error('Error in grantBatchPermissions:', error)
    throw error
  }
}
