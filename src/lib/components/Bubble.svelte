<script lang="ts">
	import type { TextPart } from 'ai'
	import type { Message } from '../types'
	import { marked } from './markdown'
	import { cn } from '../utils'

	let { message, loading }: { message: Message; loading: boolean } = $props()

	const attachments = message.content.filter(part => part.type !== 'text')
	const maxWidth = message.role === 'user' ? '60ch' : '80ch'
</script>

<div
	class={message.role === 'user'
		? 'my-2 ml-auto rounded-2xl rounded-br-none bg-zinc-100 px-4 py-2 text-slate-800 shadow-xs aria-busy:animate-pulse'
		: ''}
	style="max-width: min(var(--content-width), {maxWidth})"
	aria-busy={loading}
>
	{#each message.content.filter(part => part.type === 'text') as TextPart[] as part}
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
</div>
