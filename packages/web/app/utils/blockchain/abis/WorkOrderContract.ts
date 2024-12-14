export const WorkOrderContractABI = [
  {
    type: 'function',
    name: 'createWorkOrder',
    inputs: [
      { name: '_repairRequestId', type: 'uint256' },
      { name: '_landlord', type: 'address' },
      { name: '_contractor', type: 'address' },
      { name: '_agreedPrice', type: 'uint256' },
      { name: '_descriptionHash', type: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'updateWorkOrderStatus',
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
    name: 'getWorkOrderById',
    inputs: [{ name: '_workOrderId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'repairRequestId', type: 'uint256' },
          { name: 'landlord', type: 'address' },
          { name: 'contractor', type: 'address' },
          { name: 'agreedPrice', type: 'uint256' },
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
    type: 'function',
    name: 'getWorkOrdersByRepairRequest',
    inputs: [{ name: '_repairRequestId', type: 'uint256' }],
    outputs: [{ type: 'uint256[]' }],
    stateMutability: 'view'
  },
  {
    type: 'event',
    name: 'WorkOrderCreated',
    inputs: [
      { name: 'id', type: 'uint256', indexed: false },
      { name: 'repairRequestId', type: 'uint256', indexed: false },
      { name: 'landlord', type: 'address', indexed: true },
      { name: 'contractor', type: 'address', indexed: true },
      { name: 'agreedPrice', type: 'uint256', indexed: false },
      { name: 'descriptionHash', type: 'string', indexed: false },
      { name: 'createdAt', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'WorkOrderUpdated',
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
