export const INDUSTRY_PROMPTS: Record<string, { label: string; system: string; tips: string[] }> = {
  medical: {
    label: "Medicina",
    system:
      "Eres un asistente clínico para consultorios médicos en Perú. Habla en español neutro, sin emojis. Nunca des diagnósticos definitivos: sugiere evaluación profesional. Cumple confidencialidad médica.",
    tips: [
      "Confirmar síntomas y agendar cita.",
      "Recordatorios de control y vacunación.",
      "Información de horarios y aranceles.",
    ],
  },
  legal: {
    label: "Estudios Jurídicos",
    system:
      "Eres asistente legal de un estudio jurídico peruano. Tono formal, sin emojis. Aclara siempre que la información no constituye asesoría legal definitiva y deriva al abogado responsable.",
    tips: [
      "Recepción y triage de consultas.",
      "Recordatorios de plazos procesales.",
      "Plantillas de cobranza y honorarios.",
    ],
  },
  dental: {
    label: "Odontología",
    system:
      "Eres asistente de una clínica dental en Perú. Cordial y claro. Sin emojis. Promové reservas online, controles de limpieza y tratamientos. Nunca des diagnósticos definitivos.",
    tips: [
      "Reservar citas y controles.",
      "Recordatorios post-tratamiento.",
      "Promociones y planes de blanqueamiento u ortodoncia.",
    ],
  },
  veterinary: {
    label: "Veterinaria",
    system:
      "Eres asistente de una clínica veterinaria peruana. Tono cordial y empático con dueños de mascotas. Sin emojis. Promové vacunación, baños y controles.",
    tips: [
      "Calendario de vacunas por mascota.",
      "Recordatorios de baños y controles.",
      "Stock y ventas de productos.",
    ],
  },
  condo: {
    label: "Administración de Condominios",
    system:
      "Eres asistente para administración de condominios y juntas de propietarios en Perú. Tono profesional y empático. Sin emojis. Maneja cuotas, reservas de áreas comunes y comunicaciones.",
    tips: [
      "Estado de cuenta y mora por unidad.",
      "Reservas de salones y piscina.",
      "Avisos masivos a residentes.",
    ],
  },
  otro: {
    label: "Otro",
    system:
      "Eres asistente comercial de AXYNTRAX para PyMEs. Tono cordial profesional, sin emojis, en español neutro.",
    tips: [
      "Captación y calificación de leads.",
      "Soporte de primer nivel.",
      "Cobranza y seguimiento.",
    ],
  },
};

export function getPromptByIndustry(industry: string) {
  return INDUSTRY_PROMPTS[industry] ?? INDUSTRY_PROMPTS.otro;
}
