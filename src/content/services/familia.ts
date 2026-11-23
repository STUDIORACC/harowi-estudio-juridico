import { areaId, serviceFaqId, serviceId } from '../ids';
import { ORIENTATIVE_NOTE, SERVICE_TS, type DemoService } from './shared';

/**
 * ---------------------------------------------------------------------------
 * SERVICIOS — DERECHO DE FAMILIA
 * ---------------------------------------------------------------------------
 * Contenido general y orientativo, editable desde /admin/servicios.
 * ---------------------------------------------------------------------------
 */

const AREA = areaId(1);

export const familiaServices: DemoService[] = [
  /* ------------------------------ 01. Alimentos ----------------------------- */
  {
    ...SERVICE_TS,
    id: serviceId(1),
    area_id: AREA,
    slug: 'demanda-de-alimentos',
    name: 'Demanda de alimentos',
    short_description:
      'Solicitud judicial de una pensión de alimentos para hijos menores, hijos mayores que estudian u otros beneficiarios previstos por ley.',
    description: [
      'La pensión de alimentos es la obligación de cubrir lo necesario para el sustento, la vivienda, el vestido, la educación, la atención médica y la recreación de quien no puede atenderlo por sí mismo. Cuando el obligado no cumple de forma voluntaria, la vía es solicitar al juez que fije el monto y la forma de pago.',
      'El proceso se sigue ante el juzgado de paz letrado y, en la práctica, se decide sobre dos ejes: las necesidades acreditadas de quien pide y las posibilidades económicas de quien debe pagar. Buena parte del trabajo previo consiste, precisamente, en documentar ambos extremos con la mayor precisión posible.',
      'Acompañamos la preparación de la demanda, la sustentación de los gastos, el seguimiento de las audiencias y, cuando corresponde, la ejecución de la pensión fijada.',
    ],
    when_needed: [
      'El padre o la madre no aporta, o aporta de forma irregular, para el sostenimiento del hijo.',
      'Existe un acuerdo verbal que dejó de cumplirse y no hay título que permita exigirlo.',
      'El hijo mayor de edad continúa estudios superiores con éxito y necesita mantener la pensión.',
      'Se requiere fijar una pensión por primera vez tras una separación.',
      'El monto acordado en su momento resulta insuficiente frente a las necesidades actuales.',
    ],
    process: [
      {
        step: '01',
        title: 'Evaluación del caso',
        description:
          'Revisamos la relación familiar, los gastos reales del beneficiario y la información disponible sobre los ingresos del obligado. Definimos si conviene una vía conciliatoria previa o la demanda directa.',
      },
      {
        step: '02',
        title: 'Preparación y presentación',
        description:
          'Elaboramos la demanda con el detalle de las necesidades acreditadas y los medios probatorios que las sostienen, y la presentamos ante el juzgado competente.',
      },
      {
        step: '03',
        title: 'Audiencia',
        description:
          'Se cita a las partes, se sanean las cuestiones formales, se fijan los puntos controvertidos y se actúan los medios probatorios. Asumimos la representación en cada actuación.',
      },
      {
        step: '04',
        title: 'Sentencia y ejecución',
        description:
          'Fijada la pensión, se dispone su cumplimiento. Si el obligado no paga, se solicitan las medidas de ejecución que la ley prevé.',
      },
    ],
    documents: [
      'Documento de identidad del solicitante.',
      'Partida de nacimiento del beneficiario.',
      'Comprobantes de gastos: pensión escolar, matrícula, alquiler, servicios, atención médica.',
      'Cualquier documento que acredite los ingresos o la actividad económica del obligado.',
      'Acuerdos previos, actas de conciliación o sentencias anteriores, si existen.',
    ],
    content: [
      {
        type: 'h2',
        text: '¿Cómo se determina el monto?',
      },
      {
        type: 'p',
        text: 'El juez pondera las necesidades acreditadas del beneficiario y las posibilidades económicas del obligado, considerando además sus otras cargas familiares. No existe un porcentaje único aplicable a todos los casos: el monto se fija caso por caso.',
      },
      { type: 'note', text: ORIENTATIVE_NOTE },
    ],
    image_url: null,
    sort_order: 1,
    is_active: true,
    seo_title: 'Demanda de alimentos en Perú — Abogados de familia',
    seo_description:
      'Asesoría para demandas de pensión de alimentos: requisitos, documentación, proceso ante el juzgado de paz letrado y ejecución de la pensión fijada.',
    faqs: [
      {
        id: serviceFaqId(1, 1),
        service_id: serviceId(1),
        question: '¿Necesito abogado para demandar alimentos?',
        answer:
          'La ley permite presentar la demanda de alimentos sin firma de abogado en determinados supuestos. Aun así, contar con patrocinio suele mejorar la sustentación de los gastos y el seguimiento de las audiencias, que es donde se define el resultado.',
        sort_order: 1,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(1, 2),
        service_id: serviceId(1),
        question: '¿Cuánto demora el proceso?',
        answer:
          'Depende de la carga del juzgado, de la notificación al demandado y de la complejidad probatoria. En la primera consulta ofrecemos un rango estimado para su caso concreto, sin comprometer plazos que no dependen del estudio.',
        sort_order: 2,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(1, 3),
        service_id: serviceId(1),
        question: '¿Puedo pedir alimentos si no conozco los ingresos del padre o la madre?',
        answer:
          'Sí. Cuando no hay documentación directa de ingresos, se acredita la capacidad económica por otros medios y el juez valora los indicios disponibles. Conviene reunir toda la información que exista sobre la actividad del obligado.',
        sort_order: 3,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(1, 4),
        service_id: serviceId(1),
        question: '¿La pensión puede cambiar más adelante?',
        answer:
          'Sí. Si varían las necesidades del beneficiario o las posibilidades del obligado, cualquiera de las partes puede solicitar el aumento, la reducción o la exoneración de la pensión mediante un nuevo proceso.',
        sort_order: 4,
        created_at: SERVICE_TS.created_at,
      },
    ],
  },

  /* ------------------------ 02. Reducción de alimentos ---------------------- */
  {
    ...SERVICE_TS,
    id: serviceId(2),
    area_id: AREA,
    slug: 'reduccion-de-alimentos',
    name: 'Reducción de alimentos',
    short_description:
      'Solicitud judicial para ajustar una pensión ya fijada cuando cambian de forma acreditada las posibilidades del obligado o las necesidades del beneficiario.',
    description: [
      'La pensión de alimentos no es inmutable: se fija de acuerdo con una situación determinada y puede revisarse cuando esa situación cambia. La reducción procede cuando disminuyen las posibilidades económicas del obligado o cuando las necesidades del beneficiario se reducen de manera comprobable.',
      'El proceso no se resuelve con la sola afirmación de que "ya no se puede pagar": exige acreditar el cambio con documentación. La pérdida del empleo, la aparición de nuevas cargas familiares o una enfermedad que reduce la capacidad de generar ingresos son escenarios frecuentes, pero cada uno debe probarse.',
      'Evaluamos con franqueza si el caso tiene sustento antes de iniciar cualquier acción, porque una demanda sin respaldo probatorio suele terminar en una sentencia desfavorable y en costos adicionales.',
    ],
    when_needed: [
      'El obligado perdió el empleo o vio reducidos sus ingresos de forma sostenida.',
      'Nacieron nuevos hijos y con ellos nuevas obligaciones alimentarias.',
      'Una enfermedad o incapacidad afecta la capacidad de generar ingresos.',
      'Las necesidades del beneficiario disminuyeron de manera acreditable.',
      'La pensión vigente resulta desproporcionada frente a la situación económica actual.',
    ],
    process: [
      {
        step: '01',
        title: 'Revisión de la sentencia vigente',
        description:
          'Analizamos el expediente que fijó la pensión y los fundamentos que se tuvieron en cuenta entonces, para identificar qué cambió desde ese momento.',
      },
      {
        step: '02',
        title: 'Acreditación del cambio',
        description:
          'Reunimos la documentación que demuestra la variación de ingresos o de cargas. Sin este respaldo la demanda difícilmente prospera.',
      },
      {
        step: '03',
        title: 'Demanda y audiencia',
        description:
          'Presentamos la demanda ante el mismo juzgado que fijó la pensión y asumimos la representación en la audiencia.',
      },
      {
        step: '04',
        title: 'Resolución',
        description:
          'El juez resuelve manteniendo, reduciendo o ajustando la pensión. Mientras no exista resolución firme, la pensión vigente debe seguir pagándose.',
      },
    ],
    documents: [
      'Copia de la sentencia o acta que fijó la pensión vigente.',
      'Boletas de pago, liquidación de beneficios sociales o constancia de cese laboral.',
      'Declaraciones de ingresos o documentación de la actividad económica actual.',
      'Partidas de nacimiento de nuevos hijos, si corresponde.',
      'Informes médicos, en casos de enfermedad o incapacidad.',
    ],
    content: [
      { type: 'h2', text: 'Reducción, exoneración y prorrateo' },
      {
        type: 'p',
        text: 'Son pretensiones distintas. La reducción ajusta el monto; la exoneración busca extinguir la obligación cuando concurren los supuestos legales; el prorrateo distribuye la capacidad económica del obligado entre varios beneficiarios. En la consulta identificamos cuál corresponde a su situación.',
      },
      { type: 'note', text: ORIENTATIVE_NOTE },
    ],
    image_url: null,
    sort_order: 2,
    is_active: true,
    seo_title: 'Reducción de pensión de alimentos — Asesoría legal',
    seo_description:
      'Cuándo procede la reducción de alimentos, qué debe acreditarse y cómo se tramita el proceso ante el juzgado que fijó la pensión.',
    faqs: [
      {
        id: serviceFaqId(2, 1),
        service_id: serviceId(2),
        question: '¿Puedo dejar de pagar mientras dura el proceso?',
        answer:
          'No. La pensión vigente se mantiene exigible hasta que exista una resolución que la modifique. Dejar de pagar durante el trámite genera deuda acumulada y puede tener consecuencias adicionales.',
        sort_order: 1,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(2, 2),
        service_id: serviceId(2),
        question: '¿Qué pruebas suelen ser determinantes?',
        answer:
          'La documentación que demuestre de forma objetiva la variación: cese laboral, liquidaciones, declaraciones de ingresos, partidas de nacimiento de nuevos hijos o informes médicos. Las afirmaciones sin respaldo tienen poco peso.',
        sort_order: 2,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(2, 3),
        service_id: serviceId(2),
        question: '¿Ante qué juzgado se presenta?',
        answer:
          'Por regla general, ante el mismo juzgado que fijó la pensión. En la evaluación inicial verificamos la competencia según el expediente original.',
        sort_order: 3,
        created_at: SERVICE_TS.created_at,
      },
    ],
  },

  /* ------------------------------ 03. Tenencia ------------------------------ */
  {
    ...SERVICE_TS,
    id: serviceId(3),
    area_id: AREA,
    slug: 'tenencia',
    name: 'Tenencia y régimen de visitas',
    short_description:
      'Determinación de con quién vive el hijo menor de edad y cómo se organiza el contacto con el otro progenitor.',
    description: [
      'La tenencia define con cuál de los padres vive el hijo menor de edad y cómo se ejerce el cuidado cotidiano. Cuando no hay acuerdo entre los padres, corresponde al juez decidir, tomando como criterio rector el interés superior del niño y no la conveniencia de los adultos.',
      'El proceso suele incluir la participación del equipo multidisciplinario del juzgado y, según la edad y madurez del menor, la escucha de su opinión. La conducta de cada progenitor durante el proceso —especialmente la disposición a facilitar el contacto con el otro— pesa en la decisión.',
      'Junto con la tenencia se define el régimen de visitas, que organiza días, horarios y periodos de vacaciones. Cuando existe posibilidad de acuerdo, siempre es preferible: un régimen consensuado se cumple mejor que uno impuesto.',
    ],
    when_needed: [
      'Los padres se separan y no logran acordar con quién vivirá el hijo.',
      'Un progenitor impide o dificulta el contacto del hijo con el otro.',
      'El régimen de visitas acordado dejó de cumplirse.',
      'Existen circunstancias que hacen aconsejable variar la tenencia vigente.',
      'Se requiere formalizar judicialmente un acuerdo ya alcanzado.',
    ],
    process: [
      {
        step: '01',
        title: 'Evaluación del entorno',
        description:
          'Analizamos la situación familiar, la rutina del menor y las posibilidades reales de cuidado de cada progenitor, para definir una pretensión sostenible.',
      },
      {
        step: '02',
        title: 'Intento de acuerdo',
        description:
          'Cuando es viable, promovemos una solución consensuada mediante conciliación. Reduce el desgaste del menor y acorta tiempos.',
      },
      {
        step: '03',
        title: 'Proceso judicial',
        description:
          'Si no hay acuerdo, se presenta la demanda ante el juzgado de familia. El proceso incluye audiencia y, habitualmente, informes del equipo multidisciplinario.',
      },
      {
        step: '04',
        title: 'Sentencia y cumplimiento',
        description:
          'La resolución fija la tenencia y el régimen de visitas. Si se incumple, existen mecanismos para exigir su ejecución.',
      },
    ],
    documents: [
      'Documento de identidad de ambos progenitores, en lo que esté disponible.',
      'Partida de nacimiento del menor.',
      'Constancias de estudios, informes escolares o médicos del menor.',
      'Documentación sobre la vivienda y la situación laboral del solicitante.',
      'Acuerdos, actas de conciliación o sentencias previas, si existen.',
    ],
    content: [
      { type: 'h2', text: 'Tenencia compartida' },
      {
        type: 'p',
        text: 'El ordenamiento contempla la posibilidad de una tenencia compartida cuando las circunstancias lo permiten y resulta favorable para el menor. Su viabilidad depende de factores concretos como la cercanía de los domicilios, la capacidad de comunicación entre los padres y la rutina escolar del niño.',
      },
      { type: 'note', text: ORIENTATIVE_NOTE },
    ],
    image_url: null,
    sort_order: 3,
    is_active: true,
    seo_title: 'Tenencia y régimen de visitas — Abogados de familia en Lima',
    seo_description:
      'Procesos de tenencia y régimen de visitas ante el juzgado de familia. Criterios, documentación y acompañamiento durante todo el proceso.',
    faqs: [
      {
        id: serviceFaqId(3, 1),
        service_id: serviceId(3),
        question: '¿El juez toma en cuenta la opinión del niño?',
        answer:
          'Sí. El menor tiene derecho a ser escuchado y su opinión se valora según su edad y grado de madurez, dentro del conjunto de elementos que el juez pondera.',
        sort_order: 1,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(3, 2),
        service_id: serviceId(3),
        question: '¿La tenencia se puede modificar después?',
        answer:
          'Sí. Si cambian de forma significativa las circunstancias que sustentaron la decisión, puede solicitarse la variación de la tenencia mediante un nuevo proceso.',
        sort_order: 2,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(3, 3),
        service_id: serviceId(3),
        question: '¿Qué pasa si el otro progenitor incumple el régimen de visitas?',
        answer:
          'El incumplimiento reiterado puede denunciarse ante el mismo juzgado, que dispone de medidas para exigir el cumplimiento y valora esa conducta en decisiones posteriores.',
        sort_order: 3,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(3, 4),
        service_id: serviceId(3),
        question: '¿La tenencia afecta la pensión de alimentos?',
        answer:
          'Son procesos distintos, pero relacionados: la organización del cuidado influye en cómo se distribuyen los gastos. Cada pretensión se tramita por su propia vía.',
        sort_order: 4,
        created_at: SERVICE_TS.created_at,
      },
    ],
  },

  /* -------------------- 04. Divorcio de mutuo acuerdo ----------------------- */
  {
    ...SERVICE_TS,
    id: serviceId(4),
    area_id: AREA,
    slug: 'divorcio-mutuo-acuerdo',
    name: 'Divorcio de mutuo acuerdo',
    short_description:
      'Separación convencional y divorcio ulterior cuando ambos cónyuges están de acuerdo en poner fin al vínculo matrimonial.',
    description: [
      'Cuando ambos cónyuges coinciden en terminar el matrimonio, el ordenamiento peruano prevé una vía más breve que el divorcio contencioso: la separación convencional y el divorcio ulterior, que puede tramitarse en sede notarial, municipal o judicial según el caso.',
      'La condición central es el acuerdo: los cónyuges deben haber resuelto previamente los aspectos vinculados a los hijos menores —tenencia, régimen de visitas y alimentos— y, cuando corresponde, la situación de los bienes sociales. Ese acuerdo se plasma en una propuesta de convenio que acompaña la solicitud.',
      'Nuestro trabajo consiste en redactar un convenio completo y ejecutable, evitando las omisiones que después obligan a abrir nuevos procesos, y en conducir el trámite hasta la disolución del vínculo y su inscripción.',
    ],
    when_needed: [
      'Ambos cónyuges están de acuerdo en divorciarse y en las condiciones de la separación.',
      'Se ha cumplido el plazo que la ley exige desde la celebración del matrimonio.',
      'Existen hijos menores y se requiere formalizar tenencia, visitas y alimentos.',
      'Hay bienes sociales cuya situación conviene definir antes de la disolución.',
      'Se busca la vía más rápida y menos costosa frente a un divorcio contencioso.',
    ],
    process: [
      {
        step: '01',
        title: 'Verificación de requisitos',
        description:
          'Revisamos el acta de matrimonio, el plazo transcurrido y la situación de hijos y bienes, para determinar la vía aplicable: notarial, municipal o judicial.',
      },
      {
        step: '02',
        title: 'Convenio regulador',
        description:
          'Redactamos el convenio sobre régimen de tenencia, visitas, alimentos y bienes sociales. Es la pieza central del trámite.',
      },
      {
        step: '03',
        title: 'Solicitud y separación',
        description:
          'Presentamos la solicitud con toda la documentación. Declarada la separación convencional, se abre el plazo para solicitar la disolución.',
      },
      {
        step: '04',
        title: 'Divorcio e inscripción',
        description:
          'Transcurrido el plazo legal, se solicita el divorcio ulterior y, una vez declarado, se inscribe en el registro correspondiente.',
      },
    ],
    documents: [
      'Copia certificada del acta de matrimonio.',
      'Documento de identidad de ambos cónyuges.',
      'Partidas de nacimiento de los hijos menores, si los hubiera.',
      'Documentación de los bienes sociales: partidas registrales, tarjetas de propiedad.',
      'Sentencia o acta previa sobre alimentos, tenencia o visitas, si existe.',
    ],
    content: [
      { type: 'h2', text: '¿Notaría, municipalidad o juzgado?' },
      {
        type: 'p',
        text: 'La vía notarial y la municipal son más rápidas, pero exigen que se cumplan determinadas condiciones sobre hijos menores y bienes. Cuando esas condiciones no concurren, el trámite debe seguirse ante el Poder Judicial. La verificación de este punto es lo primero que hacemos en la consulta.',
      },
      { type: 'note', text: ORIENTATIVE_NOTE },
    ],
    image_url: null,
    sort_order: 4,
    is_active: true,
    seo_title: 'Divorcio de mutuo acuerdo en Perú — Trámite y requisitos',
    seo_description:
      'Separación convencional y divorcio ulterior: requisitos, convenio regulador, vías notarial, municipal y judicial, y plazos del trámite.',
    faqs: [
      {
        id: serviceFaqId(4, 1),
        service_id: serviceId(4),
        question: '¿Es necesario que ambos estén presentes?',
        answer:
          'La solicitud es conjunta y ambos cónyuges deben manifestar su voluntad. Según la vía, es posible actuar mediante poder con facultades específicas; lo verificamos en la consulta inicial.',
        sort_order: 1,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(4, 2),
        service_id: serviceId(4),
        question: '¿Qué ocurre si no hay acuerdo sobre los bienes?',
        answer:
          'Si el desacuerdo persiste, la vía convencional deja de ser viable y el caso debe encauzarse por un proceso contencioso. En muchos supuestos conviene resolver primero la liquidación de la sociedad de gananciales.',
        sort_order: 2,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(4, 3),
        service_id: serviceId(4),
        question: '¿Cuánto demora?',
        answer:
          'La vía notarial o municipal suele ser considerablemente más breve que la judicial, pero el plazo depende de la entidad, de la completitud del expediente y de los plazos legales que deben transcurrir entre la separación y la disolución.',
        sort_order: 3,
        created_at: SERVICE_TS.created_at,
      },
    ],
  },

  /* --------------------- 05. Divorcio por causal ---------------------------- */
  {
    ...SERVICE_TS,
    id: serviceId(5),
    area_id: AREA,
    slug: 'divorcio-por-causal',
    name: 'Divorcio por causal',
    short_description:
      'Proceso judicial para disolver el vínculo matrimonial cuando no hay acuerdo y concurre alguna de las causales previstas en el Código Civil.',
    description: [
      'Cuando uno de los cónyuges no acepta el divorcio, la disolución solo puede obtenerse acreditando ante el juez alguna de las causales que la ley establece. Es un proceso contencioso: se discute, se prueba y se resuelve con sentencia.',
      'La causal invocada determina qué debe probarse y con qué medios. Algunas se acreditan con documentación objetiva; otras exigen una actividad probatoria más compleja. La elección de la causal, por tanto, no es un formalismo: condiciona toda la estrategia del caso.',
      'Junto con la disolución suelen discutirse la tenencia, los alimentos, el régimen de visitas y la liquidación de la sociedad de gananciales. Preparamos el caso considerando ese conjunto, no solo la declaración de divorcio.',
    ],
    when_needed: [
      'Uno de los cónyuges se niega a divorciarse de mutuo acuerdo.',
      'Existe separación de hecho prolongada entre los cónyuges.',
      'Concurre alguna de las causales previstas en el Código Civil.',
      'Se requiere además definir alimentos, tenencia o el destino de los bienes sociales.',
      'Hay urgencia en obtener medidas cautelares durante el proceso.',
    ],
    process: [
      {
        step: '01',
        title: 'Análisis de la causal',
        description:
          'Evaluamos los hechos y la prueba disponible para determinar qué causal resulta sostenible y cuál es el escenario probatorio real.',
      },
      {
        step: '02',
        title: 'Demanda y medidas',
        description:
          'Presentamos la demanda ante el juzgado de familia, con las pretensiones accesorias y, si el caso lo exige, las medidas cautelares correspondientes.',
      },
      {
        step: '03',
        title: 'Etapa probatoria',
        description:
          'Se contesta la demanda, se fijan los puntos controvertidos y se actúan los medios probatorios en audiencia. Es la etapa que define el resultado.',
      },
      {
        step: '04',
        title: 'Sentencia e impugnación',
        description:
          'Emitida la sentencia, evaluamos su contenido y la conveniencia de impugnarla. Firme la resolución, se procede a su inscripción.',
      },
    ],
    documents: [
      'Copia certificada del acta de matrimonio.',
      'Partidas de nacimiento de los hijos, si los hubiera.',
      'Documentación que respalde la causal invocada.',
      'Documentación de los bienes sociales.',
      'Denuncias, informes o antecedentes relacionados, si existen.',
    ],
    content: [
      { type: 'h2', text: 'Separación de hecho' },
      {
        type: 'p',
        text: 'La separación de hecho por el periodo que la ley establece es una de las causales invocadas con mayor frecuencia, porque se acredita con elementos objetivos. Aun así, exige verificar el cumplimiento de las obligaciones alimentarias y otros requisitos que se evalúan caso por caso.',
      },
      { type: 'note', text: ORIENTATIVE_NOTE },
    ],
    image_url: null,
    sort_order: 5,
    is_active: true,
    seo_title: 'Divorcio por causal en Perú — Proceso judicial de divorcio',
    seo_description:
      'Divorcio contencioso ante el juzgado de familia: causales, carga probatoria, pretensiones accesorias y etapas del proceso.',
    faqs: [
      {
        id: serviceFaqId(5, 1),
        service_id: serviceId(5),
        question: '¿Cuánto puede durar un divorcio por causal?',
        answer:
          'Es un proceso contencioso y su duración depende de la carga del juzgado, de la actividad probatoria y de si la sentencia se impugna. En la consulta damos un rango estimado, sin garantizar plazos ajenos al estudio.',
        sort_order: 1,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(5, 2),
        service_id: serviceId(5),
        question: '¿Puede convertirse en un divorcio de mutuo acuerdo?',
        answer:
          'Sí. Si durante el proceso las partes alcanzan un acuerdo integral, es posible reconducir la situación hacia una salida convencional, generalmente más breve.',
        sort_order: 2,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(5, 3),
        service_id: serviceId(5),
        question: '¿Qué pasa con los bienes durante el proceso?',
        answer:
          'Mientras el proceso avanza pueden solicitarse medidas para evitar actos de disposición que perjudiquen a uno de los cónyuges. Su procedencia se evalúa según la documentación registral y las circunstancias del caso.',
        sort_order: 3,
        created_at: SERVICE_TS.created_at,
      },
    ],
  },
];
