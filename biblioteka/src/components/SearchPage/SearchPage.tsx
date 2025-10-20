/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

type Book = {
	description: string
	id: number
	title: string
	author: string
	tags: string[]
	cover_image?: string // DODANE
}

const SearchPage: React.FC = () => {
	const [searchParams, setSearchParams] = useSearchParams()
	const [books, setBooks] = useState<Book[]>([])
	const [allTags, setAllTags] = useState<string[]>([])
	const [selectedTags, setSelectedTags] = useState<string[]>([])
	const [loading, setLoading] = useState(true)

	// Pobierz książki i tagi
	useEffect(() => {
		const fetchData = async () => {
			try {
				const [booksRes, tagsRes] = await Promise.all([
					fetch('http://localhost/biblioteka/books.php'),
					fetch('http://localhost/biblioteka/tags.php'),
				])

				const booksData = await booksRes.json()
				const tagsData = await tagsRes.json()

				setBooks(booksData)
				setAllTags(tagsData.map((tag: any) => tag.name))
			} catch (error) {
				console.error('Błąd ładowania danych:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [])

	// Obsługa URL - jak są tagi w URL, to je zaznacz
	useEffect(() => {
		const urlTags = searchParams.get('tags')
		if (urlTags) {
			setSelectedTags(urlTags.split(','))
		}
	}, [searchParams])

	// Filtruj książki po tagach
	const filteredBooks =
		selectedTags.length > 0 ? books.filter(book => selectedTags.every(tag => book.tags.includes(tag))) : books

	const toggleTag = (tag: string) => {
		const newTags = selectedTags.includes(tag) ? selectedTags.filter(t => t !== tag) : [...selectedTags, tag]

		setSelectedTags(newTags)

		// Aktualizuj URL
		if (newTags.length > 0) {
			setSearchParams({ tags: newTags.join(',') })
		} else {
			setSearchParams({})
		}
	}

	if (loading) return <div>Ładowanie...</div>

	return (
		<div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
			<h1>🔍 Wyszukiwarka książek</h1>

			{/* Filtry tagów */}
			<div style={{ marginBottom: '30px' }}>
				<h3>Filtruj po tagach:</h3>
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
					{allTags.map(tag => (
						<button
							key={tag}
							onClick={() => toggleTag(tag)}
							style={{
								background: selectedTags.includes(tag) ? '#4CAF50' : '#e0e0e0',
								color: selectedTags.includes(tag) ? 'white' : 'black',
								padding: '8px 16px',
								border: 'none',
								borderRadius: '20px',
								cursor: 'pointer',
							}}>
							{tag}
						</button>
					))}
				</div>

				{selectedTags.length > 0 && (
					<div style={{ marginTop: '10px' }}>
						<small>Aktywne filtry: {selectedTags.join(', ')}</small>
						<button
							onClick={() => {
								setSelectedTags([])
								setSearchParams({})
							}}
							style={{ marginLeft: '10px', fontSize: '12px' }}>
							Wyczyść
						</button>
					</div>
				)}
			</div>

			{/* Lista książek */}
			<div>
				<h3>Znalezione książki ({filteredBooks.length}):</h3>

				<div style={{ display: 'grid', gap: '15px' }}>
					{filteredBooks.map(book => (
						<Link
							key={book.id}
							to={`/book/${book.id}`}
							style={{
								display: 'flex', // ZMIENIONE NA FLEX
								border: '1px solid #ddd',
								padding: '15px',
								borderRadius: '8px',
								textDecoration: 'none',
								color: 'inherit',
								cursor: 'pointer',
								transition: 'all 0.3s ease',
								gap: '15px', // Odstęp między zdjęciem a treścią
							}}
							onMouseEnter={e => {
								e.currentTarget.style.background = '#f9f9f9'
								e.currentTarget.style.transform = 'translateY(-2px)'
							}}
							onMouseLeave={e => {
								e.currentTarget.style.background = 'white'
								e.currentTarget.style.transform = 'translateY(0)'
							}}>
							{/* ZDJĘCIE PO LEWEJ */}
							{book.cover_image ? (
								<img
									src={book.cover_image}
									alt={`Okładka ${book.title}`}
									style={{
										width: '80px',
										height: '120px',
										objectFit: 'cover',
										borderRadius: '5px',
										flexShrink: 0, // Zapobiega zmniejszaniu zdjęcia
									}}
								/>
							) : (
								<div
									style={{
										width: '80px',
										height: '120px',
										background: '#f0f0f0',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										borderRadius: '5px',
										flexShrink: 0,
										color: '#999',
										fontSize: '12px',
										textAlign: 'center',
									}}>
									Brak okładki
								</div>
							)}

							{/* TREŚĆ PO PRAWEJ */}
							<div style={{ flex: 1 }}>
								<h4 style={{ margin: '0 0 8px 0', color: '#333' }}>{book.title}</h4>

								{book.description && (
									<p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
										<strong>Opis:</strong>{' '}
										{book.description.length > 150 ? `${book.description.substring(0, 150)}...` : book.description}
									</p>
								)}

								{/* Tagi */}
								<div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
									{book.tags.map(tag => (
										<span
											key={tag}
											style={{
												background: '#3a03ffff',
												color: 'white',
												padding: '4px 12px',
												borderRadius: '20px',
												fontSize: '12px',
												fontWeight: '500',
											}}>
											{tag}
										</span>
									))}
								</div>
							</div>
						</Link>
					))}
				</div>
			</div>
		</div>
	)
}

export default SearchPage
