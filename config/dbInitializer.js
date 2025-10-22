const mongoose = require("mongoose");
const Service = require("../Models/Service.model");

const initialServices = [
  { serviceName: "Truck Driver (Long-Haul)", serviceCode: 73300, price: { min: 55000, max: 90000 }, category: "Nationwide" },
  { serviceName: "Electrician (Construction/Indust.)", serviceCode: 72200, price: { min: 30, max: 50 }, category: "ON, AB, BC, QC" },
  { serviceName: "Plumber", serviceCode: 72300, price: { min: 28, max: 45 }, category: "ON, BC, QC, Atlantic Canada" },
  { serviceName: "HVAC Technician", serviceCode: 72402, price: { min: 30, max: 50 }, category: "ON, AB, QC, BC" },
  { serviceName: "Welder", serviceCode: 72106, price: { min: 25, max: 44 }, category: "AB, SK, MB, BC" },
  { serviceName: "Heavy Equipment Operator", serviceCode: 73400, price: { min: 28, max: 48 }, category: "AB, ON, BC" },
  { serviceName: "Carpenter", serviceCode: 72310, price: { min: 25, max: 40 }, category: "BC, ON, QC" },
  { serviceName: "Millwright / Industrial Mechanic", serviceCode: 72400, price: { min: 30, max: 48 }, category: "ON, QC, MB" },
  { serviceName: "CNC Machine Operator", serviceCode: 73401, price: { min: 24, max: 38 }, category: "ON, QC" },
  { serviceName: "Maintenance Technician", serviceCode: 73201, price: { min: 22, max: 35 }, category: "Urban Areas" },
  { serviceName: "Sheet Metal Worker", serviceCode: 72102, price: { min: 26, max: 42 }, category: "ON, AB, QC" },
  { serviceName: "Roofing Installer", serviceCode: 73110, price: { min: 22, max: 38 }, category: "ON, BC, MB" },
  { serviceName: "Line Installer (Power/Telecom)", serviceCode: 72203, price: { min: 35, max: 55 }, category: "Nationwide" },
  { serviceName: "Water/Wastewater Technician", serviceCode: 73403, price: { min: 28, max: 45 }, category: "Urban & Rural Areas" },
  { serviceName: "Forklift Operator", serviceCode: 75101, price: { min: 20, max: 30 }, category: "Warehouses Nationwide" },
  { serviceName: "Warehouse Worker / Picker-Packer", serviceCode: 75101, price: { min: 17, max: 24 }, category: "Urban Distribution Hubs" },
  { serviceName: "Sanitation / Waste Management Worker", serviceCode: 73401, price: { min: 22, max: 35 }, category: "Municipalities" },
  { serviceName: "Construction Labourer", serviceCode: 75110, price: { min: 20, max: 30 }, category: "ON, AB, BC" },
  { serviceName: "Automotive Service Technician", serviceCode: 72410, price: { min: 25, max: 45 }, category: "Urban & Rural Areas" },
  { serviceName: "Painter / Drywaller", serviceCode: 73112, price: { min: 22, max: 35 }, category: "Residential & Commercial Builds" },
  { serviceName: "Boilermaker", serviceCode: 72105, price: { min: 30, max: 55 }, category: "Industrial provinces" },
  { serviceName: "Glazier", serviceCode: 73111, price: { min: 22, max: 40 }, category: "Urban construction zones" },
  { serviceName: "Insulation Installer", serviceCode: 73101, price: { min: 20, max: 35 }, category: "ON, QC, AB" },
  { serviceName: "Fence Installer", serviceCode: 73400, price: { min: 20, max: 30 }, category: "Suburban and rural areas" },
  { serviceName: "Agricultural Equipment Technician", serviceCode: 72400, price: { min: 25, max: 40 }, category: "MB, SK, AB" },
  { serviceName: "Driller / Blaster", serviceCode: 73402, price: { min: 28, max: 50 }, category: "Mining and construction zones" },
  { serviceName: "Oil and Gas Field Technician", serviceCode: 73403, price: { min: 30, max: 55 }, category: "AB, BC" },
  { serviceName: "Logging Machinery Operator", serviceCode: 73400, price: { min: 25, max: 42 }, category: "BC, Northern regions" },
  { serviceName: "Railroad Track Worker", serviceCode: 73400, price: { min: 23, max: 38 }, category: "Nationwide" },
  { serviceName: "Scaffolder", serviceCode: 73400, price: { min: 25, max: 38 }, category: "Construction-heavy provinces" },
  { serviceName: "Dockworker", serviceCode: 75101, price: { min: 20, max: 28 }, category: "Port cities" },
  { serviceName: "Recycling Plant Operator", serviceCode: 73401, price: { min: 20, max: 32 }, category: "Urban regions" },
  { serviceName: "Tire Technician", serviceCode: 72410, price: { min: 20, max: 30 }, category: "Service garages" },
  { serviceName: "Powerline Technician Apprentice", serviceCode: 72203, price: { min: 30, max: 50 }, category: "Nationwide" },
  { serviceName: "Asphalt Worker", serviceCode: 75110, price: { min: 22, max: 34 }, category: "Summer roadwork projects" },
  { serviceName: "Pest Control Technician", serviceCode: 73401, price: { min: 22, max: 35 }, category: "Urban centers" },
  { serviceName: "Grounds Maintenance Worker", serviceCode: 73401, price: { min: 18, max: 28 }, category: "Nationwide" },
  { serviceName: "Pool Maintenance Worker", serviceCode: 73401, price: { min: 18, max: 30 }, category: "Residential suburbs" },
  { serviceName: "Landscape Technician", serviceCode: 73401, price: { min: 20, max: 35 }, category: "Urban & rural" },
  { serviceName: "Janitor / Cleaner", serviceCode: 65310, price: { min: 17, max: 25 }, category: "Schools, offices, hospitals" },
  { serviceName: "Dry Cleaning Machine Operator", serviceCode: 73401, price: { min: 18, max: 25 }, category: "Urban centers" },
  { serviceName: "Textile Machine Operator", serviceCode: 73401, price: { min: 18, max: 28 }, category: "QC, ON" },
  { serviceName: "Meat Cutter / Butcher", serviceCode: 63201, price: { min: 20, max: 34 }, category: "Grocery & meat plants" },
  { serviceName: "Bakery Plant Worker", serviceCode: 73401, price: { min: 18, max: 26 }, category: "Food manufacturing" },
  { serviceName: "Dairy Processing Operator", serviceCode: 73401, price: { min: 20, max: 30 }, category: "Rural & food plants" },
  { serviceName: "Fish Plant Worker", serviceCode: 75109, price: { min: 18, max: 28 }, category: "Atlantic Canada" },
  { serviceName: "Brewery Production Operator", serviceCode: 73401, price: { min: 20, max: 32 }, category: "ON, QC" },
  { serviceName: "Food Packaging Worker", serviceCode: 75109, price: { min: 18, max: 26 }, category: "ON, QC, MB" },
  { serviceName: "Foundry Worker", serviceCode: 73401, price: { min: 22, max: 36 }, category: "Manufacturing areas" },
  { serviceName: "Fabric Cutter", serviceCode: 73401, price: { min: 18, max: 30 }, category: "QC, garment industries" },
];


async function initializeServices() {
  try {
    const count = await Service.countDocuments();
    if (count === 0) {
      await Service.insertMany(initialServices.map(service => ({
        ...service,
        professionalId: new mongoose.Types.ObjectId() // temp ID just for insert
      })));
      console.log("✅ Service data initialized successfully");
    } else {
      console.log("ℹ️ Service data already exists, skipping initialization");
    }
  } catch (err) {
    console.error("❌ Error initializing services:", err);
    throw err; // Re-throw to handle in the calling function
  }
}

module.exports = initializeServices;