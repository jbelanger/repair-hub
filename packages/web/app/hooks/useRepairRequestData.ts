import { usePublicClient } from 'wagmi'
import { useState, useEffect, useRef } from 'react'
import { readRepairRequest } from '~/utils/blockchain/utils/contract-read'
import type { ContractRepairRequest } from '~/utils/blockchain/types/repair-request'

export function useRepairRequestData(requestId: string) {
  const publicClient = usePublicClient()
  const [data, setData] = useState<ContractRepairRequest | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    let timeoutId: NodeJS.Timeout

    async function fetchData() {
      if (!publicClient || !mounted.current) return
      setIsLoading(true)

      const result = await readRepairRequest(publicClient, BigInt(requestId))
      
      if (!mounted.current) return

      result.match(
        (data) => {
          setData(data)
          setIsError(false)
          // Schedule next fetch if successful
          timeoutId = setTimeout(fetchData, 5000)
        },
        () => {
          setIsError(true)
          // Retry after longer delay on error
          timeoutId = setTimeout(fetchData, 15000)
        }
      )
      setIsLoading(false)
    }

    fetchData()

    return () => {
      mounted.current = false
      clearTimeout(timeoutId)
    }
  }, [publicClient, requestId])

  return {
    data,
    isLoading,
    isError
  }
}
