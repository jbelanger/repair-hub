import { usePublicClient } from 'wagmi'
import { useState, useEffect, useRef } from 'react'
import { readRepairRequest } from '~/utils/blockchain/utils/contract-read'
import type { ContractRepairRequest } from '~/utils/blockchain/types/repair-request'
import type { ContractError } from '~/utils/blockchain/types/repair-request'

type RequestState = {
  data: ContractRepairRequest | null;
  error: ContractError | null;
  isError: boolean;
}

export function useRepairRequestData(requestId: string) {
  const publicClient = usePublicClient()
  const [state, setState] = useState<RequestState>({
    data: null,
    error: null,
    isError: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true

    async function fetchData() {
      if (!publicClient || !mounted.current) return
      setIsLoading(true)

      const result = await readRepairRequest(publicClient, BigInt(requestId))
      if (!mounted.current) return

      // Wait for the ResultAsync to resolve
      const resolvedResult = await result.match(
        (data) => ({
          data,
          error: null,
          isError: false
        }),
        (error) => ({
          data: null,
          error,
          isError: true
        })
      )

      setState(resolvedResult)
      setIsLoading(false)
    }

    fetchData()

    return () => {
      mounted.current = false
    }
  }, [publicClient, requestId])

  return {
    ...state,
    isLoading
  }
}
