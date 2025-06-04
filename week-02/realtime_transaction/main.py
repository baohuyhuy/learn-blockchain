import asyncio
from wallet_monitor import SolanaWalletMonitor

async def main():
    print("SOLANA WALLET TRANSACTION MONITOR")
    print("="*50)
    print("Real-time monitoring với duplicate prevention")
    print("="*50)
    
    # Network selection
    print("\nChọn Solana network:")
    print("1. Devnet")
    print("2. Testnet")
    print("3. Mainnet")
    print("4. Local")
    network_choice = input("\nChọn network (1/2/3/4, mặc định 4-Local): ").strip()
    
    if network_choice == "2":
        network = "testnet"
        print("Đã chọn Testnet")
    elif network_choice == "3":
        network = "mainnet"
        print("Đã chọn Mainnet")
    elif network_choice == "1":
        network = "devnet"
        print("Đã chọn Devnet")
    else:
        network = "local"
        print("Đã chọn local")

    monitor = SolanaWalletMonitor(network)
    
    try:
        if not await monitor.connect():
            print("Không thể kết nối WebSocket")
            return
        
        wallet = input("\nNhập địa chỉ ví cần monitor: ").strip()
        
        if not wallet:
            print("Cần nhập địa chỉ ví!")
            return
        
        max_tx = input("Số transactions tối đa (mặc định 5): ").strip()
        max_tx = int(max_tx) if max_tx.isdigit() else 5
        
        await monitor.monitor_wallet(wallet, max_tx)
        
    except KeyboardInterrupt:
        print("\nDừng monitoring bởi người dùng")
        if monitor.duplicate_count > 0:
            print(f"Đã bỏ qua {monitor.duplicate_count} duplicate transactions")
    except Exception as e:
        print(f"Lỗi: {e}")
    finally:
        await monitor.close()

if __name__ == "__main__":
    asyncio.run(main())