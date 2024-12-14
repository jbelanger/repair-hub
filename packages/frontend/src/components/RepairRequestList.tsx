import React from 'react'
import { useAccount } from 'wagmi'
import { RepairRequest, RepairRequestStatus, RepairRequestStatusType } from '../lib/blockchain/config'

interface RepairRequestListProps {
  requests: RepairRequest[]
  isLoading: boolean
  onStatusUpdate?: (requestId: bigint, newStatus: RepairRequestStatusType) => void
}

export function RepairRequestList({ requests, isLoading, onStatusUpdate }: RepairRequestListProps) {
  const { address } = useAccount()

  const getStatusBadgeColor = (status: RepairRequestStatusType) => {
    switch (status) {
      case RepairRequestStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800'
      case RepairRequestStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800'
      case RepairRequestStatus.COMPLETED:
        return 'bg-green-100 text-green-800'
      case RepairRequestStatus.REJECTED:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: RepairRequestStatusType) => {
    return Object.entries(RepairRequestStatus).find(([_, value]) => value === status)?.[0] || 'Unknown'
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white shadow rounded-lg p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900">No repair requests found</h3>
        <p className="mt-2 text-sm text-gray-500">
          Create a new repair request to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id.toString()} className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Property ID: {request.propertyId}
            </h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                request.status
              )}`}
            >
              {getStatusText(request.status)}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Created: {new Date(Number(request.createdAt) * 1000).toLocaleString()}
            </p>
            {request.updatedAt !== request.createdAt && (
              <p className="text-sm text-gray-500">
                Updated: {new Date(Number(request.updatedAt) * 1000).toLocaleString()}
              </p>
            )}
            <p className="text-sm text-gray-500">
              Initiator: {request.initiator === address ? 'You' : request.initiator}
            </p>
          </div>

          {onStatusUpdate && request.initiator === address && request.status !== RepairRequestStatus.COMPLETED && (
            <div className="mt-4 flex space-x-2">
              {request.status === RepairRequestStatus.PENDING && (
                <button
                  onClick={() => onStatusUpdate(request.id, RepairRequestStatus.IN_PROGRESS)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Mark In Progress
                </button>
              )}
              {request.status === RepairRequestStatus.IN_PROGRESS && (
                <button
                  onClick={() => onStatusUpdate(request.id, RepairRequestStatus.COMPLETED)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Mark Completed
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
