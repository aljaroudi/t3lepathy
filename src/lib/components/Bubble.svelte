<script lang="ts">
	import type { Message } from '../types'
	import { marked } from './markdown'

	let { message }: { message: Message } = $props()
</script>

{#if message.role === 'user'}
	<div
		class="my-2 ml-auto rounded-2xl rounded-br-none bg-zinc-100 px-4 py-2 text-slate-800 shadow-xs"
		style="max-width: 60ch"
	>
		{#each message.content.filter(part => part.type === 'text') as part}
			{@html marked.parse(part.text)}
		{/each}
		{#if message.content.some(part => part.type !== 'text')}
			{@const images = message.content.filter(part => part.type === 'image')}
			{@const files = message.content.filter(part => part.type === 'file')}
			<div class="flex gap-2">
				{#each images as image}
					<img
						src={image.image}
						alt="Message attachment"
						class="size-20 rounded-lg object-cover"
					/>
				{/each}
				{#each files as file}
					<p class="rounded-full bg-cyan-700 px-3 py-1 text-sm text-white">
						{file.filename || `${file.mimeType} file`}
					</p>
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<p style="max-width: 80ch">
		{#each message.content as part}
			{#if part.type === 'text'}
				{@html marked.parse(part.text)}
			{:else if part.type === 'image'}
				<img
					src={part.image}
					alt="Message attachment"
					class="rounded-lg object-cover"
				/>
			{/if}
		{/each}
	</p>
{/if}
