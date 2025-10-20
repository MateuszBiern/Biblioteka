import React, { useState, useEffect, type ReactNode } from 'react'
import './BookDelete.css'

type Chapter = {
	id: number
	book_id: number
	chapter_order: number
	title: string
	content: string
}

type Book = {
	chapter_count: ReactNode
	id: number
	title: string
	description: string
	cover_image: string
	chapters: Chapter[]
}

const BookDelete: React.FC = () => {
	const [books, setBooks] = useState<Book[]>([])
	const [selectedBook, setSelectedBook] = useState<Book | null>(null)
	const [loading, setLoading] = useState(true)
	const [selectedChapters, setSelectedChapters] = useState<number[]>([])
	const [editingChapter, setEditingChapter] = useState<number | null>(null)
	const [editingBookTitle, setEditingBookTitle] = useState(false)
	const [tempBookTitle, setTempBookTitle] = useState('')
	const [editingBookDescription, setEditingBookDescription] = useState(false)
	const [tempBookDescription, setTempBookDescription] = useState('')

	const API_BASE = 'http://localhost/biblioteka/book_manager.php'

	// Pobierz wszystkie książki
	useEffect(() => {
		fetchBooks()
	}, [])

	const fetchBooks = async () => {
		try {
			const response = await fetch(`${API_BASE}?action=get_all_books`)
			const data = await response.json()
			setBooks(data)
		} catch (error) {
			console.error('Błąd ładowania książek:', error)
			alert('Błąd ładowania książek')
		} finally {
			setLoading(false)
		}
	}

	const fetchBookDetails = async (bookId: number) => {
		try {
			const response = await fetch(`${API_BASE}?action=get_book_details&id=${bookId}`)
			const bookData = await response.json()

			if (bookData.success === false) {
				alert('Błąd: ' + bookData.error)
				return
			}

			setSelectedBook(bookData)
			setTempBookTitle(bookData.title)
			setTempBookDescription(bookData.description || '')
		} catch (error) {
			console.error('Błąd ładowania szczegółów książki:', error)
			alert('Błąd ładowania szczegółów książki')
		}
	}

	// Masowe usuwanie rozdziałów
	const deleteSelectedChapters = async () => {
		if (!selectedBook || selectedChapters.length === 0) return

		try {
			const response = await fetch(`${API_BASE}?action=delete_chapters`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					chapterIds: selectedChapters,
				}),
			})

			const result = await response.json()
			if (result.success) {
				alert(`Usunięto ${selectedChapters.length} rozdziałów`)
				// Odśwież dane książki
				fetchBookDetails(selectedBook.id)
				setSelectedChapters([])
			} else {
				alert('Błąd: ' + result.error)
			}
		} catch (error) {
			console.error('Błąd:', error)
			alert('Wystąpił błąd podczas usuwania rozdziałów')
		}
	}

	// Aktualizacja rozdziału
	const updateChapter = async (chapterId: number, field: string, value: string) => {
		try {
			const response = await fetch(`${API_BASE}?action=update_chapter`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					chapterId,
					field,
					value,
				}),
			})

			const result = await response.json()
			if (!result.success) {
				alert('Błąd: ' + result.error)
				// Odśwież dane w przypadku błędu
				if (selectedBook) {
					fetchBookDetails(selectedBook.id)
				}
			} else {
				alert('Zmiany zapisane!')
			}
		} catch (error) {
			console.error('Błąd:', error)
			alert('Wystąpił błąd podczas aktualizacji rozdziału')
		}
	}

	// Aktualizacja tytułu książki
	const updateBookTitle = async () => {
		if (!selectedBook) return

		try {
			const response = await fetch(`${API_BASE}?action=update_book_title`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					bookId: selectedBook.id,
					title: tempBookTitle,
				}),
			})

			const result = await response.json()
			if (result.success) {
				alert('Tytuł książki zaktualizowany!')
				setSelectedBook({ ...selectedBook, title: tempBookTitle })
				setEditingBookTitle(false)
				fetchBooks() // Odśwież listę książek
			} else {
				alert('Błąd: ' + result.error)
			}
		} catch (error) {
			console.error('Błąd:', error)
			alert('Wystąpił błąd podczas aktualizacji tytułu')
		}
	}

	// Funkcja do aktualizacji opisu książki
	const updateBookDescription = async () => {
		if (!selectedBook) return

		try {
			const response = await fetch(`${API_BASE}?action=update_book_description`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					bookId: selectedBook.id,
					description: tempBookDescription,
				}),
			})

			const result = await response.json()
			if (result.success) {
				alert('Opis książki zaktualizowany!')
				setSelectedBook({ ...selectedBook, description: tempBookDescription })
				setEditingBookDescription(false)
				fetchBooks() // Odśwież listę książek
			} else {
				alert('Błąd: ' + result.error)
			}
		} catch (error) {
			console.error('Błąd:', error)
			alert('Wystąpił błąd podczas aktualizacji opisu')
		}
	}

	// Usuwanie całej książki
	const deleteBook = async (bookId: number) => {
		if (!confirm('Czy na pewno chcesz usunąć tę książkę? Tej operacji nie można cofnąć.')) {
			return
		}

		try {
			const response = await fetch(`${API_BASE}?action=delete_book`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ bookId }),
			})

			const result = await response.json()
			if (result.success) {
				alert('Książka została usunięta')
				setSelectedBook(null)
				fetchBooks() // Odśwież listę książek
			} else {
				alert('Błąd: ' + result.error)
			}
		} catch (error) {
			console.error('Błąd:', error)
			alert('Wystąpił błąd podczas usuwania książki')
		}
	}

	if (loading) {
		return <div className="loading">Ładowanie książek...</div>
	}

	// Widok listy książek
	if (!selectedBook) {
		return (
			<div className="book-manager">
				<h1>📚 Zarządzanie książkami</h1>
				<p>Wybierz książkę do zarządzania:</p>

				<div className="books-grid">
					{books.map(book => (
						<div key={book.id} className="book-card_delete" onClick={() => fetchBookDetails(book.id)}>
							{book.cover_image && (
								<img
									src={`http://localhost/biblioteka/${book.cover_image}`}
									alt={book.title}
									className="book-cover"
									onError={e => {
										// Fallback jeśli obrazek się nie ładuje
										;(e.target as HTMLImageElement).style.display = 'none'
									}}
								/>
							)}

							<div className="book-info">
								<h3 className="book-title_delete">{book.title}</h3>

								{book.description && <p className="book-description">{book.description.substring(0, 100)}...</p>}
							</div>
							<button
								onClick={e => {
									e.stopPropagation()
									deleteBook(book.id)
								}}
								className="delete-book-btn">
								🗑️ Usuń
							</button>
						</div>
					))}
				</div>

				{books.length === 0 && <div className="no-books">Brak książek w bibliotece</div>}
			</div>
		)
	}

	// Widok zarządzania pojedynczą książką
	return (
		<div className="book-manager">
			{/* Nagłówek z powrotem do listy */}
			<div className="book-header">
				<button onClick={() => setSelectedBook(null)} className="back-btn">
					← Wróć do listy
				</button>

				<div className="book-title-section">
					{editingBookTitle ? (
						<div className="title-edit">
							<input
								type="text"
								value={tempBookTitle}
								onChange={e => setTempBookTitle(e.target.value)}
								className="title-input"
							/>
							<button onClick={updateBookTitle} className="save-title-btn">
								💾 Zapisz
							</button>
							<button
								onClick={() => {
									setEditingBookTitle(false)
									setTempBookTitle(selectedBook.title)
								}}
								className="cancel-title-btn">
								❌ Anuluj
							</button>
						</div>
					) : (
						<div className="title-display">
							<h1 className="book-title-main">📖 {selectedBook.title}</h1>
							<button onClick={() => setEditingBookTitle(true)} className="edit-title-btn">
								✏️ Edytuj tytuł
							</button>
						</div>
					)}
				</div>

				<button onClick={() => deleteBook(selectedBook.id)} className="delete-book-main-btn">
					🗑️ Usuń książkę
				</button>
			</div>

			{/* Sekcja opisu książki */}
			<div className="book-description-section">
				<strong>Opis:</strong>
				{editingBookDescription ? (
					<div className="description-edit">
						<textarea
							value={tempBookDescription}
							onChange={e => setTempBookDescription(e.target.value)}
							className="description-textarea"
							rows={4}
						/>
						<div className="description-actions">
							<button onClick={updateBookDescription} className="save-description-btn">
								💾 Zapisz
							</button>
							<button
								onClick={() => {
									setEditingBookDescription(false)
									setTempBookDescription(selectedBook.description || '')
								}}
								className="cancel-description-btn">
								❌ Anuluj
							</button>
						</div>
					</div>
				) : (
					<div className="description-display">
						<p>{selectedBook.description || 'Brak opisu'}</p>
						<button onClick={() => setEditingBookDescription(true)} className="edit-description-btn">
							✏️ Edytuj opis
						</button>
					</div>
				)}
			</div>

			{/* Masowe usuwanie rozdziałów */}
			<div className="bulk-actions">
				<span className="selected-count">Zaznaczono: {selectedChapters.length} rozdziałów</span>
				{selectedChapters.length > 0 && (
					<button onClick={deleteSelectedChapters} className="delete-selected-btn">
						🗑️ Usuń zaznaczone
					</button>
				)}
				<button onClick={() => setSelectedChapters([])} className="clear-selection-btn">
					❌ Wyczyść zaznaczenie
				</button>
			</div>

			{/* Kontener z rozdziałami i podglądem */}
			<div className="chapters-container">
				{/* Lista rozdziałów - lewa strona */}
				<div className="chapters-list">
					<h3>Rozdziały ({selectedBook.chapters?.length || 0})</h3>
					{selectedBook.chapters?.map(chapter => (
						<div key={chapter.id} className={`chapter-item ${selectedChapters.includes(chapter.id) ? 'selected' : ''}`}>
							<div className="chapter-header">
								<input
									type="checkbox"
									checked={selectedChapters.includes(chapter.id)}
									onChange={e => {
										if (e.target.checked) {
											setSelectedChapters(prev => [...prev, chapter.id])
										} else {
											setSelectedChapters(prev => prev.filter(id => id !== chapter.id))
										}
									}}
									className="chapter-checkbox"
								/>
								<span className="chapter-number">Rozdział {chapter.chapter_order}:</span>
								<span className="chapter-title-preview">{chapter.title}</span>
								<button
									onClick={() => setEditingChapter(editingChapter === chapter.id ? null : chapter.id)}
									className="edit-chapter-btn">
									{editingChapter === chapter.id ? '❌ Anuluj' : '✏️ Edytuj'}
								</button>
							</div>
						</div>
					))}
				</div>

				{/* Edycja rozdziału - prawa strona */}
				<div className="chapter-editor">
					{editingChapter && selectedBook.chapters?.find(ch => ch.id === editingChapter) && (
						<div className="editor-panel">
							<h3>Edycja rozdziału</h3>
							{(() => {
								const chapter = selectedBook.chapters.find(ch => ch.id === editingChapter)
								if (!chapter) return null

								return (
									<>
										<div className="form-group">
											<label>Numer rozdziału:</label>
											<div className="chapter-order-display">{chapter.chapter_order}</div>
										</div>

										<div className="form-group">
											<label>Tytuł rozdziału:</label>
											<input
												type="text"
												value={chapter.title}
												onChange={e => {
													const updatedChapters = selectedBook.chapters.map(c =>
														c.id === chapter.id ? { ...c, title: e.target.value } : c
													)
													setSelectedBook({ ...selectedBook, chapters: updatedChapters })
												}}
												className="form-input"
											/>
										</div>

										<div className="form-group">
											<label>Treść rozdziału:</label>
											<textarea
												value={chapter.content}
												onChange={e => {
													const updatedChapters = selectedBook.chapters.map(c =>
														c.id === chapter.id ? { ...c, content: e.target.value } : c
													)
													setSelectedBook({ ...selectedBook, chapters: updatedChapters })
												}}
												className="form-textarea"
											/>
										</div>

										<div className="editor-actions">
											<button
												onClick={() => {
													updateChapter(chapter.id, 'title', chapter.title)
													updateChapter(chapter.id, 'content', chapter.content)
												}}
												className="save-chapter-btn">
												💾 Zapisz zmiany
											</button>
											<button onClick={() => setEditingChapter(null)} className="cancel-edit-btn">
												❌ Anuluj
											</button>
										</div>

										<div className="content-preview">
											<h4>Podgląd treści:</h4>
											<div className="preview-content">{chapter.content.substring(0, 500)}...</div>
										</div>
									</>
								)
							})()}
						</div>
					)}
				</div>
			</div>

			{(!selectedBook.chapters || selectedBook.chapters.length === 0) && (
				<div className="no-chapters">Brak rozdziałów w tej książce</div>
			)}
		</div>
	)
}

export default BookDelete
