# 项目介绍
hardhat-nftv2-caim 是一个使用 Solidity 和 Hardhat 构建的智能合约项目，用于创建和铸造 Chibi NFT。它使用 Chainlink VRF 生成随机数以用于铸造 NFT。

# 代码概述
主要合约文件是 ChibiNft.sol。该文件包含 ChibiNft 合约，它继承自 ERC721URIStorage，VRFConsumerBaseV2 和 Ownable。

以下是 ChibiNft 合约中每个函数的功能描述：

1. 构造函数
    - 初始化 VRF 相关变量、NFT 相关变量、gas 相关变量和 NFT URI 数组
    - 调用 ERC721 构造函数，设置 NFT 名称和符号
2. RequestNft 函数

   - 接收用户支付的 mint_fee
   - 向 vrfCoordinatorV2 请求随机数
   - 记录 requestId 与对应的 minter
   - 触发 NftRequested 事件
3. fulfillRandomWords 函数
   - 获取 requestId 对应的 minter
   - 生成新的 NFT ID
   - 根据随机数生成 Chibi 类型
   - mint 新的 NFT
   - 触发 NftMinted 事件
4. getEnumChibi 函数
   - 根据随机数生成的 mod 值，计算出对应的 Chibi 类型
5. withdraw 函数

   - 只有合约 owner 可以调用
   - 将合约余额转移到 owner 地址
6. getProbabilityArray 函数
   - 返回一个长度为 2 的数组，表示 SR_CHIBI 和 N_CHIBI 的生成概率
7. getChibiTokenUris 函数
   -  返回当前已经生成的 NFT 数量。
8. getMintFee 函数
   - 返回 mint_fee 的值。
9.  receive 函数
    - 接收用户发送的以太币，调用 RequestNft 函数生成新的 NFT。