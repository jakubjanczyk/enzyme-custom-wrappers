import TestComponent from './TestComponent';
import {createComponentWrapperFor, mountWithCustomWrappers, Wrapper} from '../src/custom-wrappers';

describe('Custom Wrappers', () => {
    type ButtonWrapper = ReturnType<typeof wrapperForButton>;

    type ContainerWrapper = ReturnType<typeof wrapperForContainer>

    const wrapperForButton = (component: Wrapper) => {
        return {
            clickTestButton: () => component.findByText('Test Button').click()
        }
    };
    const wrapperForContainer = (component: Wrapper) => {
        return {
            findSecondSpan: () => component.findByText('Test Button').click()
        }
    };

    describe('mountWithCustomWrappers', () => {
        it('should preserve basic enzyme Wrapper methods when no custom wrapper provided', () => {
            const component = mountWithCustomWrappers(TestComponent());

            expect(component.find('.test-container').exists()).toBeTruthy();
        });

        describe('custom methods', () => {
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
                const component = mountWithCustomWrappers(TestComponent({onClick}));

                component.findByText('Test Button').click();

                expect(onClick).toHaveBeenCalled();
            });

            it('should allow to click on element, when found by basic Enzyme method', () => {
                const onClick = jest.fn();
                const component = mountWithCustomWrappers(TestComponent({onClick}));

                (component.find('[data-test="test-button"]') as Wrapper).click();

                expect(onClick).toHaveBeenCalled();
            });
        });

        it('should add custom method when just one wrapper provided', () => {
            const onClick = jest.fn();
            const component = mountWithCustomWrappers<ButtonWrapper>(TestComponent({onClick}), wrapperForButton);

            component.clickTestButton();

            expect(onClick).toHaveBeenCalled();
        });

        it('should add custom method when just more than one wrapper provided', () => {
            type MyWrapper = ButtonWrapper & ContainerWrapper
            const onClick = jest.fn();
            const component = mountWithCustomWrappers<MyWrapper>(TestComponent({onClick}), wrapperForButton, wrapperForContainer);

            component.clickTestButton();

            expect(onClick).toHaveBeenCalled();
            expect(component.findSecondSpan().exists()).toBeTruthy();
        });
    });

    describe('using raw createComponentWrapperFor for nested wrapper', () => {
        type NestedContainerWrapper = ReturnType<typeof wrapperForNestedContainer>
        type SpanWrapper = ReturnType<typeof wrapperForSpans>

        const wrapperForSpans = (component: Wrapper) => {
            return {
                dataValue: () => component.prop('data-value') as string,
                isActive: () => component.prop('data-active') as boolean
            }
        };
        const customButtonWrapper = createComponentWrapperFor<ButtonWrapper>(wrapperForButton);
        const spanWrapper = createComponentWrapperFor<SpanWrapper>(wrapperForSpans);
        const wrapperForNestedContainer = (component: Wrapper) => {
            return {
                clickNestedButton: () => customButtonWrapper(component).clickTestButton(),
                allActiveSpansDataValues: () => component.find('span')
                    .map(el => spanWrapper(el))
                    .filter(el => el.isActive())
                    .map(el => el.dataValue())
            }
        };
        it('should allow to nest wrapper inside other wrappers', () => {
            const onClick = jest.fn();
            const component = mountWithCustomWrappers<NestedContainerWrapper>(TestComponent({onClick}), wrapperForNestedContainer);

            component.clickNestedButton();

            expect(onClick).toHaveBeenCalled();
        });

        it('should work with inner wrapper used on multiple elements in one method - not reuse the same custom prototype for each element', () => {
            const component = mountWithCustomWrappers<NestedContainerWrapper>(TestComponent(), wrapperForNestedContainer);

            expect(component.allActiveSpansDataValues()).toEqual(['Span 1', 'Span 3']);
        });
    });

    describe('using namespaces', () => {
        type ButtonWrapper = ReturnType<typeof wrapperForTestButton>;
        type FirstSpanWrapper = ReturnType<typeof wrapperForFirstSpan>;

        const wrapperForFirstSpan = (component: Wrapper) => ({
            firstSpan: {
                dataValue: () => component.find('span').first().prop('data-value') as string
            }
        });

        const wrapperForTestButton = (component: Wrapper) => ({
            testButton: {
                dataValue: () => component.findByDataTest('test-button').prop('data-value') as string
            }
        });

        it('should allow to create wrappers with namespaces to avoid names clashes', () => {
            type MyWrapper = FirstSpanWrapper & ButtonWrapper
            const component = mountWithCustomWrappers<MyWrapper>(TestComponent(), wrapperForFirstSpan, wrapperForTestButton);

            expect(component.firstSpan.dataValue()).toEqual('Span 1');
            expect(component.testButton.dataValue()).toEqual('Test Button');
        })
    })
});
