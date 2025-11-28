import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './RandomBook2.css'

type Book = {
	id: number
	title: string
	description?: string
	cover_image?: string
	average_rating?: number
}

const RandomBook2: React.FC = () => {
	const [books, setBooks] = useState<Book[]>([])
	const [selectedBook, setSelectedBook] = useState<Book | null>(null)

	useEffect(() => {
		const fetchBooks = async () => {
			try {
				const res = await fetch('http://localhost/biblioteka/get_recommended_books.php')
				const data: Book[] = await res.json()

				if (!data || data.length === 0) {
					console.warn('Brak rekomendowanych książek')
					return
				}

				// losowe 10 książek
				const shuffled = data.sort(() => 0.5 - Math.random())
				setBooks(shuffled.slice(0, 10))
				setSelectedBook(shuffled[0] || null)
			} catch (err) {
				console.error(err)
			}
		}
		fetchBooks()
	}, [])

	return (
		<div className="random-book-container">
			<h2 className="random-book-title">Rekomendowane książki</h2>

			{books.length === 0 ? (
				<p>Brak rekomendacji do wyświetlenia</p>
			) : (
				<div className="random-book-thumbnails">
					{books.map(book => (
						<div
							key={book.id}
							className={`random-book-thumb ${selectedBook?.id === book.id ? 'active' : ''}`}
							onClick={() => setSelectedBook(book)}>
							<img
								src={
									book.cover_image
										? `http://localhost/biblioteka/${book.cover_image}`
										: 'http://localhost/biblioteka/images/placeholder.png'
								}
								alt={book.title}
							/>
						</div>
					))}
				</div>
			)}

			{selectedBook && (
				<div className="random-book-detail">
					<img
						src={
							selectedBook.cover_image
								? `http://localhost/biblioteka/${selectedBook.cover_image}`
								: 'http://localhost/biblioteka/images/placeholder.png'
						}
						alt={selectedBook.title}
						className="random-book-main-image"
					/>
					<div className="random-book-info">
						<h3>{selectedBook.title}</h3>
						<p>{selectedBook.description || 'Brak opisu książki.'}</p>
						<Link to={`/book/${selectedBook.id}`} className="random-book-read-btn">
							Czytaj
						</Link>
					</div>
				</div>
			)}
		</div>
	)
}

export default RandomBook2
