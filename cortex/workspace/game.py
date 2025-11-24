import random

secret_number = random.randint(1, 100)
print("I'm thinking of a number between 1 and 100.")

guesses_taken = 0

while True:
    guesses_taken += 1
    try:
        guess = int(input("Take a guess: "))
    except ValueError:
        print("Invalid input. Please enter a whole number.")
        continue

    if guess < secret_number:
        print("Your guess is too low.")
    elif guess > secret_number:
        print("Your guess is too high.")
    else:
        print(f"Good job! You guessed my number in {guesses_taken} guesses!")
        break