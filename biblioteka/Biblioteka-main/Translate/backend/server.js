import express from 'express'
import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer'
import fetch from 'node-fetch'

const app = express()
app.use(express.json())

const EXPORT_DIR = path.join(process.cwd(), 'exports')
if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true })

const wait = ms => new Promise(r => setTimeout(r, ms))

// Proste tłumaczenie przez Google Translate
async function translateWithGoogle(text, targetLang = 'pl') {
	if (!text || text.trim().length === 0) return text
	try {
		const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(
			text
		)}`
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
			},
			timeout: 10000,
		})
		if (!response.ok) throw new Error(`HTTP ${response.status}`)

		const data = await response.json()
		if (data && Array.isArray(data[0])) {
			return data[0].map(item => item[0]).join('')
		}
		return text
	} catch (error) {
		console.log('❌ Google Translate error:', error.message)
		return text
	}
}

// Główna funkcja tłumaczenia - NAJSZYBSZA Z FORMATOWANIEM
async function translateText(text, targetLang = 'pl') {
	if (!text || text.trim().length === 0) return text
	text = text.trim()
	if (text.length === 0) return ''

	const maxChunkSize = 4500
	const chunks = []

	// Proste dzielenie na chunks bez naruszania formatowania
	for (let i = 0; i < text.length; i += maxChunkSize) {
		// Znajdź najbliższy koniec akapitu (podwójna nowa linia) do podziału
		let chunkEnd = i + maxChunkSize
		if (chunkEnd < text.length) {
			// Spróbuj znaleźć koniec akapitu w pobliżu granicy chunk
			const nearestParagraphEnd = text.lastIndexOf('\n\n', chunkEnd)
			if (nearestParagraphEnd > i + maxChunkSize * 0.7) {
				// Jeśli jest w rozsądnej odległości
				chunkEnd = nearestParagraphEnd + 2 // +2 aby uwzględnić \n\n
			}
		}
		chunks.push(text.substring(i, chunkEnd))
	}

	console.log(`📝 Tłumaczenie ${chunks.length} części...`)
	const translatedChunks = []

	for (let i = 0; i < chunks.length; i++) {
		console.log(`🔄 Tłumaczenie części ${i + 1}/${chunks.length}...`)
		const translated = await translateWithGoogle(chunks[i], targetLang)
		translatedChunks.push(translated)

		if (i < chunks.length - 1) {
			const delay = 2000 + Math.random() * 2000
			console.log(`⏳ Pauza: ${Math.round(delay / 1000)}s`)
			await wait(delay)
		}
	}

	return translatedChunks.join('')
}

// Funkcja do przetwarzania tytułu rozdziału
async function processChapterTitle(rawTitle, chapterNumber, targetLang = 'pl') {
	console.log(`🔍 processChapterTitle: rawTitle="${rawTitle}", chapterNumber=${chapterNumber}`)

	if (!rawTitle || rawTitle.trim().length === 0) {
		console.log(`📝 Brak tytułu, zwracam: "Chapter ${chapterNumber}"`)
		return `Chapter ${chapterNumber}`
	}

	let cleanTitle = rawTitle.replace(/\s+/g, ' ').trim()
	console.log(`🔍 Oczyszczony tytuł: "${cleanTitle}"`)

	// Sprawdź różne formaty tytułów
	const patterns = [
		/^Chapter\s+(\d+)[\s\-:]+(.+)$/i, // "Chapter 1 - Title"
		/^Ch\.?\s*(\d+)[\s\-:]+(.+)$/i, // "Ch 1 - Title"
		/^#\s*(\d+)[\s\-:]+(.+)$/i, // "#1 - Title"
		/^(\d+)[\s\-:]+(.+)$/i, // "1 - Title"
	]

	for (const pattern of patterns) {
		const match = cleanTitle.match(pattern)
		if (match && match[2]) {
			const titlePart = match[2].trim()
			console.log(`🔄 Znaleziono tytuł do przetłumaczenia: "${titlePart}"`)
			const translatedPart = await translateWithGoogle(titlePart, targetLang)
			const result = `Chapter ${chapterNumber} - ${translatedPart}`
			console.log(`✅ Przetłumaczony tytuł: "${result}"`)
			return result
		}
	}

	// Sprawdź czy to tylko "Chapter X" lub numer
	const simplePatterns = [
		/^Chapter\s+(\d+)$/i, // "Chapter 1"
		/^Ch\.?\s*(\d+)$/i, // "Ch 1"
		/^#\s*(\d+)$/i, // "#1"
		/^(\d+)$/, // "1"
	]

	for (const pattern of simplePatterns) {
		const match = cleanTitle.match(pattern)
		if (match) {
			console.log(`📝 Tylko Chapter/nummer, zwracam: "Chapter ${chapterNumber}"`)
			return `Chapter ${chapterNumber}`
		}
	}

	// Jeśli to jakiś inny tekst, przetłumacz całość
	console.log(`🔄 Tłumaczenie całego tytułu: "${cleanTitle}"`)
	const translatedTitle = await translateWithGoogle(cleanTitle, targetLang)
	const result = `Chapter ${chapterNumber} - ${translatedTitle}`
	console.log(`✅ Przetłumaczony tytuł: "${result}"`)
	return result
}

// Funkcja do przetwarzania rozdziału z ponawianiem
async function processChapterWithRetry(browser, chapterUrl, chapterNumber, bookId, maxRetries = 3) {
	let lastError = null

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		let page = null
		try {
			console.log(`🔄 Próba ${attempt}/${maxRetries} dla rozdziału ${chapterNumber}`)

			page = await browser.newPage()

			// Zmiana user agenta przy kolejnych próbach
			const userAgents = [
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
				'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
			]
			await page.setUserAgent(userAgents[attempt - 1] || userAgents[0])

			await page.setRequestInterception(true)
			page.on('request', request => {
				const resourceType = request.resourceType()
				if (['image', 'font', 'media', 'stylesheet'].includes(resourceType)) {
					request.abort()
				} else {
					request.continue()
				}
			})

			// Zwiększ timeout przy kolejnych próbach
			const timeouts = [25000, 35000, 45000]
			await page.goto(chapterUrl, {
				waitUntil: 'domcontentloaded',
				timeout: timeouts[attempt - 1] || 25000,
			})

			// Pobierz czystą treść rozdziału
			const chapterData = await page.evaluate(() => {
				// 1. NAJPIERW spróbuj pobrać h2 z .titles (dla drugiej książki)
				let title = ''
				const titlesDiv = document.querySelector('.titles')
				if (titlesDiv) {
					const h2 = titlesDiv.querySelector('h2')
					if (h2 && h2.textContent && h2.textContent.trim().length > 0) {
						title = h2.textContent.trim()
						console.log('✅ Znaleziono tytuł w .titles h2:', title)
					}
				}

				// 2. Jeśli nie ma .titles h2, użyj standardowych selektorów
				if (!title) {
					const titleSelectors = [
						'.chapter-title',
						'.chapter-name',
						'.chap-title',
						'.title-chapter',
						'h1.chapter-title',
						'h2.chapter-title',
						'h3.chapter-title',
						'.entry-title',
						'.post-title',
						'h1',
						'h2',
						'h3',
					]

					for (const selector of titleSelectors) {
						const titleEl = document.querySelector(selector)
						if (titleEl && titleEl.textContent && titleEl.textContent.trim().length > 0) {
							const text = titleEl.textContent.trim()
							// Sprawdź czy to wygląda na tytuł rozdziału (nie książki)
							if (text.match(/chapter|rozdział|ch\.?\s*\d+|#\s*\d+|\d+/i) && text.length < 100) {
								title = text
								console.log('✅ Znaleziono tytuł rozdziału:', title)
								break
							}
						}
					}
				}

				// Znajdź kontener treści
				const contentSelectors = [
					'.chapter-content',
					'#chapter-content',
					'.reading-content',
					'.novel-content',
					'.entry-content',
					'.post-content',
					'article .content',
					'[class*="content"]',
					'.text-left',
					'.text-content',
					'.content-wrap',
				]

				let contentElement = document.body
				for (const selector of contentSelectors) {
					const element = document.querySelector(selector)
					if (element && element.textContent && element.textContent.length > 300) {
						contentElement = element
						console.log('✅ Znaleziono kontener treści:', selector)
						break
					}
				}

				// Usuń niechciane elementy z treści
				const unwantedSelectors = [
					'nav',
					'header',
					'footer',
					'aside',
					'script',
					'style',
					'.ad',
					'.ads',
					'.advertisement',
					'.social',
					'.share',
					'.comments',
					'.navigation',
					'.menu',
					'.sidebar',
					'.breadcrumb',
					'.pagination',
					'.chapter-nav',
					'.titles', // Usuń cały div .titles z treści
				]

				unwantedSelectors.forEach(selector => {
					contentElement.querySelectorAll(selector).forEach(el => el.remove())
				})

				// ZACHOWAJ STRUKTURĘ PARAGRAFÓW - pobierz wszystkie <p> jako tablicę
				const paragraphs = Array.from(contentElement.querySelectorAll('p'))
					.map(p => p.textContent.trim())
					.filter(text => text.length > 0) // Usuń puste paragrafy

				console.log(`📄 Znaleziono ${paragraphs.length} paragrafów`)

				// Jeśli nie ma paragrafów, użyj zwykłego tekstu
				let content
				if (paragraphs.length > 0) {
					// Połącz paragrafy z podwójnymi nowymi liniami
					content = paragraphs.join('\n\n')
				} else {
					// Fallback: użyj zwykłego tekstu z zachowaniem formatowania
					content = contentElement.textContent
						.split('\n')
						.map(line => line.trim())
						.filter(line => line.length > 0)
						.join('\n\n')
				}

				return {
					title,
					content: content,
					paragraphCount: paragraphs.length,
				}
			})

			const { title: rawTitle, content: rawContent, paragraphCount } = chapterData

			if (!rawContent || rawContent.trim().length < 200) {
				throw new Error(`Za mało treści: ${rawContent?.length || 0} znaków`)
			}

			console.log(`📄 Oryginalny tytuł: "${rawTitle}"`)
			console.log(`📖 Treść: ${rawContent.length} znaków, ${paragraphCount} paragrafów`)

			// Przetwórz tytuł
			let processedTitle = ''
			if (rawTitle && rawTitle.trim().length > 0) {
				console.log(`🔄 Przetwarzanie tytułu rozdziału ${chapterNumber}...`)
				processedTitle = await processChapterTitle(rawTitle, chapterNumber, 'pl')
			} else {
				processedTitle = `Chapter ${chapterNumber}`
				console.log(`📝 Brak tytułu, ustawiam: "${processedTitle}"`)
			}

			console.log(`📝 Finalny tytuł: "${processedTitle}"`)

			// Tłumacz treść
			console.log(`🔄 Rozpoczynam tłumaczenie treści...`)
			const translatedContent = await translateText(rawContent, 'pl')

			await page.close()

			return {
				success: true,
				data: {
					chapter_order: chapterNumber,
					source_order: chapterNumber,
					source_url: chapterUrl,
					title: processedTitle,
					content: translatedContent,
					paragraph_count: paragraphCount,
				},
				result: {
					chapter: chapterNumber,
					status: 'ok',
					originalLength: rawContent.length,
					translatedLength: translatedContent.length,
					title: processedTitle,
					attempts: attempt,
				},
			}
		} catch (err) {
			lastError = err
			console.error(`❌ Błąd (próba ${attempt}/${maxRetries}) rozdziału ${chapterNumber}:`, err.message)

			if (page && !page.isClosed()) {
				await page.close()
			}

			// Jeśli to nie ostatnia próba, poczekaj przed kolejną
			if (attempt < maxRetries) {
				const retryDelay = attempt * 2000 // 2s, 4s, 6s...
				console.log(`⏳ Czekam ${retryDelay / 1000}s przed ponowieniem...`)
				await wait(retryDelay)
			}
		}
	}

	// Wszystkie próby się nie udały
	return {
		success: false,
		error: lastError,
		result: {
			chapter: chapterNumber,
			status: 'error',
			message: lastError.message,
			attempts: maxRetries,
		},
	}
}

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.post('/api/translate-range', async (req, res) => {
	const { bookId, baseUrl, fromChapter, toChapter, preserveUrlOrder = true } = req.body
	if (!bookId || !baseUrl || !fromChapter || !toChapter) {
		return res.status(400).json({ error: 'Niepoprawne dane' })
	}

	const results = []
	const chapters = []
	let browser

	try {
		browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		})

		for (let i = Number(fromChapter); i <= Number(toChapter); i++) {
			const chapterUrl = baseUrl.endsWith('.html') ? baseUrl.replace(/\.html$/, `_${i}.html`) : `${baseUrl}_${i}.html`

			console.log(`\n=== Rozdział ${i} ===`)
			console.log(`📖 URL: ${chapterUrl}`)

			const chapterResult = await processChapterWithRetry(browser, chapterUrl, i, bookId, 3)

			if (chapterResult.success) {
				chapters.push(chapterResult.data)
				results.push(chapterResult.result)
				console.log(
					`✅ Rozdział ${i} ukończony: "${chapterResult.data.title}" (próby: ${chapterResult.result.attempts})`
				)
			} else {
				results.push(chapterResult.result)
				console.error(`💥 Rozdział ${i} FAILED po ${chapterResult.result.attempts} próbach`)
			}

			// Pauza między rozdziałami
			if (i < Number(toChapter)) {
				const delay = 3000 + Math.random() * 2000
				console.log(`⏳ Przerwa: ${Math.round(delay / 1000)}s`)
				await wait(delay)
			}
		}

		const fileName = `book_${bookId}_chapters_${Date.now()}.json`
		const filePath = path.join(EXPORT_DIR, fileName)
		fs.writeFileSync(filePath, JSON.stringify({ bookId, chapters }, null, 2), 'utf-8')

		await browser.close()

		const successCount = results.filter(r => r.status === 'ok').length
		const failedCount = results.filter(r => r.status === 'error').length
		console.log(`\n🎉 Ukończono! ${successCount}/${results.length} rozdziałów (${failedCount} błędów)`)

		return res.json({
			status: 'done',
			results,
			download: `/exports/${fileName}`,
			summary: {
				success: successCount,
				failed: failedCount,
				total: results.length,
			},
		})
	} catch (outerErr) {
		console.error('💥 Błąd główny:', outerErr)
		if (browser) await browser.close()
		return res.status(500).json({ error: 'Internal error', message: outerErr.message })
	}
})

app.use('/exports', express.static(EXPORT_DIR))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`🚀 Serwer działa na porcie ${PORT}`))
