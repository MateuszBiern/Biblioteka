import React, { useEffect, useState } from 'react'

type Props = {
	bookId: number
}

const BookRating: React.FC<Props> = ({ bookId }) => {
	const [userRating, setUserRating] = useState<number>(0)
	const [averageRating, setAverageRating] = useState<number>(0)
	const [totalRatings, setTotalRatings] = useState<number>(0)
	const [loading, setLoading] = useState<boolean>(false)

	// Pobierz oceny przy mount
	useEffect(() => {
		setLoading(true)
		fetch(`http://localhost/biblioteka/get_ratings.php?book_id=${bookId}`)
			.then(res => res.json())
			.then(data => {
				setAverageRating(data.average_rating)
				setTotalRatings(data.total_ratings)
			})
			.catch(err => console.error('Błąd fetch ocen:', err))
			.finally(() => setLoading(false))
	}, [bookId])

	const handleRating = (rating: number) => {
		setUserRating(rating)
		setLoading(true)
		fetch('http://localhost/biblioteka/rate_book.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ book_id: bookId, rating }),
		})
			.then(res => res.json())
			.then(data => {
				if (data.success) {
					// pobierz ponownie średnią
					return fetch(`http://localhost/biblioteka/get_ratings.php?book_id=${bookId}`)
				} else {
					throw new Error('Błąd przy zapisie oceny')
				}
			})
			.then(res => res.json())
			.then(data => {
				setAverageRating(data.average_rating)
				setTotalRatings(data.total_ratings)
			})
			.catch(err => console.error(err))
			.finally(() => setLoading(false))
	}

	return (
		<div style={{ marginBottom: '15px' }}>
			<p style={{ margin: '0 0 5px 0' }}>
				Średnia ocena: {averageRating} / 5 ({totalRatings} głosów)
			</p>
			<div>
				{[1, 2, 3, 4, 5].map(star => (
					<span
						key={star}
						onClick={() => handleRating(star)}
						style={{
							fontSize: '1.5rem',
							color: star <= (userRating || Math.round(averageRating)) ? '#FFD700' : '#ccc',
							cursor: 'pointer',
							marginRight: '5px',
						}}>
						★
					</span>
				))}
				{loading && <span style={{ marginLeft: '10px' }}>Zapisywanie...</span>}
			</div>
		</div>
	)
}

export default BookRating
