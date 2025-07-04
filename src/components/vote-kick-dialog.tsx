"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { User } from "@/lib/types"

interface VoteKickDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  userToKick: User | null
  onSubmit: (reason: string) => void
}

export function VoteKickDialog({
  isOpen,
  onOpenChange,
  userToKick,
  onSubmit,
}: VoteKickDialogProps) {
  const [reason, setReason] = useState("")

  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason)
      setReason("")
    }
  }

  if (!userToKick) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vote to Kick {userToKick.name}</DialogTitle>
          <DialogDescription>
            Please provide a brief, neutral reason for initiating this vote. This will be shared with other passengers.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Spamming the chat, being disruptive."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!reason.trim()}>
            Initiate Vote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
