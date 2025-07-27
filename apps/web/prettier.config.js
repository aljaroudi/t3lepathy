/** @typedef {import("prettier").Config} PrettierConfig */
/** @typedef {import("prettier-plugin-tailwindcss").PluginOptions} TailwindConfig */
/** @typedef {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig */
/** @typedef {import('prettier-plugin-svelte').PrettierConfig & import('prettier-plugin-tailwindcss').PluginOptions} SvelteConfig */

/** @type { PrettierConfig | SortImportsConfig | TailwindConfig | SvelteConfig } */
const config = {
	plugins: [
		'@ianvs/prettier-plugin-sort-imports',
		'prettier-plugin-tailwindcss',
		'prettier-plugin-svelte',
	],
	tailwindFunctions: ['cn', 'cva'],
	importOrder: [
		'<TYPES>',
		'<THIRD_PARTY_MODULES>',
		'',
		'<TYPES>^[.|..|~]',
		'^~/',
		'^[../]',
		'^[./]',
	],
	importOrderParserPlugins: ['typescript'],
	useTabs: true,
	trailingComma: 'es5',
	singleQuote: true,
	semi: false,
	arrowParens: 'avoid',
}

export default config
