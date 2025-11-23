"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// watcher.ts – watches Kubernetes resources for the Engine-Ops operator
const client_node_1 = require("@kubernetes/client-node");
const reconciler_js_1 = require("./reconciler.js");
const kc = new client_node_1.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(client_node_1.CustomObjectsApi);
const watch = new client_node_1.Watch(kc);
async function startWatch() {
    // Example: watch custom resources of group "engineops.hummbl.dev", version "v1", plural "optimizations"
    const path = '/apis/engineops.hummbl.dev/v1/optimizations';
    watch.watch(path, {}, async (type, obj) => {
        if (type === 'ADDED' || type === 'MODIFIED') {
            await (0, reconciler_js_1.reconcile)(obj, k8sApi);
        }
    }, (_err) => {
        console.error('Watch error:', _err);
        setTimeout(startWatch, 5000); // restart on error
    });
}
startWatch().catch(err => console.error('Watcher failed to start:', err));
