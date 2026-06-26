
import React from 'react'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { StatCard } from '@/components/admin/sections/StatsCard'
import { ActivityTimeline, TimelineItem } from '@/components/admin/sections/ActivityTimeline'
import { Card, CardBody, CardHeader } from '@/components/admin/common/Card'
import { Button } from '@/components/admin/common/Button'
import {
  BarChartComponent,
  LineChartComponent,
  PieChartComponent,
} from '@/components/admin/charts/Charts'
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
} from 'lucide-react'

// Mock data for demonstration
const mockRevenuData = [
  { name: 'Jan', value: 2400 },
  { name: 'Feb', value: 1398 },
  { name: 'Mar', value: 9800 },
  { name: 'Apr', value: 3908 },
  { name: 'May', value: 4800 },
  { name: 'Jun', value: 3800 },
]

const mockMembersData = [
  { name: 'Week 1', value: 240 },
  { name: 'Week 2', value: 390 },
  { name: 'Week 3', value: 480 },
  { name: 'Week 4', value: 520 },
]

const mockStatusData = [
  { name: 'Active', value: 450 },
  { name: 'Inactive', value: 120 },
  { name: 'Pending', value: 80 },
]

const mockTimeline: TimelineItem[] = [
  {
    id: '1',
    type: 'success',
    title: 'New member registered',
    description: 'Sarah Johnson registered for annual membership',
    timestamp: new Date(Date.now() - 2 * 60000),
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: '2',
    type: 'success',
    title: 'Donation received',
    description: '€250 donation from Anonymous',
    timestamp: new Date(Date.now() - 15 * 60000),
    icon: <DollarSign className="w-4 h-4" />,
  },
  {
    id: '3',
    type: 'warning',
    title: 'Membership expiring',
    description: '5 memberships expire in the next 7 days',
    timestamp: new Date(Date.now() - 1 * 3600000),
    icon: <Activity className="w-4 h-4" />,
  },
  {
    id: '4',
    type: 'info',
    title: 'New blog post published',
    description: '"Understanding Yoga Philosophy" has been published',
    timestamp: new Date(Date.now() - 5 * 3600000),
    icon: <TrendingUp className="w-4 h-4" />,
  },
]

export default function AdminDashboard() {
  const handleQuickAction = (action: string) => {
    console.log('Quick action:', action)
  }

  return (
    <AdminLayout
      title="Dashboard"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Dashboard' },
      ]}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Members"
          value="650"
          change={{ value: 12, direction: 'up' }}
          icon={<Users className="w-6 h-6" />}
          color="primary"
          trend={{ value: 45, label: 'Active this month' }}
        />
        <StatCard
          title="Monthly Revenue"
          value="€4,250"
          change={{ value: 8, direction: 'up' }}
          icon={<DollarSign className="w-6 h-6" />}
          color="success"
          trend={{ value: '€1,425', label: 'from donations' }}
        />
        <StatCard
          title="Total Donations"
          value="€12,845"
          change={{ value: 15, direction: 'up' }}
          icon={<TrendingUp className="w-6 h-6" />}
          color="warning"
          trend={{ value: 28, label: 'donors this month' }}
        />
        <StatCard
          title="Activities"
          value="142"
          change={{ value: 5, direction: 'down' }}
          icon={<Activity className="w-6 h-6" />}
          color="info"
          trend={{ value: 24, label: 'new this week' }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-neutral-900">Revenue Trend</h3>
            <p className="text-sm text-neutral-600 mt-1">Last 6 months</p>
          </CardHeader>
          <CardBody>
            <BarChartComponent data={mockRevenuData} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-neutral-900">
              New Members Trend
            </h3>
            <p className="text-sm text-neutral-600 mt-1">Last 4 weeks</p>
          </CardHeader>
          <CardBody>
            <LineChartComponent data={mockMembersData} />
          </CardBody>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member Status Distribution */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-neutral-900">
              Member Status
            </h3>
          </CardHeader>
          <CardBody>
            <PieChartComponent
              data={mockStatusData}
              colors={['#10b981', '#ef4444', '#f59e0b']}
            />
          </CardBody>
        </Card>

        {/* Activity Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-semibold text-neutral-900">
              Recent Activity
            </h3>
          </CardHeader>
          <CardBody>
            <ActivityTimeline items={mockTimeline} maxItems={4} />
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-900">Quick Actions</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => handleQuickAction('new-member')}
              variant="outline"
              fullWidth
            >
              Add Member
            </Button>
            <Button
              onClick={() => handleQuickAction('new-donation')}
              variant="outline"
              fullWidth
            >
              Record Donation
            </Button>
            <Button
              onClick={() => handleQuickAction('send-email')}
              variant="outline"
              fullWidth
            >
              Send Email
            </Button>
            <Button
              onClick={() => handleQuickAction('view-reports')}
              variant="outline"
              fullWidth
            >
              View Reports
            </Button>
          </div>
        </CardBody>
      </Card>
    </AdminLayout>
  )
}
