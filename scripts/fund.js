const { ethers, deployments } = require("hardhat")

async function main() {
  //const { deployer } = await getNamedAccounts()
  let fundMe, deployer
  deployer = await ethers.provider.getSigner()
  fundMe = await ethers.getContractAt(
    "FundMe",
    (await deployments.get("FundMe")).address,
    //deployer,
  )
  //const fundMe = await ethers.getContract("FundMe", deployer)
  console.log(`Got contract FundMe at ${fundMe.target}`)
  console.log("Funding contract...")
  const transactionResponse = await fundMe.fund({
    value: ethers.parseEther("0.3"),
  })
  await transactionResponse.wait(1)
  console.log("Funded!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
