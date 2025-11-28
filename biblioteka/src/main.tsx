import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import BookDelete from './components/BookDelete/BookDelete'
import Header from './components/header/header'
import MainPage from './HomePage'
import BookPage from './components/BookPage/BookPage'
import ChapterPage from './components/ChapterPage/ChapterPage'
import SearchPage from './components/SearchPage/SearchPage'
import BookAdd from './components/BookAdd/BookAdd'
import Ranking from './components/Ranking/Ranking'
import RandomBook from './components/RandomBook/RandomBook'
import RandomBook2 from './components/RandomBook2/RandomBook2'
import Login from './components/Login/Login'

import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<BrowserRouter>
			<Header />
			<Routes>
				<Route path="/" element={<MainPage />} />
				<Route path="/book/:id" element={<BookPage />} />
				<Route path="/book/:id/chapter/:chapterId" element={<ChapterPage />} />
				<Route path="/searchPage" element={<SearchPage />} />

				<Route path="/add-book" element={<BookAdd />} />

				<Route path="/delete-book/:id" element={<BookDelete />} />

				<Route path="/ranking" element={<Ranking />} />
				<Route path="/random-book" element={<RandomBook />} />
				<Route path="/random-book-2" element={<RandomBook2 />} />

				<Route
					path="/login"
					element={
						<Login
							onLogin={() => window.location.replace('/')}
							onClose={function (): void {
								throw new Error('Function not implemented.')
							}}
						/>
					}
				/>
			</Routes>
		</BrowserRouter>
	</React.StrictMode>
)
