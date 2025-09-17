import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Switch } from '../ui/switch'
import { Badge } from '../ui/Badge'
import {
  AlertCircle,
  CheckCircle,
  Save,
  Users,
  Book,
  GraduationCap,
  Settings,
  Shield,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { usePermissions } from '../../contexts/PermissionContext'
import { supabaseAdmin } from '../../lib/supabase'

interface DatabasePermission {
  id: string
  name: string
  description: string | null
  resource: string
  action: string
  created_at: string
}

interface RolePermission {
  id: string
  role: string
  permission_id: string
  created_at: string
  permission: DatabasePermission
}

interface Permission {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  resource: string
  action: string
}

// Icon mapping for different resources
const getIconForResource = (resource: string): React.ReactNode => {
  switch (resource.toLowerCase()) {
    case 'users':
      return <Users className="h-4 w-4" />
    case 'courses':
      return <Book className="h-4 w-4" />
    case 'enrollments':
      return <GraduationCap className="h-4 w-4" />
    case 'settings':
      return <Settings className="h-4 w-4" />
    case 'permissions':
      return <Shield className="h-4 w-4" />
    default:
      return <AlertCircle className="h-4 w-4" />
  }
}

const ROLE_DEFAULTS = {
  admin: [],
  teacher: [],
  student: [],
}

export default function AdminPermissionManagement() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(ROLE_DEFAULTS)
  const [selectedRole, setSelectedRole] = useState<string>('admin')
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const { canAccess } = usePermissions()

  // Load permissions from database
  const loadPermissions = async () => {
    try {
      setIsLoadingData(true)

      // Load all permissions
      const { data: permissionsData, error: permError } = await supabaseAdmin
        .from('permissions')
        .select('*')
        .order('resource, action')

      if (permError) throw permError

      // Load all role permissions with permission details
      const { data: rolePermData, error: roleError } = await supabaseAdmin.from('role_permissions')
        .select(`
          id,
          role,
          permission_id,
          created_at,
          permission:permissions(*)
        `)

      if (roleError) throw roleError

      // Convert database permissions to UI format
      const uiPermissions: Permission[] = (permissionsData || []).map((perm) => ({
        id: perm.id,
        name: perm.name,
        description: perm.description || '',
        icon: getIconForResource(perm.resource),
        resource: perm.resource,
        action: perm.action,
      }))

      setPermissions(uiPermissions)

      // Group role permissions by role
      const rolePermissionMap: Record<string, string[]> = {
        admin: [],
        teacher: [],
        student: [],
      }

      ;(rolePermData || []).forEach((rp: any) => {
        if (rolePermissionMap[rp.role]) {
          rolePermissionMap[rp.role].push(rp.permission_id)
        }
      })

      setRolePermissions(rolePermissionMap)
    } catch (error) {
      console.error('Error loading permissions:', error)
      toast.error('Failed to load permissions from database')
    } finally {
      setIsLoadingData(false)
    }
  }

  // Save permissions to database
  const savePermissions = async () => {
    if (!canAccess('permissions', 'update')) {
      toast.error("You don't have permission to update permissions")
      return
    }

    try {
      setLoading(true)

      // Delete existing role permissions for the selected role
      const { error: deleteError } = await supabaseAdmin
        .from('role_permissions')
        .delete()
        .eq('role', selectedRole)

      if (deleteError) throw deleteError

      // Insert new role permissions
      if (rolePermissions[selectedRole].length > 0) {
        const rolePermissionInserts = rolePermissions[selectedRole].map((permissionId) => ({
          role: selectedRole,
          permission_id: permissionId,
        }))

        const { error: insertError } = await supabaseAdmin
          .from('role_permissions')
          .insert(rolePermissionInserts)

        if (insertError) throw insertError
      }

      setHasChanges(false)
      toast.success(`Permissions saved for ${selectedRole} role`)
    } catch (error) {
      console.error('Error saving permissions:', error)
      toast.error('Failed to save permissions to database')
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    loadPermissions()
  }, [])

  // Check if user can access this page
  if (!canAccess('permissions', 'view')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to view permissions.</p>
        </div>
      </div>
    )
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading permissions...</p>
        </div>
      </div>
    )
  }

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setRolePermissions((prev) => {
      const currentPermissions = prev[selectedRole] || []
      const newPermissions = checked
        ? [...currentPermissions, permissionId]
        : currentPermissions.filter((p) => p !== permissionId)

      setHasChanges(true)
      return {
        ...prev,
        [selectedRole]: newPermissions,
      }
    })

    toast.success(`Permission ${checked ? 'granted' : 'removed'} for ${selectedRole}`)
  }

  const roles = Object.keys(ROLE_DEFAULTS)
  const currentPermissions = rolePermissions[selectedRole] || []

  // Group permissions by resource
  const groupedPermissions = permissions.reduce(
    (acc, permission) => {
      const resource = permission.resource
      if (!acc[resource]) {
        acc[resource] = []
      }
      acc[resource].push(permission)
      return acc
    },
    {} as Record<string, Permission[]>,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permission Management</h1>
          <p className="text-gray-600">Manage role-based permissions for your application</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={loadPermissions}
            disabled={isLoadingData}
            className="flex items-center gap-2"
            style={{ backgroundColor: '#6b7280', color: 'white' }}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={savePermissions}
            disabled={loading || !hasChanges}
            className="flex items-center gap-2"
            style={{ backgroundColor: hasChanges ? '#3b82f6' : '#6b7280', color: 'white' }}
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">You have unsaved changes</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Role Selection</CardTitle>
          <CardDescription>
            Select a role to manage its permissions. Changes are saved to the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {roles.map((role) => (
              <Button
                key={role}
                onClick={() => setSelectedRole(role)}
                className="capitalize"
                style={{
                  backgroundColor: selectedRole === role ? '#3b82f6' : 'transparent',
                  color: selectedRole === role ? 'white' : '#374151',
                  border: '1px solid #d1d5db',
                }}
              >
                {role}
                <Badge variant="default" className="ml-2">
                  {(rolePermissions[role] || []).length}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
          <Card key={resource}>
            <CardHeader>
              <CardTitle className="capitalize flex items-center gap-2">
                {resourcePermissions[0].icon}
                {resource} Permissions
              </CardTitle>
              <CardDescription>
                Manage {resource}-related permissions for the {selectedRole} role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resourcePermissions.map((permission) => {
                  const isChecked = currentPermissions.includes(permission.id)
                  return (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-md">{permission.icon}</div>
                        <div>
                          <div className="font-medium text-gray-900">{permission.name}</div>
                          <div className="text-sm text-gray-500">{permission.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isChecked && <CheckCircle className="h-4 w-4 text-green-500" />}
                        <Switch
                          checked={isChecked}
                          onCheckedChange={(checked: boolean) =>
                            handlePermissionChange(permission.id, checked)
                          }
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
