import { areaId, serviceFaqId, serviceId } from '../ids';
import { ORIENTATIVE_NOTE, SERVICE_TS, type DemoService } from './shared';

/**
 * ---------------------------------------------------------------------------
 * SERVICIOS — DERECHO CIVIL Y PATRIMONIAL
 * ---------------------------------------------------------------------------
 * Contenido general y orientativo, editable desde /admin/servicios.
 * ---------------------------------------------------------------------------
 */

const AREA = areaId(3);

export const civilServices: DemoService[] = [
  /* ---------------------------- 11. Remate público -------------------------- */
  {
    ...SERVICE_TS,
    id: serviceId(11),
    area_id: AREA,
    slug: 'remate-publico',
    name: 'Remate público',
    short_description:
      'Asesoría a quien participa en un remate judicial y defensa de quien ve su bien afectado por una ejecución.',
    description: [
      'El remate público es el acto por el cual un bien embargado se vende judicialmente para satisfacer una deuda. Intervienen en él dos posiciones muy distintas: quien quiere adquirir el bien y quien busca evitar o cuestionar la ejecución sobre su patrimonio.',
      'Para quien participa como postor, el trabajo es esencialmente de verificación previa: situación registral del inmueble, cargas y gravámenes inscritos, ocupación efectiva y condiciones de la convocatoria. Adjudicarse un bien sin esa revisión suele traer problemas posteriores de posesión o de saneamiento.',
      'Para quien enfrenta la ejecución, el análisis se centra en la regularidad del procedimiento, en la valorización del bien y en las vías de contradicción o de tercería que puedan corresponder según el caso.',
    ],
    when_needed: [
      'Desea participar como postor en un remate judicial y necesita verificar el bien.',
      'Se ha convocado el remate de un inmueble de su propiedad.',
      'Un bien suyo fue embargado por una deuda ajena.',
      'Se adjudicó un bien y requiere el lanzamiento o la inscripción a su nombre.',
      'Considera que la tasación del bien no refleja su valor real.',
    ],
    process: [
      {
        step: '01',
        title: 'Revisión del expediente',
        description:
          'Analizamos el proceso de ejecución, la resolución que convoca al remate y la situación registral y física del bien.',
      },
      {
        step: '02',
        title: 'Evaluación de la posición',
        description:
          'Según el interés del cliente, definimos la estrategia: participación informada en el remate o contradicción del procedimiento.',
      },
      {
        step: '03',
        title: 'Actuación en el proceso',
        description:
          'Presentamos los escritos que correspondan y acompañamos el acto de remate y las diligencias posteriores.',
      },
      {
        step: '04',
        title: 'Adjudicación o defensa',
        description:
          'Adjudicado el bien, gestionamos la transferencia y su inscripción. En la posición contraria, agotamos las vías de impugnación disponibles.',
      },
    ],
    documents: [
      'Resolución que convoca el remate o cédula de notificación recibida.',
      'Partida registral del bien y certificado de gravámenes.',
      'Informe de tasación, si está disponible en el expediente.',
      'Documentación que acredite la propiedad o el derecho invocado.',
      'Copia del expediente judicial de ejecución.',
    ],
    content: [
      { type: 'h2', text: 'Verificar antes de postular' },
      {
        type: 'p',
        text: 'Antes de participar en un remate conviene revisar la partida registral, las cargas inscritas, la existencia de ocupantes y las condiciones publicadas en la convocatoria. Esa verificación determina el riesgo real de la operación y no puede sustituirse por la sola lectura del aviso.',
      },
      { type: 'note', text: ORIENTATIVE_NOTE },
    ],
    image_url: null,
    sort_order: 1,
    is_active: true,
    seo_title: 'Remate público judicial — Asesoría para postores y ejecutados',
    seo_description:
      'Asesoría en remates judiciales: verificación registral del bien, participación como postor, tercería de propiedad y defensa frente a la ejecución.',
    faqs: [
      {
        id: serviceFaqId(11, 1),
        service_id: serviceId(11),
        question: '¿Qué riesgos tiene comprar en un remate?',
        answer:
          'Los principales son las cargas no advertidas y la ocupación del inmueble por terceros. Ambos se identifican con una revisión registral y una verificación física previas al acto.',
        sort_order: 1,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(11, 2),
        service_id: serviceId(11),
        question: 'Embargaron un bien mío por una deuda que no es mía, ¿qué puedo hacer?',
        answer:
          'Cuando un tercero acredita ser propietario del bien afectado, el ordenamiento prevé la tercería de propiedad. Su viabilidad depende de la documentación y de la oportunidad en que se plantee.',
        sort_order: 2,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(11, 3),
        service_id: serviceId(11),
        question: '¿Se puede cuestionar la tasación?',
        answer:
          'Sí, existen mecanismos procesales para observarla dentro del propio proceso de ejecución, siempre que se planteen en la etapa que corresponde.',
        sort_order: 3,
        created_at: SERVICE_TS.created_at,
      },
    ],
  },

  /* ----------------------- 12. Prescripción adquisitiva --------------------- */
  {
    ...SERVICE_TS,
    id: serviceId(12),
    area_id: AREA,
    slug: 'prescripcion-adquisitiva',
    name: 'Prescripción adquisitiva',
    short_description:
      'Reconocimiento de la propiedad de un inmueble a favor de quien lo ha poseído de forma continua, pacífica y pública durante el plazo que la ley exige.',
    description: [
      'La prescripción adquisitiva de dominio permite que quien ha poseído un inmueble como propietario, de manera continua, pacífica y pública durante el plazo legal, obtenga el reconocimiento formal de esa propiedad y pueda inscribirla.',
      'Es una vía frecuente en inmuebles adquiridos hace años mediante documentos privados que nunca se formalizaron, en propiedades familiares con títulos incompletos y en predios cuya partida registral figura a nombre de personas ya fallecidas.',
      'El eje del caso es probatorio: debe acreditarse la posesión y su continuidad durante todo el periodo exigido. Los recibos de servicios, los pagos de tributos municipales y las declaraciones de vecinos suelen ser determinantes.',
    ],
    when_needed: [
      'Posee un inmueble desde hace años sin contar con título inscrito.',
      'Adquirió mediante documento privado que nunca se elevó a escritura pública.',
      'La partida registral figura a nombre de una persona fallecida o ilocalizable.',
      'Necesita inscribir la propiedad para vender, hipotecar o construir.',
      'Existen observaciones registrales que impiden regularizar el predio.',
    ],
    process: [
      {
        step: '01',
        title: 'Estudio de títulos',
        description:
          'Revisamos la partida registral, los antecedentes de dominio y la documentación de posesión disponible para evaluar la viabilidad del caso.',
      },
      {
        step: '02',
        title: 'Acreditación de la posesión',
        description:
          'Reunimos la documentación que demuestra la posesión continua durante el plazo legal, junto con los planos y la memoria descriptiva.',
      },
      {
        step: '03',
        title: 'Vía notarial o judicial',
        description:
          'Determinamos si el caso admite la vía notarial —más breve— o si debe tramitarse judicialmente, y presentamos la solicitud correspondiente.',
      },
      {
        step: '04',
        title: 'Declaración e inscripción',
        description:
          'Obtenida la declaración de propiedad, gestionamos su inscripción en el registro de predios.',
      },
    ],
    documents: [
      'Partida registral del inmueble y certificado de búsqueda catastral.',
      'Documento privado de compraventa o de transferencia, si existe.',
      'Recibos de servicios y pagos del impuesto predial de los años de posesión.',
      'Planos perimétricos y de ubicación con memoria descriptiva.',
      'Datos de testigos que puedan declarar sobre la posesión.',
    ],
    content: [
      { type: 'h2', text: 'La continuidad es lo que se prueba' },
      {
        type: 'p',
        text: 'No basta con poseer actualmente: debe acreditarse que la posesión se mantuvo sin interrupción durante todo el periodo exigido. Por eso conviene conservar documentación de cada año, aunque parezca menor: recibos, pagos municipales, constancias y comunicaciones.',
      },
      { type: 'note', text: ORIENTATIVE_NOTE },
    ],
    image_url: null,
    sort_order: 2,
    is_active: true,
    seo_title: 'Prescripción adquisitiva de dominio — Regularizar propiedad',
    seo_description:
      'Prescripción adquisitiva notarial y judicial: requisitos, prueba de la posesión, documentación técnica e inscripción en SUNARP.',
    faqs: [
      {
        id: serviceFaqId(12, 1),
        service_id: serviceId(12),
        question: '¿Cuánto tiempo de posesión se requiere?',
        answer:
          'El Código Civil distingue plazos según concurran o no buena fe y justo título. Determinar cuál aplica a su caso es parte de la evaluación inicial, porque cambia por completo la estrategia.',
        sort_order: 1,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(12, 2),
        service_id: serviceId(12),
        question: '¿Conviene la vía notarial o la judicial?',
        answer:
          'La notarial suele ser más rápida, pero exige que no exista oposición y que se cumplan determinados requisitos. Si aparece oposición, el trámite debe continuar en sede judicial.',
        sort_order: 2,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(12, 3),
        service_id: serviceId(12),
        question: '¿Sirve si el terreno no está inscrito?',
        answer:
          'Los predios no inscritos requieren un tratamiento distinto, que puede incluir la inmatriculación previa. Lo determinamos tras revisar la búsqueda catastral.',
        sort_order: 3,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(12, 4),
        service_id: serviceId(12),
        question: '¿Necesito planos elaborados por un profesional?',
        answer:
          'Sí. La documentación técnica —planos perimétricos, de ubicación y memoria descriptiva— debe ser elaborada y suscrita por un profesional habilitado.',
        sort_order: 4,
        created_at: SERVICE_TS.created_at,
      },
    ],
  },

  /* ------------------------------ 13. Desalojo ------------------------------ */
  {
    ...SERVICE_TS,
    id: serviceId(13),
    area_id: AREA,
    slug: 'desalojo',
    name: 'Desalojo',
    short_description:
      'Recuperación de la posesión de un inmueble ocupado sin título, con contrato vencido o por falta de pago de la renta.',
    description: [
      'El desalojo permite al propietario o a quien tiene derecho a la posesión recuperar un inmueble ocupado por quien ya no tiene título para permanecer en él. Los supuestos más frecuentes son la falta de pago de la renta, el vencimiento del contrato y la ocupación precaria.',
      'La causal determina la vía procesal y la prueba exigida, por lo que su elección debe hacerse después de revisar la documentación y no antes. Un desalojo planteado por la causal equivocada suele terminar en una sentencia desfavorable pese a asistirle el derecho al demandante.',
      'Intervenimos tanto en la posición del propietario como en la defensa del ocupante que cuenta con un título vigente o con derechos que deben discutirse antes de cualquier lanzamiento.',
    ],
    when_needed: [
      'El inquilino dejó de pagar la renta y no desocupa el inmueble.',
      'El contrato de arrendamiento venció y el ocupante permanece en el bien.',
      'Una persona ocupa el inmueble sin título alguno.',
      'Necesita recuperar la posesión para vender o utilizar el inmueble.',
      'Es ocupante y recibió una demanda de desalojo que considera improcedente.',
    ],
    process: [
      {
        step: '01',
        title: 'Revisión del título y del contrato',
        description:
          'Analizamos la documentación de propiedad, el contrato y las comunicaciones cursadas para identificar la causal aplicable.',
      },
      {
        step: '02',
        title: 'Requerimiento previo',
        description:
          'Cuando corresponde, cursamos la carta notarial de requerimiento, que en varios supuestos es condición para accionar.',
      },
      {
        step: '03',
        title: 'Demanda y audiencia',
        description:
          'Presentamos la demanda ante el juzgado competente y asumimos la representación durante la audiencia y la actuación probatoria.',
      },
      {
        step: '04',
        title: 'Sentencia y lanzamiento',
        description:
          'Obtenida la sentencia favorable y firme, gestionamos el lanzamiento con el apoyo de la autoridad competente.',
      },
    ],
    documents: [
      'Título de propiedad o partida registral del inmueble.',
      'Contrato de arrendamiento y sus adendas, si existen.',
      'Comprobantes de pago o estado de cuenta de la renta adeudada.',
      'Cartas notariales u otras comunicaciones cursadas al ocupante.',
      'Recibos de servicios del inmueble.',
    ],
    content: [
      { type: 'h2', text: 'La causal define el proceso' },
      {
        type: 'p',
        text: 'Falta de pago, vencimiento de contrato y ocupación precaria son causales distintas, con requisitos y prueba propios. Determinar cuál corresponde antes de demandar evita que el proceso se pierda por una razón formal.',
      },
      { type: 'note', text: ORIENTATIVE_NOTE },
    ],
    image_url: null,
    sort_order: 3,
    is_active: true,
    seo_title: 'Desalojo en Perú — Recuperar la posesión de un inmueble',
    seo_description:
      'Proceso de desalojo por falta de pago, vencimiento de contrato u ocupación precaria: requisitos, carta notarial, demanda y lanzamiento.',
    faqs: [
      {
        id: serviceFaqId(13, 1),
        service_id: serviceId(13),
        question: '¿Puedo sacar al inquilino por mi cuenta?',
        answer:
          'No. La desocupación debe obtenerse por la vía legal correspondiente. Actuar por cuenta propia expone al propietario a responsabilidades civiles y penales.',
        sort_order: 1,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(13, 2),
        service_id: serviceId(13),
        question: '¿Es obligatoria la carta notarial previa?',
        answer:
          'Depende de la causal y de lo pactado en el contrato. En varios supuestos el requerimiento previo es condición para accionar, por lo que se revisa antes de presentar la demanda.',
        sort_order: 2,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(13, 3),
        service_id: serviceId(13),
        question: '¿Puedo reclamar además la renta impagada?',
        answer:
          'El cobro de la renta adeudada tiene su propia vía. En la evaluación inicial definimos si conviene acumularla o tramitarla por separado.',
        sort_order: 3,
        created_at: SERVICE_TS.created_at,
      },
    ],
  },

  /* ------------------------------ 14. Exequátur ----------------------------- */
  {
    ...SERVICE_TS,
    id: serviceId(14),
    area_id: AREA,
    slug: 'exequatur',
    name: 'Exequátur',
    short_description:
      'Reconocimiento en el Perú de sentencias y resoluciones dictadas en el extranjero para que produzcan efectos legales en el país.',
    description: [
      'Una sentencia dictada en el extranjero no produce efectos automáticos en el Perú. Para que pueda inscribirse o ejecutarse aquí debe pasar por un procedimiento de reconocimiento judicial conocido como exequátur.',
      'Los supuestos más frecuentes son los divorcios tramitados fuera del país que deben inscribirse en el RENIEC, las resoluciones sobre alimentos o tenencia dictadas en el extranjero y las sentencias patrimoniales que se pretende ejecutar sobre bienes ubicados en el Perú.',
      'El procedimiento es fundamentalmente documental y formal: la resolución extranjera debe estar firme, debidamente legalizada o apostillada y traducida de manera oficial cuando corresponde. La mayor parte del trabajo consiste en preparar correctamente ese expediente.',
    ],
    when_needed: [
      'Se divorció en el extranjero y necesita inscribir el divorcio en el Perú.',
      'Requiere ejecutar en el Perú una sentencia dictada fuera del país.',
      'Debe inscribir en un registro peruano una resolución extranjera.',
      'Existe una resolución extranjera sobre alimentos, tenencia o adopción.',
      'Necesita que una decisión extranjera produzca efectos sobre bienes en el Perú.',
    ],
    process: [
      {
        step: '01',
        title: 'Revisión de la resolución',
        description:
          'Verificamos que la sentencia esté firme y que cumpla los requisitos exigidos para su reconocimiento en el Perú.',
      },
      {
        step: '02',
        title: 'Legalización y traducción',
        description:
          'Coordinamos la apostilla o legalización consular y la traducción oficial de los documentos que lo requieran.',
      },
      {
        step: '03',
        title: 'Demanda de reconocimiento',
        description:
          'Presentamos la solicitud ante la Sala competente y asumimos el seguimiento del procedimiento.',
      },
      {
        step: '04',
        title: 'Inscripción o ejecución',
        description:
          'Reconocida la resolución, gestionamos su inscripción en el registro correspondiente o iniciamos su ejecución.',
      },
    ],
    documents: [
      'Copia certificada de la sentencia extranjera con constancia de estar firme.',
      'Apostilla de La Haya o legalización consular del documento.',
      'Traducción oficial al castellano, cuando corresponda.',
      'Acta de matrimonio o partida inscrita en el Perú, según el caso.',
      'Documento de identidad del solicitante.',
    ],
    content: [
      { type: 'h2', text: 'Apostilla y traducción' },
      {
        type: 'p',
        text: 'Si el país de origen forma parte del Convenio de La Haya, basta la apostilla; en caso contrario se requiere legalización consular. La traducción debe ser oficial. Un defecto en cualquiera de estos pasos obliga a rehacer el trámite completo, de modo que conviene verificarlo antes de iniciar.',
      },
      { type: 'note', text: ORIENTATIVE_NOTE },
    ],
    image_url: null,
    sort_order: 4,
    is_active: true,
    seo_title: 'Exequátur en Perú — Reconocimiento de sentencias extranjeras',
    seo_description:
      'Trámite de exequátur: reconocimiento judicial de sentencias extranjeras de divorcio, alimentos o patrimoniales para su inscripción o ejecución en el Perú.',
    faqs: [
      {
        id: serviceFaqId(14, 1),
        service_id: serviceId(14),
        question: '¿Debo estar en el Perú para tramitarlo?',
        answer:
          'No necesariamente. El trámite puede seguirse mediante representación con poder otorgado ante el consulado peruano o en el extranjero con la formalidad correspondiente.',
        sort_order: 1,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(14, 2),
        service_id: serviceId(14),
        question: '¿Todas las sentencias extranjeras se pueden reconocer?',
        answer:
          'No. Deben cumplir los requisitos que establece el ordenamiento peruano, entre ellos que no se opongan al orden público y que la autoridad extranjera haya sido competente.',
        sort_order: 2,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(14, 3),
        service_id: serviceId(14),
        question: '¿Cuánto demora?',
        answer:
          'Al ser un procedimiento documental, buena parte del tiempo depende de la obtención de apostillas y traducciones. El plazo judicial posterior varía según la carga de la Sala competente.',
        sort_order: 3,
        created_at: SERVICE_TS.created_at,
      },
    ],
  },
];
