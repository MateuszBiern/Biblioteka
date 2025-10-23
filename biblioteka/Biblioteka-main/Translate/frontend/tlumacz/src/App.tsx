/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'

export default function App() {
	const [bookId, setBookId] = useState('16')
	const [baseUrl, setBaseUrl] = useState('https://www.fanmtl.com/novel/re-evolution-online')
	const [fromChapter, setFromChapter] = useState('1')
	const [toChapter, setToChapter] = useState('2')
	const [preserve, setPreserve] = useState(true)
	const [log, setLog] = useState<string[]>([])
	const [running, setRunning] = useState(false)

	const addLog = (text: string) => setLog(l => [...l, text])

	const startTranslation = async () => {
		setRunning(true)
		setLog([])
		addLog('Rozpoczynam zadanie...')

		try {
			const payload = {
				bookId: Number(bookId),
				baseUrl,
				fromChapter: Number(fromChapter),
				toChapter: Number(toChapter),
				preserveUrlOrder: preserve,
			}

			addLog('Wysłano żądanie do backendu...')

			const res = await fetch('/api/translate-range', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})

			if (!res.ok) throw new Error(`Błąd API: ${res.status}`)
			const data = await res.json()

			addLog('Zakończono. Wyniki:')
			data.results.forEach((r: any) => addLog(JSON.stringify(r)))
		} catch (err: any) {
			addLog('Błąd: ' + err.message)
		} finally {
			setRunning(false)
		}
	}

	return (
		<div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'Arial, sans-serif' }}>
			<h1>Reader Translator</h1>

			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
				<label>
					Book ID (DB)
					<input value={bookId} onChange={e => setBookId(e.target.value)} />
				</label>
				<label>
					Base URL
					<input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} />
				</label>
				<label>
					From chapter
					<input value={fromChapter} onChange={e => setFromChapter(e.target.value)} />
				</label>
				<label>
					To chapter
					<input value={toChapter} onChange={e => setToChapter(e.target.value)} />
				</label>
				<label style={{ gridColumn: '1 / -1' }}>
					<input type="checkbox" checked={preserve} onChange={e => setPreserve(e.target.checked)} /> Preserve URL
					chapter numbers as chapter_order
				</label>
			</div>

			<div style={{ marginTop: 16 }}>
				<button onClick={startTranslation} disabled={running} style={{ padding: '8px 16px' }}>
					{running ? 'Running...' : 'Start'}
				</button>
			</div>

			<div style={{ marginTop: 20 }}>
				<h3>Log</h3>
				<div style={{ background: '#000000ff', padding: 12, minHeight: 200, maxHeight: 400, overflow: 'auto' }}>
					{log.map((l, i) => (
						<div key={i} style={{ fontFamily: 'monospace', fontSize: 13 }}>
							{l}
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
