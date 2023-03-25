const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { storeImages } = require("../utils/pinataSDK")
// 自己写的验证js
const { verify } = require("../utils/verify")
// const { storeImages, storeTokenUriMetadata } = require("../utils/yarn")

const FUND_AMOUNT = "1000000000000000000000"
const imagesLocation = "./images/randomNft"
// let tokenUris = [
//     "ipfs://QmYUvwc8E8KNJjwkJWKBSuNzmk8RDKeXtgoW2atu4nva3Y",
//     "ipfs://QmNh4kJvWmE6irA1RJerhPbuHkgHTQ4tiKSYLzqbzTA6mG",
// ]
let imageUris = []

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "Cuteness",
            value: 100,
        },
    ],
}

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorV2Address, subscriptionId, vrfCoordinatorV2Mock

    if (process.env.UPLOAD_TO_PINATA == "true") {
        // Check out https://github.com/PatrickAlphaC/nft-mix for a pythonic version of uploading
        // to the raw IPFS-daemon from https://docs.ipfs.io/how-to/command-line-quick-start/
        // You could also look at pinata https://www.pinata.cloud/
        const { responses } = await storeImages(imagesLocation)
        responses.forEach((response) => {
            imageUris.push(`ipfs://${response.IpfsHash}`)
        })
        console.log(imageUris)
    }

    if (chainId == 31337) {
        // create VRFV2 Subscription
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait()
        subscriptionId = transactionReceipt.events[0].args.subId
        // Fund the subscription
        // Our mock makes it so we don't actually have to worry about sending fund
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
        subscriptionId = networkConfig[chainId].subscriptionId
    }

    log("----------------------------------------------------")
    arguments = [
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId]["gasLane"],
        networkConfig[chainId]["mintFee"],
        networkConfig[chainId]["callbackGasLimit"],
        imageUris,
    ]
    const ChibiNft = await deploy("ChibiNft", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (chainId == 31337) {
        await vrfCoordinatorV2Mock.addConsumer(subscriptionId, ChibiNft.address)
    }

    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(ChibiNft.address, arguments)
    }
}

module.exports.tags = ["all", "randomipfs", "main"]
