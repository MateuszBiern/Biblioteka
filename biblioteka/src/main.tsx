import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Header from './components/header/header'
import BookPage from './components/BookPage/BookPage'
import Carusel from './components/carusel/carusel'
import ChapterPage from './components/ChapterPage/ChapterPage'
import SearchPage from './components/SearchPage/SearchPage'
import BookAdd from './components/BookAdd/BookAdd'
import BookDelete from './components/BookDelete/BookDelete'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<BrowserRouter>
			<Header />
			<Routes>
				<Route path="/" element={<Carusel />} />
				<Route path="/book/:id" element={<BookPage />} />
				<Route path="/book/:id/chapter/:chapterId" element={<ChapterPage />} />
				<Route path="/searchPage" element={<SearchPage />} />
				<Route path="/add-book" element={<BookAdd />} />
				<Route path="/delete-book" element={<BookDelete />} />
			</Routes>
		</BrowserRouter>
	</React.StrictMode>
)
