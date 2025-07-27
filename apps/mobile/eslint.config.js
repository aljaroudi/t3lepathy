// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config')
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended')
const expoConfig = require('eslint-config-expo/flat')

export default defineConfig([
	expoConfig,
	eslintPluginPrettierRecommended,
	{
		ignores: ['dist/*'],
		plugins: ['react-compiler'],
		rules: {
			'react-compiler/react-compiler': 'error',
		},
	},
])
