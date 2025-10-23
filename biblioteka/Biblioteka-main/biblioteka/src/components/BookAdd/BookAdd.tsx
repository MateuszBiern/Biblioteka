/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'

import { useNavigate } from 'react-router-dom'

type Chapter = {
	title: string
	content: string
}

type BookData = {
	title: string
	author: string
	description: string
	cover_image: string
	tags: string[]
	chapters: Chapter[]
}

const BookAdd: React.FC = () => {
	const [bookData, setBookData] = useState<BookData>({
		title: '',
		author: '',
		description: '',
		cover_image: '',
		tags: [],
		chapters: [{ title: '', content: '' }],
	})

	const [allTags, setAllTags] = useState<string[]>([])
	const [showTagDropdown, setShowTagDropdown] = useState(false)
	const [loading, setLoading] = useState(false)
	const navigate = useNavigate()

	// Pobierz tagi z bazy
	useEffect(() => {
		const fetchTags = async () => {
			try {
				const response = await fetch('http://localhost/biblioteka/tags.php')
				const tagsData = await response.json()
				setAllTags(tagsData.map((tag: any) => tag.name))
			} catch (error) {
				console.error('Błąd ładowania tagów:', error)
			}
		}

		fetchTags()
	}, [])

	// Zamykanie dropdown po kliknięciu gdzieś indziej
	useEffect(() => {
		const handleClickOutside = () => {
			setShowTagDropdown(false)
		}

		document.addEventListener('click', handleClickOutside)
		return () => {
			document.removeEventListener('click', handleClickOutside)
		}
	}, [])

	// Dostępne tagi (te które nie są jeszcze wybrane)
	const availableTags = allTags.filter(tag => !bookData.tags.includes(tag))

	// Dodawanie nowego rozdziału
	const addChapter = () => {
		setBookData({
			...bookData,
			chapters: [...bookData.chapters, { title: '', content: '' }],
		})
	}

	// Usuwanie rozdziału
	const removeChapter = (index: number) => {
		if (bookData.chapters.length > 1) {
			const newChapters = bookData.chapters.filter((_, i) => i !== index)
			setBookData({ ...bookData, chapters: newChapters })
		}
	}

	// Aktualizacja rozdziału
	const updateChapter = (index: number, field: keyof Chapter, value: string) => {
		const newChapters = [...bookData.chapters]
		newChapters[index][field] = value
		setBookData({ ...bookData, chapters: newChapters })
	}

	const removeTag = (tagToRemove: string) => {
		setBookData({
			...bookData,
			tags: bookData.tags.filter(tag => tag !== tagToRemove),
		})
	}

	// Submit formularza
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)

		try {
			const response = await fetch('http://localhost/biblioteka/add_book.php', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(bookData),
			})

			// Najpierw sprawdźmy czy odpowiedź to tekst czy JSON
			const responseText = await response.text()
			console.log('Odpowiedź z serwera (tekst):', responseText)

			let result
			try {
				result = JSON.parse(responseText)
			} catch (parseError) {
				console.error('Błąd parsowania JSON:', parseError)
				throw new Error(`Serwer zwrócił błąd HTML: ${responseText.substring(0, 200)}...`)
			}

			if (response.ok) {
				alert('Książka dodana pomyślnie!')
				navigate('/')
			} else {
				throw new Error(result.error || 'Błąd podczas dodawania książki')
			}
		} catch (error) {
			console.error('Error:', error)
			alert('Wystąpił błąd podczas dodawania książki: ' + error)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
			<h1>➕ Dodaj nową książkę</h1>

			<form onSubmit={handleSubmit}>
				{/* Podstawowe informacje */}
				<div style={{ marginBottom: '20px' }}>
					<h3>Podstawowe informacje</h3>

					<div style={{ marginBottom: '10px' }}>
						<label>Tytuł: *</label>
						<input
							type="text"
							value={bookData.title}
							onChange={e => setBookData({ ...bookData, title: e.target.value })}
							required
							style={{ width: '100%', padding: '8px', marginTop: '5px' }}
						/>
					</div>

					<div style={{ marginBottom: '10px' }}>
						<label>Opis:</label>
						<textarea
							value={bookData.description}
							onChange={e => setBookData({ ...bookData, description: e.target.value })}
							style={{ width: '100%', padding: '8px', marginTop: '5px', minHeight: '80px' }}
						/>
					</div>

					<div style={{ marginBottom: '10px' }}>
						<label>Okładka:</label>
						<input
							type="file"
							accept="image/*"
							onChange={e => {
								const file = e.target.files?.[0]
								if (file) {
									// Sprawdź rozmiar pliku (max 2MB)
									if (file.size > 2 * 1024 * 1024) {
										alert('Plik jest za duży. Maksymalny rozmiar to 2MB.')
										return
									}

									const reader = new FileReader()
									reader.onload = e => {
										setBookData({ ...bookData, cover_image: e.target?.result as string })
									}
									reader.readAsDataURL(file)
								}
							}}
							style={{ width: '100%', padding: '8px', marginTop: '5px' }}
						/>
						{bookData.cover_image && (
							<div style={{ marginTop: '10px' }}>
								<img
									src={bookData.cover_image}
									alt="Podgląd"
									style={{ maxWidth: '200px', maxHeight: '200px', border: '1px solid #ddd' }}
								/>
							</div>
						)}
					</div>
				</div>

				{/* Tagi */}
				<div style={{ marginBottom: '20px' }}>
					<h3>Tagi</h3>

					{/* Wyświetl wybrane tagi */}
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
						{bookData.tags.map(tag => (
							<span
								key={tag}
								style={{
									background: '#4CAF50',
									color: 'white',
									padding: '5px 10px',
									borderRadius: '15px',
									display: 'flex',
									alignItems: 'center',
									gap: '5px',
								}}>
								{tag}
								<button
									type="button"
									onClick={() => removeTag(tag)}
									style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
									×
								</button>
							</span>
						))}
					</div>

					{/* Dropdown z tagami */}
					<div style={{ position: 'relative', marginBottom: '10px' }}>
						<button
							type="button"
							onClick={e => {
								e.stopPropagation()
								setShowTagDropdown(!showTagDropdown)
							}}
							style={{ padding: '8px 16px' }}>
							+ Wybierz z istniejących tagów
						</button>

						{showTagDropdown && (
							<div
								style={{
									position: 'absolute',
									top: '100%',
									left: 0,
									background: 'white',
									border: '1px solid #ddd',
									borderRadius: '5px',
									boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
									zIndex: 1000,
									maxHeight: '200px',
									overflowY: 'auto',
									width: '200px',
								}}>
								{availableTags.length > 0 ? (
									availableTags.map(tag => (
										<div
											key={tag}
											onClick={() => {
												setBookData({
													...bookData,
													tags: [...bookData.tags, tag],
												})
												setShowTagDropdown(false)
											}}
											style={{
												padding: '8px 12px',
												cursor: 'pointer',
												borderBottom: '1px solid #f0f0f0',
											}}
											onMouseEnter={e => {
												e.currentTarget.style.background = '#f5f5f5'
											}}
											onMouseLeave={e => {
												e.currentTarget.style.background = 'white'
											}}>
											{tag}
										</div>
									))
								) : (
									<div style={{ padding: '8px 12px', color: '#999' }}>Brak dostępnych tagów</div>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Rozdziały */}
				<div style={{ marginBottom: '20px' }}>
					<h3>Rozdziały ({bookData.chapters.length})</h3>

					{bookData.chapters.map((chapter, index) => (
						<div
							key={index}
							style={{
								border: '1px solid #ddd',
								padding: '15px',
								marginBottom: '15px',
								borderRadius: '5px',
							}}>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									marginBottom: '10px',
								}}>
								<h4>Rozdział {index + 1}</h4>
								{bookData.chapters.length > 1 && (
									<button type="button" onClick={() => removeChapter(index)}>
										Usuń
									</button>
								)}
							</div>

							<div style={{ marginBottom: '10px' }}>
								<label>Tytuł rozdziału: *</label>
								<input
									type="text"
									value={chapter.title}
									onChange={e => updateChapter(index, 'title', e.target.value)}
									required
									style={{ width: '100%', padding: '8px', marginTop: '5px' }}
								/>
							</div>

							<div style={{ marginBottom: '10px' }}>
								<label>Treść rozdziału: *</label>
								<textarea
									value={chapter.content}
									onChange={e => updateChapter(index, 'content', e.target.value)}
									required
									style={{ width: '100%', padding: '8px', marginTop: '5px', minHeight: '150px' }}
									placeholder="Treść rozdziału..."
								/>
							</div>
						</div>
					))}

					<button type="button" onClick={addChapter}>
						+ Dodaj rozdział
					</button>
				</div>

				{/* Submit */}
				<button
					type="submit"
					disabled={loading}
					style={{
						padding: '12px 24px',
						background: loading ? '#ccc' : '#4CAF50',
						color: 'white',
						border: 'none',
						borderRadius: '5px',
						cursor: loading ? 'not-allowed' : 'pointer',
					}}>
					{loading ? 'Dodawanie...' : 'Dodaj książkę'}
				</button>
			</form>
		</div>
	)
}

export default BookAdd
