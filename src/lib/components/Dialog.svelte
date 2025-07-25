<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements'

	interface DialogProps extends HTMLAttributes<HTMLDivElement> {
		onClose: () => void
		maxWidth?: string
	}

	let { children, onClose, maxWidth = '400px', ...rest }: DialogProps = $props()
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs"
	onclick={onClose}
>
	<div
		class="relative flex flex-col gap-2 rounded-xl bg-white/80 p-6 shadow-lg dark:bg-slate-800/80 dark:text-slate-200"
		style="width: 100%; min-width: 300px; max-width: {maxWidth}"
		onclick={e => e.stopPropagation()}
		{...rest}
	>
		{@render children?.()}
	</div>
</div>
