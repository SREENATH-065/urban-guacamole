"use client"

import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import { RefreshCw } from "lucide-react"

export type TicTacToeWinnerValue = 'X' | 'O' | 'Draw' | null;

interface TicTacToeProps {
  board: (string | null)[]
  onPlay: (index: number) => void
  winner: TicTacToeWinnerValue
  onReset: () => void
}

export function TicTacToe({ board, onPlay, winner, onReset }: TicTacToeProps) {
  const renderSquare = (index: number) => {
    return (
      <button
        key={index}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-md border text-2xl font-bold transition-colors",
          "hover:bg-accent focus:bg-accent focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-60",
          board[index] === 'X' ? 'text-primary' : 'text-secondary-foreground'
        )}
        onClick={() => onPlay(index)}
        aria-label={`Square ${index + 1}`}
        disabled={!!board[index] || !!winner}
      >
        {board[index]}
      </button>
    )
  }

  const getStatus = () => {
    if (winner) {
      if (winner === 'Draw') return "It's a draw!";
      return winner === 'X' ? "You win!" : "Computer wins!";
    }
    const isPlayerTurn = board.filter(Boolean).length % 2 === 0;
    return isPlayerTurn ? "Your turn (X)" : "Computer's turn...";
  }

  return (
    <div className="p-2 bg-muted rounded-md">
      <div className="grid grid-cols-3 gap-2">
        {board.map((_, index) => renderSquare(index))}
      </div>
       <div className="mt-2 flex h-6 items-center justify-between text-xs text-muted-foreground">
        <span>{getStatus()}</span>
        {winner && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onReset}>
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">New Game</span>
          </Button>
        )}
      </div>
    </div>
  )
}
