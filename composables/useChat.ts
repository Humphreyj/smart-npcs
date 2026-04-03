export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function useChat(npcId: string, campaignId: string) {
  const messages = ref<Message[]>([])
  const isStreaming = ref(false)
  const error = ref<string | null>(null)

  async function send(userText: string, playerId: string = 'player-default', mode: 'player' | 'dm' = 'player') {
    const trimmed = userText.trim()
    if (!trimmed || isStreaming.value) return

    error.value = null
    messages.value.push({ role: 'user', content: trimmed })
    isStreaming.value = true

    // Index of the NPC reply we're about to stream into
    const replyIndex = messages.value.length
    messages.value.push({ role: 'assistant', content: '' })

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npcId,
          campaignId,
          playerId,
          mode,
          // Send full history minus the empty placeholder
          messages: messages.value.slice(0, -1),
        }),
      })

      if (!response.ok || !response.body) {
        const text = await response.text().catch(() => `HTTP ${response.status}`)
        throw new Error(text)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const data = JSON.parse(line)
            if (data.message?.content) {
              const msg = messages.value[replyIndex]
              if (msg) msg.content += data.message.content
            }
          } catch {
            // incomplete chunk — will be picked up in next iteration
          }
        }
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Something went wrong'
      // Remove the empty placeholder on failure
      const reply = messages.value[replyIndex]
      if (reply !== undefined && reply.content === '') {
        messages.value.splice(replyIndex, 1)
      }
    } finally {
      isStreaming.value = false
    }
  }

  function clear() {
    messages.value = []
    error.value = null
  }

  return { messages, isStreaming, error, send, clear }
}
