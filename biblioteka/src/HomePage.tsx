import React from 'react'
import Carusel from './components/carusel/carusel'
import RecentBooks from './components/RecentBooks/RecentBooks'
import Ranking from './components/Ranking/Ranking'

import RandomBook from './components/RandomBook/RandomBook'
import RandomBook2 from './components/RandomBook2/RandomBook2'

import './HomePage.css'

const HomePage: React.FC = () => {
	return (
		<div className="home-container">
			<section className="home-carusel">
				<Carusel />
			</section>

			<section className="home-content">
				<div className="home-left">
					<RandomBook />
					<RandomBook2 />
				</div>

				<aside className="home-right">
					<Ranking />
				</aside>
			</section>
			<RecentBooks />
		</div>
	)
}

export default HomePage
