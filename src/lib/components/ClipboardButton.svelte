<script lang="ts">
	import { CopyIcon } from '@lucide/svelte'
	import CheckIcon from '@lucide/svelte/icons/check'

	// Svelte 5 Runes
	let { text }: { text: string } = $props()
	let copied = $state(false)
	let timeout: ReturnType<typeof setTimeout> | null = null

	function handleCopy() {
		navigator.clipboard.writeText(text)
		copied = true
		if (timeout) clearTimeout(timeout)
		timeout = setTimeout(() => (copied = false), 1000)
	}
</script>

<button
	class="cursor-pointer text-xs text-slate-500 hover:text-slate-700"
	onclick={handleCopy}
	title="Copy to clipboard"
>
	{#if copied}
		<CheckIcon size="1.25em" class="text-green-600" />
	{:else}
		<CopyIcon size="1.25em" />
	{/if}
</button>
