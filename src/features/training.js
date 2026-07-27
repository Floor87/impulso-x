const ROUTINE_CATEGORIES = [
  {
    id: "lower",
    label: "Tren inferior",
    muscles: ["Piernas", "Gluteos"],
    keywords: [
      "pierna",
      "glute",
      "sentadilla",
      "hip thrust",
      "peso muerto",
      "zancada",
      "estocada",
      "gemelo",
    ],
  },
  {
    id: "upper",
    label: "Tren superior",
    muscles: ["Espalda", "Pecho", "Brazos"],
    keywords: [
      "torso",
      "superior",
      "pecho",
      "espalda",
      "hombro",
      "biceps",
      "triceps",
      "press",
      "remo",
      "flexion",
    ],
  },
  {
    id: "cardio",
    label: "Cardio",
    muscles: ["Corazon", "Cuerpo completo"],
    keywords: [
      "cardio",
      "correr",
      "trotar",
      "cinta",
      "bicicleta",
      "bici",
      "burpee",
      "salto",
      "cuerda",
    ],
  },
  {
    id: "mobility",
    label: "Movilidad",
    muscles: ["Movilidad", "Control corporal"],
    keywords: ["movilidad", "estirar", "estiramiento", "elongar", "elongacion", "yoga", "pilates"],
  },
];

const EXERCISE_GUIDES = [
  {
    keywords: ["sentadilla"],
    muscle: "Piernas y gluteos",
    tip: "Manten el pecho firme y lleva las rodillas en la direccion de los pies.",
  },
  {
    keywords: ["hip thrust", "puente de glute"],
    muscle: "Gluteos",
    tip: "Empuja desde los talones y termina contrayendo los gluteos, sin arquear la espalda.",
  },
  {
    keywords: ["peso muerto"],
    muscle: "Cadena posterior",
    tip: "Conserva la espalda neutra y lleva la cadera hacia atras durante el descenso.",
  },
  {
    keywords: ["zancada", "estocada"],
    muscle: "Piernas y equilibrio",
    tip: "Usa un paso estable y alinea la rodilla delantera con el pie.",
  },
  {
    keywords: ["press"],
    muscle: "Pecho y hombros",
    tip: "Controla las costillas y evita ganar impulso con la espalda.",
  },
  {
    keywords: ["remo"],
    muscle: "Espalda",
    tip: "Lleva los codos hacia atras sin encoger los hombros.",
  },
  {
    keywords: ["flexion"],
    muscle: "Pecho y triceps",
    tip: "Manten el cuerpo en linea y acerca el pecho al suelo de forma controlada.",
  },
  {
    keywords: ["plancha"],
    muscle: "Zona media",
    tip: "Activa abdomen y gluteos para evitar que la cadera se hunda.",
  },
  {
    keywords: ["abdominal", "crunch"],
    muscle: "Zona media",
    tip: "Exhala al acercar las costillas a la pelvis y evita tirar del cuello.",
  },
  {
    keywords: ["correr", "trotar", "cinta"],
    muscle: "Cardio y piernas",
    tip: "Busca pasos suaves y un ritmo que puedas sostener con buena postura.",
  },
  {
    keywords: ["burpee"],
    muscle: "Cuerpo completo",
    tip: "Prioriza una secuencia controlada antes de aumentar la velocidad.",
  },
  {
    keywords: ["estirar", "estiramiento", "elongar", "movilidad", "yoga"],
    muscle: "Movilidad",
    tip: "Respira lento, evita los rebotes y trabaja dentro de un rango comodo.",
  },
];

export function upsertRoutine(state, routine) {
  const exists = state.routines.some((item) => item.id === routine.id);
  state.routines = exists
    ? state.routines.map((item) => (item.id === routine.id ? routine : item))
    : [...state.routines, routine];
}

export function removeRoutine(state, id) {
  state.routines = state.routines.filter((routine) => routine.id !== id);
}

export function toggleRoutine(day, id) {
  day.routinesDone[id] = !day.routinesDone[id];
  return day.routinesDone[id];
}

export function getRoutineGuide(routine) {
  const searchable = normalizeSearchText(`${routine?.name || ""} ${routine?.exercises || ""}`);
  const category =
    ROUTINE_CATEGORIES.map((item) => ({
      ...item,
      score: item.keywords.filter((keyword) => searchable.includes(keyword)).length,
    })).sort((first, second) => second.score - first.score)[0] || ROUTINE_CATEGORIES[1];
  const selectedCategory = category.score > 0 ? category : ROUTINE_CATEGORIES[1];
  const exercises = parseRoutineExercises(routine?.exercises);
  const muscles = [
    ...new Set([...exercises.map((exercise) => exercise.muscle), ...selectedCategory.muscles]),
  ].slice(0, 4);

  return {
    category: selectedCategory.id,
    label: selectedCategory.label,
    muscles,
    exercises,
  };
}

export function parseRoutineExercises(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 30)
    .map((line) => {
      const normalized = normalizeSearchText(line);
      const guide = EXERCISE_GUIDES.find((item) =>
        item.keywords.some((keyword) => normalized.includes(keyword)),
      );
      return {
        name: line,
        muscle: guide?.muscle || "Movimiento general",
        tip:
          guide?.tip ||
          "Usa una carga que puedas controlar y detente si el movimiento produce dolor.",
      };
    });
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
