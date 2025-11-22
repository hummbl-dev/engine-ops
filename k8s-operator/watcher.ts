// watcher.ts – watches Kubernetes resources for the Engine-Ops operator
import { KubeConfig, CustomObjectsApi, Watch } from '@kubernetes/client-node';
import { reconcile } from './reconciler.js';

const kc = new KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(CustomObjectsApi);
const watch = new Watch(kc);

async function startWatch(): Promise<void> {
    // Example: watch custom resources of group "engineops.hummbl.dev", version "v1", plural "optimizations"
    const path = '/apis/engineops.hummbl.dev/v1/optimizations';
    watch.watch(
        path,
        {},
        async (type: string, obj: unknown) => {
            if (type === 'ADDED' || type === 'MODIFIED') {
                await reconcile(obj, k8sApi);
            }
        },
        (_err: unknown) => {
            console.error('Watch error:', _err);
            setTimeout(startWatch, 5000); // restart on error
        }
    );
}

startWatch().catch(err => console.error('Watcher failed to start:', err));
