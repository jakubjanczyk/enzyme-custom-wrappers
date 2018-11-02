# enzyme-custom-wrappers
This is a small library mainly aiming at promoting and simplifying writing of integration tests using Enzyme library.
As a name suggests, it let's you create your own wrappers for accessing components (or their elements) and to use it on top of pure Enzyme.

## Getting Started

To start using this library just install it from NPM by running following command:
```
npm install --save-dev enzyme-custom-wrappers
```

#### Usage example

Let's say that there is Users page that allows to add an user and display a list of all users.
Then we want to test that when we add new user it appears on the list.

##### Pure Enzyme
Here's how a test like this could look with regular Enzyme.

```javascript
import {mount} from "enzyme";

it('should add new user to the list', () => {
    const component = mount(<UsersPage />);

    component.find('.add-user').find('.new-user-name-input').simulate('change', {target: {value: 'John Doe'}});
    component.find('.add-user-button').simulate('click');
    
    expect(component.find('.users-list').find('.user-row').first().find('.user-name')).toEqual('John Doe')
});
```

Of course there are many different ways to find those different elements we need to perform action on (type name into input, click a button, etc.)
 and this example might overly complicated, but it's not uncommon to have complex selectors in big application.
 
##### With enzyme-custom-wrappers
Now let's look how it looks using this library. Starting with a modified test:

```javascript
// in our test file
import {mountWithCustomWrappers} from "enzyme-custom-wrappers";

it('should add new user to the list', () => {
    const component = mountWithCustomWrappers(<UsersPage />, wrapperForUserAdd, wrapperForUsersList);

    component.addUser('John Doe');

    expect(component.allUsers()).toEqual(['John Doe'])
});

// in user-add-wrapper.js file:
export const wrapperForUserAdd = (component) => ({
  addUser: (userName) => {
    component.find('.add-user').find('.new-user-name-input').simulate('change', {target: {value: userName}});
    component.find('.add-user-button').simulate('click');
  }
})

// in users-list-wrapper.js file:
export const wrapperForUsersList = (component) => ({
  allUsers: () => component.find('.users-list').find('.user-row').find('.user-name').map(el => el.text())
})
```

Test looks much clearer now, one can immediately see what is going on there, without need to dive into any selector and what it means.

Key element of library is `mountWithCustomWrappers` function that just takes Component you want to test and any number of wrappers.
Which are just a functions that take component as an argument and return object with any number of functions. 
As a result you get mounted component with any function provided by your wrappers available to call on our object. Please see next sections for more details.


## Why?
While Enzyme is really great library that simplifies writing React tests, after creating hundreds of tests it became obvious
that there is quite a bit of boilerplate required to write clean and readable tests.
Especially that we aimed to write as many integration tests as possible and it might require mounting few levels deep of components.
We want to mock as few nested components as possible. 
In fact, we never mock our components, only exception can be for ones from external libraries. And only if they are impossible to test.

Having to perform some action on a nested components require you to somehow find the element you target (by class name, text, whatever is the best in given case). 
But it might be troublesome, especially if we want to reuse some already existing component. 
In such situation it's not too long since we start asking question like: "What was the class name we need to target?".
Even worse, if the component is used in two different places and we test them independently, what if we want to change how we access our element?

We solved this, and many more, issues by introducing custom wrappers to our tests. 
While at first sight it might appear that there is much more code necessary to write, we follow the rule that you write code once and read it multiple times.
In this case, we can achieve much cleaner, easier to understand tests. 
What's more, as you can find in Usage section, it's very easy to reuse any wrapper you create in different place. 
This is really big advantage when creating small and reusable components. 
Using wrappers, you don't need to worry about how to "add user", "sort a table", "click a red button" - you just call the function and it's hidden.

## Usage

### No wrappers
Even if you use this library's function `mountWithCustomWrappers`, you don't need to provide any wrappers, this case would be perfectly valid:

```javascript
it('should add new user to the list', () => {
    const component = mountWithCustomWrappers(<UsersPage />);

    component.find('.add-user').find('.new-user-name-input').simulate('change', {target: {value: 'John Doe'}});
    component.find('.add-user-button').simulate('click');
    
    expect(component.find('.users-list').find('.user-row').first().find('.user-name')).toEqual('John Doe')
});
```

And as it might seem unnecessary to just change Enzyme's `mount` to different function, there is one additional feature that we introduced - common wrapper methods.

### Using common wrapper methods
We discovered that we are doing a lot of things over and over again. Example might be performing a click on element. 
In regular Enzyme you would do it like this:
```javascript
component.find('.add-user-button').simulate('click');
// or
component.find('.add-user-button').props('onClick')(/*...some event here*/);
```

But why not do it like this?

```javascript
component.find('.add-user-button').click();
```

There are also another methods built-in:
* `.focus()`
* `.blur()`
* `.typeText()`
* `.findByText()`
* `.findByClass()`

Please consult API section to find out more details.


### With single wrapper
Simplest use case would be to just use a single wrapper - that is useful when testing single component. Here's the example:

```javascript
// in our test file
it('should change text of button after it is clicked', () => {
    const component = mountWithCustomWrappers(<MyButton />, wrapperForMyButton);

    component.clickMyButton();

    expect(component.myButtonText()).toEqual('Clicked!');
});

// in my-button-wrapper.js file:
export const wrapperForMyButton = (component) => ({
  clickMyButton: () => component.findByDataTest('my-button').click(), // findByDataTest is another common method we added
  myButtonText: () => component.findByDataTest('my-button').text()
})
```

### With multiple wrappers
There can be as many wrappers added as you want and need (however, be aware, if there are too many, it probably means test is too complicated and should be split into smaller ones)

```javascript
// in our test file
it('should change text of button after it is clicked, and disable neighbouring input', () => {
    const component = mountWithCustomWrappers(<MyPage />, wrapperForMyButton, wrapperForMyInput);

    component.clickMyButton();

    expect(component.myButtonText()).toEqual('Clicked!');
    expect(component.myInputIsDisabled()).toBeTruth();
});

// in my-button-wrapper.js file:
export const wrapperForMyButton = (component) => ({
  clickMyButton: () => component.findByDataTest('my-button').click(),
  myButtonText: () => component.findByDataTest('my-button').text()
})

// in my-input-wrapper.js file:
export const wrapperForMyInput = (component) => ({
  myInputIsDisabled: () => component.findByDataTest('my-input').prop('disabled') === true
})
```

### Nesting wrappers
One of the advantage of this approach is ease of reusing wrappers (after all, they are just simple objects).
Apart from being able to use one wrapper in different tests, it is also possible to use wrapper inside another wrapper!

```javascript
// in our test file
it('should change text of button after it is clicked, when used on the MyPage component', () => {
    const component = mountWithCustomWrappers(<MyPage />, wrapperForMyPage);

    component.clickButton();

    expect(component.buttonText()).toEqual('Clicked!');
});

// in my-page-wrapper.js file:
const myButtonWrapper = createComponentWrapperFor(wrapperForMyButton);
export const wrapperForMyPage = (component) => ({
  clickButton: () => myButtonWrapper(component).clickMyButton(),
  buttonText: () => myButtonWrapper(component).myButtonText()
});

// in my-button-wrapper.js file:
export const wrapperForMyButton = (component) => ({
  clickMyButton: () => component.findByDataTest('my-button').click(),
  myButtonText: () => component.findByDataTest('my-button').text()
});
```

In this example new function has been introduced `createComponentWrapperFor` which is just lower level of `mountWithCustomWrappers`.
It allows you to use a wrapper without a need to mount a component - simple as that. Please refer to API section for more details.


### Namespaces - avoiding names duplication
One downside of wrappers is that names of all functions must be unique - not only within one wrapper, but all wrappers that you use together.
However, as wrappers are just objects, there is a simple solution to this problem - namespace. Here's how they could work:

```javascript
// in our test file
it('should change text of button after it is clicked, when used on the MyPage component', () => {
    const component = mountWithCustomWrappers(<MyPage />, wrapperForMyFirstButton, wrapperForMySecondButton);

    component.firstButton.clickButton();

    expect(component.secondButton.buttonText()).not.toEqual('Clicked!');
});

// in my-first-button-wrapper.js file:
export const wrapperForMyFirstButton = (component) => ({
    firstButton: {
        clickMyButton: () => component.findByDataTest('my-first-button').click(),
        myButtonText: () => component.findByDataTest('my-first-button').text()
    }   
});

// in my-second-button-wrapper.js file:
export const wrapperForMySecondButton = (component) => ({
    secondButton: {
        clickMyButton: () => component.findByDataTest('my-second-button').click(),
        myButtonText: () => component.findByDataTest('my-second-button').text()
    }   
});
```


## API
