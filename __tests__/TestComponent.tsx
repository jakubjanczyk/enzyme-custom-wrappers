import * as React from 'react';

export default ({onClick = jest.fn}: {onClick?: (event: any) => void} = {}) => (
    <div className='test-container' data-test='test-container-data-test'>
        <div data-test='spans-container'>
            <span data-value='Span 1' data-active>Span 1</span>
            <span data-value='Span 2'>Span 2</span>
            <span data-value='Span 3' data-active>Span 3</span>
        </div>
        <button data-test='test-button' onClick={onClick} data-value="Test Button">
            Test Button
        </button>
    </div>
)