"use server"

import { z } from "zod"
import { jwtDecode } from "jwt-decode"
import { JwtPayload } from "jwt-decode"

interface CustomJwtPayload extends JwtPayload {
  role: string
  user_id?: string
}

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.union([
    z.string().email("Invalid email"), // Valid email
    z.string().length(0), // Allow empty string
  ]),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().regex(/^01[0-9]{9}$/, "Invalid phone number"),
})

const signinSchema = z.object({
  phone: z.string().regex(/^01[0-9]{9}$/, "Invalid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})


export type SignupActionResult = {
  success?: boolean
  message?: string
  role?: string
  errors?: Record<string, string[]>
}

export async function signUp(formData: FormData): Promise<SignupActionResult> {
  const validatedFields = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone"),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  const { name, email, password, phone } = validatedFields.data

  try {
    const response = await fetch('http://localhost:8000/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password,
        phone,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.log(error)
      return {
        success: false,
        message: "Signup failed",
        errors: error.detail.errors || { form: ["Server error occurred"] }
      }
    }

    const data = await response.json()
    return { success: true, message: data.message || "Signup successful!" }

  } catch (error) {
    return {
      success: false,
      message: "Failed to connect to server",
      errors: { form: ["Network error occurred"] }
    }
  }
}

export async function signIN(formData: FormData): Promise<SignupActionResult> {
  const validatedFields = signinSchema.safeParse({
    phone: formData.get("phone"),
    password: formData.get("password"),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  const { phone, password } = validatedFields.data

  try {
    const response = await fetch('http://localhost:8000/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        password,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.log(error.detail)
      return {
        success: false,
        message: "SignIn failed",
        errors: error.detail.errors || { form: ["Server error occurred"] }
      }
    }

    const data = await response.json()

    const decodedToken = jwtDecode<CustomJwtPayload>(data.access_token)
    const userRole = decodedToken?.role

    localStorage.setItem("access_token", data.access_token)
    localStorage.setItem("user_role", userRole)

    return { success: true, role: userRole, message: data.message || "Login successful!" }

  } catch (error) {
    console.log(error)
    return {
      success: false,
      message: "Failed to connect to server",
      errors: { form: ["Network error occurred"] }
    }
  }
}