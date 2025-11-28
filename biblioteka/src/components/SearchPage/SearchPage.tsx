/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

import './SearchPage.css'

type Book = {
	description: string
	id: number
	title: string
	author: string
	tags: string[]
	cover_image?: string
}

const ITEMS_PER_PAGE = 10

const SearchPage: React.FC = () => {
	const [searchParams, setSearchParams] = useSearchParams()
	const [books, setBooks] = useState<Book[]>([])
	const [allTags, setAllTags] = useState<string[]>([])
	const [selectedTags, setSelectedTags] = useState<string[]>([])
	const [titleSearch, setTitleSearch] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [loading, setLoading] = useState(true)

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

	useEffect(() => {
		const urlTags = searchParams.get('tags')
		if (urlTags) setSelectedTags(urlTags.split(','))
	}, [searchParams])

	const filteredBooks = books.filter(book => {
		const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => book.tags.includes(tag))
		const matchesTitle = book.title.toLowerCase().includes(titleSearch.toLowerCase())
		return matchesTags && matchesTitle
	})

	const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE)
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
	const endIndex = startIndex + ITEMS_PER_PAGE
	const paginatedBooks = filteredBooks.slice(startIndex, endIndex)

	const toggleTag = (tag: string) => {
		const newTags = selectedTags.includes(tag) ? selectedTags.filter(t => t !== tag) : [...selectedTags, tag]
		setSelectedTags(newTags)
		setSearchParams(newTags.length > 0 ? { tags: newTags.join(',') } : {})
		setCurrentPage(1) // reset strony
	}

	const goToPage = (page: number) => {
		if (page >= 1 && page <= totalPages) setCurrentPage(page)
	}

	const renderPagination = () => {
		if (totalPages <= 1) return null
		const pages: (number | string)[] = []

		const visiblePages = 5
		const half = Math.floor(visiblePages / 2)
		let start = Math.max(1, currentPage - half)
		let end = Math.min(totalPages, currentPage + half)

		if (currentPage - half <= 0) end = Math.min(totalPages, visiblePages)
		if (currentPage + half > totalPages) start = Math.max(1, totalPages - visiblePages + 1)

		if (start > 1) pages.push(1, '...')
		for (let i = start; i <= end; i++) pages.push(i)
		if (end < totalPages) pages.push('...', totalPages)

		return (
			<div className="pagination">
				<button disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>
					&lt;
				</button>
				{pages.map((p, idx) =>
					p === '...' ? (
						<span key={idx} className="dots">
							...
						</span>
					) : (
						<button key={idx} className={p === currentPage ? 'active' : ''} onClick={() => goToPage(Number(p))}>
							{p}
						</button>
					)
				)}
				<button disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>
					&gt;
				</button>
			</div>
		)
	}

	if (loading) return <div>Ładowanie...</div>

	return (
		<div className="search-page-container">
			<h1>Wyszukiwarka książek</h1>

			<input
				type="text"
				className="search-input"
				placeholder="Wpisz tytuł książki..."
				value={titleSearch}
				onChange={e => {
					setTitleSearch(e.target.value)
					setCurrentPage(1)
				}}
			/>

			<div className="tags-filter">
				<h3>Filtruj po tagach:</h3>
				<div className="tags-buttons">
					{allTags.map(tag => (
						<button key={tag} className={selectedTags.includes(tag) ? 'tag-active' : ''} onClick={() => toggleTag(tag)}>
							{tag}
						</button>
					))}
				</div>

				{selectedTags.length > 0 && (
					<div className="active-tags">
						<small>Aktywne filtry: {selectedTags.join(', ')}</small>
						<button
							className="clear-tags"
							onClick={() => {
								setSelectedTags([])
								setSearchParams({})
								setCurrentPage(1)
							}}>
							Wyczyść
						</button>
					</div>
				)}
			</div>

			<h3>Znalezione książki ({filteredBooks.length}):</h3>
			<div className="books-list">
				{paginatedBooks.map(book => (
					<Link key={book.id} to={`/book/${book.id}`} className="book-item">
						{book.cover_image ? (
							<img src={book.cover_image} alt={book.title} className="book-cover" />
						) : (
							<div className="book-no-cover">Brak okładki</div>
						)}

						<div className="book-info">
							<h4>{book.title}</h4>
							{book.description && (
								<p>{book.description.length > 150 ? `${book.description.substring(0, 150)}...` : book.description}</p>
							)}
							<div className="book-tags">
								{book.tags.map(tag => (
									<span key={tag}>{tag}</span>
								))}
							</div>
						</div>
					</Link>
				))}
			</div>

			{renderPagination()}
		</div>
	)
}

export default SearchPage
