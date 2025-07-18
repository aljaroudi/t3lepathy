<script lang="ts">
	import { MODELS, PROVIDERS } from '../ai'
	import { state as db, systemPrompt, titleModel } from '../db.svelte'
	import { isValidApiKey } from '../validate'
	import * as Select from './ui/select/index'

	let { showDialog = $bindable(false) }: { showDialog: boolean } = $props()
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs"
>
	<div
		class="relative flex min-w-[300px] flex-col gap-2 rounded-xl bg-white/80 p-6 shadow-lg dark:bg-slate-800/80 dark:text-slate-200"
	>
		<button
			class="absolute top-2 right-2 text-gray-500 hover:text-black"
			onclick={() => (showDialog = false)}
		>
			&times;
		</button>
		<h2 class="mb-2 text-xl font-bold">Settings</h2>

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
						aria-disabled={!isValidApiKey(provider, db.apiKeys[provider])}
						value={db.apiKeys[provider] || ''}
						oninput={({ currentTarget: { value } }) => {
							db.apiKeys = { ...db.apiKeys, [provider]: value }
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
