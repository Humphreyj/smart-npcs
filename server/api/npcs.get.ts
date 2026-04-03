import { npcs } from '../data/npcs'

export default defineEventHandler(() => {
  return npcs.map(({ id, name, role, description }) => ({
    id,
    name,
    role,
    description,
  }))
})
