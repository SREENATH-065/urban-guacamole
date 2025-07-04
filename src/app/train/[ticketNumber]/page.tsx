"use client"

import * as React from "react"
import { Suspense } from "react"
import { useParams, useSearchParams } from "next/navigation"
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { MemberList } from "@/components/member-list"
import { ChatView } from "@/components/chat-view"
import { TicTacToe } from "@/components/tic-tac-toe"
import type { User, Message } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { VoteKickDialog } from "@/components/vote-kick-dialog"
import { summarizeVoteKick } from "@/ai/flows/vote-kick-summary"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Terminal, Users, Gamepad2, LogOut } from "lucide-react"
import { db } from "@/lib/firebase"
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  Timestamp,
  getDocs,
  writeBatch,
  updateDoc,
  arrayUnion
} from "firebase/firestore"

function VoteInProgressBanner({ vote, membersCount, onVote, currentUser }: { vote: any, membersCount: number, onVote: () => void, currentUser: User }) {
    if (!vote || membersCount === 0) return null;
    
    const requiredVotes = Math.ceil(membersCount * 0.35);
    const hasVoted = vote.votes.includes(currentUser.id);

    return (
        <Card className="m-2 border-primary/50">
            <CardHeader className="p-4">
                <CardTitle className="text-lg">Vote to Kick: {vote.userToKick.name}</CardTitle>
                <CardDescription>{vote.summary}</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
                <div className="flex items-center gap-4">
                    <Progress value={Math.min((vote.votes.length / requiredVotes) * 100, 100)} className="w-full" />
                    <span className="text-sm font-medium">{vote.votes.length} / {requiredVotes} votes</span>
                </div>
            </CardContent>
            <CardFooter className="p-4">
                <Button onClick={onVote} disabled={hasVoted || vote.userToKick.id === currentUser.id}>
                    {hasVoted ? "You have voted" : "Vote to Kick"}
                </Button>
            </CardFooter>
        </Card>
    )
}

function ChatPageContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const trainId = params.ticketNumber as string

  const [currentUser, setCurrentUser] = React.useState<User | null>(null)
  const [members, setMembers] = React.useState<User[]>([])
  const [messages, setMessages] = React.useState<Message[]>([])
  const [dms, setDms] = React.useState<Record<string, Message[]>>({})
  const [activeChat, setActiveChat] = React.useState<string>("group")
  const [unreadDms, setUnreadDms] = React.useState<Set<string>>(new Set())
  const [blockedUsers, setBlockedUsers] = React.useState<Set<string>>(new Set())
  const [ticTacToeBoard, setTicTacToeBoard] = React.useState<(string | null)[]>(Array(9).fill(null))
  const [ticTacToeWinner, setTicTacToeWinner] = React.useState<string | 'Draw' | null>(null);
  const [isVoteKickDialogOpen, setVoteKickDialogOpen] = React.useState(false)
  const [userToKick, setUserToKick] = React.useState<User | null>(null)
  const [activeVote, setActiveVote] = React.useState<any | null>(null)
  const hasJoinedRef = React.useRef(false);

  // User session management and joining
  React.useEffect(() => {
    if (!trainId) return;

    const name = searchParams.get("name")
    const avatar = searchParams.get("avatar")
    const ticketNumber = searchParams.get("ticketNumber")
    
    const handleUserSession = async () => {
      let userId = sessionStorage.getItem(`rail-talk-user-${trainId}`)

      if (userId) {
        const userRef = doc(db, `trains/${trainId}/members`, userId)
        const docSnap = await getDoc(userRef)
        if (docSnap.exists()) {
          setCurrentUser({ id: docSnap.id, ...docSnap.data() } as User)
          return
        }
      }

      if (name && avatar && ticketNumber && !hasJoinedRef.current) {
        const kickedUserRef = doc(db, `trains/${trainId}/kickedUsers`, ticketNumber);
        const kickedUserSnap = await getDoc(kickedUserRef);
        if (kickedUserSnap.exists()) {
            toast({
                variant: "destructive",
                title: "Access Denied",
                description: "You have been kicked from this chat and cannot rejoin.",
                duration: 5000,
            });
            window.location.href = '/';
            return;
        }

        hasJoinedRef.current = true;
        userId = `user-${Date.now()}`
        const user: User = { id: userId, name, avatar, ticketNumber }
        
        await setDoc(doc(db, `trains/${trainId}/members`, userId), user)
        setCurrentUser(user)
        sessionStorage.setItem(`rail-talk-user-${trainId}`, userId)

        const systemMessage = {
          user: { id: "system", name: "System", avatar: "bot" },
          text: `${name} has joined the chat.`,
          timestamp: serverTimestamp(),
          isSystemMessage: true,
        }
        await addDoc(collection(db, `trains/${trainId}/messages`), systemMessage)
      }
    }

    handleUserSession()

    const storedBlockedUsers = localStorage.getItem("blockedUsers")
    if (storedBlockedUsers) {
      setBlockedUsers(new Set(JSON.parse(storedBlockedUsers)))
    }
  }, [trainId, searchParams, toast])
  
  // Fetch group messages and members
  React.useEffect(() => {
    if (!trainId) return

    const membersQuery = query(collection(db, `trains/${trainId}/members`))
    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      const fetchedMembers: User[] = []
      snapshot.forEach(doc => {
        fetchedMembers.push({ id: doc.id, ...doc.data() } as User)
      })
      setMembers(fetchedMembers.filter((m, i, self) => i === self.findIndex(t => t.id === m.id)))
    })

    const messagesQuery = query(collection(db, `trains/${trainId}/messages`), orderBy("timestamp"))
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      if (snapshot.empty) {
         const welcomeMessage = {
            user: { id: "system", name: "System", avatar: "bot" },
            text: 'Welcome to RailTalk! Be kind and enjoy the journey.',
            timestamp: serverTimestamp(),
            isSystemMessage: true,
        }
        addDoc(collection(db, `trains/${trainId}/messages`), welcomeMessage);
      }
      const fetchedMessages: Message[] = []
      snapshot.forEach(doc => {
        const data = doc.data()
        fetchedMessages.push({
          id: doc.id,
          user: data.user,
          text: data.text,
          timestamp: (data.timestamp as Timestamp)?.toMillis() || Date.now(),
          isSystemMessage: data.isSystemMessage || false
        })
      })
      setMessages(fetchedMessages)
    })

    return () => {
      unsubscribeMembers()
      unsubscribeMessages()
    }
  }, [trainId])

  const openDmIds = React.useMemo(() => Object.keys(dms), [dms]);

  // Fetch DM messages and handle unread notifications
  React.useEffect(() => {
    if (!currentUser) return;

    const unsubscribers = openDmIds.map(dmId => {
      const dmQuery = query(collection(db, `dms/${dmId}/messages`), orderBy("timestamp"));
      
      return onSnapshot(dmQuery, (snapshot) => {
        const fetchedMessages: Message[] = [];
        let hasNewMessages = false;
        
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const messageData = change.doc.data();
            if (messageData.user.id !== currentUser.id) {
              hasNewMessages = true;
            }
          }
        });

        snapshot.forEach(doc => {
          const data = doc.data();
          fetchedMessages.push({
            id: doc.id,
            user: data.user,
            text: data.text,
            timestamp: (data.timestamp as Timestamp)?.toMillis() || Date.now(),
            isSystemMessage: data.isSystemMessage || false,
          });
        });

        setDms(prev => ({ ...prev, [dmId]: fetchedMessages }));

        if (hasNewMessages && activeChat !== dmId) {
          setUnreadDms(prev => {
            const newUnread = new Set(prev);
            newUnread.add(dmId);
            return newUnread;
          });
        }
      });
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser, openDmIds, activeChat]);

  // Vote management
  React.useEffect(() => {
    if (!trainId || !currentUser || !toast) return;

    const voteQuery = query(collection(db, `trains/${trainId}/votes`));
    const unsubscribe = onSnapshot(voteQuery, async (snapshot) => {
        if (snapshot.empty) {
            setActiveVote(null);
            return;
        }

        const voteDoc = snapshot.docs[0];
        const voteData = { id: voteDoc.id, ...voteDoc.data() };
        setActiveVote(voteData);

        const requiredVotes = Math.ceil(members.length * 0.35);
        const userToKickFromVote = voteData.userToKick;
        const isUserStillMember = members.some(m => m.id === userToKickFromVote.id);

        if (members.length > 0 && voteData.votes.length >= requiredVotes && isUserStillMember) {
            const userToKick = userToKickFromVote;

            // Add to kicked list
            if (userToKick.ticketNumber) {
                await setDoc(doc(db, `trains/${trainId}/kickedUsers`, userToKick.ticketNumber), {
                    kickedAt: serverTimestamp(),
                    name: userToKick.name,
                });
            }

            // Remove from members
            await deleteDoc(doc(db, `trains/${trainId}/members`, userToKick.id));
            
            // Announce kick
            const kickMessage = {
                user: { id: "system", name: "System", avatar: "bot" },
                text: `${userToKick.name} has been kicked from the chat by a majority vote.`,
                timestamp: serverTimestamp(),
                isSystemMessage: true,
            };
            await addDoc(collection(db, `trains/${trainId}/messages`), kickMessage);

            toast({
                title: "Vote Passed",
                description: `${userToKick.name} has been removed from the chat.`,
                duration: 5000
            });
            
            if (activeChat.includes(userToKick.id)) {
                handleSetActiveChat('group');
            }
            // Delete vote last
            await deleteDoc(doc(db, `trains/${trainId}/votes`, voteData.id));
        }
    });

    return () => unsubscribe();
  }, [trainId, members, currentUser, activeChat, toast]);


  const handleBlockUser = (userId: string) => {
    const newBlockedUsers = new Set(blockedUsers)
    if (newBlockedUsers.has(userId)) {
      newBlockedUsers.delete(userId)
       toast({ title: "User unblocked", description: "You will now see messages from this user." })
    } else {
      newBlockedUsers.add(userId)
      toast({ title: "User blocked", description: "You will no longer see messages from this user." })
    }
    setBlockedUsers(newBlockedUsers)
    localStorage.setItem("blockedUsers", JSON.stringify(Array.from(newBlockedUsers)))
  }

  const handleSendMessage = async (text: string) => {
    if (!currentUser) return
    const newMessage = { 
      user: currentUser, 
      text, 
      timestamp: serverTimestamp() 
    }
    
    if (activeChat === 'group') {
      await addDoc(collection(db, `trains/${trainId}/messages`), newMessage)
    } else {
      const dmId = activeChat
      await addDoc(collection(db, `dms/${dmId}/messages`), newMessage)
    }
  }

  const handleSetActiveChat = (chatId: string) => {
    setActiveChat(chatId);
    if (unreadDms.has(chatId)) {
        setUnreadDms(prev => {
            const newUnread = new Set(prev);
            newUnread.delete(chatId);
            return newUnread;
        });
    }
  };

  const handleOpenDM = (user: User) => {
    if (currentUser && user.id === currentUser.id) return
    const dmId = [currentUser?.id, user.id].sort().join('-')
    if (!dms[dmId]) {
      setDms(prev => ({ ...prev, [dmId]: [] }))
    }
    handleSetActiveChat(dmId)
  }

  const handleCloseDm = (dmId: string) => {
      setDms(prev => {
          const newDms = { ...prev };
          delete newDms[dmId];
          return newDms;
      });
      if (activeChat === dmId) {
          handleSetActiveChat('group');
      }
  };

  const handleInitiateVoteKick = (user: User) => {
    if (activeVote) {
       toast({
            variant: "destructive",
            title: "Vote in Progress",
            description: "A vote is already underway. Please wait for it to conclude.",
        });
        return;
    }
    setUserToKick(user);
    setVoteKickDialogOpen(true);
  }

  const deleteChatRoom = React.useCallback(async () => {
    if (!trainId) return;
    try {
        const batch = writeBatch(db);

        const messagesRef = collection(db, `trains/${trainId}/messages`);
        const messagesSnapshot = await getDocs(messagesRef);
        messagesSnapshot.forEach(doc => batch.delete(doc.ref));

        const membersRef = collection(db, `trains/${trainId}/members`);
        const membersSnapshot = await getDocs(membersRef);
        membersSnapshot.forEach(doc => batch.delete(doc.ref));

        const votesRef = collection(db, `trains/${trainId}/votes`);
        const votesSnapshot = await getDocs(votesRef);
        votesSnapshot.forEach(doc => batch.delete(doc.ref));
        
        const kickedUsersRef = collection(db, `trains/${trainId}/kickedUsers`);
        const kickedUsersSnapshot = await getDocs(kickedUsersRef);
        kickedUsersSnapshot.forEach(doc => batch.delete(doc.ref));

        await batch.commit();
        console.log(`Chatroom ${trainId} and all its data have been deleted.`);
    } catch (error) {
        console.error("Error deleting chat room data:", error);
    }
  }, [trainId]);

  const handleVoteKickSubmit = async (reason: string) => {
    if (!userToKick || !currentUser || !trainId) return;

    try {
      const { summary } = await summarizeVoteKick({
        reason,
        trainId: trainId,
        userToKickName: userToKick.name,
        initiatorName: currentUser.name,
      });

      const voteData = {
        userToKick,
        initiator: currentUser,
        reason,
        summary,
        votes: [currentUser.id],
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, `trains/${trainId}/votes`), voteData);

      const systemMessage = {
        user: { id: "system", name: "System", avatar: "bot" },
        text: `${currentUser.name} has started a vote to kick ${userToKick.name}. Reason: "${summary}"`,
        timestamp: serverTimestamp(),
        isSystemMessage: true,
      };
      await addDoc(collection(db, `trains/${trainId}/messages`), systemMessage);

      toast({
        title: "Vote to Kick Initiated",
        description: "The vote is now active for other members to participate in.",
        duration: 5000
      });

    } catch (error) {
      console.error("Failed to initiate vote to kick:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not start the vote to kick." });
    } finally {
      setVoteKickDialogOpen(false);
      setUserToKick(null);
    }
  };

  const handleCastVote = async () => {
    if (!activeVote || !currentUser || !trainId) return;

    if (activeVote.votes.includes(currentUser.id)) {
        toast({ description: "You have already voted." });
        return;
    }
    
    const voteRef = doc(db, `trains/${trainId}/votes`, activeVote.id);
    await updateDoc(voteRef, {
        votes: arrayUnion(currentUser.id)
    });
  };

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    if (squares.every(square => square !== null)) return 'Draw';
    return null;
  };

  React.useEffect(() => {
    const winner = calculateWinner(ticTacToeBoard);
    if (winner) {
      if (!ticTacToeWinner) setTicTacToeWinner(winner);
      return;
    }

    const isComputerTurn = ticTacToeBoard.filter(Boolean).length % 2 !== 0;

    if (isComputerTurn) {
      const emptyIndices = ticTacToeBoard.map((v, i) => v === null ? i : null).filter((v): v is number => v !== null);
      if (emptyIndices.length > 0) {
        const computerMoveTimeout = setTimeout(() => {
          const newBoard = [...ticTacToeBoard];
          const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          newBoard[randomIndex] = 'O';
          setTicTacToeBoard(newBoard);
        }, 500);
        return () => clearTimeout(computerMoveTimeout);
      }
    }
  }, [ticTacToeBoard, ticTacToeWinner]);

  const handleTicTacToeClick = (index: number) => {
    if (calculateWinner(ticTacToeBoard) || ticTacToeBoard[index]) return;
    const isPlayerTurn = ticTacToeBoard.filter(Boolean).length % 2 === 0;
    if (isPlayerTurn) {
      const newBoard = [...ticTacToeBoard];
      newBoard[index] = 'X';
      setTicTacToeBoard(newBoard);
    }
  };

  const resetTicTacToe = () => {
    setTicTacToeBoard(Array(9).fill(null));
    setTicTacToeWinner(null);
  };

  const handleLeaveChat = React.useCallback(async () => {
    if (!currentUser || !trainId) return;

    try {
      await deleteDoc(doc(db, `trains/${trainId}/members`, currentUser.id));

      const membersQuery = query(collection(db, `trains/${trainId}/members`));
      const membersSnapshot = await getDocs(membersQuery);

      if (membersSnapshot.empty) {
        await deleteChatRoom();
      } else {
        const leaveMessage = {
            user: { id: "system", name: "System", avatar: "bot" },
            text: `${currentUser.name} has left the chat.`,
            timestamp: serverTimestamp(),
            isSystemMessage: true,
        };
        await addDoc(collection(db, `trains/${trainId}/messages`), leaveMessage);
      }
    } catch (error) {
      console.error("Error on leaving chat:", error);
    }
  }, [currentUser, trainId, deleteChatRoom]);
  
  const handleLogout = async () => {
    await handleLeaveChat();
    if (trainId) {
      sessionStorage.removeItem(`rail-talk-user-${trainId}`);
    }
    window.location.href = '/';
  }

  if (!currentUser) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Joining your journey...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="h-full flex flex-col">
        <SidebarHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h2 className="text-lg font-semibold font-headline">
                Train {trainId}
              </h2>
            </div>
             <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </SidebarHeader>
        {activeVote && currentUser && (
            <VoteInProgressBanner
                vote={activeVote}
                membersCount={members.length}
                onVote={handleCastVote}
                currentUser={currentUser}
            />
        )}
        <div className="flex-1 flex overflow-hidden">
          <Sidebar>
            <SidebarContent className="p-0">
               <Alert className="m-2 border-primary/50">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle className="font-headline">Your Info</AlertTitle>
                  <AlertDescription>
                    You are chatting as <span className="font-bold">{currentUser.name}</span>.
                  </AlertDescription>
                </Alert>
              <div className="p-2">
                <h3 className="flex items-center gap-2 px-2 text-sm font-semibold mb-2"><Users className="h-4 w-4" /> Members Online</h3>
                <MemberList
                  members={members}
                  currentUser={currentUser}
                  onOpenDM={handleOpenDM}
                  onBlockUser={handleBlockUser}
                  onInitiateVoteKick={handleInitiateVoteKick}
                  blockedUsers={blockedUsers}
                />
              </div>
              <div className="p-2">
                 <h3 className="flex items-center gap-2 px-2 text-sm font-semibold mb-2"><Gamepad2 className="h-4 w-4" /> Tic-Tac-Toe</h3>
                <TicTacToe 
                  board={ticTacToeBoard} 
                  onPlay={handleTicTacToeClick}
                  winner={ticTacToeWinner}
                  onReset={resetTicTacToe}
                />
              </div>
            </SidebarContent>
            <SidebarFooter>
              {/* Footer content if any */}
            </SidebarFooter>
          </Sidebar>
          <SidebarInset className="flex flex-col">
            <ChatView
              currentUser={currentUser}
              members={members}
              messages={messages}
              dms={dms}
              unreadDms={unreadDms}
              blockedUsers={blockedUsers}
              activeChat={activeChat}
              onSetActiveChat={handleSetActiveChat}
              onSendMessage={handleSendMessage}
              onCloseDm={handleCloseDm}
            />
          </SidebarInset>
        </div>
      </div>
       <VoteKickDialog
        isOpen={isVoteKickDialogOpen}
        onOpenChange={setVoteKickDialogOpen}
        userToKick={userToKick}
        onSubmit={handleVoteKickSubmit}
      />
    </SidebarProvider>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  )
}
