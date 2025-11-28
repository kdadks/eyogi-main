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
  Building,
  FileText,
  Award,
  BarChart3,
  UserCheck,
  Eye,
  EyeOff,
  Menu,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { usePermissions } from '../../contexts/PermissionContext'
import { supabaseAdmin } from '../../lib/supabase'

interface Permission {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  resource: string
  action: string
}

interface RolePermission {
  permission_id: string
  menu_visible: boolean
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
    case 'students':
      return <UserCheck className="h-4 w-4" />
    case 'gurukuls':
      return <Building className="h-4 w-4" />
    case 'content':
      return <FileText className="h-4 w-4" />
    case 'certificates':
      return <Award className="h-4 w-4" />
    case 'analytics':
      return <BarChart3 className="h-4 w-4" />
    case 'assignments':
      return <UserCheck className="h-4 w-4" />
    case 'dashboard':
      return <BarChart3 className="h-4 w-4" />
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
  business_admin: [],
  teacher: [],
  student: [],
  parent: [],
}

const ROLE_MENU_DEFAULTS: Record<string, Record<string, boolean>> = {
  admin: {},
  business_admin: {},
  teacher: {},
  student: {},
  parent: {},
}

export default function AdminPermissionManagement() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(ROLE_DEFAULTS)
  const [menuVisibility, setMenuVisibility] =
    useState<Record<string, Record<string, boolean>>>(ROLE_MENU_DEFAULTS)
  const [selectedRole, setSelectedRole] = useState<string>('business_admin')
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const { canAccess } = usePermissions()
  // Load permissions from database
  const loadPermissions = async () => {
    try {
      setIsLoadingData(true)

      // Load all permissions from database
      const { data: permissionsData, error: permError } = await supabaseAdmin
        .from('permissions')
        .select('id, name, description, resource, action, created_at')
        .order('resource, action')

      if (permError) {
        console.error('Error loading permissions:', permError)
        throw permError
      }

      // Load all role permissions with menu visibility
      const { data: rolePermData, error: roleError } = await supabaseAdmin
        .from('role_permissions')
        .select('id, role, permission_id, menu_visible, created_at')

      if (roleError) {
        console.error('Error loading role permissions:', roleError)
        throw roleError
      }

      // Convert ALL database permissions to UI format
      const uiPermissions: Permission[] = (permissionsData || []).map((perm) => ({
        id: perm.id,
        name: perm.name,
        description: perm.description || `${perm.resource} ${perm.action} permission`,
        icon: getIconForResource(perm.resource),
        resource: perm.resource,
        action: perm.action,
      }))

      setPermissions(uiPermissions)

      // Group role permissions by role
      const rolePermissionMap: Record<string, string[]> = {
        admin: [],
        business_admin: [],
        teacher: [],
        student: [],
        parent: [],
      }

      // Track menu visibility for each role and permission
      const menuVisibilityMap: Record<string, Record<string, boolean>> = {
        admin: {},
        business_admin: {},
        teacher: {},
        student: {},
        parent: {},
      }

      // Map role permissions and menu visibility
      ;(rolePermData || []).forEach(
        (rp: { role: string; permission_id: string; menu_visible: boolean }) => {
          if (rolePermissionMap[rp.role]) {
            rolePermissionMap[rp.role].push(rp.permission_id)
            menuVisibilityMap[rp.role][rp.permission_id] = rp.menu_visible ?? true
          }
        },
      )

      setRolePermissions(rolePermissionMap)
      setMenuVisibility(menuVisibilityMap)

      toast.success(`Loaded ${uiPermissions.length} permissions successfully`)
    } catch (error) {
      console.error('Failed to load permissions:', error)
      toast.error(
        'Failed to load permissions from database. Please check your connection and permissions.',
      )
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
      // Insert new role permissions with menu visibility
      if (rolePermissions[selectedRole].length > 0) {
        const rolePermissionInserts = rolePermissions[selectedRole].map((permissionId) => ({
          role: selectedRole,
          permission_id: permissionId,
          menu_visible: menuVisibility[selectedRole]?.[permissionId] ?? true,
        }))
        const { error: insertError } = await supabaseAdmin
          .from('role_permissions')
          .insert(rolePermissionInserts)
        if (insertError) throw insertError
      }
      setHasChanges(false)
      toast.success(`Permissions saved for ${selectedRole} role`)
    } catch {
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

    // If granting permission, default menu visibility to true
    if (checked) {
      setMenuVisibility((prev) => ({
        ...prev,
        [selectedRole]: {
          ...prev[selectedRole],
          [permissionId]: true,
        },
      }))
    }

    toast.success(`Permission ${checked ? 'granted' : 'removed'} for ${selectedRole}`)
  }

  const handleMenuVisibilityChange = (permissionId: string, visible: boolean) => {
    setMenuVisibility((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [permissionId]: visible,
      },
    }))
    setHasChanges(true)
    toast.success(`Menu ${visible ? 'visible' : 'hidden'} for ${selectedRole}`)
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
      {hasChanges && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">You have unsaved changes</span>
        </div>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Role Selection</CardTitle>
              <CardDescription>
                Select a role to manage its permissions. Changes are saved to the database.
              </CardDescription>
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
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {roles.map((role) => {
              const isSelected = selectedRole === role
              const permissionCount = (rolePermissions[role] || []).length
              return (
                <div
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-medium text-gray-900 mb-1">
                      {role === 'business_admin'
                        ? 'Business admin'
                        : role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
                    </div>
                    <Badge variant={isSelected ? 'default' : 'secondary'} className="text-xs">
                      {permissionCount} permissions
                    </Badge>
                    {role === 'business_admin' && (
                      <div className="text-xs text-gray-500 mt-1">Limited admin access</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
      {selectedRole === 'business_admin' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Business Admin Role Guidelines
            </CardTitle>
            <CardDescription className="text-amber-700">
              Business Admins have limited administrative access. Recommended permissions include:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2 text-amber-800">
                <BarChart3 className="h-4 w-4" />
                Dashboard access
              </div>
              <div className="flex items-center gap-2 text-amber-800">
                <Book className="h-4 w-4" />
                Course management
              </div>
              <div className="flex items-center gap-2 text-amber-800">
                <GraduationCap className="h-4 w-4" />
                Enrollment oversight
              </div>
              <div className="flex items-center gap-2 text-amber-800">
                <Building className="h-4 w-4" />
                Gurukul management
              </div>
              <div className="flex items-center gap-2 text-amber-800">
                <Award className="h-4 w-4" />
                Certificate management
              </div>
              <div className="flex items-center gap-2 text-amber-800">
                <FileText className="h-4 w-4" />
                Content management
              </div>
              <div className="flex items-center gap-2 text-amber-800">
                <UserCheck className="h-4 w-4" />
                Student oversight
              </div>
              <div className="flex items-center gap-2 text-amber-800">
                <UserCheck className="h-4 w-4" />
                Course assignments
              </div>
            </div>
            <div className="mt-3 p-2 bg-amber-100 rounded text-xs text-amber-800">
              <strong>Note:</strong> Business Admins cannot access user management, system
              permissions, or advanced analytics.
            </div>
          </CardContent>
        </Card>
      )}
      <div className="space-y-6">
        {permissions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Permissions Found</h3>
              <p className="text-gray-600 mb-4">
                No permissions are currently loaded from the database. This could mean:
              </p>
              <div className="text-left bg-gray-50 p-4 rounded-lg mb-4 text-sm">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>The permissions haven't been populated in your database yet</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>There's a database connection issue</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>The permissions table doesn't exist</span>
                  </li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-left">
                <h4 className="font-medium text-blue-900 mb-2">💡 To populate permissions:</h4>
                <ol className="space-y-1 text-blue-800">
                  <li>1. Open your Supabase SQL Editor</li>
                  <li>2. Run one of these SQL scripts from the SSH project:</li>
                  <li className="ml-4 font-mono text-xs bg-blue-100 p-2 rounded">
                    • add-missing-permissions-safe.sql (recommended)
                    <br />
                    • add-missing-permissions-with-created-by.sql
                    <br />• add-missing-permissions.sql
                  </li>
                  <li>3. Click the "Refresh" button above</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
            <Card key={resource}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {resourcePermissions[0].icon}
                  {resource
                    .split(' ')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ')}{' '}
                  Permissions
                </CardTitle>
                <CardDescription>
                  Manage {resource.toLowerCase()}-related permissions for the {selectedRole} role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resourcePermissions.map((permission) => {
                    const isChecked = currentPermissions.includes(permission.id)
                    const isMenuVisible = menuVisibility[selectedRole]?.[permission.id] ?? true
                    return (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-2 bg-gray-100 rounded-md">{permission.icon}</div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{permission.name}</div>
                            <div className="text-sm text-gray-500">{permission.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {/* Menu Visibility Toggle */}
                          {isChecked && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-md border">
                              <Menu className="h-4 w-4 text-gray-500" />
                              <span className="text-xs text-gray-600">Show in Menu</span>
                              <Switch
                                checked={isMenuVisible}
                                onCheckedChange={(visible: boolean) =>
                                  handleMenuVisibilityChange(permission.id, visible)
                                }
                                className="scale-75"
                              />
                              {isMenuVisible ? (
                                <Eye className="h-4 w-4 text-green-500" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                          )}
                          {/* Permission Toggle */}
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
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
