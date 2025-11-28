/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import './BookPage.css'
import BookRating from '../BookRating/BookRating'

type Chapter = { id: number; title: string; book_id: number }
type Book = {
	image?: string
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

	const [loggedUserId, setLoggedUserId] = useState<number | null>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const chaptersPerPage = 100

	const indexOfLastChapter = currentPage * chaptersPerPage
	const indexOfFirstChapter = indexOfLastChapter - chaptersPerPage
	const currentChapters = chapters.slice(indexOfFirstChapter, indexOfLastChapter)
	const totalPages = Math.ceil(chapters.length / chaptersPerPage)

	// Pobierz userId przy pierwszym renderze
	useEffect(() => {
		const storedUserId = localStorage.getItem('userId')
		if (storedUserId) setLoggedUserId(Number(storedUserId))
	}, [])

	// Pobierz książkę i rozdziały
	useEffect(() => {
		if (!id) return
		setLoading(true)
		setError(null)

		const fetchBook = fetch(`http://localhost/biblioteka/books.php`)
			.then(res => res.json())
			.then(data => {
				const found = data.find((b: any) => Number(b.id) === Number(id))
				if (found) setBook(found)
				else throw new Error('Książka nie znaleziona')
			})

		const fetchChapters = fetch(`http://localhost/biblioteka/book_chapters.php?bookId=${id}`)
			.then(res => res.json())
			.then(data => setChapters(data || []))

		Promise.all([fetchBook, fetchChapters])
			.catch(err => setError(err.message || 'Błąd pobierania danych'))
			.finally(() => setLoading(false))
	}, [id])
	// BookPage.tsx
	useEffect(() => {
		const handleStorageChange = () => {
			const storedUserId = localStorage.getItem('userId')
			if (storedUserId) setLoggedUserId(Number(storedUserId))
		}

		// nasłuchuj zmian w localStorage
		window.addEventListener('storage', handleStorageChange)

		return () => {
			window.removeEventListener('storage', handleStorageChange)
		}
	}, [])

	// Pobierz treść rozdziału
	useEffect(() => {
		if (!chapterId || chapters.length === 0) {
			setChapter(null)
			return
		}
		setChapterLoading(true)
		setError(null)

		const chapterInfo = chapters.find(ch => ch.id === Number(chapterId))
		if (!chapterInfo) {
			setError('Rozdział nie znaleziony')
			setChapterLoading(false)
			return
		}

		fetch(`http://localhost/biblioteka/chapter_content.php?chapterId=${chapterId}`)
			.then(res => res.json())
			.then(data => {
				if (data && data.content) setChapter({ id: data.id, title: chapterInfo.title, content: data.content })
				else throw new Error('Brak treści rozdziału')
			})
			.catch(err => {
				setError(err.message || 'Błąd pobierania rozdziału')
				setChapter(null)
			})
			.finally(() => setChapterLoading(false))
	}, [chapterId, chapters])

	if (loading) return <p>Ładowanie książki...</p>
	if (error && !book) return <p>Błąd: {error}</p>
	if (!book) return <p>Książka nie znaleziona</p>

	return (
		<div className="book-page-body">
			<div className="book-page-container">
				<h2>{book.title}</h2>

				<div className="book-header">
					{book.cover_image && <img src={book.cover_image} alt={book.title} className="book-cover" />}
					{book.description && <p className="book-description">{book.description}</p>}
				</div>

				{/* BookRating zawsze renderowany, userId opcjonalny */}
				<BookRating key={loggedUserId ?? 'guest'} bookId={book.id} userId={loggedUserId ?? undefined} />

				<div className="book-tags">
					{book.tags.map(tag => (
						<Link key={tag} to={`/SearchPage?tags=${tag}`} className="tag">
							{tag}
						</Link>
					))}
				</div>

				<h3>Rozdziały:</h3>
				{chapters.length > 0 ? (
					<>
						<table className="chapter-table">
							<thead>
								<tr>
									<th>Tytuł rozdziału</th>
								</tr>
							</thead>
							<tbody>
								{currentChapters.map(ch => (
									<tr key={ch.id}>
										<td>
											<Link to={`/book/${book.id}/chapter/${ch.id}`}>{ch.title}</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>

						{totalPages > 1 && (
							<div className="pagination">
								<button
									className="page-btn1"
									onClick={() => setCurrentPage(prev => prev - 1)}
									disabled={currentPage === 1}>
									Poprzednia
								</button>
								<span>
									Strona {currentPage} / {totalPages}
								</span>
								<button
									className="page-btn"
									onClick={() => setCurrentPage(prev => prev + 1)}
									disabled={currentPage === totalPages}>
									Następna
								</button>
							</div>
						)}
					</>
				) : (
					<p>Brak dostępnych rozdziałów</p>
				)}

				{chapterLoading && <div className="chapter-loading">Ładowanie treści rozdziału...</div>}
				{chapter && !chapterLoading && (
					<div className="chapter-content">
						<h4>{chapter.title}</h4>
						<p style={{ whiteSpace: 'pre-line' }}>{chapter.content}</p>
					</div>
				)}

				{error && chapterId && !chapterLoading && <div className="chapter-error">{error}</div>}

				<div className="back-link-wrapper">
					<Link to="/" className="back-link">
						Wróć do karuzeli
					</Link>
				</div>
			</div>
		</div>
	)
}

export default BookPage
