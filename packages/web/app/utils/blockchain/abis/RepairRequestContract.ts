export const RepairRequestContractABI = [
  {
    type: 'function',
    name: 'createRepairRequest',
    inputs: [
      { name: '_propertyId', type: 'string' },
      { name: '_descriptionHash', type: 'string' },
      { name: '_landlord', type: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'updateRepairRequestStatus',
    inputs: [
      { name: '_id', type: 'uint256' },
      { name: '_status', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'updateDescription',
    inputs: [
      { name: '_id', type: 'uint256' },
      { name: '_descriptionHash', type: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'updateWorkDetails',
    inputs: [
      { name: '_id', type: 'uint256' },
      { name: '_workDetailsHash', type: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'withdrawRepairRequest',
    inputs: [{ name: '_id', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'approveWork',
    inputs: [
      { name: '_id', type: 'uint256' },
      { name: '_isAccepted', type: 'bool' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getRepairRequest',
    inputs: [{ name: '_id', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'initiator', type: 'address' },
          { name: 'landlord', type: 'address' },
          { name: 'propertyId', type: 'string' },
          { name: 'descriptionHash', type: 'string' },
          { name: 'workDetailsHash', type: 'string' },
          { name: 'status', type: 'uint8' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'updatedAt', type: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'event',
    name: 'RepairRequestCreated',
    inputs: [
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'initiator', type: 'address', indexed: true },
      { name: 'landlord', type: 'address', indexed: true },
      { name: 'propertyId', type: 'string', indexed: false },
      { name: 'descriptionHash', type: 'string', indexed: false },
      { name: 'createdAt', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'RepairRequestStatusChanged',
    inputs: [
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'initiator', type: 'address', indexed: true },
      { name: 'landlord', type: 'address', indexed: true },
      { name: 'oldStatus', type: 'uint8', indexed: false },
      { name: 'newStatus', type: 'uint8', indexed: false },
      { name: 'updatedAt', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'DescriptionUpdated',
    inputs: [
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'initiator', type: 'address', indexed: true },
      { name: 'landlord', type: 'address', indexed: true },
      { name: 'oldHash', type: 'string', indexed: false },
      { name: 'newHash', type: 'string', indexed: false },
      { name: 'updatedAt', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'WorkDetailsUpdated',
    inputs: [
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'initiator', type: 'address', indexed: true },
      { name: 'landlord', type: 'address', indexed: true },
      { name: 'oldHash', type: 'string', indexed: false },
      { name: 'newHash', type: 'string', indexed: false },
      { name: 'updatedAt', type: 'uint256', indexed: false }
    ]
  }
] as const;
