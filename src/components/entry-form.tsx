"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter } from "next/navigation"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AVATAR_CHOICES } from "@/components/avatars"
import { Skeleton } from "./ui/skeleton"

const formSchema = z.object({
  trainNumber: z.string().min(5, {
    message: "Train number must be at least 5 characters.",
  }).max(20),
  ticketNumber: z.string().min(6, {
    message: "Ticket number must be at least 6 characters.",
  }).max(20),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }).max(20),
  avatar: z.string({
    required_error: "Please select an avatar."
  })
})

function EntryFormSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Join a Train</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
           <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-1/4" />
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}


export function EntryForm() {
  const router = useRouter()
  const [hasMounted, setHasMounted] = React.useState(false)

  React.useEffect(() => {
    setHasMounted(true)
  }, [])
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      trainNumber: "",
      ticketNumber: "",
      name: "",
      avatar: "avatar1"
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const { trainNumber, name, avatar, ticketNumber } = values
    const query = new URLSearchParams({ name, avatar, ticketNumber }).toString()
    router.push(`/train/${trainNumber}?${query}`)
  }

  if (!hasMounted) {
    return <EntryFormSkeleton />
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Join a Train</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="trainNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Train Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Acela-2151" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ticketNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Number (PNR)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temporary Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., HappyTraveller" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Choose an Avatar</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-4 gap-4"
                    >
                      {AVATAR_CHOICES.map((avatar) => (
                        <FormItem key={avatar.id} className="flex items-center justify-center">
                           <FormLabel htmlFor={avatar.id} className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:opacity-70">
                              <FormControl>
                                <RadioGroupItem value={avatar.id} id={avatar.id} className="sr-only" />
                              </FormControl>
                              <avatar.Icon className="mb-2 h-8 w-8" />
                              <span className="text-xs">{avatar.name}</span>
                           </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Join Train</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
