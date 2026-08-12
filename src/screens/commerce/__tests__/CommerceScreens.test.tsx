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
    fireEvent.press(screen.getByTestId('menu-product-drink-1'));
    expect(onOpenProduct).toHaveBeenCalledWith(product);
  });

  it('renders honest empty menu state', () => {
    render(<MenuScreen cartCount={0} loading={false} onBack={jest.fn()} onCart={jest.fn()} onOpenProduct={jest.fn()} products={[]} roomName="Skyline" />);
    expect(screen.getByText(/has not published an available menu/)).toBeOnTheScreen();
  });

  it('configures quantity and exact add commitment', () => {
    const onChangeQuantity = jest.fn();
    render(<ItemScreen onAdd={jest.fn()} onBack={jest.fn()} onChangeQuantity={onChangeQuantity} product={product} quantity={2} recipientName="Maya" roomName="Skyline" />);
    expect(screen.getByText('Add to order · €24.00')).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText('Increase quantity'));
    expect(onChangeQuantity).toHaveBeenCalledWith(3);
  });

  it('opens hosted Stripe checkout for a supported self order', () => {
    const onCheckout = jest.fn();
    const selfCart: CartState = { ...cart, lines: [{ ...line, quantity: 1, recipientPubkey: undefined, recipientName: undefined }] };
    render(<ReviewPayScreen cart={selfCart} method="Card" onBack={jest.fn()} onCheckout={onCheckout} onChangeMethod={jest.fn()} onChangeQuantity={jest.fn()} onRemove={jest.fn()} total={12} />);
    expect(screen.getByText('Total')).toBeOnTheScreen();
    expect(screen.getByText(/Stripe opens in a secure browser/)).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('place-order'));
    expect(onCheckout).toHaveBeenCalledTimes(1);
  });

  it('keeps unsupported quantity explicit instead of charging a different amount', () => {
    const reason = 'Stripe checkout currently supports one serving per payment.';
    render(<ReviewPayScreen cart={cart} checkoutDisabledReason={reason} method="Card" onBack={jest.fn()} onCheckout={jest.fn()} onChangeMethod={jest.fn()} onChangeQuantity={jest.fn()} onRemove={jest.fn()} total={24} />);
    expect(screen.getByTestId('checkout-disabled-reason')).toHaveTextContent(reason);
    expect(screen.getByTestId('place-order')).toBeDisabled();
  });

  it('shows all configured payment rails equally and returns selection', () => {
    const onSelect = jest.fn();
    render(<PaymentMethodsScreen onBack={jest.fn()} onSelect={onSelect} selected="Wallet" />);
    expect(screen.getByText('Apple Pay')).toBeOnTheScreen();
    expect(screen.getByText('Google Pay')).toBeOnTheScreen();
    expect(screen.getByText('Card')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('payment-card'));
    expect(onSelect).toHaveBeenCalledWith('Card');
  });

  it('selects only eligible room gifts and explains recipient control', () => {
    const onSelect = jest.fn();
    render(<GiftSelectScreen onBack={jest.fn()} onSelect={onSelect} person={person} products={[product]} roomName="Skyline" />);
    expect(screen.getByText(/Maya gets the ticket and can decline/)).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('gift-product-drink-1'));
    expect(onSelect).toHaveBeenCalledWith(product);
  });

  it('separates gift recipient, fulfillment, decline, refund, and deferred payment', () => {
    render(<GiftReviewScreen line={line} method="Choose a method" onBack={jest.fn()} onChangeMethod={jest.fn()} />);
    expect(screen.getByText(/receives a private message and claim ticket/)).toBeOnTheScreen();
    expect(screen.getByText(/Refund pending/)).toBeOnTheScreen();
    expect(screen.getByTestId('pay-gift-disabled')).toBeDisabled();
  });
});
