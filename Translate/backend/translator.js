// translator.js
import fetch from 'node-fetch'

export async function translateText(text, target = 'pl', maxChunk = 1900) {
	if (!text) return ''

	const chunks = []
	for (let i = 0; i < text.length; i += maxChunk) {
		chunks.push(text.slice(i, i + maxChunk))
	}

	const translatedChunks = []

	for (const chunk of chunks) {
		try {
			const res = await fetch('https://libretranslate.com/translate', {
				method: 'POST',
				body: JSON.stringify({
					q: chunk,
					source: 'en',
					target: target,
					format: 'text',
					api_key: '', // jeśli masz klucz, możesz wstawić
				}),
				headers: { 'Content-Type': 'application/json' },
			})
			const data = await res.json()
			translatedChunks.push(data.translatedText)
			await new Promise(r => setTimeout(r, 500)) // mała przerwa między requestami
		} catch (err) {
			console.error('LibreTranslate error:', err.message || err)
			translatedChunks.push('') // w razie błędu wrzucamy pusty tekst
		}
	}

	return translatedChunks.join('\n\n')
}
