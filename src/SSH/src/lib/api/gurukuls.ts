import * as localGurukuls from '@/lib/local-data/gurukuls'
import { Gurukul } from '@/types'

export async function getGurukuls(): Promise<Gurukul[]> {
  return await localGurukuls.getGurukuls()
}

export async function getGurukul(slug: string): Promise<Gurukul | null> {
  return await localGurukuls.getGurukul(slug)
}

export async function createGurukul(gurukul: Omit<Gurukul, 'id' | 'created_at' | 'updated_at'>): Promise<Gurukul> {
  return await localGurukuls.createGurukul(gurukul)
}

export async function updateGurukul(id: string, updates: Partial<Gurukul>): Promise<Gurukul> {
  return await localGurukuls.updateGurukul(id, updates)
}

export async function deleteGurukul(id: string): Promise<void> {
  return await localGurukuls.deleteGurukul(id)
}