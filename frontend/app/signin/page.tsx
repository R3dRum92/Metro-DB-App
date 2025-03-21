"use client"

import { useState, useTransition } from "react"
import { signIN, type SignInActionResult } from "../actions/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useAuth } from "../context/AuthContext"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/ui/icons"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const formSchema = z.object({
  phone: z.string().regex(/^01[0-9]{9}$/, "Invalid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function SignInPage() {
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useState<SignInActionResult>({
    success: false,
    message: "",
    errors: {},
  })
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({})
  const { login } = useAuth()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const formData = new FormData()
      Object.entries(values).forEach(([key, value]) => formData.append(key, value))

      const result = await signIN(formData)
      if (result?.errors) {
        setServerErrors(result.errors)
        setState({ success: false, message: "", errors: result.errors })
      } else {
        setServerErrors({})
        setState({ success: true, message: result.message, errors: {} })
        form.reset()

        // Use the token from the result to log in
        if (result.access_token) {
          login(result.access_token)
          // No need to redirect here as login() will handle redirection based on role
        }
      }
    })
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-primary text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">Enter your information to Sign In</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* phone Field */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="01xxxxxxxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                    {serverErrors.phone && (
                      <p className="text-sm font-medium text-destructive">{serverErrors.phone[0]}</p>
                    )}
                  </FormItem>
                )}
              />
              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                    {serverErrors.password && (
                      <p className="text-sm font-medium text-destructive">{serverErrors.password[0]}</p>
                    )}
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Icons.lock className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </Form>
          {serverErrors.form && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{serverErrors.form[0]}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          {state?.success && (
            <Alert className="w-full">
              <Icons.check className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}