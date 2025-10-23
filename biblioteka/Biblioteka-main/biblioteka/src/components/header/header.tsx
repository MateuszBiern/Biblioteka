import React from 'react'
import { Link } from 'react-router-dom'
import './Header.css'

const Header: React.FC = () => {
	return (
		<header className="header">
			<div className="logo">
				<Link to="/">
					<h1>Biblioteka</h1>
				</Link>
			</div>
			<nav className="nav">
				<Link to="/">Home</Link>
				<Link to="/novels">Novels</Link>
				<Link to="/ranking">Ranking</Link>
				<Link to="/SearchPage">🔍 Wyszukiwarka</Link>
				<Link to="/add-book">➕ Dodaj książkę</Link>
				<Link to="/delete-book">🗑️ Usuń książkę</Link>
			</nav>
		</header>
	)
}

export default Header
