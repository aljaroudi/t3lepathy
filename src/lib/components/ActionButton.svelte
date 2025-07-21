<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements'

	let { children, ...rest }: HTMLButtonAttributes = $props()
</script>

<button
	{...rest}
	class="ml-auto flex aspect-square cursor-pointer items-center justify-center rounded-full bg-radial-[at_25%_25%] from-cyan-500 to-cyan-700 to-75% p-2 text-lg text-white shadow-lg shadow-cyan-500/20 hover:bg-radial-[at_50%_50%] disabled:cursor-not-allowed disabled:opacity-50"
>
	{@render children?.()}
</button>
