"use server"

import { z } from "zod"

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().regex(/^01[0-9]{9}$/, "Invalid phone number"),
})

const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})


export type SignupActionResult = {
  success?: boolean
  message?: string
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
      return {
        success: false,
        message: "Signup failed",
        errors: error.errors || { form: ["Server error occurred"] }
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
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  const { email, password } = validatedFields.data

  try {
    const response = await fetch('http://localhost:8000/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        message: "Signup failed",
        errors: error.errors || { form: ["Server error occurred"] }
      }
    }

    const data = await response.json()
    return { success: true, message: data.message || "SignIN successful!" }

  } catch (error) {
    return {
      success: false,
      message: "Failed to connect to server",
      errors: { form: ["Network error occurred"] }
    }
  }
}