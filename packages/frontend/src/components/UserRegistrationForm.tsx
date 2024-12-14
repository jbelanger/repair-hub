import { useState, useCallback } from 'react'
import { useLoadScript, Autocomplete } from '@react-google-maps/api'
import { UserService, UserRoles } from '../lib/services/UserService'

const libraries: ("places")[] = ["places"]

interface UserRegistrationFormProps {
  walletAddress: string;
  onRegistrationComplete: (userId: string) => void;
}

export function UserRegistrationForm({ walletAddress, onRegistrationComplete }: UserRegistrationFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'TENANT' | 'LANDLORD'>('TENANT')
  const [propertyAddress, setPropertyAddress] = useState('')
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const [error, setError] = useState('')

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  })

  const onLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    setAutocomplete(autocomplete)
  }, [])

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace()
      if (place.formatted_address) {
        setPropertyAddress(place.formatted_address)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!propertyAddress) {
      setError('Please select a valid address')
      return
    }

    try {
      const user = await UserService.createUser({
        name,
        email,
        address: walletAddress,
        role,
      })

      if (role === UserRoles.LANDLORD) {
        await UserService.addPropertyForLandlord(user.id, propertyAddress)
      }

      onRegistrationComplete(user.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register user')
    }
  }

  if (loadError) return <div>Error loading Google Maps</div>
  if (!isLoaded) return <div>Loading...</div>

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Role
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as 'TENANT' | 'LANDLORD')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="TENANT">Tenant</option>
          <option value="LANDLORD">Landlord</option>
        </select>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Property Address
        </label>
        <Autocomplete
          onLoad={onLoad}
          onPlaceChanged={onPlaceChanged}
        >
          <input
            type="text"
            id="address"
            value={propertyAddress}
            onChange={(e) => setPropertyAddress(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Start typing your address..."
          />
        </Autocomplete>
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Register
      </button>
    </form>
  )
}
