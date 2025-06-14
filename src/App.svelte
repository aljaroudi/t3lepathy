<script lang="ts">
  import { marked } from "marked"
  import { MODELS, PROVIDERS } from "./lib/ai"
  import {
    addMessage,
    createChat,
    state as db,
    deleteApiKey,
    initDB,
    setApiKey,
    setCurrentChat,
  } from "./lib/db.svelte"
  import type { Model, Provider } from "./lib/types"
  import Trash from "./lib/icons/Trash.svelte"
  import Plus from "./lib/icons/Plus.svelte"
  import Gear from "./lib/icons/Gear.svelte"

  initDB()

  // TODO: allow user to select model
  let currentModel = $state<Model["name"]>("gemini-1.5-flash")

  let showDialog = $state(false)

  async function sendMessage(message: string) {
    if (!db.currentChatId) return alert("No chat selected")

    const model = MODELS.find((m) => m.name === currentModel)
    if (!model) return alert("Invalid model")
    const apiKey = db.apiKeys[model.provider]
    if (!apiKey) return alert("No API key found for this model")
    // User
    addMessage(
      {
        id: crypto.randomUUID(),
        chatId: db.currentChatId,
        content: message,
        role: "user",
        date: new Date(),
      },
      model,
      apiKey
    )
  }
</script>

<main class="grid h-dvh w-full" style="grid-template-columns: 200px 1fr">
  <aside class="border-r border-gray-200 bg-gray-100 p-4 flex flex-col gap-2">
    <h1 class="text-2xl font-bold">T3lepathy</h1>
    <button
      class="rounded-xl border p-2 bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
      onclick={() => createChat("New chat")}
    >
      +
    </button>
    <div class="flex flex-col gap-2 overflow-y-auto">
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
    <button
      class="rounded-xl p-2 cursor-pointer mt-auto w-fit bg-gray-200 hover:bg-gray-300 shadow-xs"
      aria-label="Settings"
      title="Settings"
      aria-pressed={showDialog}
      style="border-radius: 50%"
      aria-busy={Object.keys(db.apiKeys).length === 0}
      onclick={() => (showDialog = true)}
    >
      <Gear />
    </button>
  </aside>
  <section
    class="flex flex-col gap-2 px-4 py-2 mx-auto"
    style="max-width: 80ch"
  >
    {#each db.messages as message}
      <div
        class="rounded-xl p-2 bg-gray-100 odd:bg-blue-500 odd:text-white odd:ml-auto odd:max-w-[80%]"
      >
        <p>{@html marked(message.content)}</p>
      </div>
    {/each}
    <form
      class="mt-auto flex gap-2"
      onsubmit={(e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const message = formData.get("message") as string
        sendMessage(message.trim())
        const messageInput = e.currentTarget.querySelector("input")
        if (messageInput) messageInput.value = ""
      }}
    >
      <select name="model" id="model" required bind:value={currentModel}>
        {#each PROVIDERS as provider}
          {@const keyIsSet = db.apiKeys[provider]?.length}
          <optgroup label={keyIsSet ? provider : `${provider} (no key)`}>
            {#each MODELS.filter((model) => model.provider === provider) as model}
              <option value={model.name} disabled={!keyIsSet}>
                {model.title}
              </option>
            {/each}
          </optgroup>
        {/each}
      </select>
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

{#if showDialog}
  <div
    class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-xs"
  >
    <div class="bg-white rounded-xl shadow-lg p-6 min-w-[300px] relative">
      <button
        class="absolute top-2 right-2 text-gray-500 hover:text-black"
        onclick={() => (showDialog = false)}
        >&times;
      </button>
      <h2 class="text-xl font-bold mb-2">Settings</h2>
      <p>This is a simple dialog popup. You can put any content here.</p>
      <form
        class="grid gap-2 bg-gray-100 p-2 rounded-xl border border-gray-200 shadow-xs items-center"
        style="grid-template-columns: 20ch 2fr 1fr"
        onsubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          const provider = formData.get("provider") as Provider
          const apiKey = formData.get("apiKey") as string
          if (!apiKey) return alert("Please enter an API key")
          if (!PROVIDERS.includes(provider)) return alert("Invalid provider")
          setApiKey(provider, apiKey)
        }}
      >
        <!-- provider selection -->
        <select
          name="provider"
          id="provider"
          required
          class="rounded-xl border p-2 bg-white border-gray-200 overflow-hidden w-fit"
        >
          {#each PROVIDERS as provider}
            <option value={provider}>{provider}</option>
          {/each}
        </select>

        <!-- api key input -->
        <input
          type="text"
          name="apiKey"
          id="apiKey"
          required
          class="flex-1 rounded bg-white"
          placeholder="Enter your API key"
        />

        <!-- save button -->
        <button
          type="submit"
          class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 w-fit ml-auto"
        >
          <Plus />
        </button>
      </form>
      <!-- saved keys -->
      <div class="flex flex-col gap-2 my-4">
        {#if Object.keys(db.apiKeys).length > 0}
          {#each Object.entries(db.apiKeys) as [provider, key]}
            <div
              class="grid gap-2 items-center p-2 rounded-xl border border-gray-200 bg-gray-50"
              style="grid-template-columns: 20ch 2fr 1fr"
            >
              <label for={`apiKey-${provider}`}>{provider}</label>
              <p class="text-gray-500 text-sm">{key.slice(0, 20)}</p>
              <button
                class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 cursor-pointer w-fit ml-auto"
                onclick={() => deleteApiKey(provider as Provider)}
              >
                <Trash />
              </button>
            </div>
          {/each}
        {:else}
          <p class="p-4 text-gray-500 text-center">
            No API keys saved. Please enter your API keys below.
          </p>
        {/if}
      </div>
    </div>
  </div>
{/if}
