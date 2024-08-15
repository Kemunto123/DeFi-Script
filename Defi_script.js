require('dotenv').config();
const { ethers } = require('ethers');
const AAVE_LENDING_POOL_ABI = require('./abis/AaveLendingPool.json');
const SWAP_ROUTER_ABI = require('./abis/SwapRouter.json');
const ERC20_ABI = require('./abis/ERC20.json');

// Environment variables
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Uniswap and Aave contract addresses (Sepolia testnet)
const USDC_ADDRESS = '0x...';  // Replace with the actual USDC contract address on Sepolia
const LINK_ADDRESS = '0x...';  // Replace with the actual LINK contract address on Sepolia
const SWAP_ROUTER_CONTRACT_ADDRESS = '0x...';  // Replace with Uniswap V3 Swap Router address on Sepolia
const AAVE_LENDING_POOL_ADDRESS = '0x...';  // Replace with Aave Lending Pool contract address on Sepolia

// Setup provider and wallet
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Approve tokens for spending
async function approveToken(tokenAddress, tokenABI, amount, wallet) {
  const tokenContract = new ethers.Contract(tokenAddress, tokenABI, wallet);
  const approveAmount = ethers.utils.parseUnits(amount.toString(), 6);  // assuming USDC has 6 decimals
  const tx = await tokenContract.approve(SWAP_ROUTER_CONTRACT_ADDRESS, approveAmount);
  console.log(`Approval TX sent: ${tx.hash}`);
  await tx.wait();
  console.log(`Approval confirmed`);
}

// Perform token swap using Uniswap
async function executeSwap(swapRouter, params, wallet) {
  const tx = await swapRouter.exactInputSingle(params);
  console.log(`Swap TX sent: ${tx.hash}`);
  await tx.wait();
  console.log(`Swap confirmed`);
}

// Deposit tokens into Aave
async function depositToAave(aaveLendingPoolAddress, tokenAddress, amount, wallet) {
  const aaveLendingPool = new ethers.Contract(aaveLendingPoolAddress, AAVE_LENDING_POOL_ABI, wallet);
  const tx = await aaveLendingPool.deposit(tokenAddress, amount, wallet.address, 0);
  console.log(`Deposit TX sent: ${tx.hash}`);
  await tx.wait();
  console.log(`Deposit confirmed and earning interest on Aave`);
}

// Prepare the swap parameters
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

// Main function
async function main() {
  const swapAmount = "100";  // Amount in USDC to swap
  const amountIn = ethers.utils.parseUnits(swapAmount, 6);  // Assuming USDC has 6 decimals
  
  try {
    // Step 1: Approve USDC for swap
    await approveToken(USDC_ADDRESS, ERC20_ABI, swapAmount, wallet);

    // Step 2: Perform USDC -> LINK swap on Uniswap
    const swapRouter = new ethers.Contract(SWAP_ROUTER_CONTRACT_ADDRESS, SWAP_ROUTER_ABI, wallet);
    const swapParams = {
      tokenIn: USDC_ADDRESS,
      tokenOut: LINK_ADDRESS,
      fee: 3000,
      recipient: wallet.address,
      amountIn: amountIn,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0
    };
    await executeSwap(swapRouter, swapParams, wallet);

    // Step 3: Deposit LINK into Aave for interest earning
    const linkBalance = await new ethers.Contract(LINK_ADDRESS, ERC20_ABI, wallet).balanceOf(wallet.address);
    await depositToAave(AAVE_LENDING_POOL_ADDRESS, LINK_ADDRESS, linkBalance, wallet);
    
  } catch (err) {
    console.error("An error occurred during the process:", err.message);
  }
}

// Execute the main function
main().catch(console.error);
