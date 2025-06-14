/** @type {import('prettier').Config & import('prettier-plugin-svelte').PrettierConfig & import('prettier-plugin-tailwindcss').PluginOptions} */
export default {
	plugins: ['prettier-plugin-svelte', 'prettier-plugin-tailwindcss'],
	useTabs: true,
	trailingComma: 'es5',
	singleQuote: true,
	semi: false,
	arrowParens: 'avoid',
}
