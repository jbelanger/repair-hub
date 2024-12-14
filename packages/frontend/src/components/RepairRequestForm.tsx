import React, { useState, useCallback, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { RepairRequestService } from '../lib/blockchain'
import { RequestUrgencyLevels, RepairRequestStatusType } from '../lib/blockchain/config'

interface RepairRequestFormProps {
  onSuccess?: (hash: string) => void
  onError?: (error: Error) => void
}

export function RepairRequestForm({ onSuccess, onError }: RepairRequestFormProps) {
  const { address } = useAccount()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requestStatus, setRequestStatus] = useState<{
    hash: string
    status: RepairRequestStatusType | null
  } | null>(null)
  const [formData, setFormData] = useState({
    propertyId: '',
    description: '',
    urgency: RequestUrgencyLevels.MEDIUM,
    attachments: [] as string[]
  })

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Watch for status updates on the current request
  useEffect(() => {
    if (!requestStatus?.hash) return

    const watchStatus = () => {
      RepairRequestService.watchRepairRequestUpdated((id, status, updatedAt) => {
        console.log('Request status updated:', { id, status, updatedAt })
        setRequestStatus(prev => prev ? { ...prev, status } : null)
      })
    }

    watchStatus()
  }, [requestStatus?.hash])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) {
      setError('Please connect your wallet first')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // In a real app, we'd upload attachments to IPFS first
      // For now, we'll create a simple hash of the description
      const descriptionHash = btoa(formData.description)

      const hash = await RepairRequestService.createRepairRequest(
        formData.propertyId,
        descriptionHash
      )

      setRequestStatus({ hash, status: null })
      onSuccess?.(hash)

      // Reset form
      setFormData({
        propertyId: '',
        description: '',
        urgency: RequestUrgencyLevels.MEDIUM,
        attachments: []
      })

      // Watch for the creation event
      RepairRequestService.watchRepairRequestCreated((id, initiator, propertyId, descriptionHash, createdAt) => {
        console.log('Request created:', { id, initiator, propertyId, descriptionHash, createdAt })
      })

    } catch (error) {
      console.error('Error creating repair request:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create repair request'
      setError(errorMessage)
      onError?.(error as Error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (error) clearError()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto p-6 bg-white rounded-lg shadow">
      {error && (
        <div className="p-4 rounded-md bg-red-50 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {requestStatus && (
        <div className="p-4 rounded-md bg-blue-50 text-blue-700">
          <p>Transaction Hash: {requestStatus.hash.slice(0, 10)}...</p>
          {requestStatus.status !== null && (
            <p className="mt-2">
              Status: {Object.keys(RequestUrgencyLevels)[requestStatus.status]}
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700">
          Property ID
        </label>
        <input
          type="text"
          id="propertyId"
          name="propertyId"
          value={formData.propertyId}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Enter property ID"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Describe the repair needed"
        />
      </div>

      <div>
        <label htmlFor="urgency" className="block text-sm font-medium text-gray-700">
          Urgency Level
        </label>
        <select
          id="urgency"
          name="urgency"
          value={formData.urgency}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value={RequestUrgencyLevels.LOW}>Low</option>
          <option value={RequestUrgencyLevels.MEDIUM}>Medium</option>
          <option value={RequestUrgencyLevels.HIGH}>High</option>
        </select>
      </div>

      {/* File upload will be implemented later with IPFS integration */}
      <div>
        <label htmlFor="attachments" className="block text-sm font-medium text-gray-700">
          Attachments (Coming Soon)
        </label>
        <input
          type="file"
          id="attachments"
          name="attachments"
          multiple
          disabled
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting || !address}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            (isSubmitting || !address) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Creating Request...' : 'Submit Repair Request'}
        </button>
      </div>
    </form>
  )
}
