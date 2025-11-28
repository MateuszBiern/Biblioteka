import React, { useState } from 'react'
import './Login.css'

interface LoginProps {
	onClose: () => void
	onLogin: (role: string) => void
}

const Login: React.FC<LoginProps> = ({ onClose, onLogin }) => {
	const [isRegister, setIsRegister] = useState(false)
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [message, setMessage] = useState('')

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		try {
			const res = await fetch('http://localhost/biblioteka/login.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			})
			const data = await res.json()
			if (data.success) {
				// ZAPISZ userId DO localStorage
				if (data.userId) {
					localStorage.setItem('userId', data.userId.toString())
				}
				localStorage.setItem('role', data.role)
				window.dispatchEvent(new Event('storage'))

				onLogin(data.role)
				onClose()
			} else {
				setMessage(data.message)
			}
		} catch {
			setMessage('Błąd połączenia z serwerem.')
		}
	}

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault()
		if (password !== confirmPassword) {
			setMessage('Hasła nie są takie same.')
			return
		}
		try {
			const res = await fetch('http://localhost/biblioteka/register.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			})
			const data = await res.json()
			setMessage(data.message)
			if (data.success) setIsRegister(false)
		} catch {
			setMessage('Błąd połączenia z serwerem.')
		}
	}

	return (
		<div className="login-overlay">
			<div className="login-box">
				{isRegister ? (
					<>
						<h2>Rejestracja</h2>
						<form onSubmit={handleRegister}>
							<input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
							<input
								type="password"
								placeholder="Hasło"
								value={password}
								onChange={e => setPassword(e.target.value)}
								required
							/>
							<input
								type="password"
								placeholder="Powtórz hasło"
								value={confirmPassword}
								onChange={e => setConfirmPassword(e.target.value)}
								required
							/>
							<button type="submit">Zarejestruj się</button>
						</form>
						<p>
							Masz konto?{' '}
							<span
								className="link"
								onClick={() => {
									setIsRegister(false)
									setMessage('')
								}}>
								Zaloguj się
							</span>
						</p>
					</>
				) : (
					<>
						<h2>Logowanie</h2>
						<form onSubmit={handleLogin}>
							<input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
							<input
								type="password"
								placeholder="Hasło"
								value={password}
								onChange={e => setPassword(e.target.value)}
								required
							/>
							<button type="submit">Zaloguj się</button>
						</form>
						<p>
							Nie masz konta?{' '}
							<span
								className="link"
								onClick={() => {
									setIsRegister(true)
									setMessage('')
								}}>
								Zarejestruj się
							</span>
						</p>
					</>
				)}
				{message && <p className="info">{message}</p>}
				<button className="close-btn" onClick={onClose}>
					X
				</button>
			</div>
		</div>
	)
}

export default Login
