import asyncio
from wallet_monitor import SolanaWalletMonitor


async def main():
    print("SOLANA WALLET TRANSACTION MONITOR")
    print("="*50)

    # Network selection
    print("\nSelect Solana network:")
    print("1. Devnet")
    print("2. Testnet")
    print("3. Mainnet")
    print("4. Local")
    network_choice = input(
        "\nSelect network (1/2/3/4, default 1-Devnet): ").strip()

    if network_choice == "1":
        network = "devnet"
        print("Selected Devnet")
    elif network_choice == "2":
        network = "testnet"
        print("Selected Testnet")
    elif network_choice == "3":
        network = "mainnet"
        print("Selected Mainnet")
    elif network_choice == "4":
        network = "local"
        print("Selected Local")
    else:
        network = "devnet"
        print("Invalid network choice. Defaulting to Devnet")

    monitor = SolanaWalletMonitor(network)

    try:
        if not await monitor.connect():
            print("Cannot connect to WebSocket")
            return

        wallet = input("\nEnter wallet address to monitor: ").strip()

        if not wallet:
            raise ValueError("Wallet address is required")

        max_tx = input("Number of transactions (enter to watch unlimited): ").strip()
        max_tx = int(max_tx) if max_tx.isdigit() else None

        try:
            await monitor.monitor_wallet(wallet, max_tx)
        except (asyncio.CancelledError, KeyboardInterrupt):
            print("Monitoring stopped by user (Ctrl+C). Cleaning up...")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        await monitor.close()

if __name__ == "__main__":
    asyncio.run(main())

