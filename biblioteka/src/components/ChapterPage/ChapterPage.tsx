import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

type ChapterDetail = {
	id: number
	title: string
	book_id: number
	content?: string
}

const ChapterPage: React.FC = () => {
	const { chapterId } = useParams<{ chapterId: string }>()
	const [chapter, setChapter] = useState<ChapterDetail | null>(null)
	const [chapterList, setChapterList] = useState<ChapterDetail[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Pobierz informacje o rozdziale
	useEffect(() => {
		if (!chapterId) return

		const fetchChapterData = async () => {
			try {
				setLoading(true)
				setError(null)
				setChapter(null)
				setChapterList([])

				// Pobierz podstawowe informacje o rozdziale
				const chapterRes = await fetch(`http://localhost/biblioteka/book_chapters.php?id=${chapterId}`)
				if (!chapterRes.ok) throw new Error('Nie znaleziono rozdziału')

				const chapterData = await chapterRes.json()

				if (!chapterData?.book_id) throw new Error('Brak powiązania z książką')

				// Pobierz listę wszystkich rozdziałów tej książki
				const listRes = await fetch(`http://localhost/biblioteka/book_chapters.php?bookId=${chapterData.book_id}`)
				const chapterListData = await listRes.json()

				setChapterList(chapterListData)

				// Pobierz treść rozdziału
				const contentRes = await fetch(`http://localhost/biblioteka/chapter_content.php?chapterId=${chapterId}`)
				const contentData = await contentRes.json()

				// Zaktualizuj stan rozdziału z treścią
				setChapter({
					...chapterData,
					content: contentData.content || '',
				})
			} catch (err) {
				console.error('Error:', err)
				setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd')
			} finally {
				setLoading(false)
			}
		}

		fetchChapterData()
	}, [chapterId])

	if (loading) return <p style={{ textAlign: 'center' }}>Ładowanie...</p>
	if (error)
		return (
			<p style={{ color: 'red', textAlign: 'center' }}>
				Błąd: {error}
				<br />
				<Link to="/">⬅ Wróć</Link>
			</p>
		)
	if (!chapter) return <p>Nie znaleziono rozdziału</p>

	// znajdź pozycję bieżącego rozdziału - PORÓWNUJ JAKO STRINGI
	const currentIndex = chapterList.findIndex(ch => ch.id.toString() === chapterId)

	const prevChapter = chapterList[currentIndex - 1]
	const nextChapter = chapterList[currentIndex + 1]

	return (
		<div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: 'white' }}>
			<h1>{chapter.title}</h1>

			<div
				style={{ background: '#1F2129', padding: '15px', borderRadius: '8px', whiteSpace: 'pre-line', color: 'white' }}>
				{chapter.content || 'Brak treści'}
			</div>

			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					marginTop: '30px',
					borderTop: '1px solid #ccc',
					paddingTop: '15px',
				}}>
				{prevChapter ? (
					<Link to={`/book/${chapter.book_id}/chapter/${prevChapter.id}`}>
						<button>⬅ Poprzedni rozdział</button>
					</Link>
				) : (
					<button disabled>⬅ Poprzedni rozdział</button>
				)}

				<Link to={`/book/${chapter.book_id}`}>
					<button> Lista rozdziałów</button>
				</Link>

				{nextChapter ? (
					<Link to={`/book/${chapter.book_id}/chapter/${nextChapter.id}`}>
						<button>Następny rozdział ➡</button>
					</Link>
				) : (
					<button disabled>Następny rozdział ➡</button>
				)}
			</div>
		</div>
	)
}

export default ChapterPage
