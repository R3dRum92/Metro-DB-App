"use client";

import { useState, useTransition } from "react";
import { signUp, type SignupActionResult } from "../actions/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/ui/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.union([
    z.string().email("Invalid email"),
    z.string().length(0),
  ]),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().regex(/^01[0-9]{9}$/, "Invalid phone number"),
});

export default function SignUpPage() {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<SignupActionResult>({
    success: false,
    message: "",
    errors: {},
  });
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => formData.append(key, value));

      const result = await signUp(formData);

      if (result.errors) {
        setServerErrors(result.errors);
        setState({ success: false, message: "", errors: result.errors });
      } else {
        setServerErrors({});
        setState({ success: true, message: result.message, errors: {} });
        form.reset();
        router.push("/protected/dashboard");
      }
    });
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-primary text-2xl font-bold text-center">Create your account</CardTitle>
          <CardDescription className="text-center">Enter your information to sign up</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                    {serverErrors.name && (
                      <p className="text-sm font-medium text-destructive">{serverErrors.name[0]}</p>
                    )}
                  </FormItem>
                )}
              />
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    {serverErrors.email && (
                      <p className="text-sm font-medium text-destructive">{serverErrors.email[0]}</p>
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
              {/* Phone Field */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
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
              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Signing up...
                  </>
                ) : (
                  <>
                    <Icons.lock className="mr-2 h-4 w-4" />
                    Sign up
                  </>
                )}
              </Button>
            </form>
          </Form>
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
  );
}
