import { RecommendationEngine, EngineInput } from './recommendation.engine';

describe('RecommendationEngine', () => {
  let engine: RecommendationEngine;

  beforeEach(() => {
    engine = new RecommendationEngine();
  });

  describe('haversineKm', () => {
    it('returns 0 for identical coordinates', () => {
      expect(engine.haversineKm(7.6744, 36.8344, 7.6744, 36.8344)).toBe(0);
    });

    it('returns roughly 150km between Jimma and Nekemte', () => {
      // Jimma is approximately 150 km from Nekemte
      const km = engine.haversineKm(7.6661, 36.8344, 9.0785, 36.5497);
      expect(km).toBeGreaterThan(100);
      expect(km).toBeLessThan(220);
    });
  });

  describe('estimateTransportCost', () => {
    it('computes distance x rate x tons', () => {
      // rate 8 ETB/km/ton, 150km, 5 tons -> 6000
      const cost = engine.estimateTransportCost(8, 150, 5000);
      expect(cost).toBe(6000);
    });

    it('scales with larger quantities', () => {
      const small = engine.estimateTransportCost(8, 150, 1000);
      const large = engine.estimateTransportCost(8, 150, 10000);
      expect(large).toBe(small * 10);
    });

    it('returns 0 for zero quantity or distance', () => {
      expect(engine.estimateTransportCost(8, 150, 0)).toBe(0);
      expect(engine.estimateTransportCost(8, 0, 5000)).toBe(0);
    });
  });

  describe('rank', () => {
    const origin = { latitude: 7.6661, longitude: 36.8344, label: 'Farmer' };

    const makeMarket = (partial: Partial<any> = {}): any => ({
      marketId: 1,
      marketName: 'Market',
      marketNameOm: 'Gabaa',
      city: 'City',
      latitude: 0,
      longitude: 0,
      pricePerKg: 10,
      grade: 'Grade A',
      priceDate: new Date(),
      ...partial,
    });

    // The canonical scenario from the spec:
    const specScenario = (): EngineInput => ({
      origin,
      quantityKg: 5000,
      transportRatePerKmPerTon: 8,
      fixedRouteFees: {},
      markets: [
        makeMarket({
          marketId: 1,
          marketName: 'Jimma',
          city: 'Jimma',
          latitude: 7.6661,
          longitude: 36.8344,
          pricePerKg: 25,
        }),
        makeMarket({
          marketId: 2,
          marketName: 'Nekemte',
          city: 'Nekemte',
          latitude: 9.0785,
          longitude: 36.5497,
          pricePerKg: 28,
        }),
        makeMarket({
          marketId: 3,
          marketName: 'Mekele',
          city: 'Mekele',
          latitude: 13.4964,
          longitude: 39.4753,
          pricePerKg: 32,
        }),
      ],
    });

    it('does NOT always recommend the highest raw price', () => {
      const result = engine.rank(specScenario());
      // Mekele has the highest price (32) but, because it is ~700 km away,
      // the transport cost makes Nekemte the better choice.
      expect(result[0].option.marketName).toBe('Nekemte');
      expect(result[0].option.netRevenue).toBeCloseTo(133600, -2);
    });

    it('approximates the spec numbers (Nekemte ~128k)', () => {
      const result = engine.rank(specScenario());
      const nek = result.find((r) => r.option.marketName === 'Nekemte');
      // Allow tolerance because haversine distance is approximate.
      expect(nek!.option.netRevenue!).toBeGreaterThan(110000);
      expect(nek!.option.netRevenue!).toBeLessThan(140000);
      expect(nek!.option.grossRevenue).toBe(140000);
    });

    it('ranks by net revenue, not raw price', () => {
      const result = engine.rank(specScenario());
      const nets = result.map((r) => r.option.netRevenue);
      const sorted = [...nets].sort((a, b) => (b as number) - (a as number));
      expect(nets).toEqual(sorted);
    });

    it('higher transport costs change the ranking', () => {
      const input = specScenario();
      // Very high transport rate: the distant market becomes unattractive.
      input.transportRatePerKmPerTon = 40;
      const result = engine.rank(input);
      const jimma = result.find((r) => r.option.marketName === 'Jimma')!;
      const mekele = result.find((r) => r.option.marketName === 'Mekele')!;
      expect(jimma.ranking).toBeLessThan(mekele.ranking);
    });

    it('larger quantities change transport economics', () => {
      const input = specScenario();
      input.quantityKg = 10000;
      const result = engine.rank(input);
      // With 10 tons, Nekemte stays #1 with bigger absolute values.
      expect(result[0].option.marketName).toBe('Nekemte');
      const jimma = result.find((r) => r.option.marketName === 'Jimma')!;
      expect(jimma.option.transportCost!).toBeCloseTo(
        engine.estimateTransportCost(8, jimma.option.distanceKm!, 10000),
        0,
      );
    });

    it('skips markets with no price data', () => {
      const input = specScenario();
      input.markets.push(makeMarket({ marketId: 99, marketName: 'NoData', pricePerKg: null }));
      const result = engine.rank(input);
      expect(result.find((r) => r.option.marketName === 'NoData')).toBeUndefined();
    });

    it('handles missing transport rate by showing markets without net revenue', () => {
      const input = specScenario();
      input.transportRatePerKmPerTon = 0;
      const result = engine.rank(input);
      expect(result.length).toBe(3);
      for (const r of result) {
        expect(r.option.transportCost).toBeNull();
        expect(r.option.netRevenue).toBeNull();
      }
    });

    it('includes route fees in net revenue', () => {
      const input = specScenario();
      input.fixedRouteFees = { 2: 2000 };
      const result = engine.rank(input);
      const nek = result.find((r) => r.option.marketName === 'Nekemte')!;
      expect(nek.option.transitFees).toBe(2000);
      expect(nek.option.netRevenue).toBe(nek.option.grossRevenue! - nek.option.transportCost! - 2000);
    });

    it('returns empty for no markets', () => {
      const result = engine.rank({ ...specScenario(), markets: [] });
      expect(result).toEqual([]);
    });
  });
});