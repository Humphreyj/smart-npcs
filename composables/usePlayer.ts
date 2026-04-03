// TODO: Auth migration — replace localStorage player selection with session user.id
// When auth is added, this composable becomes a thin wrapper around useAuth().user.id
// The memory API and campaign JSON structure require no changes

export interface ActivePlayer {
  id: string
  name: string
}

export function usePlayer(campaignId: string) {
  const storageKey = `smartnpcs_player_${campaignId}`

  const activePlayer = ref<ActivePlayer | null>(null)

  if (import.meta.client) {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      try {
        activePlayer.value = JSON.parse(stored)
      } catch {
        // ignore malformed stored value
      }
    }
  }

  function setPlayer(id: string, name: string) {
    activePlayer.value = { id, name }
    if (import.meta.client) {
      localStorage.setItem(storageKey, JSON.stringify({ id, name }))
    }
  }

  function clearPlayer() {
    activePlayer.value = null
    if (import.meta.client) {
      localStorage.removeItem(storageKey)
    }
  }

  return { activePlayer, setPlayer, clearPlayer }
}
