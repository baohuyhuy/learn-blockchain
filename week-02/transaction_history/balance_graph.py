import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from datetime import datetime

class BalanceGraph:
    def __init__(self, wallet_address, transactions_data):
        self.wallet_address = wallet_address
        self.transactions_data = transactions_data
    
    def __generate_balance_data(self):
        balance_data = []
        current_balance = 0.0

        # Sort transactions by timestamp string "YYYY-MM-DD HH:MM:SS"
        self.transactions_data.sort(key=lambda x: datetime.strptime(x['timestamp'], "%Y-%m-%d %H:%M:%S"))

        for transaction in self.transactions_data:
            timestamp = transaction['timestamp']

            if transaction['from']['address'] == self.wallet_address:
                # Outgoing transfer
                current_balance = transaction['from']['balance_after']
            elif hasattr(transaction, 'to') and transaction['to'][0]['address'] == self.wallet_address:
                # Incoming transfer
                current_balance = transaction['to'][0]['balance_after']
            
            print(f"Transaction at {timestamp}: Balance updated to {current_balance} SOL")
            balance_data.append({
                'timestamp': timestamp,
                'balance': current_balance
            })
        return pd.DataFrame(balance_data)
    
    def plot_balance_graph(self):
        balance_df = self.__generate_balance_data()
                
        # Convert timestamp to datetime for better plotting
        balance_df['timestamp'] = pd.to_datetime(balance_df['timestamp'])
        
        # Create the plot with a modern style
        plt.style.use('seaborn-v0_8-whitegrid')
        fig, ax = plt.subplots(figsize=(14, 7))
        
        # Plot the line with a gradient color based on balance value
        sns.lineplot(data=balance_df, x='timestamp', y='balance', 
            linewidth=2.5, color='#3498db', ax=ax)
        
        # Add points for each transaction
        ax.scatter(balance_df['timestamp'], balance_df['balance'], 
            color='#e74c3c', s=60, zorder=5, alpha=0.7, 
            edgecolor='white', linewidth=1.5)
        
        # Annotations for extreme points
        max_point = balance_df.loc[balance_df['balance'].idxmax()]
        min_point = balance_df.loc[balance_df['balance'].idxmin()]
        last_point = balance_df.iloc[-1]
        
        for point in [max_point, min_point, last_point]:
            ax.annotate(f"{point['balance']:.2f} SOL",
              (point['timestamp'], point['balance']),
              xytext=(10, 0), textcoords='offset points',
              fontsize=9, fontweight='bold')
        
        # Improve formatting
        ax.set_title(f'Balance History of {len(balance_df)} for {self.wallet_address[:8]}...{self.wallet_address[-4:]}',
               fontsize=16, fontweight='bold', pad=20)
        ax.set_xlabel('Date/Time', fontsize=12, labelpad=10)
        ax.set_ylabel('Balance (SOL)', fontsize=12, labelpad=10)
        
        # Add padding to y-axis to better show changes
        ymin, ymax = balance_df['balance'].min(), balance_df['balance'].max()
        y_range = ymax - ymin
        ax.set_ylim([ymin - y_range * 0.1, ymax + y_range * 0.1])
        
        # Format x-axis to show dates properly
        fig.autofmt_xdate()
        
        # Add shading for trend visibility
        ax.fill_between(balance_df['timestamp'], 0, balance_df['balance'], 
               alpha=0.2, color='#3498db')
        
        # Add a horizontal line for average balance
        avg_balance = balance_df['balance'].mean()
        ax.axhline(y=avg_balance, color='#2ecc71', linestyle='--', alpha=0.8, 
              label=f'Avg: {avg_balance:.2f} SOL')
        
        ax.legend(loc='best')
        plt.tight_layout()

        return plt
