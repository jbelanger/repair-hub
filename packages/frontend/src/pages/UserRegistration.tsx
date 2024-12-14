import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { UserRegistrationForm } from '../components/UserRegistrationForm'
import { UserService } from '../lib/services/UserService'

export function UserRegistration() {
  const { address, isConnected } = useAccount()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkExistingUser = async () => {
      if (!address) return

      try {
        const user = await UserService.getUserByAddress(address)
        if (user) {
          // User already exists, redirect to home
          navigate('/')
        }
      } catch (error) {
        console.error('Error checking user:', error)
      } finally {
        setLoading(false)
      }
    }

    checkExistingUser()
  }, [address, navigate])

  if (!isConnected) {
    return (
      <div className="text-center p-4">
        Please connect your wallet to continue.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center p-4">
        Loading...
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-center mb-8">Complete Your Profile</h1>
      <UserRegistrationForm 
        walletAddress={address as string}
        onRegistrationComplete={() => navigate('/')}
      />
    </div>
  )
}
