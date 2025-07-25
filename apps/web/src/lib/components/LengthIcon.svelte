<script lang="ts">
	import type { ResponseLength } from '../types'

	let { length }: { length: ResponseLength } = $props()
</script>

<span class="flex size-6 items-center justify-center font-mono">
	{#if length === 'short'}
		S
	{:else if length === 'medium'}
		M
	{:else}
		L
	{/if}
</span>
