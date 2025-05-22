"use client"

import { useState, useEffect } from "react"
import { ChevronDown, RotateCcw, Trophy, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ConnectFourGame() {
  const rows = 6
  const cols = 7
  const [board, setBoard] = useState<string[][]>(
    Array(rows)
      .fill()
      .map(() => Array(cols).fill("")),
  )
  const [currentPlayer, setCurrentPlayer] = useState<"red" | "yellow">("red")
  const [gameActive, setGameActive] = useState(true)
  const [status, setStatus] = useState("Lượt của bạn (Đỏ)")
  const [winner, setWinner] = useState<string | null>(null)
  const [instructionsOpen, setInstructionsOpen] = useState(false)

  // Tìm hàng trống thấp nhất trong cột
  const getLowestEmptyRow = (col: number, currentBoard: string[][]) => {
    for (let row = rows - 1; row >= 0; row--) {
      if (currentBoard[row][col] === "") return row
    }
    return -1
  }

  // Kiểm tra thắng
  const checkWin = (player: string, currentBoard: string[][]) => {
    // Kiểm tra hàng ngang
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col <= cols - 4; col++) {
        if (currentBoard[row].slice(col, col + 4).every((cell) => cell === player)) return true
      }
    }
    // Kiểm tra hàng dọc
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row <= rows - 4; row++) {
        if ([0, 1, 2, 3].every((i) => currentBoard[row + i][col] === player)) return true
      }
    }
    // Kiểm tra đường chéo (/)
    for (let row = 3; row < rows; row++) {
      for (let col = 0; col <= cols - 4; col++) {
        if ([0, 1, 2, 3].every((i) => currentBoard[row - i][col + i] === player)) return true
      }
    }
    // Kiểm tra đường chéo (\)
    for (let row = 0; row <= rows - 4; row++) {
      for (let col = 0; col <= cols - 4; col++) {
        if ([0, 1, 2, 3].every((i) => currentBoard[row + i][col + i] === player)) return true
      }
    }
    return false
  }

  // Thuật toán Alpha-Beta Pruning
  const alphaBeta = (
    currentBoard: string[][],
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
  ): number => {
    if (checkWin("yellow", currentBoard)) return 100 - depth
    if (checkWin("red", currentBoard)) return depth - 100
    if (currentBoard.every((row) => row.every((cell) => cell !== ""))) return 0
    if (depth >= 6) return 0 // Giới hạn độ sâu

    if (isMaximizing) {
      let bestScore = Number.NEGATIVE_INFINITY
      for (let col = 0; col < cols; col++) {
        const row = getLowestEmptyRow(col, currentBoard)
        if (row !== -1) {
          const newBoard = JSON.parse(JSON.stringify(currentBoard))
          newBoard[row][col] = "yellow"
          const score = alphaBeta(newBoard, depth + 1, alpha, beta, false)
          bestScore = Math.max(score, bestScore)
          alpha = Math.max(alpha, bestScore)
          if (beta <= alpha) break
        }
      }
      return bestScore
    } else {
      let bestScore = Number.POSITIVE_INFINITY
      for (let col = 0; col < cols; col++) {
        const row = getLowestEmptyRow(col, currentBoard)
        if (row !== -1) {
          const newBoard = JSON.parse(JSON.stringify(currentBoard))
          newBoard[row][col] = "red"
          const score = alphaBeta(newBoard, depth + 1, alpha, beta, true)
          bestScore = Math.min(score, bestScore)
          beta = Math.min(beta, bestScore)
          if (beta <= alpha) break
        }
      }
      return bestScore
    }
  }

  // AI chọn nước đi
  const aiMove = () => {
    if (!gameActive) return

    let bestScore = Number.NEGATIVE_INFINITY
    let bestCol = 0
    for (let col = 0; col < cols; col++) {
      const row = getLowestEmptyRow(col, board)
      if (row !== -1) {
        const newBoard = JSON.parse(JSON.stringify(board))
        newBoard[row][col] = "yellow"
        const score = alphaBeta(newBoard, 0, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, false)
        if (score > bestScore) {
          bestScore = score
          bestCol = col
        }
      }
    }
    const row = getLowestEmptyRow(bestCol, board)
    if (row !== -1) {
      makeMove(row, bestCol, "yellow")
    }
  }

  // Thực hiện nước đi
  const makeMove = (row: number, col: number, player: "red" | "yellow") => {
    const newBoard = [...board]
    newBoard[row][col] = player
    setBoard(newBoard)

    if (checkWin(player, newBoard)) {
      setStatus(`${player === "red" ? "Bạn" : "AI"} thắng!`)
      setWinner(player)
      setGameActive(false)
    } else if (newBoard.every((row) => row.every((cell) => cell !== ""))) {
      setStatus("Hòa!")
      setGameActive(false)
    } else {
      const nextPlayer = player === "red" ? "yellow" : "red"
      setCurrentPlayer(nextPlayer)
      setStatus(`Lượt của ${nextPlayer === "red" ? "bạn (Đỏ)" : "AI (Vàng)"}`)
    }
  }

  // Xử lý click
  const handleCellClick = (col: number) => {
    if (!gameActive || currentPlayer !== "red") return
    const row = getLowestEmptyRow(col, board)
    if (row !== -1) {
      makeMove(row, col, "red")
    }
  }

  // Reset game
  const resetGame = () => {
    setBoard(
      Array(rows)
        .fill()
        .map(() => Array(cols).fill("")),
    )
    setCurrentPlayer("red")
    setGameActive(true)
    setStatus("Lượt của bạn (Đỏ)")
    setWinner(null)
  }

  // AI move after player's turn
  useEffect(() => {
    if (currentPlayer === "yellow" && gameActive) {
      const timer = setTimeout(() => {
        aiMove()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentPlayer, gameActive])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col items-center py-8 px-4">
      <div className="max-w-4xl w-full">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-red-500 mb-2">
            Connect Four
          </h1>
          <p className="text-gray-300">Trò chơi chiến thuật với AI thông minh</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <div
                    className={`w-4 h-4 rounded-full ${currentPlayer === "red" ? "bg-red-500" : "bg-yellow-400"} mr-2`}
                  ></div>
                  <span
                    className={`text-lg font-medium ${winner ? (winner === "red" ? "text-red-500" : "text-yellow-400") : ""}`}
                  >
                    {status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Sheet open={instructionsOpen} onOpenChange={setInstructionsOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                        <Info className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="bg-gray-900 text-white border-gray-800">
                      <SheetHeader>
                        <SheetTitle className="text-white">Cách chơi Connect Four</SheetTitle>
                        <SheetDescription className="text-gray-400">
                          Hướng dẫn chi tiết về luật chơi và chiến thuật
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6">
                        <Tabs defaultValue="rules">
                          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                            <TabsTrigger value="rules">Luật chơi</TabsTrigger>
                            <TabsTrigger value="strategy">Chiến thuật</TabsTrigger>
                          </TabsList>
                          <TabsContent value="rules" className="mt-4 space-y-4">
                            <div>
                              <h3 className="font-semibold text-lg mb-2">Mục tiêu</h3>
                              <p className="text-gray-300">
                                Nối 4 quân liên tiếp theo hàng ngang, dọc hoặc chéo trước khi AI làm được điều đó.
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg mb-2">Luật chơi</h3>
                              <ul className="list-disc pl-5 space-y-2 text-gray-300">
                                <li>
                                  Bạn là quân <span className="text-red-500 font-medium">Đỏ</span>, AI là quân{" "}
                                  <span className="text-yellow-400 font-medium">Vàng</span>.
                                </li>
                                <li>Click vào một cột để thả quân Đỏ vào ô trống thấp nhất trong cột đó.</li>
                                <li>AI sẽ tự động thả quân Vàng sau lượt của bạn.</li>
                                <li>Trò chơi kết thúc khi một bên nối được 4 quân liên tiếp hoặc bảng đầy (hòa).</li>
                              </ul>
                            </div>
                          </TabsContent>
                          <TabsContent value="strategy" className="mt-4 space-y-4">
                            <div>
                              <h3 className="font-semibold text-lg mb-2">Mẹo chiến thắng</h3>
                              <ul className="list-disc pl-5 space-y-2 text-gray-300">
                                <li>Kiểm soát cột giữa - đây là vị trí quan trọng nhất trên bàn cờ.</li>
                                <li>Tạo mối đe dọa kép - tạo ra hai đường có thể thắng cùng lúc.</li>
                                <li>Chặn đối thủ khi họ có 3 quân liên tiếp.</li>
                                <li>Suy nghĩ trước 2-3 bước để lập chiến lược.</li>
                                <li>Đôi khi, hy sinh một nước đi để tạo cơ hội tốt hơn sau này.</li>
                              </ul>
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg mb-2">Về AI</h3>
                              <p className="text-gray-300">
                                AI trong trò chơi này sử dụng thuật toán Alpha-Beta Pruning, một kỹ thuật tìm kiếm nâng
                                cao giúp AI đưa ra quyết định tối ưu bằng cách dự đoán nhiều bước đi phía trước.
                              </p>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </SheetContent>
                  </Sheet>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={resetGame}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Column indicators */}
              <div className="flex justify-around mb-2">
                {Array(cols)
                  .fill(0)
                  .map((_, col) => (
                    <button
                      key={`indicator-${col}`}
                      className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                        gameActive && currentPlayer === "red" ? "text-red-500 hover:bg-gray-700" : "text-gray-600"
                      }`}
                      onClick={() => handleCellClick(col)}
                      disabled={!gameActive || currentPlayer !== "red"}
                    >
                      <ChevronDown className="h-5 w-5" />
                    </button>
                  ))}
              </div>

              {/* Game board */}
              <div className="bg-blue-600 p-2 rounded-lg shadow-inner">
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                  {board.flat().map((cell, index) => {
                    const row = Math.floor(index / cols)
                    const col = index % cols
                    return (
                      <div
                        key={`cell-${row}-${col}`}
                        className={`aspect-square rounded-full relative shadow-inner bg-gray-800 flex items-center justify-center transition-all duration-300 overflow-hidden`}
                        onClick={() => handleCellClick(col)}
                      >
                        <div
                          className={`absolute inset-1 rounded-full transition-all duration-300 transform ${
                            cell === "red"
                              ? "bg-gradient-to-br from-red-400 to-red-600 scale-100"
                              : cell === "yellow"
                                ? "bg-gradient-to-br from-yellow-300 to-yellow-500 scale-100"
                                : "scale-0"
                          }`}
                        ></div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Game result overlay */}
              {!gameActive && (
                <div className="mt-4 bg-gray-900 bg-opacity-80 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    {winner && (
                      <Trophy className={`h-6 w-6 mr-2 ${winner === "red" ? "text-red-500" : "text-yellow-400"}`} />
                    )}
                    <h3 className="text-xl font-bold">{status}</h3>
                  </div>
                  <Button
                    onClick={resetGame}
                    className="mt-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    Chơi lại
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Hướng dẫn nhanh</CardTitle>
                <CardDescription className="text-gray-400">Cách chơi Connect Four</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-red-500 mt-1 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium">Bạn - Quân Đỏ</h4>
                    <p className="text-sm text-gray-400">Click vào cột để thả quân</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-400 mt-1 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium">AI - Quân Vàng</h4>
                    <p className="text-sm text-gray-400">AI sẽ tự động đi sau bạn</p>
                  </div>
                </div>
                <div className="pt-2">
                  <h4 className="font-medium mb-2">Mục tiêu</h4>
                  <p className="text-sm text-gray-400">
                    Nối 4 quân liên tiếp theo hàng ngang, dọc hoặc chéo trước khi AI làm được điều đó.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-2 border-gray-700 text-gray-300 hover:bg-gray-700"
                  onClick={() => setInstructionsOpen(true)}
                >
                  Xem hướng dẫn đầy đủ
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 mt-4">
              <CardHeader>
                <CardTitle>Về trò chơi</CardTitle>
                <CardDescription className="text-gray-400">Connect Four với AI thông minh</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-300">
                <p>
                  Connect Four là trò chơi chiến thuật cổ điển dành cho hai người chơi. Trong phiên bản này, bạn sẽ đối
                  đầu với AI sử dụng thuật toán Alpha-Beta Pruning.
                </p>
                <p>
                  AI có thể nhìn trước nhiều bước đi và đưa ra quyết định tối ưu, tạo nên thử thách thú vị cho người
                  chơi ở mọi cấp độ.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
