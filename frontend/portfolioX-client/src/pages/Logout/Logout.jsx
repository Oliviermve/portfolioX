import React, { useState } from 'react'

const Register = () => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    passwordConfirmation: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const API_BASE_URL = "http://127.0.0.1:8000"

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Validation
    if (!formData.nom || !formData.prenom || !formData.email || !formData.password || !formData.passwordConfirmation) {
      setError('Tous les champs sont obligatoires')
      setLoading(false)
      return
    }

    if (!formData.email.includes('@')) {
      setError('Veuillez entrer un email valide')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      setLoading(false)
      return
    }

    if (formData.password !== formData.passwordConfirmation) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    try {
      console.log('📝 Envoi des données d\'inscription:', formData)
      
      const response = await fetch(`${API_BASE_URL}/api/auth/inscription/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.passwordConfirmation
        }),
      })

      const data = await response.json()
      console.log('📡 Réponse API:', data)

      if (!response.ok || (data.success === false && data.success !== undefined)) {
        // Gestion des erreurs Django
        if (data.email && data.email[0]) {
          throw new Error(`Email: ${data.email[0]}`)
        } else if (data.password && data.password[0]) {
          throw new Error(`Mot de passe: ${data.password[0]}`)
        } else if (data.nom && data.nom[0]) {
          throw new Error(`Nom: ${data.nom[0]}`)
        } else if (data.prenom && data.prenom[0]) {
          throw new Error(`Prénom: ${data.prenom[0]}`)
        } else if (data.error) {
          throw new Error(data.error)
        } else if (data.message) {
          throw new Error(data.message)
        } else if (data.detail) {
          throw new Error(data.detail)
        } else {
          throw new Error("Erreur lors de l'inscription")
        }
      }

      // Succès
      setSuccess('Inscription réussie ! Vous pouvez maintenant vous connecter.')
      console.log('✅ Inscription réussie!')
      
      // Si l'API retourne des tokens, les stocker
      if (data.access || data.access_token) {
        const token = data.access || data.access_token
        localStorage.setItem("portfolioX_access_token", token)
        console.log('🔐 Token stocké')
      }
      
      if (data.refresh || data.refresh_token) {
        const refreshToken = data.refresh || data.refresh_token
        localStorage.setItem("portfolioX_refresh_token", refreshToken)
      }
      
      if (data.user) {
        localStorage.setItem("portfolioX_user", JSON.stringify(data.user))
      }

      // Redirection automatique après 2 secondes
      setTimeout(() => {
        window.location.href = "/login"
      }, 2000)

    } catch (err) {
      console.error('❌ Erreur d\'inscription:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour pré-remplir avec des données de test
  const fillTestData = () => {
    setFormData({
      nom: 'Doe',
      prenom: 'John',
      email: `test${Math.floor(Math.random() * 1000)}@example.com`,
      password: 'password123',
      passwordConfirmation: 'password123'
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      {/* Logo */}
      <div className="mb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center">
          <img src="/logo/logo.png" alt="logo" className="w-20" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-black mb-10">
        Create an account
      </h1>

      {/* Message de succès */}
      {success && (
        <div className="w-full max-w-sm mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-md text-sm">
          {success}
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="w-full max-w-sm mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-6">
        {/* Nom */}
        <div className="relative">
          <span className="absolute left-0 top-1.5 text-gray-500 text-xl">
            👤
          </span>
          <input
            type="text"
            name="nom"
            placeholder="enter your name"
            value={formData.nom}
            onChange={handleChange}
            className="w-full border-b border-gray-400 pl-8 pb-2 focus:outline-none focus:border-purple-500 transition"
            disabled={loading}
            required
          />
        </div>

        {/* Prenom */}
        <div className="relative">
          <span className="absolute left-0 top-1.5 text-gray-500 text-xl">
            👤
          </span>
          <input
            type="text"
            name="prenom"
            placeholder="enter your first name"
            value={formData.prenom}
            onChange={handleChange}
            className="w-full border-b border-gray-400 pl-8 pb-2 focus:outline-none focus:border-purple-500 transition"
            disabled={loading}
            required
          />
        </div>

        {/* Email */}
        <div className="relative">
          <span className="absolute left-0 top-1.5 text-gray-500 text-xl">
            ✉️
          </span>
          <input
            type="email"
            name="email"
            placeholder="enter your email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border-b border-gray-400 pl-8 pb-2 focus:outline-none focus:border-purple-500 transition"
            disabled={loading}
            required
          />
        </div>

        {/* Password */}
        <div className="relative">
          <span className="absolute left-0 top-1.5 text-gray-500 text-xl">
            🔒
          </span>
          <input
            type="password"
            name="password"
            placeholder="enter your password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border-b border-gray-400 pl-8 pb-2 focus:outline-none focus:border-purple-500 transition"
            disabled={loading}
            required
          />
        </div>

        {/* Password Confirmation */}
        <div className="relative">
          <span className="absolute left-0 top-1.5 text-gray-500 text-xl">
            🔒
          </span>
          <input
            type="password"
            name="passwordConfirmation"
            placeholder="confirm your password"
            value={formData.passwordConfirmation}
            onChange={handleChange}
            className="w-full border-b border-gray-400 pl-8 pb-2 focus:outline-none focus:border-purple-500 transition"
            disabled={loading}
            required
          />
        </div>

        {/* Button */}
        <button
          type="submit"
          className="bg-purple-500 text-white py-2 rounded-md font-medium hover:bg-purple-600 transition mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Inscription en cours..." : "Sign Up"}
        </button>
      </form>

      {/* Bouton pour pré-remplir avec des données de test */}
      <button
        onClick={fillTestData}
        className="mt-4 text-sm text-purple-500 hover:text-purple-600"
      >
        Remplir avec des données de test
      </button>

      {/* Lien vers la connexion */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Déjà un compte ?{" "}
          <a 
            href="/login"
            className="text-purple-500 hover:text-purple-600 font-medium"
          >
            Se connecter
          </a>
        </p>
      </div>

      {/* Info de debug */}
      <div className="mt-8 text-center text-xs text-gray-400">
        <p>API: {API_BASE_URL}/api/auth/inscription/</p>
        <p>Champs requis: nom, prenom, email, password, password_confirmation</p>
      </div>
    </div>
  )
}

export default Register