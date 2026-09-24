import { render, screen, fireEvent } from '@testing-library/react-native';

import { Affiche } from './affiche';

describe('Affiche', () => {
  it('affiche le pictogramme par défaut quand uri est absent', async () => {
    await render(<Affiche uri={null} />);
    expect(screen.queryByTestId('affiche-image')).toBeNull();
    expect(screen.getByTestId('affiche-icone-defaut')).toBeTruthy();
  });

  it('affiche l\'image quand une uri est fournie', async () => {
    await render(<Affiche uri="https://exemple.com/affiche.jpg" />);
    expect(screen.getByTestId('affiche-image').props.source).toEqual({ uri: 'https://exemple.com/affiche.jpg' });
    expect(screen.queryByTestId('affiche-icone-defaut')).toBeNull();
  });

  it('revient au pictogramme par défaut si l\'image ne charge pas (onError)', async () => {
    await render(<Affiche uri="https://exemple.com/cassee.jpg" />);
    const image = screen.getByTestId('affiche-image');

    await fireEvent(image, 'error');

    expect(screen.queryByTestId('affiche-image')).toBeNull();
    expect(screen.getByTestId('affiche-icone-defaut')).toBeTruthy();
  });

  it('réaffiche l\'image si l\'uri change après une erreur', async () => {
    const { rerender } = await render(<Affiche uri="https://exemple.com/cassee.jpg" />);
    await fireEvent(screen.getByTestId('affiche-image'), 'error');
    expect(screen.queryByTestId('affiche-image')).toBeNull();

    await rerender(<Affiche uri="https://exemple.com/autre.jpg" />);

    expect(screen.getByTestId('affiche-image').props.source).toEqual({ uri: 'https://exemple.com/autre.jpg' });
  });
});
