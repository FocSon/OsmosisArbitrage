import {initPoolsFromMainnetIncentives} from "./PoolUtils.js";
import {initRoutes} from "./PathUtils.js";
import {checkAllRoutes} from "./SignUtils.js";
import {initGlobals} from "./ConstUtils.js";

export const main = async () => {
    await initGlobals(5);

    await initPoolsFromMainnetIncentives();

    await initRoutes();

    await checkAllRoutes("uosmo");
}

main().then(() => {
    console.log("ended");
})