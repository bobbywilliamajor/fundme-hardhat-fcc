const { ethers, deployments } = require("hardhat")

async function main() {
  //const { deployer } = await getNamedAccounts()
  //const fundMe = await ethers.getContract("FundMe", deployer)
  let fundMe, deployer
  fundMe = await ethers.getContractAt(
    "FundMe",
    (await deployments.get("FundMe")).address,
    deployer,
    (deployer = await ethers.provider.getSigner()),
  )
  console.log(`Got contract FundMe at ${fundMe.target}`)
  console.log("Withdrawing from contract...")
  const transactionResponse = await fundMe.withdraw()
  await transactionResponse.wait(1)
  console.log("Got it back!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
