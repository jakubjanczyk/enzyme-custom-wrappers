import {mountWithCustomWrappers, Wrapper} from "../src/custom-wrappers";
import TestComponent from "./TestComponent";
import * as React from "react";

describe('common methods', () => {
    it('should findByClass', () => {
        const component = mountWithCustomWrappers(TestComponent());

        expect(component.findByClass('test-container').exists()).toBeTruthy();
    });

    it('should findByDataTest', () => {
        const component = mountWithCustomWrappers(TestComponent());

        expect(component.findByDataTest('test-container-data-test').exists()).toBeTruthy();
    });

    it('should findByText', () => {
        const component = mountWithCustomWrappers(TestComponent());

        expect(component.findByText('Span 2')).toHaveLength(1);
    });

    it('should allow to click on element, when found by custom method', () => {
        const onClick = jest.fn();
        const component = mountWithCustomWrappers(
            <button onClick={onClick}>
                Test Button
            </button>
        );

        component.findByText('Test Button').click();

        expect(onClick).toHaveBeenCalled();
    });

    it('should allow to blur element, when found by custom method', () => {
        const onBlur = jest.fn();
        const component = mountWithCustomWrappers(
            <button onBlur={onBlur}>
                Test Button
            </button>
        );

        component.findByText('Test Button').blur();

        expect(onBlur).toHaveBeenCalled();
    });

    it('should allow to focus element, when found by custom method', () => {
        const onFocus = jest.fn();
        const component = mountWithCustomWrappers(
            <button onFocus={onFocus}>
                Test Button
            </button>
        );

        component.findByText('Test Button').focus();

        expect(onFocus).toHaveBeenCalled();
    });

    it('should allow to type into input element, when found by custom method', () => {
        const onChange = jest.fn();
        const component = mountWithCustomWrappers(<input data-test="test-input" onChange={(event) => onChange(event.target.value)} />);

        const text = 'some text';
        component.findByDataTest('test-input').typeText(text);

        expect(onChange).toHaveBeenCalledWith(text);
    });

    it('should allow to click on element, when found by basic Enzyme method', () => {
        const onClick = jest.fn();
        const component = mountWithCustomWrappers(TestComponent({onClick}));

        (component.find('[data-test="test-button"]') as Wrapper).click();

        expect(onClick).toHaveBeenCalled();
    });
});
