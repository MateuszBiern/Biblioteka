import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Header.css'
import Login from '../Login/Login'
const Header: React.FC = () => {
	const [isLoggedIn, setIsLoggedIn] = useState(false)
	const [role, setRole] = useState<string | null>(null)
	const [showLogin, setShowLogin] = useState(false)
	const [menuOpen, setMenuOpen] = useState(false)

	useEffect(() => {
		const savedRole = localStorage.getItem('role')
		if (savedRole) {
			setIsLoggedIn(true)
			setRole(savedRole)
		}
	}, [])

	const handleLogin = (userRole: string) => {
		setIsLoggedIn(true)
		setRole(userRole)
		localStorage.setItem('role', userRole)
		setShowLogin(false)
	}

	const handleLogout = () => {
		setIsLoggedIn(false)
		setRole(null)
		localStorage.removeItem('role')
		localStorage.removeItem('userId') // <- DODAJ TĘ LINIJKĘ
		setMenuOpen(false)
	}

	return (
		<header className="header">
			<div className="logo">
				<Link to="/">
					<h1>Biblioteka</h1>
				</Link>
			</div>

			{/* Przed zalogowaniem — tylko przycisk logowania */}
			{!isLoggedIn && (
				<button className="login-btn" onClick={() => setShowLogin(true)}>
					Zaloguj
				</button>
			)}

			{/* Po zalogowaniu — hamburger + menu */}
			{isLoggedIn && (
				<>
					<button className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
						<span></span>
						<span></span>
						<span></span>
					</button>

					<nav className={`nav ${menuOpen ? 'active' : ''}`}>
						<Link to="/" onClick={() => setMenuOpen(false)}>
							Home
						</Link>
						<Link to="/ranking" onClick={() => setMenuOpen(false)}>
							Ranking
						</Link>
						<Link to="/searchPage" onClick={() => setMenuOpen(false)}>
							Wyszukiwarka
						</Link>

						{role === 'admin' && (
							<>
								<Link to="/add-book" onClick={() => setMenuOpen(false)}>
									Dodaj książkę
								</Link>
								<Link to="/delete-book/:id" onClick={() => setMenuOpen(false)}>
									Usuń książkę
								</Link>
							</>
						)}

						<button className="logout-btn" onClick={handleLogout}>
							Wyloguj ({role})
						</button>
					</nav>
				</>
			)}

			{/* Okno logowania */}
			{showLogin && <Login onLogin={handleLogin} onClose={() => setShowLogin(false)} />}
		</header>
	)
}

export default Header
