/*
        Routes object structure :
            - id = <denom> exemple : uosmos
            - chaque élément contient un array de routes possibles

        Un array de routes possible est un tableau dans lequel chaque élément est un pool.
        chaque pool mise bout à bout en suivant l'ordre du tableau est un chemin
 */
import {tokenPools, getPool} from "./PoolUtils.js";
import {changeClient, client, getDecimals, maxPathLen} from "./ConstUtils.js";
export const routes = []

// create empty array to receive path later
export async function initRoutes() {
    for (const tokenDenom in tokenPools) {
        routes[tokenDenom] = [];
        createRoute(tokenDenom);
    }

    let i = 1;
    for (const routeKey in routes["uosmo"]) {
        console.log(`${i}/${routes["uosmo"].length}`)
        await calculateLiquidity(routes["uosmo"][routeKey]);
        i+=1
    }
}

function createRoute(originDenom, path = [], curDenom = originDenom, longueur = 0) {
    if(longueur >= maxPathLen)
        return;

    const pools = tokenPools[curDenom];

    for (const poolsKey in pools) {
        const pool = pools[poolsKey]

        if(!path.includes(pool.id)) {
            path[longueur] = pool.id;

            if (longueur > 0 && pool.tokens.includes(originDenom)) {
                const tempPath = path.slice(0,longueur+1);
                routes[originDenom].push(tempPath);
            } else {
                createRoute(originDenom, path, pool.getOtherTokenDenom(curDenom), longueur+1);
            }
        }
    }
}

//arg = path qui commence avec une pool contenant le jeton fort
async function calculateLiquidity(path, leadToken = "uosmo") {
    let previousPool = undefined;
    let previousSpotPrice = 1;

    // les pools ont-elles toutes déjà leur liquidité ?
    let needCalcul = false;
    for (const pathKey in path) {
        needCalcul = needCalcul || getPool(path[pathKey]).liquidityTotal === undefined;
    }
    if(!needCalcul) {
        return;
    }

    // Pour chaque pool,
    for (const pathKey in path) {
        const pool = getPool(path[pathKey]);
        const slaveToken = pool.getOtherTokenDenom(leadToken);

        let leadTokenKey;
        let slaveTokenKey;

        // On récupère les clefs des tokens dans la pool pour plus tard
        for (const tokenKey in pool.tokens) {
            if (pool.tokens[tokenKey] === leadToken) {
                leadTokenKey = tokenKey;
            } else {
                slaveTokenKey = tokenKey;
            }
        }

        // Si la liquidité nest oas renseignée on la récupère
        if(pool.liquidity === undefined) {
            pool.liquidity = await askLiquidity(pool.id);
        }

        //On calcul le prix d'achat du jeton fort par une unité du jeton faible
        let spotPrice = (pool.liquidity[leadToken]*pool.ratio[leadTokenKey])/(pool.liquidity[slaveToken]*pool.ratio[slaveTokenKey]);

        //On utilise ce prix d'achat pour calculer le prix spot en osmo de la pool
        if(previousPool === undefined) {
            pool.liquidityTotal = pool.liquidity[leadToken] * pool.ratio[leadTokenKey];
        } else {
            pool.liquidityTotal = previousSpotPrice * pool.liquidity[leadToken] * pool.ratio[leadTokenKey];
        }

        previousSpotPrice *= spotPrice;
        leadToken = slaveToken;
        previousPool = pool;
    }
}

export async function isRouteProfitable(path, tokenIn, amountIn, fee, slippage) {
    let spotPrices = [];

    for (const poolKey in path) {
        const pool = getPool(path[poolKey]);
        const tokenOut = pool.getOtherTokenDenom(tokenIn);

        spotPrices[poolKey] = await askSpotPrice(tokenOut, tokenIn, pool.id);

        tokenIn = tokenOut;
    }

    let amountOut = amountIn;

    for (const spotPricesKey in spotPrices) {
        amountOut = amountOut * (spotPrices[spotPricesKey] - (spotPrices[spotPricesKey] * getPool(path[spotPricesKey]).swapFee));
    }

    console.log(`${amountIn} -> ${amountOut} (${tokenIn}, ${slippage}, ${fee})`)

    return [(amountOut * slippage) - fee > amountIn, amountOut];
}

async function askSpotPrice(tokenOut, tokenIn, id) {
    let retry = true;

    while (retry) {
        retry = false;

        try {
            return (await client.osmosis.gamm.v1beta1.spotPrice({
                baseAssetDenom: tokenOut,
                quoteAssetDenom: tokenIn,
                poolId: id
            })).spot_price;
        } catch (e) {
            console.log("Erreur : changement d'endpoint....................");
            await changeClient();
            retry = true;
        }
    }
}

async function askLiquidity(id) {
    const ret = [];
    let res;
    
    let retry = true;

    while (retry) {
        retry = false;

        try {
            res = (await client.osmosis.gamm.v1beta1.totalPoolLiquidity({
                poolId: id
            })).liquidity;
        } catch (e) {
            console.log("Erreur : changement d'endpoint....................");
            await changeClient();
            retry = true;
        }
    }

    for (const resKey in res) {
        ret[res[resKey].denom] = res[resKey].amount/(10**getDecimals(res[resKey].denom));
    }

    return ret;
}

export function determineSlippage(path, amountIn, tokenIn) {
    let slippage = 1;

    for (const pathKey in path) {
        const pool = getPool(path[pathKey]);
        let tokenInKey;

        for (const tokenKey in pool.tokens) {
            if (pool.tokens[tokenKey] === tokenIn) {
                tokenInKey = tokenKey;
            }
        }

        const vd = pool.liquidityTotal/pool.ratio[tokenInKey]
        const va = vd - amountIn;

        slippage += ((va - vd)/vd);

        tokenIn = pool.getOtherTokenDenom(tokenIn);
    }

    return slippage;
}