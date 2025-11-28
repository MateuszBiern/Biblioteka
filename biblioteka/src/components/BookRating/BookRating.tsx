import React, { useEffect, useState } from 'react'

type Props = {
	bookId: number
	userId?: number
}

const BookRating: React.FC<Props> = ({ bookId, userId }) => {
	const [userRating, setUserRating] = useState<number>(0)
	const [averageRating, setAverageRating] = useState<number>(0)
	const [totalRatings, setTotalRatings] = useState<number>(0)
	const [loading, setLoading] = useState<boolean>(false)

	// Funkcja pobiera średnią ocen i ocenę użytkownika
	const fetchRatings = async () => {
		setLoading(true)
		try {
			// Pobierz średnią ocen
			const avgRes = await fetch(`http://localhost/biblioteka/get_ratings.php?book_id=${bookId}`)
			const avgData = await avgRes.json()
			setAverageRating(avgData.average_rating)
			setTotalRatings(avgData.total_ratings)

			// Pobierz ocenę zalogowanego użytkownika tylko jeśli jest userId
			if (userId) {
				const userRes = await fetch(
					`http://localhost/biblioteka/get_user_rating.php?book_id=${bookId}&user_id=${userId}`
				)
				const userData = await userRes.json()
				setUserRating(userData.user_rating)
			} else {
				setUserRating(0)
			}
		} catch (err) {
			console.error('Błąd pobierania ocen:', err)
		} finally {
			setLoading(false)
		}
	}

	// Fetch przy mount i przy zmianie userId lub bookId
	useEffect(() => {
		fetchRatings()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [bookId, userId])

	const handleRating = (rating: number) => {
		if (!userId) {
			alert('Musisz być zalogowany, aby ocenić książkę!')
			return
		}

		setUserRating(rating)
		setLoading(true)

		fetch('http://localhost/biblioteka/rate_book.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				book_id: bookId,
				rating: parseFloat(rating.toFixed(1)), // <- WAŻNE: float z 1 miejscem po przecinku
				user_id: userId,
			}),
		})
			.then(res => res.json())
			.then(data => {
				if (data.success) {
					// odśwież średnią i licznik głosów
					return fetch(`http://localhost/biblioteka/get_ratings.php?book_id=${bookId}&user_id=${userId}`)
				} else {
					throw new Error(data.error || 'Błąd przy zapisie oceny')
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
							cursor: userId ? 'pointer' : 'not-allowed',
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
