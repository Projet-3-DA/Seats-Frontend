import { render, screen } from '@testing-library/react-native';

import { VentesParSection } from './ventes-par-section';

const balcon = { id: 10, nom: 'Balcon', couleur: '#f59e0b', prix: 40, total: 4, vendus: 1, revenu: 40 };
const fosse = { id: 12, nom: 'Fosse', couleur: '#22c55e', prix: 15, total: 2, vendus: 0, revenu: 0 };
const sansSection = { id: null, nom: null, couleur: null, prix: 25, total: 2, vendus: 2, revenu: 50 };

describe('VentesParSection (#22)', () => {
  it('affiche, par section, les sièges vendus sur le total, le taux et le revenu', async () => {
    await render(<VentesParSection parSection={[balcon, sansSection]} />);

    expect(screen.getByText('Ventes par section')).toBeTruthy();
    expect(screen.getByLabelText(/^Balcon : 1 sur 4 sièges vendus, revenu 40,00/)).toBeTruthy();
    expect(screen.getByText('1 / 4 sièges vendus (25 %)')).toBeTruthy();
    expect(screen.getByText(/^40,00.*\/ place$/)).toBeTruthy();
  });

  it('affiche clairement zéro pour une section sans vente, au lieu de l’omettre', async () => {
    await render(<VentesParSection parSection={[balcon, fosse]} />);

    expect(screen.getByLabelText(/^Fosse : 0 sur 2 sièges vendus, revenu 0,00/)).toBeTruthy();
    expect(screen.getByText('0 / 2 sièges vendus (0 %)')).toBeTruthy();
  });

  it('nomme « Sans section » les sièges hors section, et « Tarif unique » une salle sans section', async () => {
    const { rerender } = await render(<VentesParSection parSection={[balcon, sansSection]} />);
    expect(screen.getByText('Sans section')).toBeTruthy();

    await rerender(<VentesParSection parSection={[sansSection]} />);
    expect(screen.getByText('Tarif unique')).toBeTruthy();
    expect(screen.queryByText('Sans section')).toBeNull();
  });

  it('affiche un tiret quand le revenu est inconnu (événement sans tarif)', async () => {
    await render(<VentesParSection parSection={[balcon, { ...sansSection, prix: null, revenu: null }]} />);

    expect(screen.getByLabelText('Sans section : 2 sur 2 sièges vendus, revenu —')).toBeTruthy();
  });

  it("n'affiche rien sans statistiques (réponse d'un ancien backend)", async () => {
    await render(<VentesParSection parSection={undefined} />);

    expect(screen.queryByText('Ventes par section')).toBeNull();
  });
});
