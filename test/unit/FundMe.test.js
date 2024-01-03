const { deployments, getNamedAccounts, ethers } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", () => {
      let fundMe, deployer, mockV3Aggregator, deployerAddress
      const sendValue = ethers.parseEther("1")
      beforeEach(async function () {
        // deploy our fundme contract
        // using hardhat deploy
        // const accounts = await ethers.getSigners()
        deployer = await ethers.provider.getSigner()
        deployerAddress = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"]) // deploy with tags
        fundMe = await ethers.getContractAt(
          "FundMe",
          (await deployments.get("FundMe")).address,
          deployer,
        ) // most recently deployed fundme contract
        mockV3Aggregator = await ethers.getContractAt(
          "MockV3Aggregator",
          (await deployments.get("MockV3Aggregator")).address,
          deployer,
        )
      })

      describe("constructor", () => {
        it("sets the aggregator addresses correctly", async function () {
          const response = await fundMe.getPriceFeed()
          const target = await mockV3Aggregator.target
          assert.equal(response, target)
        })
      })
      describe("fund", () => {
        it("Fails if you don't send enough ETH", async function () {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!",
          )
        })
        it("updated the amount funded data structure", async function () {
          await fundMe.fund({ value: sendValue })
          const response =
            await fundMe.getAddressToAmountFunded(deployerAddress)
          assert.equal(response.toString(), sendValue.toString())
        })
        it("Adds getFunder to an array of getFunder", async function () {
          await fundMe.fund({ value: sendValue })
          const funder = await fundMe.getFunder(0)
          assert.equal(funder, deployerAddress)
        })
      })
      describe("withdraw", async function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue })
        })

        it("Withdraw ETH from a single funder", async function () {
          // Arrange
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target,
          )
          console.log(startingFundMeBalance)
          const startingDeployerBalance =
            await ethers.provider.getBalance(deployerAddress)
          // Act
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasPrice, gasUsed } = transactionReceipt
          const gasCost = gasUsed * gasPrice

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target,
          )
          const endingDeployerBalance =
            await ethers.provider.getBalance(deployerAddress)
          // Assert
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString(),
          )
        })
        it("allows us to withdraw with multiple getFunder", async function () {
          // Arrange
          const accounts = await ethers.getSigners()
          for (let i = 1; i < 6; i++) {
            const fundedConnectedContract = fundMe.connect(accounts[i])
            await fundedConnectedContract.fund({ value: sendValue })
          }
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target,
          )
          const startingDeployerBalance =
            await ethers.provider.getBalance(deployerAddress)
          // Act
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasPrice, gasUsed } = transactionReceipt
          const gasCost = gasUsed * gasPrice

          // Assert
          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target,
          )
          const endingDeployerBalance =
            await ethers.provider.getBalance(deployerAddress)
          // Assert
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString(),
          )

          // Make sure getFunder reverts
          await expect(fundMe.getFunder(0)).to.be.reverted

          for (let i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0,
            )
          }
        })
        it("Only allows the owner to withdraw", async function () {
          const accounts = await ethers.getSigners()
          const attacker = accounts[1]
          const attackerConnectedContract = await fundMe.connect(attacker)
          await expect(
            attackerConnectedContract.withdraw(),
          ).to.be.revertedWithCustomError(
            attackerConnectedContract,
            "FundMe__NotOwner",
          )
        })
        it("cheaperWithdraw tesiing...", async function () {
          // Arrange
          const accounts = await ethers.getSigners()
          for (let i = 1; i < 6; i++) {
            const fundedConnectedContract = fundMe.connect(accounts[i])
            await fundedConnectedContract.fund({ value: sendValue })
          }
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target,
          )
          const startingDeployerBalance =
            await ethers.provider.getBalance(deployerAddress)
          // Act
          const transactionResponse = await fundMe.cheaperWithdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasPrice, gasUsed } = transactionReceipt
          const gasCost = gasUsed * gasPrice

          // Assert
          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target,
          )
          const endingDeployerBalance =
            await ethers.provider.getBalance(deployerAddress)
          // Assert
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString(),
          )

          // Make sure getFunder reverts
          await expect(fundMe.getFunder(0)).to.be.reverted

          for (let i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0,
            )
          }
        })
      })
    })
