<script lang="ts">
	import { CopyIcon } from '@lucide/svelte'

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
	class="cursor-pointer text-xs text-slate-500 transition-colors hover:text-slate-700 aria-pressed:text-green-600"
	onclick={handleCopy}
	title="Copy to clipboard"
	aria-pressed={copied}
>
	<CopyIcon size="1.25em" />
</button>
