import { Injector } from '@furystack/inject'
import { expect } from 'chai'
import { Action, applyMiddleware, createStore, Reducer } from 'redux'
import { IInjectableActionCallbackParams, ReduxDiMiddleware } from '../src/index'

// tslint:disable:completed-docs
export class ExampleInjectable {
  public async getValueAsync(...args: any[]) {
    return true
  }

  constructor(public readonly value?: string) {}
}

export const tests = describe('ReduxDiMiddleware', () => {
  it('Can be constructed', () => {
    const m = new ReduxDiMiddleware(new Injector())
    expect(m).to.be.instanceof(ReduxDiMiddleware)
  })

  describe('Injectables', () => {
    it('Should be added to default container', () => {
      const m = new ReduxDiMiddleware(new Injector())
      const injectable = new ExampleInjectable('asd')
      m.setInjectable(injectable)
      expect(injectable).to.be.eq(m.getInjectable(ExampleInjectable))
    })
  })

  describe('middleware', () => {
    const mockReducer: Reducer<{ value: string }, Action> = (state = { value: 'asd' }, action: Action) => state

    it('Should be registered into a Redux store', done => {
      const m = new ReduxDiMiddleware(new Injector())
      m.setInjectable(new ExampleInjectable('asdddd'))
      const store = createStore(mockReducer, applyMiddleware(m.getMiddleware()))
      const action = {
        type: 'AAA',
        inject: (options: IInjectableActionCallbackParams<any>) => {
          expect(options.getState()).to.be.deep.eq({ value: 'asd' })
          expect(options.getInjectable(ExampleInjectable).value).to.be.eq('asdddd')
          options.dispatch({ type: 'AAA' })
          done()
        },
      }
      store.dispatch({ type: 'AAA' })
      store.dispatch(action)
    })

    it('Should be work with a readme example', () => {
      const di = new ReduxDiMiddleware(new Injector())
      const injectableService = new ExampleInjectable()

      di.setInjectable(injectableService)
      const store = createStore(mockReducer, applyMiddleware(di.getMiddleware()))

      const exampleAction = {
        type: 'DO_SOMETHING',
        inject: async (options: IInjectableActionCallbackParams<{ state: { value: string } }>) => {
          // gets the preconfigured injected instance
          const service = options.getInjectable(ExampleInjectable)

          // gets the current state
          const currentState = options.getState()
          try {
            const value = await service.getValueAsync(currentState.state.value)

            // dispatch an another action on the store with a result
            options.dispatch({
              type: 'DO_SOMETHING_FINISHED',
              value,
            })
          } catch (error) {
            options.dispatch({
              type: 'DO_SOMETHING_FAILED',
              error,
            })
          }
        },
      }
    })
  })
})
