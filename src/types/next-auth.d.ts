import NextAuth from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      status?: string
      firstName?: string
      lastName?: string
      institution?: any
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role?: string
    status?: string
    firstName?: string
    lastName?: string
    institution?: any
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    status?: string
    firstName?: string
    lastName?: string
    institution?: any
  }
}

// Global window type extensions
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      isMetaMask?: boolean
    }
    gtag?: (...args: any[]) => void
    getVRDisplays?: () => Promise<any[]>
  }

  interface Navigator {
    getVRDisplays?: () => Promise<any[]>
  }
}

export {}