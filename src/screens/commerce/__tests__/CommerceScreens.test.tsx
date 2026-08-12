import { fireEvent, render, screen } from '@testing-library/react-native';

import type { CartLine, CartState } from '@/commerce/Cart';
import { GiftReviewScreen } from '@/screens/commerce/GiftReviewScreen';
import { GiftSelectScreen } from '@/screens/commerce/GiftSelectScreen';
import { ItemScreen } from '@/screens/commerce/ItemScreen';
import { MenuScreen } from '@/screens/commerce/MenuScreen';
import { PaymentMethodsScreen } from '@/screens/commerce/PaymentMethodsScreen';
import { ReviewPayScreen } from '@/screens/commerce/ReviewPayScreen';
import type { RoomPerson, RoomProduct } from '@/rooms/types';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() }, usePathname: () => '/menu' }));

const product: RoomProduct = { id: 'drink-1', address: `30009:${'a'.repeat(64)}:drink`, name: 'Mezcal Negroni', description: 'Smoky and bitter', price: 12, currency: 'EUR', section: 'Cocktails', productKind: 'drink', available: true, position: 0 };
const person: RoomPerson = { pubkey: 'b'.repeat(64), name: 'Maya', about: '', intent: 'Open to chat', context: '', expiresAt: 2_000_000_000, createdAt: 1 };
const line: CartLine = { productId: product.id, address: product.address, name: product.name, price: product.price, currency: 'EUR', quantity: 2, recipientPubkey: person.pubkey, recipientName: person.name };
const cart: CartState = { roomId: 'skyline', roomName: 'The Skyline Room', lines: [line] };

describe('commerce screens', () => {
  it('renders section-first menu and opens an available product', () => {
    const onOpenProduct = jest.fn();
    render(<MenuScreen cartCount={1} loading={false} onBack={jest.fn()} onCart={jest.fn()} onOpenProduct={onOpenProduct} products={[product]} roomName="Skyline" />);
    expect(screen.getByText('Cocktails')).toBeOnTheScreen();
    expect(screen.getByText('Mezcal Negroni')).toBeOnTheScreen();
    expect(screen.getByText('€12.00')).toBeOnTheScreen();
    expect(screen.getByTestId('menu-product-image-drink-1')).toBeOnTheScreen();
    expect(screen.getByLabelText('Cart, 1 items')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('menu-product-drink-1'));
    expect(onOpenProduct).toHaveBeenCalledWith(product);
  });

  it('holds products back while the menu is loading', () => {
    render(<MenuScreen cartCount={0} loading onBack={jest.fn()} onCart={jest.fn()} onOpenProduct={jest.fn()} products={[product]} roomName="Skyline" />);
    expect(screen.queryByTestId('menu-product-drink-1')).not.toBeOnTheScreen();
    expect(screen.queryByText(/has not published an available menu/)).not.toBeOnTheScreen();
  });

  it('renders honest empty menu state', () => {
    render(<MenuScreen cartCount={0} loading={false} onBack={jest.fn()} onCart={jest.fn()} onOpenProduct={jest.fn()} products={[]} roomName="Skyline" />);
    expect(screen.getByText(/has not published an available menu/)).toBeOnTheScreen();
  });

  it('configures quantity and exact add commitment', () => {
    const onChangeQuantity = jest.fn();
    render(<ItemScreen onAdd={jest.fn()} onBack={jest.fn()} onChangeQuantity={onChangeQuantity} product={product} quantity={2} recipientName="Maya" roomName="Skyline" />);
    expect(screen.getByText('Add to order · €24.00')).toBeOnTheScreen();
    expect(screen.getByTestId('item-hero-image')).toBeOnTheScreen();
    expect(screen.getByText('Prepared as listed')).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText('Increase quantity'));
    expect(onChangeQuantity).toHaveBeenCalledWith(3);
  });

  it('clamps quantity at its boundaries', () => {
    const onChangeQuantity = jest.fn();
    const { rerender } = render(<ItemScreen onAdd={jest.fn()} onBack={jest.fn()} onChangeQuantity={onChangeQuantity} product={product} quantity={1} roomName="Skyline" />);
    fireEvent.press(screen.getByLabelText('Decrease quantity'));
    expect(onChangeQuantity).toHaveBeenCalledWith(1);
    rerender(<ItemScreen onAdd={jest.fn()} onBack={jest.fn()} onChangeQuantity={onChangeQuantity} product={product} quantity={20} roomName="Skyline" />);
    fireEvent.press(screen.getByLabelText('Increase quantity'));
    expect(onChangeQuantity).toHaveBeenCalledWith(20);
  });

  it('locks unavailable or pending adds and surfaces errors', () => {
    const { rerender } = render(<ItemScreen adding={false} onAdd={jest.fn()} onBack={jest.fn()} onChangeQuantity={jest.fn()} product={{ ...product, available: false }} quantity={1} roomName="Skyline" />);
    expect(screen.getByTestId('add-item')).toBeDisabled();
    rerender(<ItemScreen adding error="The cart could not be saved." onAdd={jest.fn()} onBack={jest.fn()} onChangeQuantity={jest.fn()} product={product} quantity={1} roomName="Skyline" />);
    expect(screen.getByTestId('add-item')).toBeDisabled();
    expect(screen.getByText('The cart could not be saved.')).toBeOnTheScreen();
  });

  it('reviews cart but never fakes payment availability', () => {
    render(<ReviewPayScreen cart={cart} method="Wallet" onBack={jest.fn()} onChangeMethod={jest.fn()} onChangeQuantity={jest.fn()} onRemove={jest.fn()} total={24} />);
    expect(screen.getByText('Total')).toBeOnTheScreen();
    expect(screen.getAllByText('€24.00').length).toBeGreaterThan(0);
    expect(screen.getByText('For Maya')).toBeOnTheScreen();
    expect(screen.getByText('Wallet')).toBeOnTheScreen();
    expect(screen.getByText(/Payments are intentionally not connected/)).toBeOnTheScreen();
    expect(screen.getByTestId('place-order-disabled')).toBeDisabled();
  });

  it('renders mixed recipients and routes line edits to their owners', () => {
    const onChangeQuantity = jest.fn();
    const onRemove = jest.fn();
    const selfLine: CartLine = { ...line, productId: 'snack-1', name: 'Marinated olives', price: 5, quantity: 1, recipientPubkey: undefined, recipientName: undefined };
    render(<ReviewPayScreen cart={{ ...cart, lines: [line, selfLine] }} method="Wallet" onBack={jest.fn()} onChangeMethod={jest.fn()} onChangeQuantity={onChangeQuantity} onRemove={onRemove} total={29} />);
    expect(screen.getByText('For Maya')).toBeOnTheScreen();
    expect(screen.getByText('For me')).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText('Decrease Marinated olives'));
    expect(onChangeQuantity).toHaveBeenCalledWith('snack-1', 0, undefined);
    fireEvent.press(screen.getByLabelText('Increase Mezcal Negroni'));
    expect(onChangeQuantity).toHaveBeenCalledWith('drink-1', 3, person.pubkey);
    fireEvent.press(screen.getAllByText('Remove')[1]);
    expect(onRemove).toHaveBeenCalledWith('snack-1', undefined);
  });

  it('states an empty cart total without enabling payment', () => {
    render(<ReviewPayScreen cart={{ ...cart, lines: [] }} method="Wallet" onBack={jest.fn()} onChangeMethod={jest.fn()} onChangeQuantity={jest.fn()} onRemove={jest.fn()} total={0} />);
    expect(screen.getAllByText('€0.00').length).toBeGreaterThan(0);
    expect(screen.getByTestId('place-order-disabled')).toBeDisabled();
  });

  it('shows all configured payment rails equally and returns selection', () => {
    const onSelect = jest.fn();
    render(<PaymentMethodsScreen onBack={jest.fn()} onSelect={onSelect} selected="Wallet" />);
    expect(screen.getByText('Apple Pay')).toBeOnTheScreen();
    expect(screen.getByText('Google Pay')).toBeOnTheScreen();
    expect(screen.getByText('Card')).toBeOnTheScreen();
    expect(screen.getByTestId('payment-wallet')).toBeSelected();
    expect(screen.getByText(/Selection does not initiate a charge/)).toBeOnTheScreen();
    expect(screen.getByText(/No payment details are collected/)).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('payment-card'));
    expect(onSelect).toHaveBeenCalledWith('Card');
  });

  it('selects only eligible room gifts and explains recipient control', () => {
    const onSelect = jest.fn();
    render(<GiftSelectScreen onBack={jest.fn()} onSelect={onSelect} person={person} products={[product]} roomName="Skyline" />);
    expect(screen.getByRole('header', { name: 'Pick the next track' })).toBeOnTheScreen();
    expect(screen.getByText(/Maya gets the ticket and can decline/)).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('gift-product-drink-1'));
    expect(onSelect).toHaveBeenCalledWith(product);
  });

  it('separates gift recipient, fulfillment, decline, refund, and deferred payment', () => {
    render(<GiftReviewScreen line={line} method="Choose a method" onBack={jest.fn()} onChangeMethod={jest.fn()} />);
    expect(screen.getByRole('header', { name: 'Send a drink to Maya' })).toBeOnTheScreen();
    expect(screen.getByText('The bar receives a normal order. Maya receives a private message and claim ticket.')).toBeOnTheScreen();
    expect(screen.getByText(/Refund pending/)).toBeOnTheScreen();
    expect(screen.getByText('Payment unavailable · €24.00')).toBeOnTheScreen();
    expect(screen.getByTestId('pay-gift-disabled')).toBeDisabled();
  });

  it('rejects a missing recipient instead of inventing or treating one as self', () => {
    const anonymous: CartLine = { ...line, recipientPubkey: undefined, recipientName: undefined };
    render(<GiftReviewScreen line={anonymous} method="Choose a method" onBack={jest.fn()} onChangeMethod={jest.fn()} />);
    expect(screen.getByRole('header', { name: 'Gift unavailable' })).toBeOnTheScreen();
    expect(screen.getByText('Recipient details are missing')).toBeOnTheScreen();
    expect(screen.queryByTestId('pay-gift-disabled')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('gift-payment-method')).not.toBeOnTheScreen();
  });

  it('routes the method choice and back to their callbacks', () => {
    const onChangeMethod = jest.fn();
    const onBack = jest.fn();
    render(<GiftReviewScreen line={line} method="Wallet" onBack={onBack} onChangeMethod={onChangeMethod} />);
    expect(screen.getByText('Wallet')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('gift-payment-method'));
    expect(onChangeMethod).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByText('Choose another drink'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
