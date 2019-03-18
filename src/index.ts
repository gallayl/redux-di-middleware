import { Constructable, Injector } from '@furystack/inject'
import { Dispatch, Middleware } from 'redux'

/**
 * Interface for defining the example action callback parameters
 */
export interface IInjectableActionCallbackParams<TState> {
  /**
   * Returns the current state of the store
   */
  getState: () => TState
  /**
   * Dispatches an action on the current store
   */
  dispatch: Dispatch
  /**
   * Returns an injectable instance
   */
  getInjectable: <TInjectable>(injectableType: Constructable<TInjectable>) => TInjectable
}

/**
 * Type for an injectable action callback
 */
export type IInjectableActionCallback<TState> = (options: IInjectableActionCallbackParams<TState>) => any

/**
 * Interface for Injectable Action definition
 */
export interface InjectableAction<TState> {
  /**
   * Method that can be called and will be executed
   */
  inject: IInjectableActionCallback<TState>
}

/**
 * Type guard for checking if the given action is an InjectableAction
 * @param action The action to check
 */
export const isInjectableAction = <TState>(action: any): action is InjectableAction<TState> => {
  return action && action.inject && typeof action.inject === 'function'
}

/**
 * Class for managing the Middleware and the registered injectable instances
 */
export class ReduxDiMiddleware {
  /**
   *
   */
  constructor(private readonly injector: Injector) {}

  /**
   * Registers an instantiated object into a DI Container that can be used as a singleton in the Actions.
   * @param value The value for specifying a singleton into the DI container. Have to be a constructed object.
   * @param key The key for setting the instance value
   */
  public setInjectable<T>(value: T, key?: Constructable<T>) {
    this.injector.setExplicitInstance(value, key)
  }

  /**
   * Returns a registered injectable object.
   * @throws when no DI Container is registered or no entity is registered in the specified container from the type
   * @param injectableType The Injectable type
   */
  public getInjectable<T>(injectableType: Constructable<T>) {
    return this.injector.getInstance(injectableType)
  }

  /**
   * Returns the Redux Middleware that can be used in the Redux Store
   */
  public getMiddleware: () => Middleware = () => api => next => (action: InjectableAction<{}>) => {
    if (isInjectableAction(action)) {
      return action.inject({
        dispatch: a => api.dispatch(a),
        getState: () => api.getState(),
        getInjectable: <T>(value: Constructable<T>) => this.getInjectable(value),
      })
    } else {
      return next(action)
    }
  }
}
