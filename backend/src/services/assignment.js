const { Team, Vehicle } = require("../models");

async function suggestAssignment(report) {
  const label = report?.ml_results?.classification?.[0]?.label || "garbage_dump";
  const volumeBin = report?.ml_results?.volume_bin || "medium";
  const requiredCapacity = { small: 1.0, medium: 2.0, large: 4.0, very_large: 6.0 }[volumeBin] || 2.0;

  const [teams, vehicles] = await Promise.all([
    Team.find({ available: true }).lean(),
    Vehicle.find({ available: true }).lean(),
  ]);

  const assignedVehicle = vehicles.find((vehicle) => vehicle.capacity_m3 >= requiredCapacity) || vehicles[0] || null;
  const team = teams.find((candidate) => candidate.capabilities?.includes(label)) || teams[0] || null;

  return {
    team_id: team?.team_id || null,
    vehicle_id: assignedVehicle?.vehicle_id || null,
    vehicle_type: assignedVehicle?.type || null,
    scheduled_time: null,
    note: `Suggested dispatch for ${label} with ${volumeBin} volume.`,
  };
}

module.exports = { suggestAssignment };
