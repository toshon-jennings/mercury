import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { HERMES_HOME } from './installer'

const MODELS_FILE = join(HERMES_HOME, 'models.json')

export interface SavedModel {
  id: string
  name: string
  provider: string
  model: string
  baseUrl: string
  createdAt: number
}

function readModels(): SavedModel[] {
  try {
    if (!existsSync(MODELS_FILE)) return []
    return JSON.parse(readFileSync(MODELS_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function writeModels(models: SavedModel[]): void {
  writeFileSync(MODELS_FILE, JSON.stringify(models, null, 2), 'utf-8')
}

export function listModels(): SavedModel[] {
  return readModels()
}

export function addModel(
  name: string,
  provider: string,
  model: string,
  baseUrl: string
): SavedModel {
  const models = readModels()

  // Dedup: if same model ID + provider exists, return existing
  const existing = models.find((m) => m.model === model && m.provider === provider)
  if (existing) return existing

  const entry: SavedModel = {
    id: randomUUID(),
    name,
    provider,
    model,
    baseUrl: baseUrl || '',
    createdAt: Date.now()
  }
  models.push(entry)
  writeModels(models)
  return entry
}

export function removeModel(id: string): boolean {
  const models = readModels()
  const filtered = models.filter((m) => m.id !== id)
  if (filtered.length === models.length) return false
  writeModels(filtered)
  return true
}

export function updateModel(
  id: string,
  fields: Partial<Pick<SavedModel, 'name' | 'provider' | 'model' | 'baseUrl'>>
): boolean {
  const models = readModels()
  const idx = models.findIndex((m) => m.id === id)
  if (idx === -1) return false
  models[idx] = { ...models[idx], ...fields }
  writeModels(models)
  return true
}
