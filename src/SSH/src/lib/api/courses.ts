import * as localCourses from '../local-data/courses'
import { Course } from '../../types'

export async function getCourses(filters?: {
  gurukul_id?: string
  level?: string
  age_group?: number
  search?: string
}): Promise<Course[]> {
  return await localCourses.getCourses(filters)
}

export async function getCourse(id: string): Promise<Course | null> {
  return await localCourses.getCourse(id)
}

export async function getEnrolledCount(courseId: string): Promise<number> {
  return await localCourses.getEnrolledCount(courseId)
}

export async function createCourse(
  course: Omit<Course, 'id' | 'created_at' | 'updated_at'>,
): Promise<Course> {
  return await localCourses.createCourse(course)
}

export async function updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
  return await localCourses.updateCourse(id, updates)
}

export async function deleteCourse(id: string): Promise<void> {
  return await localCourses.deleteCourse(id)
}

export async function getTeacherCourses(teacherId: string): Promise<Course[]> {
  return await localCourses.getTeacherCourses(teacherId)
}
