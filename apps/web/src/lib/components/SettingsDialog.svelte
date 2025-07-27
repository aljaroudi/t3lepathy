<script lang="ts">
	import { AlertTriangleIcon } from '@lucide/svelte'
	import { MODELS, PROVIDERS } from 'shared'
	import { apiKeys, systemPrompt, titleModel } from '../state.svelte'
	import { isValidApiKey } from '../validate'
	import * as Select from './ui/select/index'
	import Dialog from './Dialog.svelte'
	import ProviderLogo from '../icons/ProviderLogo.svelte'

	let { onClose }: { onClose: () => void } = $props()
	let noApiKeys = $derived(
		Object.values(apiKeys.value).every(v => v.trim() === '')
	)
</script>

<Dialog {onClose}>
	<button
		class="absolute top-2 right-2 cursor-pointer rounded bg-slate-100 px-2 py-1 text-xs text-slate-400 select-none dark:bg-slate-500 dark:text-slate-200"
		onclick={onClose}
	>
		ESC
	</button>
	<h2 class="mb-2 text-xl font-bold">Settings</h2>

	<!-- show warning message if no api keys -->
	{#if noApiKeys}
		<p
			class="flex items-center gap-1 rounded-lg bg-amber-50 p-2 text-sm text-amber-600"
		>
			<AlertTriangleIcon size="1em" />
			Please add API keys to continue
		</p>
	{/if}

	<!-- providers -->
	<div class="flex flex-col gap-2">
		<span class="text-sm text-gray-500">API keys</span>
		{#each PROVIDERS as provider}
			<div
				class="rounded-lg border-none p-2 aria-disabled:bg-rose-200 dark:bg-slate-100 dark:text-slate-800"
			>
				<label for={`apiKey-${provider}`} class="flex items-center gap-2">
					<ProviderLogo {provider} />
					<span class="text-sm font-light">{provider}</span>
				</label>
				<input
					type="text"
					id={`apiKey-${provider}`}
					placeholder={`${provider} API key`}
					class="w-full border-none bg-transparent p-0 outline-none focus:ring-0"
					aria-disabled={!isValidApiKey(provider, apiKeys.value[provider])}
					value={apiKeys.value[provider]}
					oninput={({ currentTarget: { value } }) => {
						apiKeys.value = { ...apiKeys.value, [provider]: value.trim() }
					}}
				/>
			</div>
		{/each}
	</div>
	<span class="text-sm text-gray-500">System prompt</span>
	<textarea
		name="systemPrompt"
		id="systemPrompt"
		class="w-full resize-none rounded-lg border-none p-2 dark:bg-slate-100 dark:text-slate-800"
		bind:value={systemPrompt.value}
		oninput={({ currentTarget: { value } }) => {
			systemPrompt.value = value.trimStart()
		}}
		placeholder="System prompt"
		autocomplete="off"
	></textarea>

	<div class="flex flex-col gap-2">
		<span class="text-sm text-gray-500">Title generation model</span>
		<Select.Root type="single" bind:value={titleModel.value}>
			<Select.Trigger>
				{MODELS.find(m => m.name === titleModel.value)?.title}
			</Select.Trigger>
			<Select.Content>
				{#each MODELS as model}
					<Select.Item value={model.name}>{model.title}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>
</Dialog>
