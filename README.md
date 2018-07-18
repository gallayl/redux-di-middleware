
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/e5f49807dba94c57906e4e115c7179a5)](https://app.codacy.com/app/gallayl/redux-di-middleware?utm_source=github.com&utm_medium=referral&utm_content=gallayl/redux-di-middleware&utm_campaign=badger)
[![npm version](https://badge.fury.io/js/redux-di-middleware.svg)](https://badge.fury.io/js/redux-di-middleware)
[![Build Status](https://travis-ci.org/gallayl/redux-di-middleware.svg?branch=master)](https://travis-ci.org/gallayl/redux-di-middleware)
[![codecov](https://codecov.io/gh/gallayl/redux-di-middleware/branch/master/graph/badge.svg)](https://codecov.io/gh/gallayl/redux-di-middleware)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/cd3c4876c52d41c6919e892e76d43e7e)](https://www.codacy.com/app/gallayl/redux-di-middleware?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=gallayl/redux-di-middleware&amp;utm_campaign=Badge_Grade)
[![Greenkeeper badge](https://badges.greenkeeper.io/gallayl/redux-di-middleware.svg)](https://greenkeeper.io/)

# redux-di-middleware
A redux middleware for dependency injection and async operations, written in Typescript

## Install

```sh
npm install redux-di-middleware
```

## Usage

### Setting up with the Store

You can set up the middleware during the store creation.

```ts
const di = new ReduxDiMiddleware();
const injectableService = new ExampleInjectable();

// This service will be registered as a singleton in the default DI Container.
// You can register services from another type as well into the same container.
di.setInjectable(injectableService);

const store = createStore(mockReducer, applyMiddleware(di.getMiddleware()));
```

### An example action

Injectable actions have to be a field called *inject* that must be a function (and can be async as well)

```ts
const exampleAction: InjectableAction<{state: { value: string}}, Action> = ({
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
```

### Using named containers

If you want to inject more than a simple instance you can use named containers.

```ts

const injectableService = new ExampleInjectable();
// sets to the default container
di.setInjectable(injectableService);

// sets to "myCustomContainer"
const otherInjectableService = new ExampleInjectable();
di.setInjectable(otherInjectableService, "myCustomContainer")

// ... later in the Action
// gets from the default container
const service = options.getInjectable(ExampleInjectable);

// gets from "myCustomContainer"
const serviceFromCustomContainer = options.getInjectable(ExampleInjectable, "myCustomContainer");


```
