/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './BookAdd.css'

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

	useEffect(() => {
		const handleClickOutside = () => {
			setShowTagDropdown(false)
		}

		document.addEventListener('click', handleClickOutside)
		return () => {
			document.removeEventListener('click', handleClickOutside)
		}
	}, [])

	const availableTags = allTags.filter(tag => !bookData.tags.includes(tag))

	const addChapter = () => {
		setBookData({
			...bookData,
			chapters: [...bookData.chapters, { title: '', content: '' }],
		})
	}

	const removeChapter = (index: number) => {
		if (bookData.chapters.length > 1) {
			const newChapters = bookData.chapters.filter((_, i) => i !== index)
			setBookData({ ...bookData, chapters: newChapters })
		}
	}

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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)

		try {
			const response = await fetch('http://localhost/biblioteka/add_book.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(bookData),
			})

			const responseText = await response.text()
			console.log('Odpowiedź z serwera (tekst):', responseText)

			let result
			try {
				result = JSON.parse(responseText)
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
			} catch (parseError) {
				throw new Error(`Serwer zwrócił HTML: ${responseText.substring(0, 200)}...`)
			}

			if (response.ok) {
				alert('Książka dodana pomyślnie!')
				navigate('/')
			} else {
				throw new Error(result.error || 'Błąd podczas dodawania książki')
			}
		} catch (error) {
			alert('Wystąpił błąd: ' + error)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="bookadd-container">
			<h1 className="bookadd-title"> Dodaj nową książkę</h1>

			<form onSubmit={handleSubmit} className="bookadd-form">
				{/* Podstawowe informacje */}
				<div className="section">
					<h3>Podstawowe informacje</h3>

					<div className="form-group">
						<label>Tytuł: *</label>
						<input
							type="text"
							value={bookData.title}
							onChange={e => setBookData({ ...bookData, title: e.target.value })}
							required
						/>
					</div>

					<div className="form-group">
						<label>Opis:</label>
						<textarea
							value={bookData.description}
							onChange={e => setBookData({ ...bookData, description: e.target.value })}
						/>
					</div>

					<div className="form-group">
						<label>Okładka:</label>
						<input
							type="file"
							accept="image/*"
							onChange={e => {
								const file = e.target.files?.[0]
								if (file) {
									if (file.size > 2 * 1024 * 1024) {
										alert('Plik za duży. Max 2MB.')
										return
									}
									const reader = new FileReader()
									reader.onload = e => {
										setBookData({ ...bookData, cover_image: e.target?.result as string })
									}
									reader.readAsDataURL(file)
								}
							}}
						/>
						{bookData.cover_image && (
							<div className="cover-preview">
								<img src={bookData.cover_image} alt="Podgląd" />
							</div>
						)}
					</div>
				</div>

				{/* Tagi */}
				<div className="section">
					<h3>Tagi</h3>

					<div className="tags-selected">
						{bookData.tags.map(tag => (
							<span className="tag-item" key={tag}>
								{tag}
								<button type="button" onClick={() => removeTag(tag)} className="tag-remove">
									×
								</button>
							</span>
						))}
					</div>

					<div className="tag-dropdown-wrapper">
						<button
							type="button"
							onClick={e => {
								e.stopPropagation()
								setShowTagDropdown(!showTagDropdown)
							}}
							className="btn-primary">
							+ Wybierz z istniejących tagów
						</button>

						{showTagDropdown && (
							<div className="tag-dropdown">
								{availableTags.length > 0 ? (
									availableTags.map(tag => (
										<div
											key={tag}
											className="tag-option"
											onClick={() => {
												setBookData({ ...bookData, tags: [...bookData.tags, tag] })
												setShowTagDropdown(false)
											}}>
											{tag}
										</div>
									))
								) : (
									<div className="tag-empty">Brak dostępnych tagów</div>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Rozdziały */}
				<div className="section">
					<h3>Rozdziały ({bookData.chapters.length})</h3>

					{bookData.chapters.map((chapter, index) => (
						<div key={index} className="chapter-box">
							<div className="chapter-header">
								<h4>Rozdział {index + 1}</h4>
								{bookData.chapters.length > 1 && (
									<button type="button" className="btn-danger" onClick={() => removeChapter(index)}>
										Usuń
									</button>
								)}
							</div>

							<div className="form-group">
								<label>Tytuł rozdziału: *</label>
								<input
									type="text"
									value={chapter.title}
									onChange={e => updateChapter(index, 'title', e.target.value)}
									required
								/>
							</div>

							<div className="form-group">
								<label>Treść rozdziału: *</label>
								<textarea
									value={chapter.content}
									onChange={e => updateChapter(index, 'content', e.target.value)}
									required
									placeholder="Treść rozdziału..."
								/>
							</div>
						</div>
					))}

					<button type="button" className="btn-secondary" onClick={addChapter}>
						+ Dodaj rozdział
					</button>
				</div>

				<button type="submit" className="btn-submit" disabled={loading}>
					{loading ? 'Dodawanie...' : 'Dodaj książkę'}
				</button>
			</form>
		</div>
	)
}

export default BookAdd
