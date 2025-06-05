import { render } from '@testing-library/react';
import { act } from 'react';
import { useScreenWakeLock } from '../hooks/useScreenWakeLock';

function TestComponent({ active }: { active: boolean }) {
  useScreenWakeLock(active);
  return null;
}


describe('useScreenWakeLock', () => {
  let requestMock: jest.Mock;
  let releaseMock: jest.Mock;

  beforeEach(() => {
    releaseMock = jest.fn().mockResolvedValue(undefined);
    requestMock = jest.fn().mockResolvedValue({ release: releaseMock });
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: { request: requestMock },
    });
  });

  afterEach(() => {
    // @ts-ignore
    delete (navigator as any).wakeLock;
    jest.clearAllMocks();
  });

  it('requests and releases the wake lock based on active prop', async () => {
    const { rerender } = render(<TestComponent active={true} />);

    await act(async () => {
      await Promise.resolve();
    });
    expect(requestMock).toHaveBeenCalledTimes(1);

    rerender(<TestComponent active={false} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(releaseMock).toHaveBeenCalled();
  });

  it('re-requests the wake lock when page becomes visible', async () => {
    render(<TestComponent active={true} />);

    await act(async () => {
      await Promise.resolve();
    });
    expect(requestMock).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(requestMock).toHaveBeenCalledTimes(2);
  });
});

