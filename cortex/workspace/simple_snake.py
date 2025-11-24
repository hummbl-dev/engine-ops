#!/usr/bin/env python3
"""Ultra-simple terminal Snake game that definitely works"""
import curses
import random
import time

def main(stdscr):
    curses.curs_set(0)
    stdscr.nodelay(1)
    stdscr.timeout(100)
    
    # Simple 20x20 grid
    h, w = 20, 20
    
    # Snake: list of (y, x) positions
    snake = [(h//2, w//2), (h//2, w//2-1), (h//2, w//2-2)]
    direction = (0, 1)  # right
    
    # Food
    food = (random.randint(1, h-2), random.randint(1, w-2))
    
    score = 0
    
    while True:
        stdscr.clear()
        
        # Draw border
        stdscr.border()
        
        # Draw score
        stdscr.addstr(0, 2, f" Score: {score} ")
        
        # Draw snake
        for i, (y, x) in enumerate(snake):
            if 0 < y < h-1 and 0 < x < w-1:
                stdscr.addstr(y, x, 'O' if i == 0 else 'o')
        
        # Draw food
        if 0 < food[0] < h-1 and 0 < food[1] < w-1:
            stdscr.addstr(food[0], food[1], '*')
        
        stdscr.refresh()
        
        # Get key
        key = stdscr.getch()
        
        # Change direction
        if key == curses.KEY_UP and direction != (1, 0):
            direction = (-1, 0)
        elif key == curses.KEY_DOWN and direction != (-1, 0):
            direction = (1, 0)
        elif key == curses.KEY_LEFT and direction != (0, 1):
            direction = (0, -1)
        elif key == curses.KEY_RIGHT and direction != (0, -1):
            direction = (0, 1)
        elif key == ord('q'):
            break
        
        # Move snake
        head = snake[0]
        new_head = (head[0] + direction[0], head[1] + direction[1])
        
        # Check collision with walls
        if new_head[0] <= 0 or new_head[0] >= h-1 or new_head[1] <= 0 or new_head[1] >= w-1:
            stdscr.addstr(h//2, w//2 - 5, "GAME OVER!")
            stdscr.refresh()
            stdscr.nodelay(0)
            stdscr.getch()
            break
        
        # Check collision with self
        if new_head in snake:
            stdscr.addstr(h//2, w//2 - 5, "GAME OVER!")
            stdscr.refresh()
            stdscr.nodelay(0)
            stdscr.getch()
            break
        
        # Add new head
        snake.insert(0, new_head)
        
        # Check if ate food
        if new_head == food:
            score += 1
            food = (random.randint(1, h-2), random.randint(1, w-2))
        else:
            snake.pop()  # Remove tail

if __name__ == "__main__":
    curses.wrapper(main)
