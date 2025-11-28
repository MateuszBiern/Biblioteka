/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Ranking.css'

type Book = {
	id: number
	title: string
	cover_image?: string
	average_rating?: number
}

const Ranking: React.FC = () => {
	const [books, setBooks] = useState<Book[]>([])

	useEffect(() => {
		const fetchRanking = async () => {
			try {
				const res = await fetch('http://localhost/biblioteka/books.php')
				const data = await res.json()

				const booksWithRatings = await Promise.all(
					data.map(async (book: any) => {
						try {
							const resRating = await fetch(`http://localhost/biblioteka/get_ratings.php?book_id=${book.id}`)
							const ratingsData = await resRating.json()
							const avg =
								Array.isArray(ratingsData) && ratingsData.length > 0
									? ratingsData[0].average_rating
									: ratingsData.average_rating || 0
							return { ...book, average_rating: parseFloat(avg) || 0 }
						} catch {
							return { ...book, average_rating: 0 }
						}
					})
				)

				const topBooks = booksWithRatings.sort((a, b) => b.average_rating - a.average_rating).slice(0, 5)
				setBooks(topBooks)
			} catch (err) {
				console.error(err)
			}
		}

		fetchRanking()
	}, [])

	return (
		<div className="ranking-container">
			<h1 className="ranking-title">Top 5 najlepiej ocenianych książek</h1>
			<div className="ranking-list">
				{books.map((book, index) => (
					<Link to={`/book/${book.id}`} key={book.id} className="ranking-item-link">
						<div className="ranking-item">
							<div className="ranking-position">#{index + 1}</div>
							<div className="ranking-image" style={{ backgroundImage: `url(${book.cover_image || ''})` }} />
							<div className="ranking-info">
								<p className="ranking-book-title">{book.title}</p>
								<p className="ranking-rating"> {book.average_rating?.toFixed(1) || '0.0'}</p>
							</div>
						</div>
					</Link>
				))}
			</div>
		</div>
	)
}

export default Ranking
