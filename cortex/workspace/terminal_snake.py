import curses
import random
import time

GAME_HEIGHT = 30
GAME_WIDTH = 30
INFO_LINES = 1 # Lines for score/speed above the game area

PLAY_AREA_Y_START = INFO_LINES
PLAY_AREA_X_START = 0
PLAY_AREA_Y_END = PLAY_AREA_Y_START + GAME_HEIGHT + 1
PLAY_AREA_X_END = PLAY_AREA_X_START + GAME_WIDTH + 1

COLOR_SNAKE_HEAD = 1
COLOR_SNAKE_BODY = 2
COLOR_FOOD = 3
COLOR_BORDER = 4
COLOR_TEXT = 5
COLOR_GAME_OVER = 6

UP = (-1, 0)
DOWN = (1, 0)
LEFT = (0, -1)
RIGHT = (0, 1)

INITIAL_SPEED = 150
SPEED_DECREMENT_PER_SCORE = 5
MIN_SPEED = 50

def draw_centered_text(stdscr, y, text, color_pair):
    max_y, max_x = stdscr.getmaxyx()
    x = (max_x - len(text)) // 2
    stdscr.addstr(y, x, text, curses.color_pair(color_pair))

def place_food(snake, game_height, game_width):
    while True:
        food_y = random.randint(1, game_height)
        food_x = random.randint(1, game_width)
        if (food_y, food_x) not in snake:
            return (food_y, food_x)

def check_terminal_size(stdscr):
    max_y, max_x = stdscr.getmaxyx()
    required_y = PLAY_AREA_Y_END + 2
    required_x = PLAY_AREA_X_END + 2

    if max_y < required_y or max_x < required_x:
        stdscr.clear()
        draw_centered_text(stdscr, max_y // 2 - 1, "Terminal too small!", COLOR_GAME_OVER)
        draw_centered_text(stdscr, max_y // 2, f"Please resize to at least {required_y}x{required_x}", COLOR_GAME_OVER)
        draw_centered_text(stdscr, max_y // 2 + 1, "Press 'q' to quit, or resize and press any key.", COLOR_GAME_OVER)
        stdscr.nodelay(False)
        while True:
            key = stdscr.getch()
            if key == ord('q') or key == ord('Q'):
                return False
            max_y, max_x = stdscr.getmaxyx()
            if max_y >= required_y and max_x >= required_x:
                stdscr.nodelay(True)
                stdscr.clear()
                return True
    return True

def run_game(stdscr):
    curses.curs_set(0)
    stdscr.timeout(INITIAL_SPEED)
    stdscr.keypad(True)
    curses.noecho()
    curses.cbreak()

    curses.start_color()
    curses.init_pair(COLOR_SNAKE_HEAD, curses.COLOR_GREEN, curses.COLOR_BLACK)
    curses.init_pair(COLOR_SNAKE_BODY, curses.COLOR_CYAN, curses.COLOR_BLACK)
    curses.init_pair(COLOR_FOOD, curses.COLOR_RED, curses.COLOR_BLACK)
    curses.init_pair(COLOR_BORDER, curses.COLOR_WHITE, curses.COLOR_BLACK)
    curses.init_pair(COLOR_TEXT, curses.COLOR_YELLOW, curses.COLOR_BLACK)
    curses.init_pair(COLOR_GAME_OVER, curses.COLOR_YELLOW, curses.COLOR_RED)

    while True:
        score = 0
        current_speed = INITIAL_SPEED
        game_over = False

        initial_head_y = GAME_HEIGHT // 2
        initial_head_x = GAME_WIDTH // 2
        snake = [(initial_head_y, initial_head_x),
                 (initial_head_y, initial_head_x - 1),
                 (initial_head_y, initial_head_x - 2)]
        direction = RIGHT

        food = place_food(snake, GAME_HEIGHT, GAME_WIDTH)

        stdscr.clear()
        draw_centered_text(stdscr, 0, "Python Terminal Snake", COLOR_TEXT)
        draw_centered_text(stdscr, 1, "Use WASD or Arrow Keys to move.", COLOR_TEXT)
        draw_centered_text(stdscr, 2, "Eat food to grow, avoid walls and yourself!", COLOR_TEXT)
        draw_centered_text(stdscr, 3, "Press 'Q' to quit anytime.", COLOR_TEXT)
        draw_centered_text(stdscr, 4, "Press any key to start...", COLOR_TEXT)
        stdscr.refresh()
        stdscr.nodelay(False)
        stdscr.getch()
        curses.flushinp()  # Clear any buffered input
        stdscr.nodelay(True)

        stdscr.clear()

        while not game_over:
            if not check_terminal_size(stdscr):
                return
            
            curses.update_lines_cols()

            stdscr.attron(curses.color_pair(COLOR_BORDER))
            stdscr.addch(PLAY_AREA_Y_START, PLAY_AREA_X_START, curses.ACS_ULCORNER)
            stdscr.addch(PLAY_AREA_Y_START, PLAY_AREA_X_END, curses.ACS_URCORNER)
            stdscr.addch(PLAY_AREA_Y_END, PLAY_AREA_X_START, curses.ACS_LLCORNER)
            stdscr.addch(PLAY_AREA_Y_END, PLAY_AREA_X_END, curses.ACS_LRCORNER)
            for x in range(PLAY_AREA_X_START + 1, PLAY_AREA_X_END):
                stdscr.addch(PLAY_AREA_Y_START, x, curses.ACS_HLINE)
                stdscr.addch(PLAY_AREA_Y_END, x, curses.ACS_HLINE)
            for y in range(PLAY_AREA_Y_START + 1, PLAY_AREA_Y_END):
                stdscr.addch(y, PLAY_AREA_X_START, curses.ACS_VLINE)
                stdscr.addch(y, PLAY_AREA_X_END, curses.ACS_VLINE)
            stdscr.attroff(curses.color_pair(COLOR_BORDER))
            
            stdscr.addstr(0, 2, f"Score: {score:<5}", curses.color_pair(COLOR_TEXT))
            stdscr.addstr(0, GAME_WIDTH - 15, f"Speed: {current_speed:<3}ms", curses.color_pair(COLOR_TEXT))

            key = stdscr.getch()

            if key == ord('q') or key == ord('Q'):
                return

            if key == curses.KEY_UP or key == ord('w'):
                if direction != DOWN:
                    direction = UP
            elif key == curses.KEY_DOWN or key == ord('s'):
                if direction != UP:
                    direction = DOWN
            elif key == curses.KEY_LEFT or key == ord('a'):
                if direction != RIGHT:
                    direction = LEFT
            elif key == curses.KEY_RIGHT or key == ord('d'):
                if direction != LEFT:
                    direction = RIGHT
            elif key == curses.KEY_RESIZE:
                continue

            # Movement happens automatically based on timeout
            # Key presses only change direction, not trigger movement

            head_y, head_x = snake[0]
            new_head_y = head_y + direction[0]
            new_head_x = head_x + direction[1]

            if not (1 <= new_head_y <= GAME_HEIGHT and 1 <= new_head_x <= GAME_WIDTH):
                game_over = True
                continue

            if (new_head_y, new_head_x) in snake:
                game_over = True
                continue
            
            snake.insert(0, (new_head_y, new_head_x))

            if (new_head_y, new_head_x) == food:
                score += 1
                current_speed = max(MIN_SPEED, current_speed - SPEED_DECREMENT_PER_SCORE)
                stdscr.timeout(current_speed)
                stdscr.addch(food[0] + PLAY_AREA_Y_START, food[1] + PLAY_AREA_X_START, ' ')
                food = place_food(snake, GAME_HEIGHT, GAME_WIDTH)
            else:
                tail_y, tail_x = snake.pop()
                stdscr.addch(tail_y + PLAY_AREA_Y_START, tail_x + PLAY_AREA_X_START, ' ')

            stdscr.attron(curses.color_pair(COLOR_FOOD))
            stdscr.addch(food[0] + PLAY_AREA_Y_START, food[1] + PLAY_AREA_X_START, curses.ACS_DIAMOND)
            stdscr.attroff(curses.color_pair(COLOR_FOOD))

            stdscr.attron(curses.color_pair(COLOR_SNAKE_HEAD))
            stdscr.addch(snake[0][0] + PLAY_AREA_Y_START, snake[0][1] + PLAY_AREA_X_START, 'O')
            stdscr.attroff(curses.color_pair(COLOR_SNAKE_HEAD))

            stdscr.attron(curses.color_pair(COLOR_SNAKE_BODY))
            for segment_y, segment_x in snake[1:]:
                stdscr.addch(segment_y + PLAY_AREA_Y_START, segment_x + PLAY_AREA_X_START, 'o')
            stdscr.attroff(curses.color_pair(COLOR_SNAKE_BODY))
            
            stdscr.refresh()

        stdscr.clear()
        max_y, max_x = stdscr.getmaxyx()
        
        draw_centered_text(stdscr, max_y // 2 - 2, "GAME OVER!", COLOR_GAME_OVER)
        draw_centered_text(stdscr, max_y // 2 - 1, f"Final Score: {score}", COLOR_GAME_OVER)
        draw_centered_text(stdscr, max_y // 2 + 1, "Press 'R' to Play Again or 'Q' to Quit.", COLOR_TEXT)
        stdscr.nodelay(False)

        while True:
            key = stdscr.getch()
            if key == ord('r') or key == ord('R'):
                break
            elif key == ord('q') or key == ord('Q'):
                return
            elif key == curses.KEY_RESIZE:
                stdscr.clear()
                curses.update_lines_cols()
                max_y, max_x = stdscr.getmaxyx()
                draw_centered_text(stdscr, max_y // 2 - 2, "GAME OVER!", COLOR_GAME_OVER)
                draw_centered_text(stdscr, max_y // 2 - 1, f"Final Score: {score}", COLOR_GAME_OVER)
                draw_centered_text(stdscr, max_y // 2 + 1, "Press 'R' to Play Again or 'Q' to Quit.", COLOR_TEXT)
                stdscr.refresh()

if __name__ == "__main__":
    curses.wrapper(run_game)