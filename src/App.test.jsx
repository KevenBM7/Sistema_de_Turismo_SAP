import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

test('renders home page', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  const headingElement = screen.getByText(/Bienvenido al Sistema de Turismo Municipal/i);
  expect(headingElement).toBeInTheDocument();
});
