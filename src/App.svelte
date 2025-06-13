<script lang="ts">
  import { MODELS } from "./lib/ai"
  import {
    addMessage,
    createChat,
    state as db,
    getChats,
    setCurrentChat,
  } from "./lib/db.svelte"

  getChats()

  // TODO: allow user to select model
  const currentModel = MODELS.find((m) => m.provider === "Google")!
  // TODO: allow user to input api keys for each provider
  const apiKey = ""

  async function sendMessage(message: string) {
    if (!db.currentChatId) return alert("No chat selected")
    // User
    addMessage(
      {
        id: crypto.randomUUID(),
        chatId: db.currentChatId,
        content: message,
        role: "user",
        date: new Date(),
      },
      currentModel,
      apiKey
    )
  }
</script>

<main class="grid h-dvh w-full" style="grid-template-columns: 200px 1fr">
  <aside class="border-r border-gray-200 bg-gray-100 p-4">
    <h1 class="text-2xl font-bold">T3lepathy</h1>
    <div class="flex flex-col gap-2">
      <button
        class="rounded-xl border p-2 bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
        onclick={() => createChat("New chat")}
      >
        +
      </button>
      {#each db.chats as chat}
        <button
          class="flex rounded-xl border-2 p-2 aria-pressed:border-blue-500"
          aria-pressed={db.currentChatId === chat.id}
          onclick={() => setCurrentChat(chat.id)}
        >
          {chat.title}
        </button>
      {/each}
    </div>
  </aside>
  <section class="flex flex-col gap-2 p-2">
    {#each db.messages as message}
      <div class="rounded-xl border p-2">
        <p>{message.content}</p>
      </div>
    {/each}
    <form
      class="mt-auto flex gap-2"
      onsubmit={(e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const message = formData.get("message") as string
        sendMessage(message.trim())
        e.currentTarget.reset()
      }}
    >
      <input
        name="message"
        type="text"
        class="flex-1 rounded-xl border p-2"
        placeholder="Type your message..."
        minLength={1}
        required
      />
      <button type="submit" class="rounded-xl border p-2"> Send </button>
    </form>
  </section>
</main>
