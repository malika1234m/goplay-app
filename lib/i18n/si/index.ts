// Copied from goplay-production/src/i18n by scripts/sync-i18n.mjs — edit it there.
import common from "./common";
import owner from "./owner";
import payments from "./payments";
import worker from "./worker";
import app from "./app";

const si: Record<string, string> = { ...common, ...owner, ...payments, ...worker, ...app };
export default si;
