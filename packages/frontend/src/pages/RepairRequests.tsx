import React, { useEffect, useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { RepairRequestList } from '../components/RepairRequestList'
import { ConnectWallet } from '../components/ConnectWallet'
import { RepairRequestService } from '../lib/blockchain'
import { RepairRequest, RepairRequestStatusType } from '../lib/blockchain/config'
import { Link } from 'react-router-dom'

interface Notification {
  type: 'success' | 'error' | 'info'
  message: string
  hash?: string
}

export function RepairRequests() {
  const { isConnected, address } = useAccount()
  const [requests, setRequests] = useState<RepairRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notification, setNotification] = useState<Notification | null>(null)

  const fetchRequests = useCallback(async () => {
    if (!address) return

    setIsLoading(true)
    try {
      // Fetch existing requests
      const existingRequests = await RepairRequestService.getAllRepairRequests(address)
      setRequests(existingRequests)

      // Watch for new requests
      RepairRequestService.watchRepairRequestCreated(
        async (id, initiator, propertyId, descriptionHash, createdAt) => {
          if (initiator.toLowerCase() === address.toLowerCase()) {
            try {
              const request = await RepairRequestService.getRepairRequest(id)
              setRequests(prev => [...prev, request].sort((a, b) => 
                Number(b.createdAt) - Number(a.createdAt)
              ))
            } catch (error) {
              console.error('Error fetching request details:', error)
            }
          }
        }
      )

      // Watch for status updates
      RepairRequestService.watchRepairRequestUpdated(
        (id, status, updatedAt) => {
          setRequests(prev => prev.map(request => 
            request.id === id 
              ? { ...request, status, updatedAt }
              : request
          ))
        }
      )

      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching repair requests:', error)
      setNotification({
        type: 'error',
        message: 'Failed to fetch repair requests'
      })
      setIsLoading(false)
    }
  }, [address])

  useEffect(() => {
    if (isConnected && address) {
      fetchRequests()
    } else {
      setRequests([])
    }
  }, [isConnected, address, fetchRequests])

  const handleStatusUpdate = async (requestId: bigint, newStatus: RepairRequestStatusType) => {
    try {
      setNotification({
        type: 'info',
        message: 'Updating request status...'
      })

      const hash = await RepairRequestService.updateStatus(requestId, newStatus)
      
      setNotification({
        type: 'success',
        message: 'Status updated successfully!',
        hash
      })

      // Status will be updated through the event watcher
    } catch (error) {
      console.error('Error updating status:', error)
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update status'
      })
    }
  }

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
            <h1 className="text-3xl font-bold text-gray-900">My Repair Requests</h1>
            <div className="flex items-center space-x-4">
              <Link
                to="/create-request"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create New Request
              </Link>
              <ConnectWallet />
            </div>
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
              Please connect your wallet to view your repair requests. Make sure you're connected
              to the Sepolia testnet.
            </p>
            <div className="inline-block">
              <ConnectWallet />
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <RepairRequestList
              requests={requests}
              isLoading={isLoading}
              onStatusUpdate={handleStatusUpdate}
            />
          </div>
        )}
      </main>
    </div>
  )
}
