import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import {
  ChartBarIcon,
  UserGroupIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  ClockIcon,
  MapPinIcon,
  LinkIcon,
  CalendarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

interface AnalyticsData {
  totalUsers: number
  activeUsers: number
  newUsers: number
  pageViews: number
  sessions: number
  bounceRate: number
  avgSessionDuration: string
  topPages: Array<{
    page: string
    views: number
    uniqueViews: number
    avgTime: string
  }>
  userLocations: Array<{
    country: string
    city: string
    users: number
    percentage: number
  }>
  referralSources: Array<{
    source: string
    users: number
    percentage: number
    type: 'direct' | 'search' | 'social' | 'referral'
  }>
  deviceTypes: Array<{
    device: string
    users: number
    percentage: number
  }>
  trafficTrends: Array<{
    date: string
    users: number
    sessions: number
    pageViews: number
  }>
  userEngagement: {
    returningUsers: number
    newUsers: number
    avgPagesPerSession: number
    conversionRate: number
  }
}

export default function SiteAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d')
  const [activeTab, setActiveTab] = useState<'overview' | 'traffic' | 'users' | 'content'>('overview')

  useEffect(() => {
    loadAnalyticsData()
  }, [dateRange])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock analytics data - in real app, this would come from Google Analytics API or similar
      const mockData: AnalyticsData = {
        totalUsers: 12847,
        activeUsers: 3421,
        newUsers: 1256,
        pageViews: 45632,
        sessions: 18934,
        bounceRate: 34.2,
        avgSessionDuration: '4m 32s',
        topPages: [
          { page: '/', views: 8934, uniqueViews: 6234, avgTime: '2m 15s' },
          { page: '/courses', views: 6543, uniqueViews: 4321, avgTime: '3m 45s' },
          { page: '/gurukuls', views: 4321, uniqueViews: 3456, avgTime: '2m 58s' },
          { page: '/about', views: 3456, uniqueViews: 2987, avgTime: '1m 42s' },
          { page: '/contact', views: 2345, uniqueViews: 1876, avgTime: '1m 23s' }
        ],
        userLocations: [
          { country: 'Ireland', city: 'Dublin', users: 4234, percentage: 32.9 },
          { country: 'India', city: 'Mumbai', users: 2876, percentage: 22.4 },
          { country: 'United Kingdom', city: 'London', users: 1987, percentage: 15.5 },
          { country: 'United States', city: 'New York', users: 1543, percentage: 12.0 },
          { country: 'India', city: 'Bangalore', users: 1234, percentage: 9.6 },
          { country: 'Canada', city: 'Toronto', users: 973, percentage: 7.6 }
        ],
        referralSources: [
          { source: 'Direct', users: 5432, percentage: 42.3, type: 'direct' },
          { source: 'Google Search', users: 3456, percentage: 26.9, type: 'search' },
          { source: 'Facebook', users: 1876, percentage: 14.6, type: 'social' },
          { source: 'YouTube', users: 987, percentage: 7.7, type: 'social' },
          { source: 'Twitter', users: 654, percentage: 5.1, type: 'social' },
          { source: 'Other Websites', users: 442, percentage: 3.4, type: 'referral' }
        ],
        deviceTypes: [
          { device: 'Desktop', users: 7234, percentage: 56.3 },
          { device: 'Mobile', users: 4321, percentage: 33.6 },
          { device: 'Tablet', users: 1292, percentage: 10.1 }
        ],
        trafficTrends: [
          { date: '2025-01-20', users: 1234, sessions: 1876, pageViews: 4532 },
          { date: '2025-01-21', users: 1456, sessions: 2134, pageViews: 5234 },
          { date: '2025-01-22', users: 1876, sessions: 2876, pageViews: 6543 },
          { date: '2025-01-23', users: 2134, sessions: 3234, pageViews: 7234 },
          { date: '2025-01-24', users: 1987, sessions: 2987, pageViews: 6876 },
          { date: '2025-01-25', users: 2345, sessions: 3456, pageViews: 7654 },
          { date: '2025-01-26', users: 2876, sessions: 4234, pageViews: 8934 }
        ],
        userEngagement: {
          returningUsers: 8234,
          newUsers: 4613,
          avgPagesPerSession: 2.4,
          conversionRate: 12.3
        }
      }
      
      setAnalyticsData(mockData)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'search': return '🔍'
      case 'social': return '📱'
      case 'referral': return '🔗'
      default: return '🌐'
    }
  }

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile': return DevicePhoneMobileIcon
      case 'desktop': return ComputerDesktopIcon
      default: return ComputerDesktopIcon
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const calculateGrowth = (current: number, previous: number) => {
    const growth = ((current - previous) / previous) * 100
    return {
      percentage: Math.abs(growth).toFixed(1),
      isPositive: growth > 0
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data available</h3>
        <p className="text-gray-600">Analytics data will appear here once tracking is set up.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Site Analytics</h2>
          <p className="text-gray-600">Comprehensive insights into your website performance</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <Button variant="outline" size="sm">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Custom Range
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: ChartBarIcon },
            { id: 'traffic', name: 'Traffic Sources', icon: LinkIcon },
            { id: 'users', name: 'User Insights', icon: UserGroupIcon },
            { id: 'content', name: 'Content Performance', icon: EyeIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(analyticsData.totalUsers)}</p>
                    <div className="flex items-center mt-2">
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">+12.5% from last period</span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <UserGroupIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(analyticsData.activeUsers)}</p>
                    <div className="flex items-center mt-2">
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">+8.2% from last period</span>
                    </div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <EyeIcon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Page Views</p>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(analyticsData.pageViews)}</p>
                    <div className="flex items-center mt-2">
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">+15.3% from last period</span>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <ChartBarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Bounce Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{analyticsData.bounceRate}%</p>
                    <div className="flex items-center mt-2">
                      <ArrowTrendingDownIcon className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">-2.1% from last period</span>
                    </div>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <ClockIcon className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Traffic Trends Chart */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Traffic Trends</h3>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between space-x-2">
                {analyticsData.trafficTrends.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-orange-500 to-orange-300 rounded-t-md transition-all duration-300 hover:from-orange-600 hover:to-orange-400"
                      style={{ height: `${(day.users / Math.max(...analyticsData.trafficTrends.map(d => d.users))) * 200}px` }}
                    />
                    <div className="mt-2 text-xs text-gray-600 text-center">
                      <div className="font-medium">{formatNumber(day.users)}</div>
                      <div>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.sessions)}</div>
                <div className="text-sm text-gray-600">Total Sessions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-gray-900">{analyticsData.avgSessionDuration}</div>
                <div className="text-sm text-gray-600">Avg Session Duration</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-gray-900">{analyticsData.userEngagement.avgPagesPerSession}</div>
                <div className="text-sm text-gray-600">Pages per Session</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-gray-900">{analyticsData.userEngagement.conversionRate}%</div>
                <div className="text-sm text-gray-600">Conversion Rate</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Traffic Sources Tab */}
      {activeTab === 'traffic' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Referral Sources */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center">
                  <LinkIcon className="h-5 w-5 mr-2" />
                  Traffic Sources
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.referralSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getSourceIcon(source.type)}</span>
                        <div>
                          <p className="font-medium text-gray-900">{source.source}</p>
                          <p className="text-sm text-gray-600">{source.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatNumber(source.users)}</p>
                        <p className="text-sm text-gray-600">{source.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Device Types */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center">
                  <ComputerDesktopIcon className="h-5 w-5 mr-2" />
                  Device Types
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.deviceTypes.map((device, index) => {
                    const IconComponent = getDeviceIcon(device.device)
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <IconComponent className="h-5 w-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">{device.device}</p>
                            <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-orange-500 h-2 rounded-full" 
                                style={{ width: `${device.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatNumber(device.users)}</p>
                          <p className="text-sm text-gray-600">{device.percentage}%</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User Engagement Stats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600">{formatNumber(analyticsData.userEngagement.newUsers)}</div>
                <div className="text-sm text-gray-600">New Users</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600">{formatNumber(analyticsData.userEngagement.returningUsers)}</div>
                <div className="text-sm text-gray-600">Returning Users</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-purple-600">{analyticsData.userEngagement.avgPagesPerSession}</div>
                <div className="text-sm text-gray-600">Pages per Session</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-orange-600">{analyticsData.userEngagement.conversionRate}%</div>
                <div className="text-sm text-gray-600">Conversion Rate</div>
              </CardContent>
            </Card>
          </div>

          {/* User Locations */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2" />
                User Locations
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.userLocations.map((location, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {location.country.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{location.city}, {location.country}</p>
                        <div className="w-48 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-orange-500 h-2 rounded-full" 
                            style={{ width: `${location.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatNumber(location.users)}</p>
                      <p className="text-sm text-gray-600">{location.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content Performance Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center">
                <EyeIcon className="h-5 w-5 mr-2" />
                Top Performing Pages
              </h3>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Page
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Page Views
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unique Views
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Time on Page
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.topPages.map((page, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {page.page === '/' ? 'Home Page' : page.page}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatNumber(page.views)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatNumber(page.uniqueViews)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{page.avgTime}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={index < 2 ? 'bg-green-100 text-green-800' : index < 4 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
                            {index < 2 ? 'Excellent' : index < 4 ? 'Good' : 'Average'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}