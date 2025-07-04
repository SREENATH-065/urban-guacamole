"use client"

import type { User } from "@/lib/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getAvatar } from "@/components/avatars"
import { MessageCircle, UserX, Gavel, MoreVertical, ShieldCheck, ShieldOff } from "lucide-react"

interface MemberListProps {
  members: User[]
  currentUser: User
  onOpenDM: (user: User) => void
  onBlockUser: (userId: string) => void
  onInitiateVoteKick: (user: User) => void
  blockedUsers: Set<string>
}

export function MemberList({
  members,
  currentUser,
  onOpenDM,
  onBlockUser,
  onInitiateVoteKick,
  blockedUsers
}: MemberListProps) {
  return (
    <div className="space-y-2">
      {members.map((member) => {
        const AvatarIcon = getAvatar(member.avatar)
        const isBlocked = blockedUsers.has(member.id)
        
        return (
          <div key={member.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/20">
                  <AvatarIcon className="h-5 w-5 text-primary" />
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm">{member.name} {member.id === currentUser.id && "(You)"}</span>
            </div>
            {member.id !== currentUser.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onOpenDM(member)}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    <span>Send Message</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBlockUser(member.id)}>
                    {isBlocked ? <ShieldCheck className="mr-2 h-4 w-4" /> : <ShieldOff className="mr-2 h-4 w-4" />}
                    <span>{isBlocked ? "Unblock" : "Block"} User</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onInitiateVoteKick(member)} className="text-destructive focus:text-destructive">
                    <Gavel className="mr-2 h-4 w-4" />
                    <span>Vote to Kick</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )
      })}
    </div>
  )
}
