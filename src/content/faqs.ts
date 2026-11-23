import type { Faq } from '@/types';
import { faqId } from './ids';

/**
 * ---------------------------------------------------------------------------
 * PREGUNTAS FRECUENTES GENERALES
 * ---------------------------------------------------------------------------
 * Se administran desde /admin/faq. Las respuestas describen el funcionamiento
 * del estudio y del sitio; no contienen respuestas jurídicas concretas.
 * ---------------------------------------------------------------------------
 */

const TS = {
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

export const demoFaqs: Faq[] = [
  {
    ...TS,
    id: faqId(1),
    question: '¿Cómo solicito una consulta?',
    answer:
      'Puede completar el formulario de la página «Cuéntanos tu caso», escribirnos por WhatsApp o llamar al número publicado en Contacto. Al recibir su mensaje revisamos la información y coordinamos una fecha para conversar sobre el caso.',
    category: 'Consultas',
    sort_order: 1,
    is_active: true,
  },
  {
    ...TS,
    id: faqId(2),
    question: '¿Qué documentos debo llevar a la primera reunión?',
    answer:
      'Todo lo que tenga relación con el asunto: contratos, notificaciones, cartas, partidas, comprobantes y cualquier resolución recibida. No es necesario que el expediente esté completo ni ordenado; parte del trabajo inicial consiste precisamente en identificar qué falta.',
    category: 'Consultas',
    sort_order: 2,
    is_active: true,
  },
  {
    ...TS,
    id: faqId(3),
    question: '¿Puedo tener una consulta virtual?',
    answer:
      'Sí. Atendemos de forma presencial en la oficina y también por videollamada. Al solicitar la cita puede indicar la modalidad que prefiere; en ambos casos el tratamiento del caso es el mismo.',
    category: 'Consultas',
    sort_order: 3,
    is_active: true,
  },
  {
    ...TS,
    id: faqId(4),
    question: '¿Cómo reservo una cita?',
    answer:
      'Desde la página «Solicitar cita» puede elegir el área, el profesional, la fecha y el horario disponible. La solicitud queda registrada como pendiente y el estudio la confirma por el canal de contacto que haya indicado.',
    category: 'Citas',
    sort_order: 4,
    is_active: true,
  },
  {
    ...TS,
    id: faqId(5),
    question: '¿Qué ocurre después de enviar mi solicitud?',
    answer:
      'Recibimos la solicitud en el panel del estudio y la revisamos dentro del horario de atención. Si el horario elegido no estuviera disponible, le proponemos una alternativa antes de confirmar.',
    category: 'Citas',
    sort_order: 5,
    is_active: true,
  },
  {
    ...TS,
    id: faqId(6),
    question: '¿Qué áreas atiende el estudio?',
    answer:
      'Derecho de familia, derecho penal, derecho civil y patrimonial, y derecho empresarial. En la sección Áreas de práctica encontrará el detalle de cada servicio con su explicación y sus preguntas frecuentes.',
    category: 'Estudio',
    sort_order: 6,
    is_active: true,
  },
  {
    ...TS,
    id: faqId(7),
    question: '¿La consulta tiene costo?',
    answer:
      'Las condiciones de la consulta inicial se informan al coordinar la cita, antes de cualquier reunión. No hay cargos que no hayan sido comunicados previamente.',
    category: 'Honorarios',
    sort_order: 7,
    is_active: true,
  },
  {
    ...TS,
    id: faqId(8),
    question: '¿Cómo se determinan los honorarios?',
    answer:
      'Dependen de la complejidad del asunto, de la vía aplicable y del tiempo de dedicación previsto. Se acuerdan por escrito antes de asumir el caso, de modo que el cliente conoce el alcance y el costo desde el inicio.',
    category: 'Honorarios',
    sort_order: 8,
    is_active: true,
  },
  {
    ...TS,
    id: faqId(9),
    question: '¿La información que envío es confidencial?',
    answer:
      'Sí. La información recibida se trata con reserva profesional y se usa únicamente para evaluar y atender su consulta. El acceso está limitado al equipo del estudio.',
    category: 'Estudio',
    sort_order: 9,
    is_active: true,
  },
  {
    ...TS,
    id: faqId(10),
    question: '¿Atienden casos fuera de Lima?',
    answer:
      'La posibilidad depende del distrito judicial y de la etapa del proceso. Lo indicamos con claridad en la primera conversación, antes de asumir cualquier compromiso.',
    category: 'Estudio',
    sort_order: 10,
    is_active: true,
  },
];
