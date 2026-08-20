import { fireEvent, render, screen } from '@testing-library/react-native';

import { RoomQrScannerScreen } from '@/screens/discovery/RoomQrScannerScreen';

jest.mock('expo-camera', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { View: NativeView } = jest.requireActual<typeof import('react-native')>('react-native');
  return { CameraView: (props: object) => ReactRuntime.createElement(NativeView, { ...props, testID: 'camera-view' }) };
});

const props = { onBack: jest.fn(), onRequestPermission: jest.fn(), onScan: jest.fn() };

describe('RoomQrScannerScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['checking', 'Checking camera access…'],
    ['prompt', 'Camera only when you choose'],
    ['denied', 'Camera access is off'],
  ] as const)('renders the %s state without mounting the camera', (permission, copy) => {
    render(<RoomQrScannerScreen {...props} permission={permission} />);
    expect(screen.getByText(copy)).toBeTruthy();
    expect(screen.queryByTestId('camera-view')).toBeNull();
  });

  it('requests permission only after the explicit action', () => {
    render(<RoomQrScannerScreen {...props} permission="prompt" />);
    fireEvent.press(screen.getByTestId('request-camera'));
    expect(props.onRequestPermission).toHaveBeenCalledTimes(1);
  });

  it('scans only QR codes after permission and announces invalid-code errors', () => {
    render(<RoomQrScannerScreen {...props} error="That code is not a Crays room link." permission="granted" />);
    const camera = screen.getByTestId('camera-view');
    expect(camera.props.barcodeScannerSettings).toEqual({ barcodeTypes: ['qr'] });
    camera.props.onBarcodeScanned({ data: 'crays://room' });
    expect(props.onScan).toHaveBeenCalledWith('crays://room');
    expect(screen.getByRole('alert')).toHaveTextContent('That code is not a Crays room link.');
  });
});
