# DeFi Script - Uniswap to Aave

## Overview of Script

This DeFi script demonstrates a multi-protocol interaction between **Uniswap** and **Aave**. The script allows users to perform the following operations:

1. **Token Swap on Uniswap**: The user initiates a swap of USDC for LINK using Uniswap V3. The script handles the approval of USDC spending, fetches pool information, prepares swap parameters, and executes the token swap.
  
2. **Deposit LINK into Aave**: After swapping USDC for LINK, the script deposits the acquired LINK into Aave's Lending Pool to start earning interest on the deposited assets.

The workflow is fully decentralized, interacting directly with the Ethereum blockchain via Sepolia Testnet. The script showcases how different DeFi protocols can be composed to provide enhanced financial operations like swaps and lending.

### **Workflow Breakdown:**

- **Step 1: User Initiates Token Swap**  
  The user requests to swap USDC for LINK through Uniswap.
  
- **Step 2: Token Approval**  
  The script sends an approval transaction, allowing Uniswap's Swap Router to spend the user's USDC.

- **Step 3: Fetch Pool Information**  
  The script retrieves the details of the USDC-LINK liquidity pool, including token addresses, fees, and other parameters necessary for executing the swap.

- **Step 4: Execute Swap**  
  The swap is executed using Uniswap's `exactInputSingle` function, swapping USDC for LINK.

- **Step 5: Deposit LINK to Aave**  
  Once the swap is successful, the LINK tokens are deposited into the Aave protocol's lending pool, where the user starts earning interest on the deposited LINK.

## Diagram Illustration

The diagram below illustrates the complete flow of interactions between the user, Uniswap, Aave, and the Ethereum blockchain:

![DeFi Interaction Diagram](./Image.png)

### **Diagram Explanation:**

1. **User Initiates Token Swap**  
   The user initiates the token swap from USDC to LINK by interacting with their Ethereum wallet.

2. **Approve USDC for Uniswap**  
   The wallet interacts with the Uniswap Swap Router to approve USDC for swapping. This approval transaction is recorded on the Ethereum blockchain.

3. **Execute Swap on Uniswap**  
   The script swaps USDC for LINK using the Uniswap pool. The swap transaction is confirmed on the blockchain.

4. **Deposit LINK to Aave**  
   After the swap is completed, the acquired LINK is deposited into Aave's lending pool, starting the process of earning interest. This transaction is also recorded on the Ethereum blockchain.

## Setup and Execution

### Requirements

- **Node.js**
- **Ethers.js**
- **Infura API Key** (to connect to the Ethereum Sepolia Testnet)
- **Ethereum Wallet Private Key** (with Sepolia ETH for gas fees)
- **Uniswap and Aave Contract ABIs**

### Installation

1. Clone the project repository:
   ```bash
   git clone https://github.com/yourusername/defi-script.git




# Code Explanation

This document provides a detailed breakdown of the key functions and logic within the script, focusing on the interactions with Uniswap and Aave, and explaining how the entire workflow is handled.

## Overview

The script facilitates two primary interactions:
1. **Token Swap on Uniswap**: Swaps USDC for LINK using Uniswap V3.
2. **Deposit into Aave**: Deposits the acquired LINK into Aave’s Lending Pool to earn interest.

The code is written using **Ethers.js** to interact with Ethereum smart contracts and requires connection to the **Ethereum Sepolia Testnet** via **Infura**.

---

## Code Breakdown

### 1. **Importing Dependencies**
At the beginning of the script, we import necessary libraries, ABIs, and environment variables:
```js
const { ethers } = require("ethers");
require("dotenv").config();
const USDC_ABI = require("./abis/USDC.json");
const LINK_ABI = require("./abis/LINK.json");
const UNISWAP_ROUTER_ABI = require("./abis/UniswapV3Router.json");
const AAVE_LENDING_POOL_ABI = require("./abis/AaveLendingPool.json");



- **Ethers.js**: Used for interacting with the Ethereum blockchain.
- **dotenv**: Allows us to securely load environment variables (e.g., RPC URL, Private Key).
- **Contract ABIs**: Application Binary Interfaces (ABIs) required to interact with the smart contracts.

---

### 2. **Initializing Variables**
We set up the provider, wallet, and contract addresses:
```js
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const USDC_ADDRESS = "USDC_CONTRACT_ADDRESS";
const LINK_ADDRESS = "LINK_CONTRACT_ADDRESS";
const UNISWAP_ROUTER_ADDRESS = "UNISWAP_ROUTER_CONTRACT_ADDRESS";
const AAVE_LENDING_POOL_ADDRESS = "AAVE_LENDING_POOL_CONTRACT_ADDRESS";
```
- **Provider**: Connects to the Ethereum Sepolia Testnet via Infura.
- **Wallet**: Stores the user's private key, used to sign transactions.

---

### 3. **Approve Token Function**
This function handles the approval of tokens for spending by the Uniswap Router:
```js
async function approveToken(tokenAddress, tokenABI, amount, wallet) {
    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, wallet);
    const approveAmount = ethers.parseUnits(amount.toString(), USDC_DECIMALS);
    const transaction = await tokenContract.approve(UNISWAP_ROUTER_ADDRESS, approveAmount);
    const receipt = await transaction.wait();
    console.log(`Approved ${amount} USDC for Uniswap`);
}
```
- **approveToken**: Grants the Uniswap router permission to spend the user’s USDC.
- The function uses `ethers.Contract` to interact with the USDC smart contract and calls the `approve` function to authorize spending.

---

### 4. **Get Pool Info Function**
This function retrieves necessary information about the Uniswap liquidity pool:
```js
async function getPoolInfo(factoryContract, tokenIn, tokenOut) {
    const poolAddress = await factoryContract.getPool(tokenIn.address, tokenOut.address, 3000);
    const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);
    const fee = await poolContract.fee();
    return { poolContract, fee };
}
```
- **getPoolInfo**: Queries Uniswap's factory contract to get the pool address for the USDC/LINK pair and returns the contract instance and pool fee.
- **3000**: Refers to the fee tier of 0.3%.

---

### 5. **Prepare Swap Parameters Function**
This function prepares the parameters for the Uniswap swap:
```js
async function prepareSwapParams(poolContract, signer, amountIn) {
    return {
        tokenIn: USDC_ADDRESS,
        tokenOut: LINK_ADDRESS,
        fee: await poolContract.fee(),
        recipient: signer.address,
        amountIn: amountIn,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
    };
}
```
- **prepareSwapParams**: Constructs the parameters required to execute the swap, including the token addresses, fees, and amount to be swapped.

---

### 6. **Execute Swap Function**
This function performs the actual swap on Uniswap:
```js
async function executeSwap(swapRouter, params, signer) {
    const transaction = await swapRouter.exactInputSingle(params);
    const receipt = await signer.sendTransaction(transaction);
    console.log(`Swap completed: ${receipt.transactionHash}`);
}
```
- **executeSwap**: Calls Uniswap's `exactInputSingle` function to swap USDC for LINK and logs the transaction hash.
- The function prepares and sends the swap transaction using the Uniswap router.

---

### 7. **Deposit to Aave Function**
This function deposits the acquired LINK into Aave’s Lending Pool:
```js
async function depositToAave(lendingPoolContract, amount, wallet) {
    const depositTransaction = await lendingPoolContract.deposit(
        LINK_ADDRESS, 
        amount, 
        wallet.address, 
        0
    );
    const receipt = await depositTransaction.wait();
    console.log(`LINK deposited to Aave: ${receipt.transactionHash}`);
}
```
- **depositToAave**: Interacts with Aave’s lending pool contract to deposit LINK tokens and earn interest.
- After the successful swap, this function ensures the LINK is deposited into Aave's lending pool.

---

### 8. **Main Function**
This is the main entry point that ties everything together:
```js
async function main() {
    const swapAmount = "100"; // Amount of USDC to swap
    const amountIn = ethers.parseUnits(swapAmount, USDC_DECIMALS);

    await approveToken(USDC_ADDRESS, USDC_ABI, swapAmount, wallet);
    const poolInfo = await getPoolInfo(uniswapFactory, USDC, LINK);
    const swapParams = await prepareSwapParams(poolInfo.poolContract, wallet, amountIn);
    await executeSwap(uniswapRouter, swapParams, wallet);

    const amountOut = ethers.parseUnits("Swap Result Amount", LINK_DECIMALS);
    await depositToAave(aaveLendingPool, amountOut, wallet);
}
```
- **main**: This function coordinates the entire workflow. It first approves the USDC for spending, retrieves pool information, swaps the USDC for LINK, and finally deposits the LINK into Aave’s lending pool.

---

## Summary

This script illustrates how to interact with multiple DeFi protocols like Uniswap and Aave programmatically using **Ethers.js**. The key steps involve:
1. **Approving Token Spending**: Allowing the Uniswap router to spend USDC.
2. **Swapping Tokens**: Using Uniswap to exchange USDC for LINK.
3. **Earning Interest**: Depositing the acquired LINK into Aave to generate yield.

The script showcases the composability of DeFi protocols and how they can be combined to create sophisticated financial operations.
```




