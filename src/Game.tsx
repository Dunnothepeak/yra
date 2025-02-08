import React, { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';
import { motion, AnimatePresence } from 'framer-motion';

const GRID_SIZE = 12;
const SHAPES = [
  [[1]], // Single block
  [[1,1]], // Horizontal duo
  [[1,1,1]], // Horizontal trio
  [[1,1,1,1]], // Horizontal quad
  [[1,1,1,1,1,1,1,1]], // Horizontal octo
  [[1,1],[1,1]], // Square
  [[1,1,1,1],[1,1,1,1]], // 4x2 rectangle
  [[1,0,0],[1,0,0],[1,1,1]], // L shape
  [[1,1,1],[0,1,0]], // T shape
  [[1],[1],[1],[1]], // Vertical quad
];

const Game = () => {
  const [grid, setGrid] = useState(Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [completedRows, setCompletedRows] = useState([]);
  const [previewShapes, setPreviewShapes] = useState([]);
  const [currentShapeIndex, setCurrentShapeIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (previewShapes.length === 0) {
      setPreviewShapes([
        SHAPES[Math.floor(Math.random() * SHAPES.length)],
        SHAPES[Math.floor(Math.random() * SHAPES.length)],
        SHAPES[Math.floor(Math.random() * SHAPES.length)]
      ]);
    }
  }, []);

  const canPlaceShape = (shape, startRow, startCol) => {
    if (startRow + shape.length > GRID_SIZE || startCol + shape[0].length > GRID_SIZE) return false;
    
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[0].length; j++) {
        if (shape[i][j] && grid[startRow + i][startCol + j]) return false;
      }
    }
    return true;
  };

  const findBestPosition = (shape) => {
    let bestScore = -1;
    let bestPosition = null;
    
    for (let row = 0; row <= GRID_SIZE - shape.length; row++) {
      for (let col = 0; col <= GRID_SIZE - shape[0].length; col++) {
        if (canPlaceShape(shape, row, col)) {
          // Simplified scoring - prioritize completing rows
          let score = 0;
          const tempGrid = grid.map(row => [...row]);
          
          // Place shape temporarily
          for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[0].length; j++) {
              if (shape[i][j]) {
                tempGrid[row + i][col + j] = 1;
              }
            }
          }
          
          // Check rows that would be completed
          for (let i = row; i < row + shape.length; i++) {
            if (tempGrid[i].every(cell => cell === 1)) {
              score += 100;
            }
          }
          
          if (score > bestScore) {
            bestScore = score;
            bestPosition = { row, col };
          }
        }
      }
    }
    
    // If no good position found, just place it anywhere valid
    if (!bestPosition) {
      for (let row = 0; row <= GRID_SIZE - shape.length; row++) {
        for (let col = 0; col <= GRID_SIZE - shape[0].length; col++) {
          if (canPlaceShape(shape, row, col)) {
            return { row, col };
          }
        }
      }
    }
    
    return bestPosition;
  };

  const placeShape = () => {
    if (gameOver || isAnimating || currentShapeIndex >= 3) return;
    
    const shape = previewShapes[currentShapeIndex];
    const bestPosition = findBestPosition(shape);
    
    if (bestPosition) {
      setIsAnimating(true);
      
      setTimeout(() => {
        const newGrid = grid.map(row => [...row]);
        for (let i = 0; i < shape.length; i++) {
          for (let j = 0; j < shape[0].length; j++) {
            if (shape[i][j]) {
              newGrid[bestPosition.row + i][bestPosition.col + j] = 1;
            }
          }
        }
        setGrid(newGrid);
        
        const completed = [];
        for (let i = 0; i < GRID_SIZE; i++) {
          if (newGrid[i].every(cell => cell === 1)) {
            completed.push(i);
          }
        }
        setCompletedRows(completed);
        
        setCurrentShapeIndex(prev => prev + 1);
        
        if (currentShapeIndex === 2) {
          setPreviewShapes([
            SHAPES[Math.floor(Math.random() * SHAPES.length)],
            SHAPES[Math.floor(Math.random() * SHAPES.length)],
            SHAPES[Math.floor(Math.random() * SHAPES.length)]
          ]);
          setCurrentShapeIndex(0);
        }
        
        setIsAnimating(false);
      }, 500);
    } else {
      setGameOver(true);
    }
  };

  const handleCellClick = (row, col) => {
    if (gameOver) return;
    
    if (!completedRows.includes(row) && grid[row][col] === 1) {
      setGameOver(true);
      return;
    }
    
    if (completedRows.includes(row)) {
      const newGrid = grid.map(row => [...row]);
      newGrid[row][col] = 0;
      setGrid(newGrid);
      
      if (newGrid[row].every(cell => cell === 0)) {
        setScore(prev => prev + 1);
        setCompletedRows(prev => prev.filter(r => r !== row));
      }
    }
  };

  useEffect(() => {
    if (!gameOver && !isAnimating) {
      const timer = setInterval(placeShape, 2000);
      return () => clearInterval(timer);
    }
  }, [grid, gameOver, previewShapes, currentShapeIndex, isAnimating]);

  const resetGame = () => {
    setGrid(Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0)));
    setScore(0);
    setGameOver(false);
    setCompletedRows([]);
    setPreviewShapes([]);
    setCurrentShapeIndex(0);
    setIsAnimating(false);
  };

  const renderPreviewShape = (shape, index) => {
    if (!shape) return null;
    return (
      <motion.div 
        className="grid gap-0.5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {shape.map((row, i) => (
          <div key={i} className="flex gap-0.5">
            {row.map((cell, j) => (
              <div
                key={j}
                className={`w-3 h-3 ${
                  cell ? 
                    index === currentShapeIndex ? 'bg-blue-400' : 'bg-blue-600'
                    : 'bg-transparent'
                }`}
              />
            ))}
          </div>
        ))}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center gap-4 p-4">
      <div className="text-2xl font-bold mb-2">Reverse BlockBlast</div>
      <div className="text-lg mb-2">Score: {score}</div>
      
      <div className="relative">
        <div className="grid bg-gray-800 rounded-lg overflow-hidden">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((cell, colIndex) => (
                <motion.button
                  key={`${rowIndex}-${colIndex}`}
                  className={`w-6 h-6 sm:w-8 sm:h-8 border-[0.5px] border-gray-700 ${
                    cell ? 
                      completedRows.includes(rowIndex) 
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                      : 'bg-transparent'
                  }`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  animate={{ scale: cell ? 1 : 1 }}
                  transition={{ duration: 0.2 }}
                  disabled={!cell || gameOver}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 mt-4">
        <AnimatePresence>
          {previewShapes.map((shape, index) => (
            <div key={index} className="bg-gray-800 p-2 rounded">
              {renderPreviewShape(shape, index)}
            </div>
          ))}
        </AnimatePresence>
      </div>
      
      <AlertDialog open={gameOver}>
        <AlertDialogContent className="bg-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Game Over!</AlertDialogTitle>
            <AlertDialogDescription>
              Final Score: {score}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={resetGame} className="bg-blue-500 hover:bg-blue-600">
              Play Again
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Game;
