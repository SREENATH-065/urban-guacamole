"use client"

import * as React from "react"
import type { User, Message } from "@/lib/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getAvatar, BotAvatar } from "@/components/avatars"
import { cn } from "@/lib/utils"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Send } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card"

interface MessagePaneProps {
  messages: Message[]
  currentUser: User
  blockedUsers: Set<string>
  onSendMessage: (text: string) => void
  title: string
  description: string
}

export function MessagePane({
  messages,
  currentUser,
  blockedUsers,
  onSendMessage,
  title,
  description
}: MessagePaneProps) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const [newMessage, setNewMessage] = React.useState("")

  const filteredMessages = messages.filter(
    (message) => !blockedUsers.has(message.user.id)
  )

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim())
      setNewMessage("")
    }
  }

  return (
    <Card className="flex-1 flex flex-col h-full border-0 shadow-none rounded-none">
       <CardHeader className="border-b">
          <CardTitle className="font-headline">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-6 space-y-4">
            {filteredMessages.map((message) => {
              const isCurrentUser = message.user.id === currentUser.id
              const AvatarIcon = message.user.id === 'system' ? BotAvatar : getAvatar(message.user.avatar)
              
              if (message.isSystemMessage) {
                return (
                  <div key={message.id} className="text-center text-xs text-muted-foreground italic py-2">
                    <span className="px-2 py-1 rounded-full bg-muted">{message.text}</span>
                  </div>
                )
              }

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-end gap-2",
                    isCurrentUser ? "justify-end" : "justify-start"
                  )}
                >
                  {!isCurrentUser && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        <AvatarIcon className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2",
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                     {!isCurrentUser && (
                       <p className="text-xs font-bold text-primary pb-1">{message.user.name}</p>
                     )}
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs text-right mt-1 opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                   {isCurrentUser && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-accent text-accent-foreground">
                        <AvatarIcon className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-2 border-t">
        <form onSubmit={handleSend} className="flex w-full items-center space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
