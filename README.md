# Lucid Contract Code


This repo contains smart contracts for our gnosis safe app. We store the data onchain 
and plan on exposing subgraphs to query transactions.


# Setup

This is general setup of the hard hat project to test and deploy the smart contracts here


## .env file

create a `.env` file at the root of the directory. 

* change `DEPLOYER_ADDRESS` to the address of the wallet you are using to deploy the smart contract.
* change `DEPLOY_PK` to private key of the wallet specified see [here](https://metamask.zendesk.com/hc/en-us/articles/360015289632-How-to-Export-an-Account-Private-Key)
* change `INFURA_API_KEY` to the  `Project ID` when you create an [infura project](https://docs.infura.io/infura/create-a-project)

```bash
DEPLOYER_ADDRESS=xx
DEPLOY_PK=xxx
INFURA_API_KEY=xx
```


## Install packages 


```bash
npm install 
```

## Testing contracts
If you have setup everything above you should be able to run the test suite

```bash
npm run test
```

## Deploying contracts

If tests pass all you need to do is run. You can specify the network just look at package.json for the command.

```bash
npm run deploy:mumbai
```
