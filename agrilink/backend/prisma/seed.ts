import { PrismaClient, Role, PriceSource, VerificationStatus, TransactionStatus, ShipmentStatus, TransportRequestStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AgriLink database with demo data...');
  console.log('⚠️  NOTE: All seeded price data is DEMO data, not verified real-world market data.\n');

  await seedAdmin();
  await seedCrops();
  await seedMarkets();
  await seedTransportRates();
  await seedUsers();
  await seedPrices();
  await seedDemands();
  await seedTransportAndTransactions();
  await seedRouteFees();

  console.log('\n✅ Seed complete. Demo accounts:');
  console.log('   Admin:      0911000001 / admin123');
  console.log('   Farmer:     0922000001 / farmer123');
  console.log('   Buyer:      0933000001 / buyer123');
  console.log('   Transporter: 0944000001 / truck123');
}

async function seedAdmin() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { phone: '0911000001' },
    update: {},
    create: {
      phone: '0911000001',
      passwordHash: hash,
      role: Role.ADMIN,
      preferredLanguage: 'OM',
    },
  });
}

async function seedCrops() {
  const crops = [
    { name: 'Maize', nameOm: 'Boqqolloo', category: 'Grain' },
    { name: 'Teff', nameOm: 'Xaafii', category: 'Grain' },
    { name: 'Wheat', nameOm: 'Qamadii', category: 'Grain' },
    { name: 'Potato', nameOm: 'Dinnicha', category: 'Tuber' },
    { name: 'Coffee', nameOm: 'Buna', category: 'Cash Crop' },
    { name: 'Tomato', nameOm: 'Timaatimii', category: 'Vegetable' },
    { name: 'Carrot', nameOm: 'Kaarootii', category: 'Vegetable' },
  ];
  for (const c of crops) {
    const existing = await prisma.crop.findFirst({ where: { name: c.name } });
    if (!existing) {
      await prisma.crop.create({ data: c });
    }
  }
}

async function seedMarkets() {
  const markets = [
    { name: 'Jimma Market', nameOm: 'Gabaa Jimmaa', city: 'Jimma', woreda: 'Jimma Town', latitude: 7.6661, longitude: 36.8344, type: 'ASSEMBLY' },
    { name: 'Agaro Market', nameOm: 'Gabaa Agaaroo', city: 'Agaro', woreda: 'Agaro', latitude: 7.8491, longitude: 36.5925, type: 'PRIMARY' },
    { name: 'Nekemte Market', nameOm: 'Gabaa Naqamtee', city: 'Nekemte', woreda: 'Nekemte Town', latitude: 9.0785, longitude: 36.5497, type: 'WHOLESALE' },
    { name: 'Addis Ababa (Merkato)', nameOm: 'Adaamaa Magaalaa (Maarkatoo)', city: 'Addis Ababa', woreda: 'Addis Ketema', latitude: 9.0244, longitude: 38.7469, type: 'WHOLESALE' },
    { name: 'Mana Market', nameOm: 'Gabaa Manna', city: 'Mana', woreda: 'Mana', latitude: 7.5872, longitude: 36.8209, type: 'PRIMARY' },
    { name: 'Sekoru Market', nameOm: 'Gabaa Sikaaroo', city: 'Sekoru', woreda: 'Sekoru', latitude: 7.7078, longitude: 37.0459, type: 'PRIMARY' },
  ];
  for (const m of markets) {
    const existing = await prisma.market.findFirst({ where: { name: m.name } });
    if (!existing) {
      await prisma.market.create({ data: m as any });
    }
  }
}

async function seedTransportRates() {
  const rates = [
    { routeType: 'general', vehicleType: 'truck-5ton', ratePerKmPerTon: 8 },
    { routeType: 'general', vehicleType: 'truck-10ton', ratePerKmPerTon: 7 },
    { routeType: 'general', vehicleType: 'isuzu', ratePerKmPerTon: 9 },
  ];
  for (const r of rates) {
    const existing = await prisma.transportRate.findFirst({
      where: { routeType: r.routeType, vehicleType: r.vehicleType },
    });
    if (!existing) {
      await prisma.transportRate.create({ data: r });
    }
  }
}

async function seedUsers() {
  const password = async (p: string) => bcrypt.hash(p, 10);

  // Farmer 1 - with farms in Jimma
  const f1 = await prisma.user.upsert({
    where: { phone: '0922000001' },
    update: {},
    create: {
      phone: '0922000001',
      passwordHash: await password('farmer123'),
      role: Role.FARMER,
      farmerProfile: {
        create: {
          name: 'Tolessa Gammadaa',
          phone: '0922000001',
          location: 'Mana, Jimma Zone',
          latitude: 7.5872,
          longitude: 36.8209,
          cooperative: 'Mana Farmers Cooperative',
          woreda: 'Mana',
          kebele: 'Mana 01',
          farms: {
            create: [
              {
                name: 'Tolessa Farm 1',
                latitude: 7.5872,
                longitude: 36.8209,
                landSize: 3.5,
                woreda: 'Mana',
                kebele: 'Mana 01',
              },
              {
                name: 'Tolessa Farm 2',
                latitude: 7.5932,
                longitude: 36.8344,
                landSize: 2.0,
                woreda: 'Mana',
                kebele: 'Mana 02',
              },
            ],
          },
        },
      },
    },
    include: { farmerProfile: { include: { farms: true } } },
  });

  // Farmer 2
  await prisma.user.upsert({
    where: { phone: '0922000002' },
    update: {},
    create: {
      phone: '0922000002',
      passwordHash: await password('farmer123'),
      role: Role.FARMER,
      farmerProfile: {
        create: {
          name: 'Alemitu Birruu',
          phone: '0922000002',
          location: 'Sekoru, Jimma Zone',
          latitude: 7.7078,
          longitude: 37.0459,
          cooperative: 'Sekoru Cooperative',
          woreda: 'Sekoru',
          kebele: 'Sekoru 03',
          farms: {
            create: [
              {
                name: 'Alemitu Farm',
                latitude: 7.7078,
                longitude: 37.0459,
                landSize: 2.5,
                woreda: 'Sekoru',
                kebele: 'Sekoru 03',
              },
            ],
          },
        },
      },
    },
  });

  // Buyer 1
  const b1 = await prisma.user.upsert({
    where: { phone: '0933000001' },
    update: {},
    create: {
      phone: '0933000001',
      passwordHash: await password('buyer123'),
      role: Role.BUYER,
      buyerProfile: {
        create: {
          businessName: 'Jimma Agro Traders',
          contactPerson: 'Yonas Tafese',
          phone: '0933000001',
          location: 'Jimma Town',
          latitude: 7.6661,
          longitude: 36.8344,
          serviceArea: 'Jimma Zone',
          verificationStatus: VerificationStatus.VERIFIED,
          status: 'BUYING_NOW',
        },
      },
    },
  });

  // Buyer 2 - collector
  await prisma.user.upsert({
    where: { phone: '0933000002' },
    update: {},
    create: {
      phone: '0933000002',
      passwordHash: await password('buyer123'),
      role: Role.BUYER,
      buyerProfile: {
        create: {
          businessName: 'Nekemte Grain Collector',
          contactPerson: 'Fekadu Worku',
          phone: '0933000002',
          location: 'Nekemte',
          latitude: 9.0785,
          longitude: 36.5497,
          serviceArea: 'East Wollega & Jimma',
          isCollector: true,
          fee: 0.5,
          verificationStatus: VerificationStatus.PENDING,
          status: 'ACTIVE',
        },
      },
    },
  });

  // Transporter 1
  await prisma.user.upsert({
    where: { phone: '0944000001' },
    update: {},
    create: {
      phone: '0944000001',
      passwordHash: await password('truck123'),
      role: Role.TRANSPORTER,
      transporterProfile: {
        create: {
          name: 'Gammadaa Transport PLC',
          phone: '0944000001',
          serviceArea: 'Jimma, Nekemte, Addis Ababa',
          latitude: 7.6661,
          longitude: 36.8344,
          vehicles: {
            create: [
              { type: 'Isuzu Truck', plateNumber: '3-B-12345', capacityKg: 8000 },
              { type: 'Dump Truck 10T', plateNumber: '3-C-67890', capacityKg: 10000 },
            ],
          },
        },
      },
    },
  });

  // Transporter 2
  await prisma.user.upsert({
    where: { phone: '0944000002' },
    update: {},
    create: {
      phone: '0944000002',
      passwordHash: await password('truck123'),
      role: Role.TRANSPORTER,
      transporterProfile: {
        create: {
          name: 'Loko Trucking',
          phone: '0944000002',
          serviceArea: 'Jimma Zone',
          latitude: 7.64,
          longitude: 36.8,
          vehicles: {
            create: [
              { type: 'Pickup', plateNumber: '3-A-45678', capacityKg: 1500 },
            ],
          },
        },
      },
    },
  });
}

async function seedPrices() {
  const crops = await prisma.crop.findMany();
  const markets = await prisma.market.findMany();
  const cropByName = new Map(crops.map((c) => [c.name, c.id]));
  const marketByName = new Map(markets.map((m) => [m.name, m.id]));

  // Base prices per crop per market (ETB/kg) - DEMO DATA
  const priceData: Record<string, Record<string, number>> = {
    'Jimma Market': { Maize: 32, Teff: 62, Wheat: 45, Potato: 25, Coffee: 210, Tomato: 18, Carrot: 22 },
    'Agaro Market': { Maize: 30, Teff: 60, Wheat: 42, Potato: 22, Coffee: 200, Tomato: 16, Carrot: 20 },
    'Nekemte Market': { Maize: 36, Teff: 68, Wheat: 50, Potato: 28, Coffee: 230, Tomato: 22, Carrot: 26 },
    'Addis Ababa (Merkato)': { Maize: 40, Teff: 78, Wheat: 56, Potato: 32, Coffee: 260, Tomato: 26, Carrot: 30 },
    'Mana Market': { Maize: 28, Teff: 55, Wheat: 40, Potato: 20, Coffee: 190, Tomato: 15, Carrot: 18 },
  };

  const now = new Date();
  for (const [marketName, prices] of Object.entries(priceData)) {
    const marketId = marketByName.get(marketName);
    if (!marketId) continue;
    for (const [cropName, price] of Object.entries(prices)) {
      const cropId = cropByName.get(cropName);
      if (!cropId) continue;
      // Multiple observations over the past ~14 days for trends.
      for (let day = 0; day < 4; day++) {
        const obsDate = new Date(now);
        obsDate.setDate(obsDate.getDate() - day * 4);
        const jitter = 1 + ((day * 7) % 5) / 100;
        await prisma.priceObservation.create({
          data: {
            cropId,
            marketId,
            grade: 'Grade A',
            pricePerKg: Math.round(price * jitter * 100) / 100,
            currency: 'ETB',
            observationDate: obsDate,
            source: PriceSource.SEED_DEMO,
            sourceDetail: 'Demo seed data - not market-verified',
            verificationStatus: 'PENDING',
          },
        });
      }
    }
  }
}

async function seedDemands() {
  const crops = await prisma.crop.findMany();
  const buyers = await prisma.buyerProfile.findMany({ take: 2 });
  const cropByName = new Map(crops.map((c) => [c.name, c.id]));
  if (buyers.length < 2) return;

  await prisma.buyerDemand.create({
    data: {
      buyerId: buyers[0].id,
      cropId: cropByName.get('Potato')!,
      grade: 'Grade A',
      quantity: 5000,
      offeredPrice: 27,
      location: 'Jimma Town',
      status: 'OPEN',
    },
  });
  await prisma.buyerDemand.create({
    data: {
      buyerId: buyers[0].id,
      cropId: cropByName.get('Maize')!,
      grade: 'Grade A',
      quantity: 10000,
      offeredPrice: 35,
      location: 'Jimma Town',
      status: 'OPEN',
    },
  });
  await prisma.buyerDemand.create({
    data: {
      buyerId: buyers[1].id,
      cropId: cropByName.get('Potato')!,
      grade: 'Grade B',
      quantity: 15000,
      offeredPrice: 26,
      location: 'Nekemte',
      status: 'OPEN',
    },
  });
  await prisma.buyerDemand.create({
    data: {
      buyerId: buyers[1].id,
      cropId: cropByName.get('Maize')!,
      quantity: 20000,
      offeredPrice: 34,
      location: 'Nekemte',
      status: 'OPEN',
    },
  });
}

async function seedTransportAndTransactions() {
  const farmers = await prisma.farmerProfile.findMany({ take: 2 });
  const buyers = await prisma.buyerProfile.findMany({ take: 2 });
  const transporters = await prisma.transporterProfile.findMany({ take: 1 });
  const crops = await prisma.crop.findMany();
  const potato = crops.find((c) => c.name === 'Potato');
  const maize = crops.find((c) => c.name === 'Maize');

  if (!farmers[0] || !potato) return;

  const req1 = await prisma.transportRequest.create({
    data: {
      farmerId: farmers[0].id,
      pickupLat: farmers[0].latitude || 7.5872,
      pickupLng: farmers[0].longitude || 36.8209,
      pickupLabel: 'Farmer in Mana',
      destLat: 9.0785,
      destLng: 36.5497,
      destLabel: 'Nekemte Market',
      cropId: potato.id,
      quantity: 5000,
      preferredDate: new Date(nowPlusDays(3)),
      vehicleType: 'Isuzu Truck',
      estimatedPrice: 6000,
      distanceKm: 150,
      status: TransportRequestStatus.ACCEPTED,
      transporterId: transporters[0]?.id,
      shipment: {
        create: {
          status: ShipmentStatus.IN_TRANSIT,
          trackingRef: 'AGSEED001',
        },
      },
    },
    include: { shipment: true },
  });

  if (buyers[0] && req1.shipment) {
    await prisma.transaction.create({
      data: {
        farmerId: farmers[0].id,
        buyerId: buyers[0].id,
        cropId: potato.id,
        quantity: 5000,
        agreedPrice: 25,
        grossValue: 125000,
        transportCost: 3000,
        otherFees: 0,
        netValue: 122000,
        marketId: undefined,
        shipmentId: req1.shipment.id,
        status: TransactionStatus.IN_PROGRESS,
      },
    });
  }

  if (maize && buyers[1]) {
    await prisma.transaction.create({
      data: {
        farmerId: farmers[0]?.id,
        buyerId: buyers[1].id,
        cropId: maize.id,
        quantity: 4000,
        agreedPrice: 34,
        grossValue: 136000,
        transportCost: 6400,
        otherFees: 0,
        netValue: 129600,
        status: TransactionStatus.COMPLETED,
        completedAt: new Date(nowPlusDays(-10)),
      },
    });
  }
}

async function seedRouteFees() {
  const markets = await prisma.market.findMany();
  const byName = new Map(markets.map((m) => [m.name, m.id as number]));

  const fees = [
    { origin: 'Mana Market', dest: 'Nekemte Market', fee: 200 },
    { origin: 'Mana Market', dest: 'Addis Ababa (Merkato)', fee: 800 },
    { origin: 'Jimma Market', dest: 'Addis Ababa (Merkato)', fee: 700 },
  ];
  for (const f of fees) {
    const oid = byName.get(f.origin);
    const did = byName.get(f.dest);
    if (oid && did) {
      await prisma.routeFee.create({ data: { originMarketId: oid, destMarketId: did, fee: f.fee } });
    }
  }
}

function nowPlusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());