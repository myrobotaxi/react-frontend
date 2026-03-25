import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ClimateCard } from '@/features/vehicles/components/ClimateCard';
import type { ClimateData } from '@/features/vehicles/components/ClimateCard';

const baseClimate: ClimateData = {
  isClimateOn: false,
  interiorTemp: 72,
  exteriorTemp: 88,
};

const onClimate: ClimateData = {
  isClimateOn: true,
  interiorTemp: 72,
  exteriorTemp: 88,
  fanSpeed: 4,
  driverTempSetting: 72,
  passengerTempSetting: 70,
  defrostMode: 'off',
  seatHeaterLeft: 2,
  seatHeaterRight: 0,
  climateKeeperMode: 'off',
};

describe('ClimateCard', () => {
  describe('always visible content', () => {
    it('renders the Climate section label', () => {
      render(<ClimateCard climate={baseClimate} />);
      expect(screen.getByText('Climate')).toBeInTheDocument();
    });

    it('renders interior temperature', () => {
      render(<ClimateCard climate={baseClimate} />);
      expect(screen.getByText(/72/)).toBeInTheDocument();
    });

    it('renders exterior temperature', () => {
      render(<ClimateCard climate={baseClimate} />);
      expect(screen.getByText(/88/)).toBeInTheDocument();
    });

    it('renders Interior and Exterior labels', () => {
      render(<ClimateCard climate={baseClimate} />);
      expect(screen.getByText('Interior')).toBeInTheDocument();
      expect(screen.getByText('Exterior')).toBeInTheDocument();
    });
  });

  describe('off state', () => {
    it('shows Off badge when climate is off', () => {
      render(<ClimateCard climate={{ ...baseClimate, isClimateOn: false }} />);
      expect(screen.getByText('Off')).toBeInTheDocument();
    });

    it('does not render fan speed section when climate is off', () => {
      render(<ClimateCard climate={{ ...baseClimate, isClimateOn: false }} />);
      expect(screen.queryByText('Fan Speed')).toBeNull();
    });

    it('does not render seat heater section when climate is off', () => {
      render(<ClimateCard climate={{ ...baseClimate, isClimateOn: false }} />);
      expect(screen.queryByText('Driver Seat')).toBeNull();
    });
  });

  describe('on state', () => {
    it('shows On badge when climate is on', () => {
      render(<ClimateCard climate={onClimate} />);
      expect(screen.getByText('On')).toBeInTheDocument();
    });

    it('renders fan speed label', () => {
      render(<ClimateCard climate={onClimate} />);
      expect(screen.getByText('Fan Speed')).toBeInTheDocument();
    });

    it('renders fan speed value', () => {
      render(<ClimateCard climate={onClimate} />);
      expect(screen.getByText('4/10')).toBeInTheDocument();
    });

    it('renders driver temp set-point', () => {
      render(<ClimateCard climate={onClimate} />);
      expect(screen.getByText('Driver Set')).toBeInTheDocument();
    });

    it('renders passenger temp set-point', () => {
      render(<ClimateCard climate={onClimate} />);
      expect(screen.getByText('Passenger Set')).toBeInTheDocument();
    });

    it('renders driver seat heater level', () => {
      render(<ClimateCard climate={onClimate} />);
      expect(screen.getByText('Driver Seat')).toBeInTheDocument();
      expect(screen.getByText('2/3')).toBeInTheDocument();
    });

    it('renders passenger seat heater as Off when level is 0', () => {
      render(<ClimateCard climate={onClimate} />);
      expect(screen.getByText('Pass. Seat')).toBeInTheDocument();
      expect(screen.getByText('Off')).toBeInTheDocument();
    });

    it('renders defrost mode label', () => {
      render(<ClimateCard climate={onClimate} />);
      expect(screen.getByText('Defrost')).toBeInTheDocument();
    });
  });

  describe('climate keeper modes', () => {
    it('shows Dog Mode label when climateKeeperMode is dogMode', () => {
      render(<ClimateCard climate={{ ...onClimate, climateKeeperMode: 'dogMode' }} />);
      expect(screen.getByText('Dog Mode')).toBeInTheDocument();
    });

    it('shows Camp Mode label when climateKeeperMode is campMode', () => {
      render(<ClimateCard climate={{ ...onClimate, climateKeeperMode: 'campMode' }} />);
      expect(screen.getByText('Camp Mode')).toBeInTheDocument();
    });

    it('shows Keep On label when climateKeeperMode is keepOn', () => {
      render(<ClimateCard climate={{ ...onClimate, climateKeeperMode: 'keepOn' }} />);
      expect(screen.getByText('Keep On')).toBeInTheDocument();
    });

    it('does not show Mode section when climateKeeperMode is off', () => {
      render(<ClimateCard climate={{ ...onClimate, climateKeeperMode: 'off' }} />);
      expect(screen.queryByText('Mode')).toBeNull();
    });
  });

  describe('fan speed bar', () => {
    it('renders a progress bar element with correct width for fan speed 5', () => {
      const { container } = render(<ClimateCard climate={{ ...onClimate, fanSpeed: 5 }} />);
      const bar = container.querySelector('.bg-gold');
      expect(bar).toBeTruthy();
      expect((bar as HTMLElement).style.width).toBe('50%');
    });

    it('renders an empty bar for fan speed 0', () => {
      const { container } = render(<ClimateCard climate={{ ...onClimate, fanSpeed: 0 }} />);
      const bar = container.querySelector('.bg-gold');
      expect(bar).toBeTruthy();
      expect((bar as HTMLElement).style.width).toBe('0%');
    });
  });
});
