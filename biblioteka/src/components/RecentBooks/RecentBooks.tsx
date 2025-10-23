/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './RecentBooks.css'

type Chapter = { id: number; title: string; book_id: number }
type Book = {
	id: number
	title: string
	cover_image?: string
	chapters?: Chapter[]
}

const RecentBooks: React.FC = () => {
	const [books, setBooks] = useState<Book[]>([])

	useEffect(() => {
		const fetchRecentBooks = async () => {
			try {
				const res = await fetch('http://localhost/biblioteka/books.php')
				const data = await res.json()
				const sorted = data.sort((a: any, b: any) => b.id - a.id)
				const latest = sorted.slice(0, 5)

				const booksWithChapters = await Promise.all(
					latest.map(async (book: any) => {
						try {
							const resCh = await fetch(`http://localhost/biblioteka/book_chapters.php?bookId=${book.id}`)
							const chapters = await resCh.json()
							// sortuj malejąco po id (ostatnie dodane na górze) i weź max 10
							const latestChapters = chapters.sort((a: any, b: any) => b.id - a.id).slice(0, 10)
							return { ...book, chapters: latestChapters }
						} catch {
							return { ...book, chapters: [] }
						}
					})
				)

				setBooks(booksWithChapters)
			} catch (err) {
				console.error(err)
			}
		}

		fetchRecentBooks()
	}, [])

	return (
		<div className="recent-books-container">
			<div className="ostatnie">
				<h1>ostatnio dodane</h1>{' '}
			</div>

			{books.map(book => (
				<div key={book.id} className="recent-book-item">
					<p className="recent-book-title">{book.title}</p>
					<div className="recent-book-main">
						<Link to={`/book/${book.id}`} className="recent-book-link">
							<div className="recent-book-cover" style={{ backgroundImage: `url(${book.cover_image || ''})` }} />
						</Link>
						<div className="recent-book-chapters">
							{book.chapters && book.chapters.length > 0 ? (
								book.chapters.slice(0, 10).map(ch => (
									<Link key={ch.id} to={`/book/${book.id}/chapter/${ch.id}`} className="recent-book-chapter-link">
										{ch.title || `Chapter ${ch.id}`}
									</Link>
								))
							) : (
								<p className="recent-book-no-chapters">Brak rozdziałów</p>
							)}
						</div>
					</div>
				</div>
			))}
		</div>
	)
}

export default RecentBooks
