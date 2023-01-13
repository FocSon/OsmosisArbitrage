import {isRouteProfitable, determineSlippage, routes} from "./PathUtils.js";
import {getPool} from "./PoolUtils.js";
import {
    chainId, getDecimals,
    senderAddr,
    stargateClient
} from "./ConstUtils.js";
import {FEES, osmosis} from "osmojs";

import {signAndBroadcast} from '@cosmology/core';

const {
    swapExactAmountIn
} = osmosis.gamm.v1beta1.MessageComposer.withTypeUrl;

const fee = FEES.osmosis.swapExactAmountIn('low');

export async function checkAllRoutes(denom) {
    while (true) {
        askProfitable(denom, 3, 6);
        await new Promise(resolve => setTimeout(resolve, routes[denom].length * 100));
    }
}

async function askProfitable(denom, amount, decimals) {
    let slippage;
    let sigRes;

    for (const pathKey in routes[denom]) {
        let route = routes[denom][pathKey];
        slippage = determineSlippage(route, amount, denom);

        const gas = Math.trunc((250000/3)*route.length);
        const feeAmount = Math.trunc(((1250/250000)*gas) + 2)/(10**getDecimals("uosmo"));

        let result = true;
        let amountRes = undefined;

        while (result) {
            [result, amountRes] = await isRouteProfitable(route, denom, amount, feeAmount, slippage)

            if(amountRes < amount*0.98) {
                console.log(`route : ${route} null : ${amountRes}`);
                console.log("trying reverse ...")
                route = route.reverse();
                [result, amountRes] = await isRouteProfitable(route, denom, amount, feeAmount, slippage)
            }

            if(!result || amountRes < amount + (feeAmount/10**decimals)) {
                console.log(`route : ${route} null`);
            } else if (result) {
                console.log(`route : ${route} profitable`);
                sigRes = await executeSwap(route, denom, amount, decimals);
            }

            if(sigRes === undefined || sigRes.rawLog.includes('failed to execute message')) {
                result = false
            }
        }
    }
}

async function executeSwap(path, tokenInDenom, tokenInAmount, tokenInDecimals) {
    let res;

    fee.gas = `${Math.trunc((250000/3)*path.length)}`;
    fee.amount[0].amount = `${Math.trunc(((1250/250000)*fee.gas) + 2)}`;

    const routes = constructRoutesFromPath(path, tokenInDenom);

    const msg = swapExactAmountIn({
        routes: routes,
        sender: senderAddr,
        tokenIn: {
            denom: tokenInDenom,
            amount: tokenInAmount * 10**tokenInDecimals
        },
        tokenOutMinAmount: `${tokenInAmount * (10**tokenInDecimals)}`
    });

    console.log(msg)
    console.log(fee)

    try {
        res = await signAndBroadcast({
            client: stargateClient,
            chainId: chainId,
            address: senderAddr,
            msg,
            fee,
            memo: ''
        });
    } catch (e) {
        console.log(e)
        return undefined;
    }

    console.log(res);

    return res;
}

function constructRoutesFromPath(path, tokenIn) {
    const routes = [];

    for (const pathKey in path) {
        const pool = getPool(path[pathKey]);

        const tokenOut = pool.getOtherTokenDenom(tokenIn);

        routes.push({
            poolId: pool.id,
            tokenOutDenom: tokenOut
        })

        tokenIn = tokenOut;
    }

    return routes;
}