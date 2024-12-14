import React, { useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { RepairRequestForm } from '../components/RepairRequestForm'
import { ConnectWallet } from '../components/ConnectWallet'

interface Notification {
  type: 'success' | 'error' | 'info'
  message: string
  hash?: string
}

export function CreateRepairRequest() {
  const { isConnected } = useAccount()
  const [notification, setNotification] = useState<Notification | null>(null)

  const handleSuccess = useCallback((hash: string) => {
    setNotification({
      type: 'success',
      message: 'Repair request created successfully!',
      hash,
    })
    // Keep success message visible longer
    setTimeout(() => setNotification(null), 10000)
  }, [])

  const handleError = useCallback((error: Error) => {
    setNotification({
      type: 'error',
      message: `Error creating repair request: ${error.message}`,
    })
    // Clear error message after 5 seconds
    setTimeout(() => setNotification(null), 5000)
  }, [])

  const getNotificationStyle = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800'
      case 'error':
        return 'bg-red-50 text-red-800'
      case 'info':
        return 'bg-blue-50 text-blue-800'
      default:
        return 'bg-gray-50 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Create Repair Request</h1>
            <ConnectWallet />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Notification */}
        {notification && (
          <div
            className={`mb-4 p-4 rounded-md ${getNotificationStyle(notification.type)}`}
            role="alert"
          >
            <div className="flex items-start">
              <div className="flex-1">
                <p className="text-sm">{notification.message}</p>
                {notification.hash && (
                  <p className="text-sm mt-1">
                    Transaction Hash:{' '}
                    <a
                      href={`https://sepolia.etherscan.io/tx/${notification.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-600"
                    >
                      {notification.hash.slice(0, 10)}...
                    </a>
                  </p>
                )}
              </div>
              <button
                onClick={() => setNotification(null)}
                className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {!isConnected ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Please connect your wallet to create a repair request. Make sure you're connected
              to the Sepolia testnet.
            </p>
            <div className="inline-block">
              <ConnectWallet />
            </div>
          </div>
        ) : (
          <>
            {/* Description */}
            <div className="mb-8 px-4 sm:px-0">
              <p className="mt-1 text-sm text-gray-600">
                Submit a new repair request by filling out the form below. Please provide as much detail
                as possible to help us understand and address your repair needs effectively.
              </p>
            </div>

            {/* Form */}
            <div className="bg-white shadow rounded-lg">
              <RepairRequestForm
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </div>

            {/* Additional Information */}
            <div className="mt-8 px-4 sm:px-0">
              <h2 className="text-lg font-medium text-gray-900">What happens next?</h2>
              <div className="mt-4 text-sm text-gray-600">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Your repair request will be recorded on the Sepolia blockchain for transparency.</li>
                  <li>The property owner will be notified of your request.</li>
                  <li>Once reviewed, you'll receive updates on the status of your request.</li>
                  <li>If approved, a work order will be created and assigned to a contractor.</li>
                </ol>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
