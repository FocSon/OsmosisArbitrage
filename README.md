# OsmosisArbitrage
A bot which identify and exploit arbitrages on the Osmosis AMM DeFi plateform in javascript.

# Edit : 1

Since the last update of the osmosis network, they implemented a skip module which exploit most of the arbitrage opportunities. You won't be able to make as much profits as previously with this strategy.

# Edit : 2

I've worked on other arbitrage bot since the publication of this repository so I've took note that the code contained in this repo can be refacored in order to be more modular. I'll work on this when i'll have the time and delete this edit once it's done.

# Functionnalities
This bot is sync to a peer.
Once this peer declare a new block on the osmosis blockchain, the bot will search between all eligible swap route those which are profitables.
If it detect a swap route which cover at least the transaction fees, it submit an on chain tx in order to execute the swap.
The bot will also find the more profitable price for each profitable swap route.

# Requirements
Have npm and nodeJs installed.
A good and stable insternet connection is recommended.

# Installation
Clone the repo and execute the following command at the source root
```bash
npm install
```

Once it's done, you can execute the bot by typing
```bash
npm run start
```

# Configuration
The configuration part isn't optimized yet. There are some points that you will need to maintain manually.

## in the file src/constUtils.js, you'll fins almost everything you'll need to keep up to date.

- mnemonic
in the mnemonic constant, you'll need to enter your seed in order to sign transections.
I recommend you to create a wallet specially for this bot. Don't use your main account.

- lcdEndPoint
In this constant, you can enter the lcd endpoint from which you want to get blockchain informations (new blocks, liquidity...).
Considerating the large amount of requests sended, endpoints can temporary block your ip. Give more than one endpoint allow to swich between endpoint if this append.
There are some default endpoint :
  *  Polkachu's endpoint : "https://osmosis-api.polkachu.com"
  *  Interbloc endpoint (10k free requests per month at time of writing) : "https://api.osmosis.interbloc.org"
  *  default osmosis endpoint (slower than others endpoints) : "https://lcd.osmosis.zone"

- usefullPools
This list contains all pools you want to search abritrage on.
You can see a list of all pools available here : https://frontier.osmosis.zone/pools
Keep in mind that the more pool you add, the longest the swap route estimation time will be. If you want to estimate all swap routes, keep this time between the blocktime (6s at time of writing).
WARNING : ONLY POOLS WITH TWO ASSETS ARE SUPPORTED AT THIS TIME.

- tokenInfos
This variable contains info about all tokens listed on osmisis. It is mandatory in order to know tokens decimals and other usefull infos.
To keep it's content up to date, you can copy/paste info from this repo : https://github.com/osmosis-labs/assetlists/blob/main/osmosis-1/osmosis-1.assetlist.json

## The last parameters to set are in src/Main.js.

- checkAllRoutes function takes as argument the denom of the token to check arbitrages on ("uosmo" for osmo, "ibc\27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2" for atom...).
You can find eligible denom in the list of the tokenInfo variable in src/constUtils.

- initGlobals
initGlobal takes the maximum swap route length as parameter.
For exemple, if it's argument is 3, it will allow the bot to check the route :
  *  OSMO/ATOM - ATOM/OSMO
  *  OSMO/ATOM - ATOM/SCRT - SCRT/OSMO

but not the route
  * OSMO/ATOM - ATOM/SCRT - SCRT/EVMOS - EVMOS/OSMO

# Contact
If you encounter any problem, don't hesitate to open an issue on the repo.

# Buy me a coffee
If you like my work, don't hesitate to make a little donation :
- Osmosis     : osmo17sudeyhrvk93f05s5kzj2lf5avf8444ar4wu52
- Cosmos Hub  : cosmos17sudeyhrvk93f05s5kzj2lf5avf8444atwavzc
