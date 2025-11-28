import React, { useState } from 'react'
import './Register.css'

interface RegisterProps {
	onClose: () => void
}

const Register: React.FC<RegisterProps> = ({ onClose }) => {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [message, setMessage] = useState('')

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
		} catch {
			setMessage('Błąd połączenia z serwerem.')
		}
	}

	return (
		<div className="register-overlay">
			<div className="register-box">
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
				{message && <p className="info">{message}</p>}

				<button className="close-btn" onClick={onClose}>
					X
				</button>
			</div>
		</div>
	)
}

export default Register
