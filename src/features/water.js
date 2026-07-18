export function changeWater(day, amount) {
  const wasComplete = day.water >= day.plan.waterGoal;
  day.water = Math.max(0, day.water + Number(amount));
  return {
    wasComplete,
    isComplete: day.water >= day.plan.waterGoal,
  };
}

export function updateWaterGoal(state, value) {
  state.waterGoal = Math.max(250, Number(value) || 2000);
  return state.waterGoal;
}
