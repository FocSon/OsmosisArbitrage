import {usefullPools, usefullPoolsTestnet, api, incentivisedMainnetPools} from "./ConstUtils.js";

export class Pool {
    constructor(id, swapFee, tokens, ratio, liquidityTotal = undefined, liquidity = undefined, shares = undefined) {
        this.id = id;
        this.swapFee = swapFee;
        this.tokens = tokens;
        this.ratio = ratio;
        this.liquidity = liquidity;
        this.liquidityTotal = liquidityTotal;
        this.shares = shares;
    }

    getOtherTokenDenom(originTokenDenom) {
        if(!this.tokens.includes(originTokenDenom)) {
            return undefined;
        } else {
            return this.tokens[0] === originTokenDenom ? this.tokens[1] : this.tokens[0];
        }
    }

    static convertPoolFromOsmosis(pool) {
        const tokens = [];
        const ratio = [];

        for (const assetKey in pool.pool_assets) {
            tokens.push(pool.pool_assets[assetKey].token.denom);
            ratio.push(pool.total_weight / (pool.pool_assets[assetKey].weight));
        }

        return new Pool(pool.id, pool.pool_params.swap_fee, tokens, ratio, undefined, undefined, pool.total_shares.amount);
    }
}


/*
    tokenPools structure :
        array id = token denom
        array content = array de pool => chaque pool contient le token
*/
export let tokenPools = [];
export let allPools;

export async function processPools() {
    //pour chaque pool
    for (const poolKey in allPools) {
        const pool = allPools[poolKey];

        if(pool.tokens.length === 2) {
            // On renseigne la pool auprès des tokens qu'elle contient
            for (const tokenKey in pool.tokens) {
                const realKey = pool.tokens[tokenKey];

                if (tokenPools[realKey] === undefined) {
                    tokenPools[realKey] = [];
                }

                tokenPools[realKey].push(pool);
            }
        } else {
            delete allPools[poolKey];
        }
    }
}

//effextue les opéartion de filtre sur les pools
export async function initPools() {
    allPools = (await api.getPools()).pools;
    allPools = allPools.map((pool) => Pool.convertPoolFromOsmosis(pool));

    filterLowLiquidity();

    rearrangeAllPools();

    await processPools();
}

export async function initPoolsFromMainnetList() {
    allPools = (await api.getPools()).pools;
    allPools = allPools.map((pool) => Pool.convertPoolFromOsmosis(pool));

    filterPoolsFromList(usefullPools);

    rearrangeAllPools();

    await processPools();
}

export async function initPoolsFromMainnetIncentives() {
    allPools = (await api.getPools()).pools;
    allPools = allPools.map((pool) => Pool.convertPoolFromOsmosis(pool));

    filterPoolsFromList(incentivisedMainnetPools);

    rearrangeAllPools();

    await processPools();
}

export async function initPoolsFromTestnetList() {
    allPools = (await api.getPools()).pools;
    allPools = allPools.map((pool) => Pool.convertPoolFromOsmosis(pool));

    filterPoolsFromList(usefullPoolsTestnet);

    rearrangeAllPools();

    await processPools();
}

function filterLowLiquidity() {
    const refLiquidity = getPool(744).shares; //    745-1

    allPools = allPools.filter((pool) => {return pool.shares/refLiquidity > 1});
}

function filterPoolsFromList(list) {
    allPools = allPools.filter((pool) => {return list.includes(parseInt(pool.id))});
}

function rearrangeAllPools() {
    const temp = allPools;
    allPools = []

    for (const tempKey in temp) {
        const pool = temp[tempKey];
        allPools[pool.id] = pool;
    }
}

export function getPool(poolIdParm) {
    return allPools[poolIdParm];
}