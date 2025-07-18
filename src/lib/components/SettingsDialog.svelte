<script lang="ts">
	import { PROVIDERS } from '../ai'
	import { state as db } from '../db.svelte'
	import { isValidApiKey } from '../validate'

	let { showDialog = $bindable(false) }: { showDialog: boolean } = $props()
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs"
>
	<div class="relative min-w-[300px] rounded-xl bg-white p-6 shadow-lg">
		<button
			class="absolute top-2 right-2 text-gray-500 hover:text-black"
			onclick={() => (showDialog = false)}
			>&times;
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
						class="col-span-3 rounded-lg border border-gray-200 bg-white p-2 aria-disabled:border-rose-500 dark:bg-slate-100 dark:text-slate-800"
						aria-disabled={!isValidApiKey(provider, db.apiKeys[provider])}
						value={db.apiKeys[provider] || ''}
						oninput={({ currentTarget: { value } }) => {
							db.apiKeys = { ...db.apiKeys, [provider]: value }
						}}
					/>
				</div>
			{/each}
		</div>
	</div>
</div>
