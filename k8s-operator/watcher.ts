// watcher.ts – watches Kubernetes resources for the Engine-Ops operator
import { KubeConfig, CustomObjectsApi, Watch } from '@kubernetes/client-node';
import { reconcile } from './reconciler.js';

const kc = new KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(CustomObjectsApi);
const watch = new Watch(kc);

async function startWatch() {
    // Example: watch custom resources of group "engineops.hummbl.dev", version "v1", plural "optimizations"
    const path = '/apis/engineops.hummbl.dev/v1/optimizations';
    watch.watch(
        path,
        {},
        async (type: string, obj: any) => {
            if (type === 'ADDED' || type === 'MODIFIED') {
                await reconcile(obj, k8sApi);
            }
        },
        (err: any) => {
            console.error('Watch error:', err);
            setTimeout(startWatch, 5000); // restart on error
        }
    );
}

startWatch().catch(err => console.error('Watcher failed to start:', err));
