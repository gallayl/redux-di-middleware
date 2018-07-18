import { expect } from "chai";
import { Action, applyMiddleware, createStore, Reducer } from "redux";
import { defaultContainerName, InjectableAction, ReduxDiMiddleware } from "../src/index";

// tslint:disable:completed-docs
export class ExampleInjectable {

    public async getValueAsync(...args: any[]) {
        return true;
    }

    constructor(public readonly value?: string) { }
}

export const tests = describe("ReduxDiMiddleware", () => {
    it("Can be constructed", () => {
        const m = new ReduxDiMiddleware();
        expect(m).to.be.instanceof(ReduxDiMiddleware);
    });

    describe("Injectables", () => {
        it("Should be added to default container", () => {
            const m = new ReduxDiMiddleware();
            const injectable = new ExampleInjectable("asd");
            m.setInjectable(injectable);
            expect(injectable).to.be.eq(m.getInjectable(ExampleInjectable));
        });

        it("Should be added to another container", () => {
            const m = new ReduxDiMiddleware();
            const injectable = new ExampleInjectable("asd");
            m.setInjectable(injectable, "container2");
            expect(injectable).to.be.eq(m.getInjectable(ExampleInjectable, "container2"));

            // tslint:disable-next-line:no-string-literal
            expect((m["containers"].get(defaultContainerName) as any).size).to.be.eq(0);
        });

        it("Should throw an error if no injectable is available in the container", () => {
            const m = new ReduxDiMiddleware();
            expect(() => m.getInjectable(ExampleInjectable)).to.throws();
        });
    });

    describe("Containers", () => {
        it("Should define its own default container", () => {
            const m = new ReduxDiMiddleware();
            // tslint:disable-next-line:no-string-literal
            expect(m["containers"].has(defaultContainerName)).to.be.eq(true);
        });

        it("Should be created lazily on adding a new entry", () => {
            const m = new ReduxDiMiddleware();
            m.setInjectable(new ExampleInjectable("alma"), "container2");
            // tslint:disable-next-line:no-string-literal
            expect(m["containers"].has("container2")).to.be.eq(true);
        });

        it("Should throw meaningful error when try to get value from an undefined container", () => {
            const m = new ReduxDiMiddleware();
            expect(() => m.getInjectable(ExampleInjectable, "container2")).to.throws();
        });
    });

    describe("middleware", () => {

        const mockReducer: Reducer<{ value: string }, Action> = (state = { value: "asd" }, action: Action) => state;

        it("Should be registered into a Redux store", (done: MochaDone) => {
            const m = new ReduxDiMiddleware();
            m.setInjectable(new ExampleInjectable("asdddd"));
            const store = createStore(mockReducer, applyMiddleware(m.getMiddleware()));
            const action: InjectableAction<any, Action> = ({
                type: "AAA",
                inject: (options) => {
                    expect(options.getState()).to.be.deep.eq({ value: "asd" });
                    expect(options.getInjectable(ExampleInjectable).value).to.be.eq("asdddd");
                    options.dispatch({ type: "AAA" });
                    done();
                },
            });
            store.dispatch({ type: "AAA" });
            store.dispatch(action);
        });

        it("Should be work with a readme example", () => {
            const di = new ReduxDiMiddleware();
            const injectableService = new ExampleInjectable();

            di.setInjectable(injectableService);
            const store = createStore(mockReducer, applyMiddleware(di.getMiddleware()));

            const exampleAction: InjectableAction<{ state: { value: string } }, Action> = ({
                type: "DO_SOMETHING",
                inject: async (options) => {
                    // gets the preconfigured injected instance
                    const service = options.getInjectable(ExampleInjectable);

                    // gets the current state
                    const currentState = options.getState();
                    try {
                        const value = await service.getValueAsync(currentState.state.value);

                        // dispatch an another action on the store with a result
                        options.dispatch({
                            type: "DO_SOMETHING_FINISHED",
                            value,
                        });
                    } catch (error) {
                        options.dispatch({
                            type: "DO_SOMETHING_FAILED",
                            error,
                        });
                    }
                },
            });
        });
    });

});
