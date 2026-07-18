export function addMeal(day, meal) {
  day.meals = [...day.meals, meal];
}

export function removeMeal(day, id) {
  day.meals = day.meals.filter((meal) => meal.id !== id);
}
