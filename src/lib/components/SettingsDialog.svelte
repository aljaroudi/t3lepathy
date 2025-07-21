<script lang="ts">
	import { AlertTriangleIcon } from '@lucide/svelte'
	import { MODELS, PROVIDERS } from '../ai'
	import { apiKeys, systemPrompt, titleModel } from '../db.svelte'
	import { isValidApiKey } from '../validate'
	import * as Select from './ui/select/index'

	let { onClose }: { onClose: () => void } = $props()
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs"
	onclick={onClose}
>
	<div
		class="relative flex flex-col gap-2 rounded-xl bg-white/80 p-6 shadow-lg dark:bg-slate-800/80 dark:text-slate-200"
		style="width: 100%; min-width: 300px; max-width: 400px"
		onclick={e => e.stopPropagation()}
	>
		<button
			class="absolute top-2 right-2 cursor-pointer rounded bg-slate-100 px-2 py-1 text-xs text-slate-400 select-none dark:bg-slate-500 dark:text-slate-200"
			onclick={onClose}
		>
			ESC
		</button>
		<h2 class="mb-2 text-xl font-bold">Settings</h2>

		<!-- show warning message if no api keys -->
		{#if apiKeys.isEmpty}
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
				<div class="grid grid-cols-4 items-center gap-2">
					<label for={`apiKey-${provider}`}>{provider}</label>
					<input
						type="text"
						name={`apiKey-${provider}`}
						id={`apiKey-${provider}`}
						placeholder={`${provider} API key`}
						class="col-span-3 rounded-lg border-none p-2 aria-disabled:bg-rose-200 dark:bg-slate-100 dark:text-slate-800"
						aria-disabled={!isValidApiKey(provider, apiKeys.value[provider])}
						value={apiKeys.value[provider] || ''}
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
	</div>
</div>
