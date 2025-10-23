import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './Carusel.css'

type Book = {
	id: number
	title: string
	author: string
	cover_image?: string
}

const Carusel: React.FC = () => {
	const [books, setBooks] = useState<Book[]>([])
	const [currentIndex, setCurrentIndex] = useState(0)
	const [isDragging, setIsDragging] = useState(false)
	const [startX, setStartX] = useState(0)
	const caruselRef = useRef<HTMLDivElement>(null)
	const navigate = useNavigate()

	useEffect(() => {
		fetch('http://localhost/biblioteka/books.php')
			.then(res => res.json())
			.then(data => {
				if (data.error) {
					console.error('Błąd PHP:', data.error)
					return
				}
				setBooks(data)
			})
			.catch(err => console.error('Błąd fetch:', err))
	}, [])

	// Funkcje nawigacji
	const prev = () => {
		setCurrentIndex(prevIndex => (prevIndex === 0 ? books.length - 1 : prevIndex - 1))
	}

	const next = () => {
		setCurrentIndex(prevIndex => (prevIndex === books.length - 1 ? 0 : prevIndex + 1))
	}

	const goToBook = (bookId: number) => {
		navigate(`/book/${bookId}`)
	}

	// Obsługa przeciągania
	const handleMouseDown = (e: React.MouseEvent) => {
		setIsDragging(true)
		setStartX(e.clientX)
	}

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isDragging) return

		const currentX = e.clientX
		const diff = startX - currentX

		// Próg przeciągnięcia - 50px
		if (diff > 50) {
			next()
			setIsDragging(false)
		} else if (diff < -50) {
			prev()
			setIsDragging(false)
		}
	}

	const handleMouseUp = () => {
		setIsDragging(false)
	}

	// Obsługa dotyku
	const handleTouchStart = (e: React.TouchEvent) => {
		setIsDragging(true)
		setStartX(e.touches[0].clientX)
	}

	const handleTouchMove = (e: React.TouchEvent) => {
		if (!isDragging) return

		const currentX = e.touches[0].clientX
		const diff = startX - currentX

		if (diff > 50) {
			next()
			setIsDragging(false)
		} else if (diff < -50) {
			prev()
			setIsDragging(false)
		}
	}

	if (books.length === 0) {
		return <div className="carusel-loading">Ładowanie książek...</div>
	}

	const currentBook = books[currentIndex]
	const nextBook = books[(currentIndex + 1) % books.length]
	const prevBook = books[(currentIndex - 1 + books.length) % books.length]

	return (
		<div className="carusel">
			<h1 className="carusel-title">Popularne Książki</h1>

			<div
				className="carusel-container"
				ref={caruselRef}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleMouseUp}
				style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
				{/* Lewa książka (poprzednia) */}
				<div
					className="book-card book-prev"
					onClick={() => setCurrentIndex((currentIndex - 1 + books.length) % books.length)}>
					{prevBook.cover_image ? (
						<img src={prevBook.cover_image} alt={prevBook.title} />
					) : (
						<div className="book-placeholder">📖</div>
					)}
					<div className="book-info">
						<h3>{prevBook.title}</h3>
					</div>
				</div>

				{/* Środkowa książka (aktualna) */}
				<div className="book-card book-current" onClick={() => goToBook(currentBook.id)}>
					{currentBook.cover_image ? (
						<img src={currentBook.cover_image} alt={currentBook.title} />
					) : (
						<div className="book-placeholder">📖</div>
					)}
					<div className="book-info">
						<h2>{currentBook.title}</h2>
						<button className="read-btn" onClick={() => goToBook(currentBook.id)}>
							Czytaj
						</button>
					</div>
				</div>

				{/* Prawa książka (następna) */}
				<div className="book-card book-next" onClick={() => setCurrentIndex((currentIndex + 1) % books.length)}>
					{nextBook.cover_image ? (
						<img src={nextBook.cover_image} alt={nextBook.title} />
					) : (
						<div className="book-placeholder">📖</div>
					)}
					<div className="book-info">
						<h3>{nextBook.title}</h3>
					</div>
				</div>
			</div>

			{/* Przyciski nawigacji */}
			<div className="carusel-controls">
				<button className="nav-btn" onClick={prev}>
					◀
				</button>
				<div className="carusel-dots">
					{books.map((_, index) => (
						<button
							key={index}
							className={`dot ${index === currentIndex ? 'active' : ''}`}
							onClick={() => setCurrentIndex(index)}
						/>
					))}
				</div>
				<button className="nav-btn" onClick={next}>
					▶
				</button>
			</div>
		</div>
	)
}

export default Carusel
