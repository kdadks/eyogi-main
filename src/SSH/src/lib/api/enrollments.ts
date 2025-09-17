import * as localEnrollments from '../local-data/enrollments'
import { Enrollment } from '../../types'

export async function enrollInCourse(courseId: string, studentId: string): Promise<Enrollment> {
  return await localEnrollments.enrollInCourse(courseId, studentId)
}

export async function getStudentEnrollments(studentId: string): Promise<Enrollment[]> {
  return await localEnrollments.getStudentEnrollments(studentId)
}

export async function getTeacherEnrollments(teacherId: string): Promise<Enrollment[]> {
  return await localEnrollments.getTeacherEnrollments(teacherId)
}

export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: Enrollment['status'],
  additionalData?: Partial<Enrollment>,
): Promise<Enrollment> {
  return await localEnrollments.updateEnrollmentStatus(enrollmentId, status, additionalData)
}

export async function bulkUpdateEnrollments(
  enrollmentIds: string[],
  status: Enrollment['status'],
): Promise<Enrollment[]> {
  return await localEnrollments.bulkUpdateEnrollments(enrollmentIds, status)
}

export async function getEnrollmentStats(): Promise<{
  total: number
  pending: number
  approved: number
  completed: number
}> {
  return await localEnrollments.getEnrollmentStats()
}

export async function getAllEnrollments(): Promise<Enrollment[]> {
  return await localEnrollments.getAllEnrollments()
}
