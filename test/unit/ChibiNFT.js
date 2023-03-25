const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random IPFS NFT Unit Tests", function () {
          let randomIpfsNft, deployer, vrfCoordinatorV2Mock, user
          beforeEach(async function () {
              // deployer
              //   deployer = await ethers.getSigners()[0]
              //   user = await ethers.getSigners()[1]
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              user = accounts[1]
              await deployments.fixture(["all"])
              randomIpfsNft = await ethers.getContract("ChibiNft", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
              console.log(await randomIpfsNft.owner())
          })

          describe("RequestNft", function () {
              it("should fail with insufficient fee", async () => {
                  // 向合约发送0.001 ETH，不足以支付mint_fee
                  const sent_amount = ethers.utils.parseEther("0.001", "ether")
                  // 调用RequestNft函数
                  await expect(randomIpfsNft.RequestNft({ value: sent_amount })).to.be.rejectedWith(
                      "ChibiNft__NotenoughMintfee"
                  )
              })
              it("should succeed with sufficient fee", async () => {
                  // 向合约发送0.02 ETH，足以支付mint_fee
                  const sent_amount = ethers.utils.parseEther("0.02", "ether")
                  // 调用RequestNft函数
                  await expect(randomIpfsNft.RequestNft({ value: sent_amount })).to.not.be.rejected
              })
              it("Should emit the NftMinted event", async () => {
                  // 向合约发送0.02 ETH，足以支付mint_fee
                  const sent_amount = ethers.utils.parseEther("0.02", "ether")
                  // 调用RequestNft函数
                  await expect(randomIpfsNft.RequestNft({ value: sent_amount })).to.be.emit(
                      randomIpfsNft,
                      "NftRequested"
                  )
              })
          })

          describe("fulfillRandomWords", async () => {
              it("tokencounter should be equal to 1", async () => {
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftRequested", async () => {
                          try {
                              const tokenCounter = await randomIpfsNft.getTokenCounter()
                              //   expect(tokenCounter).equal("1")
                              assert.equal(tokenCounter.toString(), "1")
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          const fee = await randomIpfsNft.getMintFee()
                          const response = await randomIpfsNft.RequestNft({ value: fee })
                          const receipt = await response.wait(1)
                          assert.equal(receipt.events[1].event, "NftRequested")
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              receipt.events[1].args.requestId,
                              randomIpfsNft.address
                          )
                      } catch (e) {
                          reject(e)
                      }
                  })
              })
          })
          describe("withdraw", async () => {
              it("should fail if not owner", async () => {
                  await expect(randomIpfsNft.connect(user).withdraw()).to.be.rejectedWith(
                      "Ownable: caller is not the owner"
                  )
              })
              it("should fail if no balance", async () => {
                  await expect(
                      randomIpfsNft.connect(deployer).withdraw()
                  ).to.be.revertedWithCustomError(randomIpfsNft, "ChibiNft__withdraw")
              })
              it("should succeed if owner", async () => {
                  const fee = await randomIpfsNft.getMintFee()
                  await randomIpfsNft.RequestNft({ value: fee })
                  await expect(randomIpfsNft.connect(deployer).withdraw()).to.not.be.rejected
              })
          })
          describe("getChibiTokenUris", async () => {
              it("should return SR_NEKO ipfs hash", async () => {
                  expect(await randomIpfsNft.getChibiTokenUris(0)).equal(
                      "ipfs://QmdhK3E6msDzUEdN6cPLVnbwFErQM1vE8HwE1GhTAk8oZ8"
                  )
              })
              it("should return R_NEKO ipfs hash", async () => {
                  expect(await randomIpfsNft.getChibiTokenUris(1)).equal(
                      "ipfs://QmYetmfhH9u5q5RoR7pdkwPPWiKCAGFtUbArBSmfv3z6w1"
                  )
              })
          })
      })
