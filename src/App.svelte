<script lang="ts">
	import 'highlight.js/styles/atom-one-dark.min.css'
	import { getFileTypes, MODELS, PROVIDERS } from './lib/ai'
	import { state as db, persistedState } from './lib/db.svelte'
	import type { Model, ResponseLength } from './lib/types'
	import Panel from './lib/icons/Panel.svelte'
	import { convertFileToBase64 } from './lib/storage'
	import Sidebar from './lib/components/Sidebar.svelte'
	import Arrow from './lib/icons/Arrow.svelte'
	import * as Select from './lib/components/ui/select/index'
	import '@fontsource-variable/ibm-plex-sans'
	import { PaperclipIcon, PlusIcon, SearchIcon } from '@lucide/svelte'
	import Bubble from './lib/components/Bubble.svelte'
	import LengthIcon from './lib/components/LengthIcon.svelte'
	import SettingsDialog from './lib/components/SettingsDialog.svelte'
	import SearchDialog from './lib/components/SearchDialog.svelte'
	import ActionButton from './lib/components/ActionButton.svelte'

	void db.init()

	let showDialog = $state(false)
	let showSidebar = $state(true)
	let showSearch = $state(false)
	let searchQuery = $state('')
	let grounding = $state(false)
	let loading = $state<string | null>(null)
	let responseLength = persistedState<ResponseLength>(
		'responseLength',
		'medium'
	)
	let currentModelId = persistedState<Model['name']>(
		'currentModel',
		'gemini-2.0-flash-lite'
	)
	let textInput = persistedState<string>('textInput', '')
	const currentModel = $derived(
		MODELS.find(m => m.name === currentModelId.value)!
	)

	async function sendMessage(message: string, files: File[]) {
		const chatId = db.currentChatId || (await db.addChat('New chat'))

		const apiKey = db.apiKeys[currentModel.provider]
		if (!apiKey) return alert('No API key found for this model')
		// User
		const msgId = crypto.randomUUID()
		loading = msgId
		await db
			.addMessage(
				{
					id: msgId,
					chatId,
					content: [
						{ type: 'text' as const, text: message },
						...(await Promise.all(files.map(convertFileToBase64))),
					],
					role: 'user',
					date: new Date(),
				},
				currentModel,
				responseLength.value,
				grounding
			)
			.catch(() => alert('Error sending message'))
			.finally(() => (loading = null))
	}

	function jumpToTextInput() {
		document.getElementById('message')?.focus()
	}

	function getRandomPlaceholder() {
		const PLACEHOLDERS = [
			"What's on your mind?",
			'What do you want to know?',
			'How may I help you?',
			'What can I do for you?',
		]
		return PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]
	}
</script>

<main
	class="grid h-dvh w-full transition-all duration-300 ease-in-out dark:bg-slate-800 dark:text-slate-100"
	data-sidebar={showSidebar}
	style="grid-template-columns: var(--sidebar-width) 1fr"
>
	{#if showSidebar}
		<Sidebar
			onClose={() => (showSidebar = false)}
			onCreateChat={() => {
				if (db.messages.length) db.addChat('New chat')
				jumpToTextInput()
			}}
			onSelectChat={chatId => db.setCurrentChat(chatId)}
			{showDialog}
			onShowDialog={() => (showDialog = true)}
		/>
	{:else}
		<div
			class="mx-3 my-4 flex h-fit w-fit items-center gap-2 rounded-lg bg-slate-200/50 p-1 backdrop-blur-sm"
			style="z-index: 10"
		>
			<button
				class="flex size-10 cursor-pointer items-center justify-center rounded-lg p-2 transition-all duration-300 ease-in-out hover:bg-slate-200"
				style="transform: rotate(180deg)"
				onclick={() => (showSidebar = true)}
			>
				<Panel />
			</button>
			<button
				class="flex size-10 cursor-pointer items-center justify-center rounded-lg p-2 transition-all duration-300 ease-in-out hover:bg-slate-200"
				onclick={() => db.addChat('New chat')}
			>
				<PlusIcon size="1em" />
			</button>
		</div>
	{/if}
	<section class="relative flex h-dvh w-full flex-col gap-2 px-4">
		<div
			class="overflow-y-auto"
			style="scroll-padding-bottom: 120px; padding-bottom: calc(120px + 1rem);"
		>
			<div
				class="mx-auto flex w-full flex-1 flex-col gap-4"
				style="width: var(--content-width)"
			>
				{#each db.messages as message}
					<Bubble {message} loading={loading === message.id} />
				{/each}
			</div>
		</div>
		<!-- Floating input form -->
		<form
			class="absolute right-2 bottom-0 left-2 z-20 mx-auto flex w-full flex-col gap-2 rounded-t-xl border border-b-0 border-slate-200 bg-white/80 p-2 shadow-xs backdrop-blur-xs dark:border-slate-200/20 dark:bg-slate-800/80"
			style="height: 120px; width: calc(var(--content-width) + 1rem)"
			onsubmit={e => {
				e.preventDefault()
				const formData = new FormData(e.currentTarget)
				const message = formData.get('message') as string
				const files = formData
					.getAll('file')
					.filter(f => f instanceof File && f.name !== '') as File[]
				if (!message.trim()) return
				sendMessage(message.trim(), files)
				textInput.value = ''
				const fileInput = document.getElementById('file') as HTMLInputElement
				fileInput.value = ''
			}}
		>
			<textarea
				id="message"
				name="message"
				class="resize-none border-none bg-transparent p-2 outline-none focus:ring-0 dark:text-slate-200"
				placeholder={getRandomPlaceholder()}
				minLength={1}
				required
				autocomplete="off"
				spellcheck="false"
				bind:value={textInput.value}
				oninput={({ currentTarget: { value } }) =>
					(textInput.value = value.trimStart())}
			></textarea>
			<div class="flex gap-2 px-2 py-1">
				<Select.Root type="single" required bind:value={currentModelId.value}>
					<Select.Trigger
						class="cursor-pointer border-none shadow-none hover:bg-cyan-100 dark:bg-transparent dark:hover:bg-cyan-900"
					>
						{currentModel.title}
					</Select.Trigger>
					<Select.Content>
						{#each PROVIDERS as provider}
							{@const keyIsSet = db.apiKeys[provider]?.length}
							<Select.Group>
								<Select.Label class="text-base">{provider}</Select.Label>
								{#each MODELS.filter(model => model.provider === provider) as model}
									<Select.Item value={model.name} disabled={!keyIsSet}>
										<div class="flex flex-col gap-2 pl-2">
											<span>{model.title}</span>
											<span class="text-xs text-gray-500">
												{model.description}
											</span>
										</div>
									</Select.Item>
								{/each}
							</Select.Group>
						{/each}
					</Select.Content>
				</Select.Root>

				<Select.Root type="single" bind:value={responseLength.value}>
					<Select.Trigger
						class="cursor-pointer border-none capitalize shadow-none hover:bg-cyan-100 dark:bg-transparent dark:hover:bg-cyan-900"
					>
						<LengthIcon length={responseLength.value} />
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="short">
							<div class="flex flex-col gap-2">
								<span>Short</span>
								<span class="text-xs text-gray-500">Up to 3 sentences</span>
							</div>
						</Select.Item>
						<Select.Item value="medium">
							<div class="flex flex-col gap-2">
								<span>Medium</span>
								<span class="text-xs text-gray-500">Up to 5 sentences</span>
							</div>
						</Select.Item>
						<Select.Item value="open">
							<div class="flex flex-col gap-2">
								<span>Open</span>
								<span class="text-xs text-gray-500">Unlimited response</span>
							</div>
						</Select.Item>
					</Select.Content>
				</Select.Root>

				<button
					type="button"
					class="size-9 cursor-pointer rounded-lg hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:bg-cyan-100 dark:hover:bg-cyan-900 dark:hover:text-white dark:aria-pressed:bg-cyan-900"
					onclick={() => document.getElementById('file')?.click()}
					disabled={getFileTypes(currentModel).length === 0}
					title="Attach files"
				>
					<PaperclipIcon size={16} class="mx-auto" />
				</button>
				<button
					type="button"
					class="size-9 cursor-pointer rounded-lg hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:bg-cyan-100 dark:hover:bg-cyan-900 dark:hover:text-white dark:aria-pressed:bg-cyan-900"
					onclick={() => (grounding = !grounding)}
					aria-pressed={grounding}
					title="Toggle search grounding"
				>
					<SearchIcon size={16} class="mx-auto" />
				</button>
				<input
					type="file"
					name="file"
					id="file"
					class="hidden"
					multiple
					accept={getFileTypes(currentModel)}
				/>
				<ActionButton
					id="submit"
					type="submit"
					disabled={!textInput.value.trim().length}
				>
					<Arrow />
				</ActionButton>
			</div>
		</form>
	</section>
</main>

{#if showDialog}
	<SettingsDialog {showDialog} />
{:else if showSearch}
	<SearchDialog {showSearch} {searchQuery} />
{/if}

<svelte:window
	onkeydown={e => {
		if (e.key === 'Escape') {
			showDialog = showSearch = false
		} else if (e.key === 'Enter' && e.metaKey) {
			document.getElementById('submit')?.click()
		} else if (e.key === 'b' && e.metaKey) {
			showSidebar = !showSidebar
		} else if (e.key === 'k' && e.metaKey) {
			showSearch = !showSearch
		} else if (e.key === ',' && e.metaKey && e.shiftKey) {
			showDialog = !showDialog
		}
	}}
/>
