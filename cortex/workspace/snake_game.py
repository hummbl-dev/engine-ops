# Snake Game in Python using Pygame

# INSTRUCTIONS:
# 1. Ensure you have pygame installed: pip install pygame
# 2. Run this script.
# 3. Use the UP, DOWN, LEFT, and RIGHT arrow keys to control the snake.
# 4. The snake grows when it eats the red food.
# 5. The game ends if the snake hits the walls or itself.
# 6. Your score will be displayed at the top left.

import pygame
import random
import sys

# --- Constants ---
WIDTH, HEIGHT = 600, 600
GRID_SIZE = 20
GRID_WIDTH = WIDTH // GRID_SIZE
GRID_HEIGHT = HEIGHT // GRID_SIZE
FPS = 10

# Colors
BLACK = (0, 0, 0)
GREEN = (0, 255, 0)
RED = (255, 0, 0)
WHITE = (255, 255, 255)

# --- Game Initialization ---
pygame.init()
SCREEN = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Classic Snake")
CLOCK = pygame.time.Clock()
FONT = pygame.font.Font(None, 36) # Default font, size 36

# --- Game Variables ---
snake = []
snake_direction = (0, 0) # (dx, dy)
food_pos = (0, 0)
score = 0
game_over = False

# --- Functions ---

def reset_game():
    global snake, snake_direction, food_pos, score, game_over
    
    # Initialize snake: starting in the middle, 3 segments long, moving right
    snake = [
        (GRID_WIDTH // 2 * GRID_SIZE, GRID_HEIGHT // 2 * GRID_SIZE),
        ((GRID_WIDTH // 2 - 1) * GRID_SIZE, GRID_HEIGHT // 2 * GRID_SIZE),
        ((GRID_WIDTH // 2 - 2) * GRID_SIZE, GRID_HEIGHT // 2 * GRID_SIZE)
    ]
    snake_direction = (GRID_SIZE, 0) # Start moving right
    score = 0
    game_over = False
    generate_food()

def generate_food():
    global food_pos
    while True:
        x = random.randint(0, GRID_WIDTH - 1) * GRID_SIZE
        y = random.randint(0, GRID_HEIGHT - 1) * GRID_SIZE
        food_pos = (x, y)
        if food_pos not in snake: # Ensure food doesn't spawn on the snake
            break

def draw_elements():
    # Clear screen
    SCREEN.fill(BLACK)

    # Draw snake
    for segment in snake:
        pygame.draw.rect(SCREEN, GREEN, (segment[0], segment[1], GRID_SIZE, GRID_SIZE))

    # Draw food
    pygame.draw.rect(SCREEN, RED, (food_pos[0], food_pos[1], GRID_SIZE, GRID_SIZE))

    # Display score
    score_text = FONT.render(f"Score: {score}", True, WHITE)
    SCREEN.blit(score_text, (10, 10))

    if game_over:
        game_over_text = FONT.render("GAME OVER! Press R to Restart", True, WHITE)
        text_rect = game_over_text.get_rect(center=(WIDTH // 2, HEIGHT // 2))
        SCREEN.blit(game_over_text, text_rect)

    pygame.display.flip()

# --- Main Game Loop ---
reset_game()

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_UP and snake_direction != (0, GRID_SIZE):
                snake_direction = (0, -GRID_SIZE)
            elif event.key == pygame.K_DOWN and snake_direction != (0, -GRID_SIZE):
                snake_direction = (0, GRID_SIZE)
            elif event.key == pygame.K_LEFT and snake_direction != (GRID_SIZE, 0):
                snake_direction = (-GRID_SIZE, 0)
            elif event.key == pygame.K_RIGHT and snake_direction != (-GRID_SIZE, 0):
                snake_direction = (GRID_SIZE, 0)
            elif event.key == pygame.K_r and game_over: # Restart game
                reset_game()

    if not game_over:
        # Move snake
        head_x, head_y = snake[0]
        new_head = (head_x + snake_direction[0], head_y + snake_direction[1])

        # Check for self-collision
        if new_head in snake:
            game_over = True

        # Check for wall collision
        if not (0 <= new_head[0] < WIDTH and 0 <= new_head[1] < HEIGHT):
            game_over = True

        if not game_over:
            snake.insert(0, new_head) # Add new head

            # Check if food was eaten
            if new_head == food_pos:
                score += 1
                generate_food() # Generate new food
            else:
                snake.pop() # Remove tail if no food eaten

    draw_elements() # Draw all game elements

    CLOCK.tick(FPS) # Control frame rate

pygame.quit()
sys.exit()