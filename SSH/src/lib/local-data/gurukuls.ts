import { Gurukul } from '../../types'
const STORAGE_KEY = 'eyogi_gurukuls'
export async function getGurukuls(): Promise<Gurukul[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 150))
  const gurukuls = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  return gurukuls.filter((g: Gurukul) => g.is_active)
}
export async function getGurukul(slug: string): Promise<Gurukul | null> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100))
  const gurukuls = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  return gurukuls.find((g: Gurukul) => g.slug === slug && g.is_active) || null
}
export async function createGurukul(
  gurukul: Omit<Gurukul, 'id' | 'created_at' | 'updated_at'>,
): Promise<Gurukul> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))
  const gurukuls = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  const newGurukul: Gurukul = {
    ...gurukul,
    id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  gurukuls.push(newGurukul)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gurukuls))
  return newGurukul
}
export async function updateGurukul(id: string, updates: Partial<Gurukul>): Promise<Gurukul> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))
  const gurukuls = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  const gurukulIndex = gurukuls.findIndex((g: Gurukul) => g.id === id)
  if (gurukulIndex === -1) {
    throw new Error('Gurukul not found')
  }
  const updatedGurukul = {
    ...gurukuls[gurukulIndex],
    ...updates,
    updated_at: new Date().toISOString(),
  }
  gurukuls[gurukulIndex] = updatedGurukul
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gurukuls))
  return updatedGurukul
}
export async function deleteGurukul(id: string): Promise<void> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200))
  const gurukuls = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  const gurukulIndex = gurukuls.findIndex((g: Gurukul) => g.id === id)
  if (gurukulIndex !== -1) {
    gurukuls[gurukulIndex].is_active = false
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gurukuls))
  }
}
