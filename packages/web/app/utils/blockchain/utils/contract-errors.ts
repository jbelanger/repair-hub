import { ContractError } from '../types/repair-request'

export function parseContractError(error: unknown): ContractError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Check for rate limiting and network errors
  if (errorMessage.includes('exceeded') && errorMessage.includes('limit')) {
    return { code: 'RATE_LIMIT', message: 'Request limit exceeded. Please try again in a few minutes.' };
  }
  if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
    return { code: 'RATE_LIMIT', message: 'Too many requests. Please try again in a few minutes.' };
  }
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return { code: 'NETWORK_ERROR', message: 'Network connection issue. Please check your connection and try again.' };
  }

  // Check for specific contract errors
  if (errorMessage.includes('RepairRequestDoesNotExist')) {
    return { code: 'NOT_FOUND', message: 'This repair request does not exist' };
  }
  if (errorMessage.includes('CallerIsNotLandlord')) {
    return { code: 'UNAUTHORIZED', message: 'Only the landlord can perform this action' };
  }
  if (errorMessage.includes('CallerIsNotTenant')) {
    return { code: 'UNAUTHORIZED', message: 'Only the tenant can perform this action' };
  }
  if (errorMessage.includes('RequestIsCancelled')) {
    return { code: 'INVALID_STATE', message: 'This request has been cancelled and cannot be modified' };
  }
  if (errorMessage.includes('RequestIsNotPending')) {
    return { code: 'INVALID_STATE', message: 'This action can only be performed on pending requests' };
  }
  if (errorMessage.includes('InvalidStatusTransition')) {
    return { code: 'INVALID_STATE', message: 'Invalid status transition. Please check the current status and try again.' };
  }
  if (errorMessage.includes('RequestNotCompleted')) {
    return { code: 'INVALID_STATE', message: 'This action can only be performed on completed requests' };
  }
  if (errorMessage.includes('Pausable: paused')) {
    return { code: 'CONTRACT_PAUSED', message: 'The contract is currently paused. Please try again later.' };
  }

  // Check for common web3 errors
  if (errorMessage.includes('user rejected transaction')) {
    return { code: 'USER_REJECTED', message: 'Transaction was cancelled' };
  }
  if (errorMessage.includes('insufficient funds')) {
    return { code: 'INSUFFICIENT_FUNDS', message: 'Insufficient funds to complete the transaction' };
  }
  if (errorMessage.includes('gas required exceeds allowance')) {
    return { code: 'GAS_LIMIT', message: 'Transaction would exceed gas limits. Please try again.' };
  }
  if (errorMessage.includes('cannot estimate gas') || errorMessage.includes('execution reverted')) {
    return { code: 'GAS_ESTIMATION', message: 'Unable to estimate gas. The transaction may fail or the contract could be paused.' };
  }

  // Return the original error message for unmatched errors
  return { 
    code: 'UNKNOWN', 
    message: errorMessage 
  };
}
