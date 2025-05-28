from currencies import get_all_currencies
from tokens import get_all_tokens, check_token_exists
from monitor_token_price import monitor_price_changes


def main():
    currency = 'USD'  # Default currency

    allTokens = get_all_tokens()
    currency_codes = get_all_currencies()

    try:
        while True:
            # Clear the console screen
            print("\033c", end="")

            print(
                "=================== Crypto Token Monitoring Program ===================\n")
            print("1. View all available tokens - Press '1'")
            print(f"2. Change currency (current: {currency}) - Press '2'")
            print("3. Monitor token price - Press '3'")
            print("4. Exit - Press '4'")

            mode_choice = input("Select an option (1/2/3/4): ").strip()

            if mode_choice == '1':
                print("\033c", end="")
                print("Available tokens:")
                print(", ".join(sorted(allTokens)))
                input("Press Enter to continue...")

            elif mode_choice == '2':
                print("\033c", end="")
                print("Available currencies:")
                print(", ".join(sorted(currency_codes)))

                currency = input(
                    "Enter the currency code you want to use (default: USD): ").strip().upper() or 'USD'
                if currency not in currency_codes:
                    print(
                        f"Invalid currency code '{currency}'. Defaulting to USD.")
                    currency = 'USD'
                    input("Press Enter to continue...")

            elif mode_choice == '3':
                print("\033c", end="")

                token_id = input(
                    "Enter token symbol (e.g., BTC, ETH): ").strip().upper()
                if not token_id:
                    print("Token symbol cannot be empty. Please try again.")
                    continue

                exists, message = check_token_exists(token_id, allTokens)
                if not exists:
                    print(message)
                    input("Press Enter to continue...")
                    continue

                while True:
                    stop_monitoring = monitor_price_changes(token_id, currency)
                    if stop_monitoring:
                        break

            elif mode_choice == '4':
                print("Exiting the program. Goodbye!")
                break

            else:
                print("Invalid option. Please try again.")
    except KeyboardInterrupt:
        print("\nExiting the program. Goodbye!")


if __name__ == "__main__":
    main()
