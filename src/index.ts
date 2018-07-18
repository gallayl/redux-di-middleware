import { Action, Dispatch, Middleware } from "redux";

/**
 * The default container name. Will be used if not specified otherwise
 */
export const defaultContainerName = "default";

/**
 * Type for an injectable action callback
 */
export type IInjectableActionCallback<TState, TAction extends Action> = (options: {
    getState: () => TState,
    dispatch: Dispatch<TAction>,
    getInjectable: <TInjectable>(injectableType: { new(...args: any[]): TInjectable }, containerName?: string) => TInjectable,
}) => any;

/**
 * Interface for Injectable Action definition
 */
export interface InjectableAction<TState, TAction extends Action> extends Action {
    inject: IInjectableActionCallback<TState, TAction>;
}

export const isInjectableAction = <TState, TAction extends Action>(action: any): action is InjectableAction<TState, TAction> => {
    return action && action.inject && typeof action.inject === "function";
};

export class ReduxDiMiddleware {
    private readonly containers: Map<string, Map<string, any>> = new Map<string, Map<string, any>>([
        [defaultContainerName, new Map<string, any>()] as [string, Map<string, any>],
    ]);

    public setInjectable<T>(value: T, containerName: string = defaultContainerName) {
        let container!: Map<string, any>;
        if (!this.containers.has(containerName)) {
            this.containers.set(containerName, new Map());
        }
        container = this.containers.get(containerName) as Map<string, any>;
        container.set(value.constructor.name, value);
    }

    public getInjectable<T>(injectableType: { new(...args: any[]): T }, containerName: string = defaultContainerName) {
        if (this.containers.has(containerName)) {
            const container = this.containers.get(containerName) as Map<string, any>;
            if (container.has(injectableType.name)) {
                return container.get(injectableType.name) as T;
            }
            throw Error(`Injectable not found for '${injectableType.name}' in the container '${containerName}'`);
        }
        throw Error(`No container found with name '${containerName}'`);
    }

    public getMiddleware: () => Middleware = () => (api) => (next) => (action: InjectableAction<{}, Action>) => {
        if (isInjectableAction(action)) {
            return action.inject({
                dispatch: (a) => api.dispatch(a),
                getState: () => api.getState(),
                getInjectable: (...args) => this.getInjectable(...args),
            });
        } else {
            return next(action);
        }
    }
}
