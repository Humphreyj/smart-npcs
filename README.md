# Smart NPCs

A Nuxt 3 web app for Dungeon Masters to chat with AI-powered NPCs that have persistent memory. Built with Vue 3, TypeScript, Tailwind CSS, and Ollama for local LLM inference.

## Getting Started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

> **Prerequisites:** [Ollama](https://ollama.com) must be running locally with `dolphin-mistral` pulled.
> ```bash
> ollama serve &
> ollama pull dolphin-mistral
> ```

## Project Structure

```
smart-npcs/
├── app.vue                              # Root layout — AppNavbar on every page
├── nuxt.config.ts                       # Nuxt config, Tailwind, Google Fonts (Cinzel)
│
├── pages/
│   ├── index.vue                        # Campaign selection screen
│   ├── campaign/[id].vue                # Campaign overview + location list
│   ├── location/[id].vue                # Location detail + NPC list
│   └── chat/[npc].vue                   # Chat interface for a specific NPC
│
├── components/
│   ├── AppNavbar.vue                    # Top navbar — logo + static DM account section
│   ├── NPCCard.vue                      # NPC card (name, role, description)
│   └── ChatMessage.vue                  # Single chat message bubble
│
├── composables/
│   └── useChat.ts                       # Chat state, message history, send + stream logic
│
└── server/
    ├── data/
    │   └── campaigns/
    │       └── lost-crown.json          # Sample campaign (The Lost Crown)
    └── api/
        ├── campaigns/
        │   ├── index.get.ts             # GET /api/campaigns — list all campaigns
        │   └── [id].get.ts              # GET /api/campaigns/[id] — full campaign data
        ├── locations/
        │   └── [id].get.ts             # GET /api/locations/[id] — location + npcs
        ├── npcs/
        │   └── [id].get.ts             # GET /api/npcs/[id] — NPC + location context
        ├── memory/
        │   └── update.post.ts          # POST /api/memory/update — summarize + save memory
        └── chat.post.ts                # POST /api/chat — stream Ollama response
```

## How It Works

1. **Campaign data** lives in `server/data/campaigns/*.json` — nested Campaign → Location → NPC structure
2. **Homepage** lists available campaigns, clicking one shows its locations
3. **Location page** shows sub-locations and NPCs at that location
4. **Chat page** loads the NPC's full profile, location context, campaign world rules, and any existing memory for the current player — all injected into the system prompt
5. **Ollama** (`dolphin-mistral`) streams the NPC's response
6. **End Session** button triggers a memory summarizer — Ollama extracts key facts from the conversation and writes them back to the campaign JSON so the NPC remembers next time

## Data Structure

Campaign JSON files follow a nested structure:
```
Campaign → Locations → Sub-locations → NPCs
```
Each NPC has a `memory` object keyed by player ID. After each session, the summarizer populates it with relationship status, key facts, and a session summary.

See `Homietron/DnD/Data Structure.md` in Obsidian for full schema documentation.

## Obsidian Integration

Obsidian (`Homietron/DnD/`) is used as a **design and brainstorming tool** — not as a data source for the app. Use it to:
- Sketch out NPC personalities and backstories
- Plan campaign lore, factions, and locations
- Document architecture decisions and roadmap

When ready, translate Obsidian notes into the campaign JSON format.

The original bash prototype scripts (`chat-with.sh`, `dnd-chat.sh`) still work against Obsidian markdown files for quick local testing without the web app.

## Current Status

- ✅ Nuxt 3 scaffold with TypeScript + Tailwind
- ✅ Dark fantasy aesthetic (Cinzel font, dark bg, gold accents)
- ✅ Navbar with static account section
- ✅ Campaign → Location → NPC navigation flow
- ✅ Ollama streaming chat (dolphin-mistral)
- ✅ Full system prompt (NPC profile + location + campaign world rules)
- ✅ NPC memory — manual End Session trigger, Ollama summarizer, persisted to JSON
- ✅ Sample campaign: The Lost Crown (2 locations, 3 NPCs)
- 🔲 Campaign editor UI (create/edit campaigns, locations, NPCs in the browser)
- 🔲 Multiple player support (player selection / player profiles)
- 🔲 Party view (DM sees all NPCs and their memory across the campaign)
- 🔲 User accounts + auth
- 🔲 Cloud hosting / deployed environment (see Infrastructure & Hosting notes)
- 🔲 Billing / subscription

## Roadmap (Priority Order)

### Near Term
1. **Player selection** — let the DM pick which player is speaking before a chat
2. **Campaign editor** — create/edit campaigns, locations, NPCs in the browser instead of editing JSON
3. **Party view** — DM dashboard showing all NPCs and memory summaries across a campaign

### Medium Term
4. **User accounts** — auth so multiple DMs can have their own campaigns
5. **Cloud deployment** — move from local Ollama to hosted inference (Together.ai → RunPod)

### Long Term
6. **Billing** — subscription model, usage-based pricing
7. **NSFW mode** — same architecture, adult content variant (separate product/domain)

## Tech Stack

- [Nuxt 3](https://nuxt.com)
- [Vue 3](https://vuejs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Ollama](https://ollama.com) — local LLM inference
- [dolphin-mistral](https://ollama.com/library/dolphin-mistral) — uncensored Mistral model
