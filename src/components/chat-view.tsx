"use client"

import * as React from 'react'
import type { User, Message } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessagePane } from '@/components/message-pane'
import { getAvatar } from '@/components/avatars'
import { Avatar, AvatarFallback } from './ui/avatar'
import { X } from 'lucide-react'

interface ChatViewProps {
  currentUser: User
  members: User[]
  messages: Message[]
  dms: Record<string, Message[]>
  unreadDms: Set<string>
  blockedUsers: Set<string>
  activeChat: string
  onSetActiveChat: (chatId: string) => void
  onSendMessage: (text: string) => void
  onCloseDm: (dmId: string) => void
}

export function ChatView({
  currentUser,
  members,
  messages,
  dms,
  unreadDms,
  blockedUsers,
  activeChat,
  onSetActiveChat,
  onSendMessage,
  onCloseDm,
}: ChatViewProps) {
  
  const openDms = Object.keys(dms)

  const getDmPartner = (dmId: string): User | undefined => {
    const partnerId = dmId.replace(currentUser.id, '').replace('-', '');
    return members.find(m => m.id === partnerId)
  }

  const handleTabChange = (value: string) => {
    onSetActiveChat(value);
  }

  const closeDm = (e: React.MouseEvent, dmId: string) => {
    e.stopPropagation()
    onCloseDm(dmId)
  }

  return (
    <Tabs value={activeChat} onValueChange={handleTabChange} className="flex-1 flex flex-col h-full">
      <TabsList className="m-2">
        <TabsTrigger value="group">Group Chat</TabsTrigger>
        {openDms.map((dmId) => {
          const partner = getDmPartner(dmId)
          if (!partner) return null;
          const AvatarIcon = getAvatar(partner.avatar)
          return (
             <TabsTrigger key={dmId} value={dmId} className="relative group/dm-tab">
               {unreadDms.has(dmId) && (
                  <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
               )}
               <Avatar className="h-5 w-5 mr-2">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                    <AvatarIcon className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
              {partner.name}
              <button onClick={(e) => closeDm(e, dmId)} className="ml-2 rounded-full p-0.5 hover:bg-muted-foreground/20 opacity-0 group-hover/dm-tab:opacity-100 transition-opacity">
                <X className="h-3 w-3" />
              </button>
            </TabsTrigger>
          )
        })}
      </TabsList>
      <TabsContent value="group" className="flex-1 flex flex-col h-full overflow-hidden mt-0">
         <MessagePane
          messages={messages}
          currentUser={currentUser}
          blockedUsers={blockedUsers}
          onSendMessage={onSendMessage}
          title="Group Chat"
          description="Talk with everyone on the train."
        />
      </TabsContent>
       {openDms.map((dmId) => {
          const partner = getDmPartner(dmId)
          if (!partner) return null;
          return (
             <TabsContent key={dmId} value={dmId} className="flex-1 flex flex-col h-full overflow-hidden mt-0">
               <MessagePane
                messages={dms[dmId] || []}
                currentUser={currentUser}
                blockedUsers={blockedUsers}
                onSendMessage={onSendMessage}
                title={`Chat with ${partner.name}`}
                description={`This is a private conversation.`}
              />
            </TabsContent>
          )
       })}
    </Tabs>
  )
}
