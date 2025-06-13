import requests
import json
import os
current_dir = os.path.dirname(os.path.abspath(__file__))
input_path = os.path.join(current_dir, "input.txt")

if os.path.exists(input_path):
    with open(input_path, "r", encoding="utf-8") as f:
        input_list = [line.strip() for line in f if line.strip()]
        print(input_list)
else:
    print(f"'input.txt' not found in {current_dir}")

for mint2 in input_list:
    mint1 = "So11111111111111111111111111111111111111112"
    url = (
        f"https://api-v3.raydium.io/pools/info/mint"
        f"?mint1={mint1}&mint2={mint2}"
        "&poolType=all&poolSortField=liquidity&sortType=desc&pageSize=1&page=1"
    )
    response = requests.get(url)
    data = response.json()
    json_dir = os.path.join(current_dir, "json")
    os.makedirs(json_dir, exist_ok=True)
    json_path = os.path.join(json_dir, f"raydium_{mint2}.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f"Saved to {json_path}")
    
    if data['data']['count'] == 0:
        print("The exchange hasn't hold this token")
    else:
        print("Price: 1 SOL = ", data['data']['data'][0]['price'], " ", data['data']['data'][0]['mintB']['symbol'], sep="")
        print("TVL: $", data['data']['data'][0]['tvl'], sep="")
