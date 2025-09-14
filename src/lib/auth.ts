import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import LinkedInProvider from 'next-auth/providers/linkedin'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          firstName: profile.given_name,
          lastName: profile.family_name,
        }
      },
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid profile email',
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          firstName: profile.given_name,
          lastName: profile.family_name,
        }
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            },
            include: {
              alumniProfile: true,
              studentProfile: true,
              institution: true,
            }
          })

          if (!user || !user.password) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
            image: user.profileImage,
            institution: user.institution,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (user) {
        token.role = user.role
        token.status = user.status
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.institution = user.institution
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as any
        session.user.status = token.status as any
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.institution = token.institution as any
      }
      return session
    },
    async signIn({ user, account, profile, email, credentials }) {
      // Allow OAuth providers
      if (account?.provider === 'google' || account?.provider === 'linkedin') {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (!existingUser) {
            // Create new user for OAuth signup
            const names = user.name?.split(' ') || ['', '']
            await prisma.user.create({
              data: {
                email: user.email!,
                firstName: names[0] || '',
                lastName: names.slice(1).join(' ') || '',
                profileImage: user.image,
                role: 'STUDENT', // Default role
                status: 'ACTIVE',
              }
            })
          }
        } catch (error) {
          console.error('OAuth sign in error:', error)
          return false
        }
      }

      return true
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  events: {
    async signIn(message) {
      console.log('User signed in:', message.user.email)
      
      // Log analytics event
      try {
        await prisma.analyticsData.create({
          data: {
            event: 'user_sign_in',
            properties: {
              provider: message.account?.provider,
              userAgent: message.user.email,
            },
            userId: message.user.id,
          }
        })
      } catch (error) {
        console.error('Failed to log sign in event:', error)
      }
    },
    async signOut(message) {
      console.log('User signed out:', message.token?.email)
    },
    async createUser(message) {
      console.log('New user created:', message.user.email)
      
      // Initialize gamification profile
      try {
        await prisma.gamificationProfile.create({
          data: {
            userId: message.user.id,
            totalPoints: 100, // Welcome bonus
            level: 1,
          }
        })

        // Award welcome achievement
        await prisma.achievement.create({
          data: {
            userId: message.user.id,
            title: 'Welcome to AlumniVerse Pro!',
            description: 'Successfully created your account',
            type: 'PLATFORM',
            points: 100,
            verified: true,
          }
        })
      } catch (error) {
        console.error('Failed to initialize user profile:', error)
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
}