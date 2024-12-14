export const RepairRequestContractABI = [
  {
    type: 'function',
    name: 'createRepairRequest',
    inputs: [
      { name: '_propertyId', type: 'string' },
      { name: '_descriptionHash', type: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'updateRepairRequestStatus',
    inputs: [
      { name: '_id', type: 'uint256' },
      { name: '_status', type: 'uint8' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'updateDescriptionHash',
    inputs: [
      { name: '_id', type: 'uint256' },
      { name: '_newDescriptionHash', type: 'string' }
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
          { name: 'propertyId', type: 'string' },
          { name: 'descriptionHash', type: 'string' },
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
      { name: 'id', type: 'uint256', indexed: false },
      { name: 'initiator', type: 'address', indexed: false },
      { name: 'propertyId', type: 'string', indexed: false },
      { name: 'descriptionHash', type: 'string', indexed: false },
      { name: 'createdAt', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'RepairRequestUpdated',
    inputs: [
      { name: 'id', type: 'uint256', indexed: false },
      { name: 'status', type: 'uint8', indexed: false },
      { name: 'updatedAt', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'DescriptionHashUpdated',
    inputs: [
      { name: 'id', type: 'uint256', indexed: false },
      { name: 'oldHash', type: 'string', indexed: false },
      { name: 'newHash', type: 'string', indexed: false },
      { name: 'updatedAt', type: 'uint256', indexed: false }
    ]
  }
] as const;
