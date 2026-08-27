import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USERS = [
  { username: "admin", password: "Admin@123", fullName: "Alex Morgan", role: "Administrator" },
  { username: "dispatcher", password: "Dispatch@123", fullName: "Priya Nair", role: "Dispatcher" },
];

const CUSTOMERS = [
  {
    name: "Riverside Mall",
    contactEmail: "facilities@riversidemall.com",
    phone: "555-0101",
    address: "400 Riverside Dr, Springfield",
  },
  {
    name: "Northgate Hospital",
    contactEmail: "maintenance@northgatehosp.org",
    phone: "555-0102",
    address: "12 Northgate Ave, Springfield",
  },
  {
    name: "Lakeside Offices",
    contactEmail: "admin@lakesideoffices.com",
    phone: "555-0103",
    address: "88 Lakeside Blvd, Springfield",
  },
  {
    name: "Green Valley School",
    contactEmail: "ops@greenvalleyschool.edu",
    phone: "555-0104",
    address: "220 Green Valley Rd, Springfield",
  },
  {
    name: "Fresh Foods Market",
    contactEmail: "store@freshfoodsmarket.com",
    phone: "555-0105",
    address: "55 Market St, Springfield",
  },
];

const TECHNICIANS = [
  { name: "Ravi Kumar", phone: "555-0201", specialty: "HVAC" },
  { name: "Anita Sharma", phone: "555-0202", specialty: "Electrical" },
  { name: "James Cole", phone: "555-0203", specialty: "General Maintenance" },
];

function daysFromToday(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  for (const user of USERS) {
    const existing = await prisma.user.findUnique({ where: { username: user.username } });
    if (!existing) {
      await prisma.user.create({
        data: {
          username: user.username,
          passwordHash: await bcrypt.hash(user.password, 10),
          fullName: user.fullName,
          role: user.role,
        },
      });
    }
  }

  if ((await prisma.customer.count()) === 0) {
    await prisma.customer.createMany({ data: CUSTOMERS });
  }
  if ((await prisma.technician.count()) === 0) {
    await prisma.technician.createMany({ data: TECHNICIANS });
  }

  if ((await prisma.workOrder.count()) === 0) {
    const customers = await prisma.customer.findMany({ orderBy: { id: "asc" } });
    const technicians = await prisma.technician.findMany({ orderBy: { id: "asc" } });
    const [riverside, northgate, lakeside, greenValley, freshFoods] = customers;
    const [ravi, anita, james] = technicians;

    const WORK_ORDERS = [
      {
        title: "Replace HVAC compressor",
        description: "Unit blowing warm air, compressor likely failed",
        customerId: riverside.id,
        location: "400 Riverside Dr, Unit 3",
        technicianId: ravi.id,
        status: "In Progress",
        scheduledDate: daysFromToday(-2),
      },
      {
        title: "Quarterly generator inspection",
        description: "Routine maintenance and load test",
        customerId: northgate.id,
        location: "12 Northgate Ave",
        technicianId: anita.id,
        status: "Assigned",
        scheduledDate: daysFromToday(5),
      },
      {
        title: "Fix leaking rooftop pipe",
        description: "Water stain spreading on 3rd floor ceiling",
        customerId: lakeside.id,
        location: "88 Lakeside Blvd, Floor 3",
        technicianId: null,
        status: "New",
        scheduledDate: daysFromToday(1),
      },
      {
        title: "Install new electrical panel",
        description: "Upgrade from 100A to 200A service",
        customerId: greenValley.id,
        location: "220 Green Valley Rd",
        technicianId: james.id,
        status: "Done",
        scheduledDate: daysFromToday(-10),
      },
      {
        title: "Repair walk-in freezer",
        description: "Freezer not maintaining temperature",
        customerId: freshFoods.id,
        location: "55 Market St",
        technicianId: ravi.id,
        status: "Done",
        scheduledDate: daysFromToday(-15),
      },
      {
        title: "Diagnose intermittent power outage",
        description: "Circuit trips randomly, cause unknown",
        customerId: riverside.id,
        location: "400 Riverside Dr, Parking Structure",
        technicianId: null,
        status: "New",
        scheduledDate: daysFromToday(3),
      },
      {
        title: "Annual fire sprinkler inspection",
        description: "Regulatory compliance check",
        customerId: northgate.id,
        location: "12 Northgate Ave, All Floors",
        technicianId: anita.id,
        status: "Assigned",
        scheduledDate: daysFromToday(7),
      },
      {
        title: "Replace broken loading dock door",
        description: "Door won't close, safety issue",
        customerId: freshFoods.id,
        location: "55 Market St, Loading Dock",
        technicianId: james.id,
        status: "In Progress",
        scheduledDate: daysFromToday(-1),
      },
      {
        title: "Service rooftop AC units",
        description: "Pre-summer maintenance for 4 units",
        customerId: lakeside.id,
        location: "88 Lakeside Blvd, Rooftop",
        technicianId: null,
        status: "New",
        scheduledDate: daysFromToday(10),
      },
      {
        title: "Inspect classroom lighting",
        description: "Flickering lights reported in west wing",
        customerId: greenValley.id,
        location: "220 Green Valley Rd, West Wing",
        technicianId: ravi.id,
        status: "Assigned",
        scheduledDate: daysFromToday(2),
      },
    ];

    for (const workOrder of WORK_ORDERS) {
      await prisma.workOrder.create({ data: workOrder });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
