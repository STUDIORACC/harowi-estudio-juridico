import { areaId, serviceFaqId, serviceId } from '../ids';
import { ORIENTATIVE_NOTE, SERVICE_TS, type DemoService } from './shared';

/**
 * ---------------------------------------------------------------------------
 * SERVICIOS — DERECHO EMPRESARIAL
 * ---------------------------------------------------------------------------
 * Contenido general y orientativo, editable desde /admin/servicios.
 * ---------------------------------------------------------------------------
 */

const AREA = areaId(4);

export const empresarialServices: DemoService[] = [
  /* ---------------------- 15. Constitución de empresas ---------------------- */
  {
    ...SERVICE_TS,
    id: serviceId(15),
    area_id: AREA,
    slug: 'constitucion-de-empresas',
    name: 'Constitución de empresas',
    short_description:
      'Constitución de sociedades y empresas individuales: elección del tipo societario, estatuto, escritura pública e inscripción registral.',
    description: [
      'Constituir una empresa es, ante todo, una decisión jurídica. El tipo societario elegido define cómo se toman las decisiones, cómo se transfieren las participaciones y hasta dónde llega la responsabilidad de cada socio. Cambiar esa estructura más adelante es posible, pero siempre más costoso que definirla bien al inicio.',
      'El estatuto es el documento que gobernará la vida de la sociedad. Un estatuto redactado como formulario genérico suele funcionar mientras hay acuerdo entre los socios y falla justamente cuando aparece el desacuerdo: quórums, mayorías, facultades de los representantes y mecanismos de salida.',
      'Acompañamos el proceso completo: elección de la forma societaria, redacción de la minuta y el estatuto, otorgamiento de la escritura pública, inscripción en SUNARP y los trámites posteriores de inicio de actividades.',
    ],
    when_needed: [
      'Va a iniciar un negocio y necesita definir su forma jurídica.',
      'Opera de manera informal y requiere formalizar la actividad.',
      'Incorpora socios y necesita reglas claras desde el inicio.',
      'Un cliente o proveedor le exige contratar con una persona jurídica.',
      'Requiere un estatuto adaptado y no un modelo estándar.',
    ],
    process: [
      {
        step: '01',
        title: 'Elección del tipo societario',
        description:
          'Evaluamos la actividad, el número de socios y los planes de crecimiento para determinar la forma jurídica más adecuada.',
      },
      {
        step: '02',
        title: 'Minuta y estatuto',
        description:
          'Redactamos el estatuto con el objeto social, el capital, los órganos, las facultades de los representantes y las reglas de decisión.',
      },
      {
        step: '03',
        title: 'Escritura pública e inscripción',
        description:
          'Coordinamos el otorgamiento ante notario y la inscripción de la sociedad en el Registro de Personas Jurídicas.',
      },
      {
        step: '04',
        title: 'Inicio de actividades',
        description:
          'Gestionamos el RUC y orientamos sobre los pasos siguientes: libros societarios, licencias y registros que correspondan al giro.',
      },
    ],
    documents: [
      'Documento de identidad de los socios o del titular.',
      'Propuesta de nombre y reserva de denominación en SUNARP.',
      'Descripción de la actividad económica y del objeto social.',
      'Domicilio fiscal y documentación que lo acredite.',
      'Detalle de los aportes de capital, en dinero o en bienes.',
    ],
    content: [
      { type: 'h2', text: 'El estatuto importa más de lo que parece' },
      {
        type: 'p',
        text: 'Quórums, mayorías, facultades de los representantes y mecanismos de transferencia de participaciones definen cómo se resuelve un desacuerdo entre socios. Es el momento más barato para acordarlos: después, cada modificación requiere junta, escritura e inscripción.',
      },
      { type: 'note', text: ORIENTATIVE_NOTE },
    ],
    image_url: null,
    sort_order: 1,
    is_active: true,
    seo_title: 'Constitución de empresas en Perú — Asesoría societaria',
    seo_description:
      'Constitución de SAC, EIRL y otras formas societarias: elección del tipo, estatuto, escritura pública, inscripción en SUNARP y obtención del RUC.',
    faqs: [
      {
        id: serviceFaqId(15, 1),
        service_id: serviceId(15),
        question: '¿Qué tipo de sociedad me conviene?',
        answer:
          'Depende del número de socios, de la actividad y de los planes de crecimiento. En la consulta comparamos las alternativas aplicables a su caso y sus consecuencias prácticas.',
        sort_order: 1,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(15, 2),
        service_id: serviceId(15),
        question: '¿Cuánto demora la constitución?',
        answer:
          'El plazo depende de la reserva de nombre, de la disponibilidad notarial y de la calificación registral. Indicamos un estimado al iniciar, sujeto a los tiempos de esas entidades.',
        sort_order: 2,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(15, 3),
        service_id: serviceId(15),
        question: '¿Puedo aportar bienes en lugar de dinero?',
        answer:
          'Sí, el aporte puede ser dinerario o no dinerario. Los aportes en bienes requieren su valorización y el cumplimiento de formalidades adicionales.',
        sort_order: 3,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(15, 4),
        service_id: serviceId(15),
        question: '¿Incluye la asesoría tributaria?',
        answer:
          'Orientamos sobre el régimen tributario aplicable al inicio de actividades. La gestión contable continua corresponde a un contador, con quien coordinamos cuando el cliente lo requiere.',
        sort_order: 4,
        created_at: SERVICE_TS.created_at,
      },
    ],
  },
];
