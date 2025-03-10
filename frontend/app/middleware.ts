// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtDecode } from 'jwt-decode'

interface CustomJwtPayload {
  role: string
  user_id?: string
  exp: number
  sub: string
}

// Define your route permissions
const routePermissions: Record<string, string[]> = {
  '/protected/dashboard': ['user', 'admin'],
  '/protected/admin': ['admin'],
  '/protected/admin/users': ['admin'],
  '/protected/admin/settings': ['admin'],
  // Add more routes as needed
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value

  // Check if the path is a protected route
  const path = request.nextUrl.pathname
  const isProtectedRoute = path.startsWith('/protected')
  const isAdminRoute = path.includes('/admin')

  // If it's not a protected route, allow access
  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // If it's a protected route but no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  try {
    // Verify the token
    const decodedToken = jwtDecode<CustomJwtPayload>(token)

    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000)
    if (decodedToken.exp < currentTime) {
      // Token expired, redirect to login
      return NextResponse.redirect(new URL('/signin', request.url))
    }

    // Get the user's role from the token
    const userRole = decodedToken.role || 'user'

    // Strict role checks for admin routes
    if (isAdminRoute && userRole !== 'admin') {
      // User is not an admin but trying to access admin route
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Check if the user has permission for other protected routes
    const routeRoles = routePermissions[path] || []

    if (routeRoles.length > 0 && !routeRoles.includes(userRole)) {
      // User doesn't have permission for this route
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // User has permission, allow access
    return NextResponse.next()
  } catch (error) {
    // Error decoding token, redirect to login
    return NextResponse.redirect(new URL('/signin', request.url))
  }
}

// Configure which routes the middleware should run on
export const config = {
  matcher: ['/protected/:path*']
}