import React from 'react'
import Carusel from './components/carusel/carusel'
import RecentBooks from './components/RecentBooks/RecentBooks'

const MainPage: React.FC = () => {
	return (
		<div>
			<Carusel />
			
			<RecentBooks />
		</div>
	)
}

export default MainPage
