// controller.ts – main reconciliation loop for Engine-Ops operator
import { KubeConfig, CustomObjectsApi } from '@kubernetes/client-node';
import { reconcile } from './reconciler.js';

const kc = new KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(CustomObjectsApi);

async function startOperator() {
    console.log('Engine-Ops Operator starting...');
    // Watch for custom resources and invoke reconciler
    // Placeholder: actual watch implementation in watcher.ts
}

startOperator().catch(err => {
    console.error('Operator failed to start:', err);
    process.exit(1);
});
