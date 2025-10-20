/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import './BookPage.css'

type Chapter = { id: number; title: string; book_id: number }
type Book = {
	image: any
	id: number
	title: string
	author: string
	description?: string
	cover_image?: string
	tags: string[]
}
type ChapterDetail = { id: number; title: string; content: string }

const BookPage: React.FC = () => {
	const { id, chapterId } = useParams<{ id: string; chapterId?: string }>()
	const [book, setBook] = useState<Book | null>(null)
	const [chapters, setChapters] = useState<Chapter[]>([])
	const [chapter, setChapter] = useState<ChapterDetail | null>(null)
	const [loading, setLoading] = useState(true)
	const [chapterLoading, setChapterLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Pobierz książkę i listę chapterów
	useEffect(() => {
		if (!id) return

		setLoading(true)
		setError(null)

		// fetch książki
		fetch(`http://localhost/biblioteka/books.php`)
			.then(res => {
				if (!res.ok) throw new Error('Błąd sieci')
				return res.json()
			})
			.then(data => {
				const found = data.find((b: any) => Number(b.id) === Number(id))
				if (found) setBook(found)
				else setError('Książka nie znaleziona')
			})
			.catch(err => {
				console.error('Błąd fetch książki:', err)
				setError('Błąd pobierania książki')
			})

		// fetch chapterów dla książki
		fetch(`http://localhost/biblioteka/book_chapters.php?bookId=${id}`)
			.then(res => {
				if (!res.ok) throw new Error('Błąd sieci')
				return res.json()
			})
			.then(data => setChapters(data))
			.catch(err => {
				console.error('Błąd fetch chapterów:', err)
				setChapters([])
			})
			.finally(() => setLoading(false))
	}, [id])

	// Pobierz treść wybranego chaptera
	useEffect(() => {
		if (!chapterId) {
			setChapter(null)
			return
		}

		setChapterLoading(true)
		setError(null)

		// Zmieniony endpoint na chapter_content.php
		fetch(`http://localhost/biblioteka/chapter_content.php?chapterId=${chapterId}`)
			.then(res => {
				if (!res.ok) throw new Error('Błąd sieci')
				return res.json()
			})
			.then(data => {
				if (data && data.content) {
					// Musimy też pobrać tytuł rozdziału
					const chapterInfo = chapters.find(ch => ch.id === parseInt(chapterId))
					if (chapterInfo) {
						setChapter({
							id: data.id,
							title: chapterInfo.title,
							content: data.content,
						})
					} else {
						// Jeśli nie mamy tytułu, pobierz go osobno
						fetch(`http://localhost/biblioteka/book_chapters.php?id=${chapterId}`)
							.then(res => res.json())
							.then(chapterData => {
								if (chapterData && chapterData.title) {
									setChapter({
										id: data.id,
										title: chapterData.title,
										content: data.content,
									})
								} else {
									setError('Nie znaleziono informacji o rozdziale')
								}
							})
					}
				} else {
					setError('Chapter nie znaleziony lub brak treści')
					setChapter(null)
				}
			})
			.catch(err => {
				console.error('Błąd fetch chaptera:', err)
				setError('Błąd pobierania chaptera')
				setChapter(null)
			})
			.finally(() => setChapterLoading(false))
	}, [chapterId, chapters])

	if (loading) return <p>Ładowanie książki...</p>
	if (error) return <p>Błąd: {error}</p>
	if (!book) return <p>Książka nie znaleziona</p>

	return (
		<div className="book-page-body">
			<div style={{ padding: '20px' }}>
				<h2>{book.title}</h2>
				<div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
					<div>
						{book.cover_image && (
							<img
								src={book.cover_image}
								alt={`Okładka ${book.title}`}
								style={{
									maxWidth: '200px',
									maxHeight: '300px',
									marginBottom: '15px',
									border: '1px solid #ddd',
									borderRadius: '5px',
								}}
							/>
						)}
					</div>
					<p>{book.description}</p>
				</div>

				<div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
					{book.tags.map(tag => (
						<Link
							key={tag}
							to={`/SearchPage?tags=${tag}`}
							style={{
								background: '#4CAF50',
								color: 'white',
								padding: '4px 12px',
								borderRadius: '20px',
								fontSize: '12px',
								fontWeight: '500',
								textDecoration: 'none',
							}}>
							{tag}
						</Link>
					))}
				</div>
				<h3>Rozdziały:</h3>
				{chapters.length > 0 ? (
					<ul>
						{chapters.map(ch => (
							<li key={ch.id}>
								<Link to={`/book/${book.id}/chapter/${ch.id}`}>{ch.title}</Link>
							</li>
						))}
					</ul>
				) : (
					<p>Brak dostępnych rozdziałów</p>
				)}
				{chapter && (
					<div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0' }}>
						<h4>{chapter.title}</h4>
						<p style={{ whiteSpace: 'pre-line' }}>{chapter.content}</p>
					</div>
				)}
				{/* Stan ładowania dla chaptera */}
				{chapterLoading && (
					<div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
						<p>Ładowanie treści rozdziału...</p>
					</div>
				)}
				<div style={{ marginTop: '20px' }}>
					<Link to="/">⬅ Wróć do karuzeli</Link>
				</div>
			</div>
		</div>
	)
}

export default BookPage
