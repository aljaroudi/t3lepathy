<script lang="ts">
	import type { TextPart } from 'ai'
	import type { Message } from '../types'
	import { marked } from './markdown'
	import { cn } from '../utils'
	import { getPrice } from '../ai'
	import ClipboardButton from './ClipboardButton.svelte'

	let { message, loading }: { message: Message; loading: boolean } = $props()
	let bubbleElement = $state<HTMLElement | null>(null)

	const attachments = $derived(
		message.content.filter(part => part.type !== 'text')
	)
	const maxWidth = message.role === 'user' ? '60ch' : '80ch'

	const textParts = $derived(
		message.content.filter(part => part.type === 'text') as TextPart[]
	)

	// Auto-scroll to bottom when this bubble's content changes
	$effect(() => {
		// Track the text content and loading state to trigger scroll
		textParts.forEach(part => part.text)

		if (!bubbleElement) return

		// Find the scrollable container (the overflow-y-auto div)
		const scrollContainer = bubbleElement.closest(
			'.overflow-y-auto'
		) as HTMLElement
		if (!scrollContainer) return

		// Use requestAnimationFrame to ensure DOM updates are complete
		requestAnimationFrame(() => {
			scrollContainer.scrollTo({
				top: scrollContainer.scrollHeight,
				behavior: 'smooth',
			})
		})
	})
</script>

<section
	class={message.role === 'user'
		? 'my-2 ml-auto rounded-2xl rounded-br-none bg-zinc-100 px-4 py-2 text-slate-800 shadow-xs aria-busy:animate-pulse'
		: ''}
	style="max-width: min(var(--content-width), {maxWidth})"
	aria-busy={loading}
	bind:this={bubbleElement}
>
	{#each textParts as part}
		{@html marked.parse(part.text)}
	{/each}
	{#if attachments.length > 0}
		<div class="flex gap-2">
			{#each attachments as attachment}
				{#if attachment.type === 'image'}
					<img
						src={attachment.image}
						alt="Message attachment"
						class={cn(
							'rounded-lg object-cover',
							message.role === 'user' ? 'size-20' : 'max-h-[512px]'
						)}
					/>
				{:else if attachment.type === 'file'}
					<p class="rounded-full bg-cyan-700 px-3 py-1 text-sm text-white">
						{attachment.filename || `${attachment.mimeType} file`}
					</p>
				{/if}
			{/each}
		</div>
	{/if}
	<div
		class="flex items-center gap-2 py-2 {message.role === 'user' ? '' : 'px-2'}"
	>
		<!-- copy to clipboard button -->
		<ClipboardButton text={textParts.map(p => p.text).join('\n')} />
		{#if message.tokens}
			<p class="text-xs text-slate-500">
				{message.tokens.toLocaleString(undefined)} tokens
			</p>
		{/if}
		{#if getPrice(message)}
			<p class="text-xs text-slate-500">
				{getPrice(message)?.toLocaleString(undefined, {
					style: 'currency',
					currency: 'USD',
					minimumFractionDigits: 2,
					maximumFractionDigits: 10,
				})}
			</p>
		{/if}
	</div>
</section>
