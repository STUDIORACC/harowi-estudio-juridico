import type { BlogPost } from '@/types';
import { areaId, postId } from './ids';

/**
 * ---------------------------------------------------------------------------
 * BLOG — ARTÍCULOS DE DEMOSTRACIÓN
 * ---------------------------------------------------------------------------
 * Se administran desde /admin/blog. Son textos informativos de carácter
 * general: explican cómo funcionan ciertos procesos, sin dar indicaciones
 * para un caso concreto.
 * ---------------------------------------------------------------------------
 */

const TS = {
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

export const demoPosts: BlogPost[] = [
  {
    ...TS,
    id: postId(1),
    slug: 'que-documentos-llevar-a-la-primera-consulta',
    title: 'Qué documentos conviene llevar a la primera consulta con un abogado',
    excerpt:
      'La primera reunión rinde mucho más cuando se llega con la documentación a la vista. Una guía práctica de qué reunir según el tipo de asunto.',
    category: 'Orientación',
    area_id: null,
    author_id: null,
    status: 'publicado',
    published_at: '2026-02-10T09:00:00.000Z',
    reading_minutes: 5,
    cover_tone: 'ink',
    cover_image_url: null,
    seo_title: 'Qué documentos llevar a la primera consulta con un abogado',
    seo_description:
      'Guía práctica sobre la documentación que conviene reunir antes de la primera reunión con un abogado, según el tipo de asunto.',
    content: [
      {
        type: 'p',
        text: 'La primera consulta tiene un objetivo concreto: entender el problema y determinar si existe una vía para resolverlo. Cuanto más completa sea la información disponible en esa reunión, más precisa será la evaluación y menos tiempo se perderá en reconstruir hechos que ya constan por escrito.',
      },
      {
        type: 'p',
        text: 'No es necesario llegar con el expediente ordenado ni con todos los documentos. Parte del trabajo inicial consiste, justamente, en identificar qué falta y cómo obtenerlo. Pero hay un mínimo que suele marcar la diferencia.',
      },
      { type: 'h2', text: 'Lo que conviene llevar siempre' },
      {
        type: 'ul',
        items: [
          'Documento de identidad.',
          'Toda notificación, carta o resolución recibida, incluso las que parezcan menores.',
          'Contratos, acuerdos o documentos privados vinculados al asunto.',
          'Comprobantes de pago relacionados.',
          'Una línea de tiempo aproximada de los hechos, escrita con sus propias palabras.',
        ],
      },
      { type: 'h2', text: 'Según el tipo de asunto' },
      {
        type: 'h3',
        text: 'Familia',
      },
      {
        type: 'p',
        text: 'Partidas de nacimiento o de matrimonio, acuerdos previos, actas de conciliación y comprobantes de los gastos que se pretende acreditar: pensión escolar, atención médica, alquiler y servicios.',
      },
      { type: 'h3', text: 'Penal' },
      {
        type: 'p',
        text: 'La citación o disposición recibida, con su fecha de notificación. Si ya se tiene acceso a la carpeta fiscal, resulta especialmente útil llevarla, porque permite revisar la imputación antes de fijar cualquier posición.',
      },
      { type: 'h3', text: 'Civil y patrimonial' },
      {
        type: 'p',
        text: 'Partida registral del inmueble, título de propiedad, contratos, recibos de servicios y pagos del impuesto predial. En materia de posesión, la documentación acumulada año por año suele ser la prueba más sólida.',
      },
      { type: 'h2', text: 'Una recomendación sobre los plazos' },
      {
        type: 'p',
        text: 'Si recibió una notificación con plazo, indíquelo al solicitar la cita. Hay actuaciones que no admiten demora y conviene que el estudio conozca esa circunstancia antes de la reunión.',
      },
      {
        type: 'note',
        text: 'Este artículo es informativo y de carácter general. No sustituye la asesoría sobre un caso concreto.',
      },
    ],
  },
  {
    ...TS,
    id: postId(2),
    slug: 'como-se-fija-una-pension-de-alimentos',
    title: 'Cómo se fija una pensión de alimentos',
    excerpt:
      'No existe un porcentaje único. El monto se determina ponderando las necesidades acreditadas del beneficiario y las posibilidades del obligado.',
    category: 'Familia',
    area_id: areaId(1),
    author_id: null,
    status: 'publicado',
    published_at: '2026-02-24T09:00:00.000Z',
    reading_minutes: 6,
    cover_tone: 'sage',
    cover_image_url: null,
    seo_title: 'Cómo se fija una pensión de alimentos en el Perú',
    seo_description:
      'Criterios que pondera el juez al fijar una pensión de alimentos: necesidades del beneficiario, posibilidades del obligado y prueba de ambos extremos.',
    content: [
      {
        type: 'p',
        text: 'Una de las preguntas más frecuentes en materia de familia es cuánto corresponde de pensión de alimentos. La respuesta honesta es que no existe una cifra ni un porcentaje aplicable a todos los casos: el monto se fija ponderando dos elementos que deben acreditarse.',
      },
      { type: 'h2', text: 'Los dos ejes de la decisión' },
      {
        type: 'p',
        text: 'El primero son las necesidades del beneficiario: alimentación, vivienda, educación, salud, vestido y recreación. El segundo son las posibilidades económicas de quien debe pagar, considerando además sus otras cargas familiares. El juez resuelve sobre lo que se prueba, no sobre lo que se afirma.',
      },
      { type: 'h2', text: 'Cómo se acreditan las necesidades' },
      {
        type: 'ul',
        items: [
          'Boletas de pensión escolar y de matrícula.',
          'Recibos de servicios y contrato de alquiler de la vivienda.',
          'Comprobantes de atención médica, medicamentos o terapias.',
          'Gastos regulares de transporte y alimentación.',
        ],
      },
      { type: 'h2', text: 'Cómo se acreditan las posibilidades del obligado' },
      {
        type: 'p',
        text: 'Cuando existe trabajo formal, las boletas de pago simplifican el análisis. En actividades independientes o informales, la capacidad económica se acredita por otros medios y el juez valora los indicios disponibles: el nivel de vida, la actividad que desarrolla y la información que se logre incorporar al proceso.',
      },
      {
        type: 'quote',
        text: 'La falta de documentación formal de ingresos no impide que se fije una pensión; cambia la forma de probar.',
      },
      { type: 'h2', text: 'La pensión puede revisarse' },
      {
        type: 'p',
        text: 'El monto responde a una situación determinada. Si las necesidades aumentan o si las posibilidades del obligado varían de forma acreditable, cualquiera de las partes puede solicitar el aumento, la reducción o la exoneración mediante un nuevo proceso.',
      },
      {
        type: 'note',
        text: 'Artículo informativo de carácter general. Cada caso exige una evaluación particular de la prueba disponible.',
      },
    ],
  },
  {
    ...TS,
    id: postId(3),
    slug: 'que-hacer-si-recibo-una-citacion-fiscal',
    title: 'Recibí una citación fiscal: qué significa y qué hacer',
    excerpt:
      'Una citación no equivale a una acusación, pero sí abre plazos. Qué revisar antes de declarar y por qué conviene la defensa técnica desde el inicio.',
    category: 'Penal',
    area_id: areaId(2),
    author_id: null,
    status: 'publicado',
    published_at: '2026-03-12T09:00:00.000Z',
    reading_minutes: 5,
    cover_tone: 'clay',
    cover_image_url: null,
    seo_title: 'Qué hacer al recibir una citación fiscal',
    seo_description:
      'Qué significa una citación fiscal, qué derechos asisten al citado y por qué conviene revisar la carpeta antes de prestar declaración.',
    content: [
      {
        type: 'p',
        text: 'Recibir una citación del Ministerio Público o de la Policía genera alarma, y esa reacción suele llevar a dos errores opuestos: ignorarla o acudir de inmediato a declarar sin preparación. Ninguno de los dos conviene.',
      },
      { type: 'h2', text: 'Qué es y qué no es una citación' },
      {
        type: 'p',
        text: 'Una citación es la comunicación formal de que existe una indagación en curso y de que se requiere la presencia de una persona, sea en calidad de investigado, de testigo o de agraviado. No equivale a una acusación ni supone que se haya decidido nada sobre el fondo.',
      },
      { type: 'h2', text: 'Lo primero: leer la calidad en que se cita' },
      {
        type: 'p',
        text: 'El documento indica en qué calidad se convoca y, por lo general, los hechos materia de indagación. Esa información determina los derechos que asisten y el tipo de preparación que corresponde.',
      },
      { type: 'h2', text: 'Derechos que asisten al citado' },
      {
        type: 'ul',
        items: [
          'Contar con abogado defensor desde el primer momento.',
          'Conocer los hechos que se le atribuyen antes de declarar.',
          'Acceder al contenido de la carpeta, con las reservas que la ley establece.',
          'Guardar silencio, sin que ello se interprete en su contra.',
        ],
      },
      {
        type: 'quote',
        text: 'Declarar sin haber revisado la carpeta es la decisión que con más frecuencia condiciona el resto del proceso.',
      },
      { type: 'h2', text: 'Y si no puedo asistir en la fecha' },
      {
        type: 'p',
        text: 'La inasistencia sin justificación puede tener consecuencias procesales. Cuando existe un impedimento real, corresponde comunicarlo por escrito y solicitar una nueva fecha antes del día señalado.',
      },
      {
        type: 'note',
        text: 'Artículo informativo de carácter general. No sustituye la defensa técnica en un caso concreto.',
      },
    ],
  },
  {
    ...TS,
    id: postId(4),
    slug: 'regularizar-la-propiedad-de-un-inmueble',
    title: 'Regularizar la propiedad de un inmueble: vías disponibles',
    excerpt:
      'Documentos privados que nunca se formalizaron, partidas a nombre de personas fallecidas, predios sin inscribir. Qué camino corresponde en cada caso.',
    category: 'Civil',
    area_id: areaId(3),
    author_id: null,
    status: 'publicado',
    published_at: '2026-04-07T09:00:00.000Z',
    reading_minutes: 6,
    cover_tone: 'stone',
    cover_image_url: null,
    seo_title: 'Cómo regularizar la propiedad de un inmueble en el Perú',
    seo_description:
      'Prescripción adquisitiva, otorgamiento de escritura pública y saneamiento registral: qué vía corresponde según la situación del inmueble.',
    content: [
      {
        type: 'p',
        text: 'Una parte considerable de los inmuebles en el país presenta alguna irregularidad documental: una compraventa hecha por documento privado que nunca se elevó a escritura, una partida que sigue a nombre de un familiar fallecido, o un predio que simplemente nunca se inscribió.',
      },
      {
        type: 'p',
        text: 'Cada situación tiene una vía distinta, y elegir la equivocada suele significar meses perdidos. Lo primero, siempre, es el estudio de títulos.',
      },
      { type: 'h2', text: 'Compra por documento privado' },
      {
        type: 'p',
        text: 'Si el vendedor está identificado y disponible, la vía natural es el otorgamiento de escritura pública, que puede exigirse judicialmente cuando se niega a formalizar. Si el vendedor no puede ubicarse, el camino suele ser otro.',
      },
      { type: 'h2', text: 'Posesión prolongada sin título' },
      {
        type: 'p',
        text: 'La prescripción adquisitiva de dominio permite obtener el reconocimiento de la propiedad a favor de quien ha poseído el inmueble de forma continua, pacífica y pública durante el plazo legal. Es un procedimiento esencialmente probatorio: la continuidad de la posesión es lo que debe acreditarse.',
      },
      { type: 'h2', text: 'Partida a nombre de una persona fallecida' },
      {
        type: 'p',
        text: 'Aquí el paso previo suele ser la sucesión intestada o la inscripción del testamento, según corresponda. Sin ese trámite, la transferencia posterior no puede inscribirse.',
      },
      { type: 'h2', text: 'Antes de cualquier vía: el estudio de títulos' },
      {
        type: 'ul',
        items: [
          'Partida registral vigente y certificado de gravámenes.',
          'Certificado de búsqueda catastral.',
          'Antecedentes de dominio de los últimos años.',
          'Documentación de posesión: recibos, pagos del impuesto predial, constancias.',
        ],
      },
      {
        type: 'note',
        text: 'Artículo informativo de carácter general. La vía aplicable depende de la situación registral concreta del predio.',
      },
    ],
  },
  {
    ...TS,
    id: postId(5),
    slug: 'elegir-el-tipo-de-sociedad-al-constituir-una-empresa',
    title: 'Elegir el tipo de sociedad al constituir una empresa',
    excerpt:
      'La forma societaria define cómo se decide, cómo se sale y hasta dónde responde cada socio. Conviene resolverlo antes de la minuta.',
    category: 'Empresarial',
    area_id: areaId(4),
    author_id: null,
    status: 'publicado',
    published_at: '2026-05-05T09:00:00.000Z',
    reading_minutes: 5,
    cover_tone: 'sand',
    cover_image_url: null,
    seo_title: 'Qué tipo de sociedad elegir al constituir una empresa en el Perú',
    seo_description:
      'Criterios para elegir la forma societaria al constituir una empresa: número de socios, responsabilidad, órganos de decisión y transferencia de participaciones.',
    content: [
      {
        type: 'p',
        text: 'Al constituir una empresa, la elección del tipo societario suele tratarse como un trámite. En la práctica es la decisión que define cómo se toman los acuerdos, qué pasa si un socio quiere salir y hasta dónde llega la responsabilidad de cada uno.',
      },
      { type: 'h2', text: 'Las preguntas que ordenan la decisión' },
      {
        type: 'ul',
        items: [
          '¿Cuántas personas participan y con qué porcentaje?',
          '¿Se prevé el ingreso de nuevos socios o de inversión externa?',
          '¿Quién tendrá la representación y con qué facultades?',
          '¿Cómo se resolverá un desacuerdo entre socios con participaciones iguales?',
          '¿Qué actividad se desarrollará y qué exigencias tiene el giro?',
        ],
      },
      { type: 'h2', text: 'El estatuto no es un formulario' },
      {
        type: 'p',
        text: 'Los estatutos genéricos funcionan mientras hay acuerdo y fallan exactamente cuando aparece el conflicto. Quórums, mayorías, facultades de los representantes y reglas de transferencia de participaciones son cláusulas que conviene discutir al inicio, cuando todavía no hay posiciones enfrentadas.',
      },
      {
        type: 'quote',
        text: 'Modificar un estatuto después exige junta, escritura pública e inscripción. Acordarlo bien al comienzo cuesta una fracción de eso.',
      },
      { type: 'h2', text: 'Después de la inscripción' },
      {
        type: 'p',
        text: 'La constitución no termina en SUNARP: siguen la obtención del RUC, la legalización de los libros societarios y las licencias o registros que exija el giro. Conviene planificar esos pasos desde el inicio para no detener la operación.',
      },
      {
        type: 'note',
        text: 'Artículo informativo de carácter general. La forma societaria adecuada depende de las circunstancias de cada proyecto.',
      },
    ],
  },
];

export const demoPostBySlug = (slug: string) => demoPosts.find((post) => post.slug === slug);
