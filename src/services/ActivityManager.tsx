import { Exit } from '../FlowDefinition';
import { External } from './External';
import { CounterComp } from "../components/Counter";

// how often we ask the server for new data
const REFRESH_SECONDS = 10;

/**
 * Contains all the activity data for a flow
 */
export interface Activity {

    // exit_uuid:destination_node_uuid -> count
    paths: { [key: string]: number };

    // node_uuid -> count
    active: { [key: string]: number };
}


export class ActivityManager {

    private static singleton: ActivityManager;
    private external: External;

    // our main activity fetch from the external
    private activity: Activity;

    // our simulation activity
    private simulation: Activity;

    private listeners: { [key: string]: CounterComp } = {};
    private timer: any;

    static get(): ActivityManager {
        return ActivityManager.singleton;
    }

    static initialize(external: External) {
        this.singleton = new ActivityManager(external);
    }

    constructor(external: External) {
        this.external = external;
        this.fetchActivity();
        this.registerListener = this.registerListener.bind(this);
    }

    public clearSimulation() {
        this.simulation = null;
        this.fetchActivity();
    }

    public setSimulation(activity: Activity) {
        this.simulation = activity;
        if (this.timer) {
            window.clearTimeout(this.timer);
            this.timer = null;
        }
        this.notifyListeners();
    }

    private fetchActivity(wait: number = 0) {
        if (!this.timer) {
            this.timer = window.setTimeout(() => {
                this.timer = null;
                this.external.getActivity().then((activity: Activity) => {
                    this.activity = activity;
                    this.notifyListeners();
                });

                this.fetchActivity(REFRESH_SECONDS * 1000);
            }, wait);
        }
    }

    public notifyListeners() {
        for (let counter in this.listeners) {
            this.listeners[counter].requestUpdate();
        }
    }

    public deregister(key: string) {
        delete this.listeners[key];
    }

    public registerListener(counter: CounterComp) {
        // this is called from ref, which is null on unmounts
        if (counter) {
            this.listeners[counter.getKey()] = counter;
        }
    }

    public getActivity(): Activity {
        if (this.simulation) {
            return this.simulation;
        }
        return this.activity;
    }

    public getActiveCount(nodeUUID: string): number {
        var activity = this.getActivity();
        if (activity) {
            var count = activity.active[nodeUUID];
            if (count !== undefined) {
                return count;
            }
        }
        return 0;
    }

    public getPathCount(exit: Exit): number {
        var activity = this.getActivity();
        if (activity) {
            if (exit.destination_node_uuid) {
                var count = activity.paths[exit.uuid + ":" + exit.destination_node_uuid];
                if (count !== undefined) {
                    return count;
                }
            }
        }
        return 0;
    }
}