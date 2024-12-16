import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create subscription plans
  const plans = [
    {
      name: "FREE",
      price: 0,
      yearlyPrice: 0,
      maxProperties: 1,
      features: JSON.stringify([
        "1 property",
        "Unlimited tenants",
        "Repair request management",
        "Smart contract integration",
        "Basic analytics",
      ])
    },
    {
      name: "STANDARD",
      price: 10,
      yearlyPrice: 100,
      maxProperties: -1, // -1 means unlimited
      features: JSON.stringify([
        "Unlimited properties",
        "Unlimited tenants",
        "Repair request management",
        "Smart contract integration",
        "Advanced analytics",
        "Priority support",
        "Custom branding",
      ])
    }
  ];

  console.log('Seeding subscription plans...');

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
