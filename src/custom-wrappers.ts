import {mount, ReactWrapper} from 'enzyme';
import {ReactElement} from 'react';

export interface CommonWrapper {
    findByText: (text: string) => Wrapper;
    findByClass: (className: string) => Wrapper;
    findByDataTest: (dataTest: string) => Wrapper;
    click: () => Wrapper;
    blur: () => Wrapper;
    focus: () => Wrapper;
    typeText: (text: string) => Wrapper;
}

export interface Wrapper extends CommonWrapper, ReactWrapper {
}

export interface WrapperMarker {
}

type WrapperFunction = (component: Wrapper) => WrapperMarker;

const extendToCurrentData = (next: WrapperMarker, current: Wrapper) => ({...current, ...next});

const havingText = (text: string) => (el: ReactWrapper) => {
    if (!el || el.length !== 1) {
        return false;
    }
    return el && el.instance() && el.text() === text;
};

const havingClass = (className: string) => (el: ReactWrapper) => (el.prop<string>('className') || '').includes(className);

const commonWrapper: (CommonWrapper | any) = {
    findByText(text: string) {
        return this.findWhere(havingText(text));
    },
    findByClass(className: string) {
        return this.findWhere(havingClass(className));
    },
    findByDataTest(dataTest: string) {
        return this.find(`[data-test="${dataTest}"]`);
    },
    click() {
        return this.simulate('click');
    },
    blur() {
        return this.simulate('blur');
    },
    focus() {
        return this.simulate('focus');
    },
    typeText(text: string) {
        return this.simulate('change', {target: {value: text}});
    }
};

const extendReactWrapperWithCommonMethods = (component: ReactWrapper) =>
    Object.setPrototypeOf(component, Object.assign(Object.getPrototypeOf(component), commonWrapper));

const combineAllWrappers = (wrappers: WrapperFunction[], extendedComponent: Wrapper) =>
    wrappers.map(part => part(extendedComponent))
        .reduce((result: Wrapper, nextWrapper: WrapperMarker) => extendToCurrentData(nextWrapper, result), {});

const wrapperMethodsAsPrototypeOf = (extendedComponent: Wrapper, wrapper: WrapperMarker) =>
    Object.setPrototypeOf(extendedComponent, Object.assign(Object.create(Object.getPrototypeOf(extendedComponent)), wrapper));

export const createComponentWrapperFor = <CustomWrappers = {}>(...wrappers: WrapperFunction[]) => (component: ReactWrapper): CustomWrappers & Wrapper => {
    const extendedComponent = extendReactWrapperWithCommonMethods(component);
    if (wrappers.length === 0) {
        return extendedComponent;
    }
    const wrapper = combineAllWrappers(wrappers, extendedComponent);
    return wrapperMethodsAsPrototypeOf(extendedComponent, wrapper);
};

export const mountWithCustomWrappers = <CustomWrappers = {}>(node: ReactElement<any>, ...wrappers: WrapperFunction[]): CustomWrappers & Wrapper =>
    createComponentWrapperFor<CustomWrappers>(...wrappers)(mount(node));
