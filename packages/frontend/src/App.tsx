import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { CreateRepairRequest } from './pages/CreateRepairRequest'
import { RepairRequests } from './pages/RepairRequests'
import { UserRegistration } from './pages/UserRegistration'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RepairRequests />,
  },
  {
    path: '/create-request',
    element: <CreateRepairRequest />,
  },
  {
    path: '/register',
    element: <UserRegistration />,
  },
])

function App() {
  return (
    <RouterProvider router={router} />
  )
}

export default App
