<script lang="ts">
	import type { Provider } from '../types'
	import OpenAILogo from './OpenAILogo.svelte'
	import GoogleLogo from './GoogleLogo.svelte'
	import AnthropicLogo from './AnthropicLogo.svelte'

	let { provider }: { provider: Provider } = $props()
</script>

{#if provider === 'OpenAI'}
	<OpenAILogo />
{:else if provider === 'Google'}
	<GoogleLogo />
{:else if provider === 'Anthropic'}
	<AnthropicLogo />
{/if}
