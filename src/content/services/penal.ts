import { areaId, serviceFaqId, serviceId } from '../ids';
import { ORIENTATIVE_NOTE, SERVICE_TS, type DemoService } from './shared';

/**
 * ---------------------------------------------------------------------------
 * SERVICIOS — DERECHO PENAL
 * ---------------------------------------------------------------------------
 * Contenido general y orientativo, editable desde /admin/servicios. No describe
 * estrategias de defensa concretas ni anticipa resultados de ningún caso.
 * ---------------------------------------------------------------------------
 */

const AREA = areaId(2);

export const penalServices: DemoService[] = [
  /* ---------------------------- 06. Derecho penal --------------------------- */
  {
    ...SERVICE_TS,
    id: serviceId(6),
    area_id: AREA,
    slug: 'derecho-penal',
    name: 'Defensa penal',
    short_description:
      'Defensa técnica de personas investigadas y patrocinio de la parte agraviada en todas las etapas del proceso penal.',
    description: [
      'Una investigación penal se decide en gran medida por lo que ocurre en sus primeras semanas: qué se declara, qué se aporta y qué diligencias se solicitan a tiempo. Intervenir temprano no es una precaución: suele ser la diferencia entre discutir el caso con margen o hacerlo cuando ya está definido.',
      'Asumimos la defensa técnica desde las diligencias preliminares, durante la investigación preparatoria, en la etapa intermedia y en el juicio oral. También patrocinamos a la parte agraviada cuando se busca la persecución del delito y la reparación civil correspondiente.',
      'El trabajo empieza siempre por la lectura completa de la carpeta fiscal. Antes de esa revisión no fijamos posiciones ni ofrecemos pronósticos: el expediente es el que determina qué es defendible.',
    ],
    when_needed: [
      'Ha recibido una citación policial o fiscal para declarar.',
      'Se ha iniciado una investigación preliminar o preparatoria en su contra.',
      'Fue detenido o un familiar suyo se encuentra detenido.',
      'Es víctima de un delito y necesita constituirse en actor civil.',
      'Debe afrontar una audiencia de control de acusación o un juicio oral.',
    ],
    process: [
      {
        step: '01',
        title: 'Revisión de la carpeta',
        description:
          'Solicitamos acceso al expediente fiscal y analizamos la imputación, los elementos de convicción y el estado de los plazos.',
      },
      {
        step: '02',
        title: 'Estrategia de defensa',
        description:
          'Definimos la teoría del caso, la prueba de descargo que debe reunirse y las diligencias que conviene solicitar al Ministerio Público.',
      },
      {
        step: '03',
        title: 'Actuación en el proceso',
        description:
          'Asumimos la representación en declaraciones, diligencias y audiencias, y presentamos los requerimientos y medios impugnatorios que correspondan.',
      },
      {
        step: '04',
        title: 'Juicio y recursos',
        description:
          'De llegarse a juicio oral, asumimos la defensa en todas sus sesiones y evaluamos los recursos frente a la sentencia.',
      },
    ],
    documents: [
      'Documento de identidad.',
      'Citación, notificación o disposición fiscal recibida.',
      'Copia de la carpeta fiscal o del expediente, si ya se tiene acceso.',
      'Documentación relacionada con los hechos investigados.',
      'Datos de contacto de testigos, si los hubiera.',
    ],
    content: [
      { type: 'h2', text: 'Antes de declarar' },
      {
        type: 'p',
        text: 'Toda persona citada tiene derecho a contar con defensa técnica antes de prestar declaración y a conocer la imputación que se le atribuye. Declarar sin haber revisado el contenido de la carpeta rara vez favorece al investigado.',
      },
      { type: 'note', text: ORIENTATIVE_NOTE },
    ],
    image_url: null,
    sort_order: 1,
    is_active: true,
    seo_title: 'Abogado penalista en Lima — Defensa técnica en proceso penal',
    seo_description:
      'Defensa penal en diligencias preliminares, investigación preparatoria, etapa intermedia y juicio oral. Patrocinio también de la parte agraviada.',
    faqs: [
      {
        id: serviceFaqId(6, 1),
        service_id: serviceId(6),
        question: 'Me citaron a declarar, ¿debo ir con abogado?',
        answer:
          'Es lo recomendable. La defensa técnica permite conocer previamente la imputación, revisar la carpeta y preparar la declaración. Asistir sin abogado es un derecho, pero rara vez conviene.',
        sort_order: 1,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(6, 2),
        service_id: serviceId(6),
        question: '¿Puedo cambiar de abogado durante el proceso?',
        answer:
          'Sí. La designación de defensa es un derecho del investigado y puede variarse en cualquier momento del proceso, comunicándolo a la autoridad correspondiente.',
        sort_order: 2,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(6, 3),
        service_id: serviceId(6),
        question: '¿Qué diferencia hay entre denuncia, investigación y proceso?',
        answer:
          'La denuncia da origen a una indagación; la investigación preliminar determina si existen elementos para formalizar; y solo después se abre el proceso propiamente dicho. Cada etapa tiene plazos y posibilidades de actuación distintas.',
        sort_order: 3,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(6, 4),
        service_id: serviceId(6),
        question: '¿Atienden casos fuera de Lima?',
        answer:
          'La cobertura territorial depende del distrito judicial y de la etapa del caso. En la primera consulta indicamos con claridad si podemos asumir la representación o si corresponde una coordinación local.',
        sort_order: 4,
        created_at: SERVICE_TS.created_at,
      },
    ],
  },

  /* -------------------------- 07. Lavado de activos ------------------------- */
  {
    ...SERVICE_TS,
    id: serviceId(7),
    area_id: AREA,
    slug: 'lavado-de-activos',
    name: 'Lavado de activos',
    short_description:
      'Defensa en investigaciones por lavado de activos, con análisis del componente financiero y documental del caso.',
    description: [
      'Las investigaciones por lavado de activos combinan materia penal y análisis financiero. La discusión suele girar en torno al origen de determinados fondos o bienes y a la documentación que respalda cada operación, más que a un hecho puntual.',
      'Son procedimientos documentalmente intensos: reportes de operaciones, movimientos bancarios, registros societarios e informes periciales. La defensa exige ordenar esa información y explicar de forma consistente la trazabilidad de los recursos.',
      'Asumimos la defensa desde la etapa preliminar, coordinando con peritos contables cuando el caso lo requiere y atendiendo especialmente a las medidas que pueden afectar bienes y cuentas durante la investigación.',
    ],
    when_needed: [
      'Recibió una citación en una investigación por lavado de activos.',
      'Sus cuentas o bienes fueron afectados por una medida dictada en un proceso.',
      'Una empresa vinculada a usted figura en una investigación de este tipo.',
      'Necesita sustentar documentalmente el origen de determinados fondos.',
      'Se le requiere información en el marco de una investigación financiera.',
    ],
    process: [
      {
        step: '01',
        title: 'Análisis de la imputación',
        description:
          'Revisamos la disposición fiscal, la actividad económica cuestionada y los elementos de convicción reunidos hasta el momento.',
      },
      {
        step: '02',
        title: 'Reconstrucción documental',
        description:
          'Ordenamos la documentación que acredita el origen de los fondos y evaluamos la necesidad de informes periciales de parte.',
      },
      {
        step: '03',
        title: 'Defensa en el procedimiento',
        description:
          'Intervenimos en las diligencias, formulamos requerimientos y atendemos las medidas que afecten bienes o cuentas.',
      },
      {
        step: '04',
        title: 'Etapa intermedia y juicio',
        description:
          'Discutimos la acusación en el control correspondiente y, de llegarse a juicio, asumimos la defensa en todas sus sesiones.',
      },
    ],
    documents: [
      'Citación, notificación o disposición fiscal recibida.',
      'Documentación bancaria y financiera relacionada.',
      'Documentación societaria y contable, si hay empresas involucradas.',
      'Contratos, comprobantes y títulos que sustenten las operaciones.',
      'Declaraciones tributarias de los periodos cuestionados.',
    ],
    content: [
      { type: 'h2', text: 'Medidas sobre bienes y cuentas' },
      {
        type: 'p',
        text: 'Durante este tipo de investigaciones pueden dictarse medidas que afectan la disponibilidad de bienes y cuentas. Existen mecanismos procesales para cuestionarlas o solicitar su variación; su procedencia depende del sustento de la medida y de la documentación que se pueda oponer.',
      },
      { type: 'note', text: ORIENTATIVE_NOTE },
    ],
    image_url: null,
    sort_order: 2,
    is_active: true,
    seo_title: 'Defensa penal en lavado de activos — Estudio jurídico en Lima',
    seo_description:
      'Defensa en investigaciones por lavado de activos: análisis de la imputación, sustento documental del origen de fondos y medidas sobre bienes.',
    faqs: [
      {
        id: serviceFaqId(7, 1),
        service_id: serviceId(7),
        question: '¿Por qué estas investigaciones duran tanto?',
        answer:
          'Suelen involucrar información bancaria, societaria y pericial de varios periodos, y frecuentemente requieren cooperación de distintas entidades. Esa complejidad explica su extensión, que varía en cada caso.',
        sort_order: 1,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(7, 2),
        service_id: serviceId(7),
        question: '¿Puedo disponer de mis bienes durante la investigación?',
        answer:
          'Depende de si existen medidas dictadas sobre ellos. Si las hay, su alcance concreto debe revisarse en la resolución que las ordenó antes de realizar cualquier acto de disposición.',
        sort_order: 2,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(7, 3),
        service_id: serviceId(7),
        question: '¿Se necesita un perito contable?',
        answer:
          'En muchos casos sí. Un informe pericial de parte permite contrastar el análisis financiero del Ministerio Público. La decisión se toma tras revisar el contenido de la carpeta.',
        sort_order: 3,
        created_at: SERVICE_TS.created_at,
      },
    ],
  },

  /* --------------------------- 08. Crimen organizado ------------------------ */
  {
    ...SERVICE_TS,
    id: serviceId(8),
    area_id: AREA,
    slug: 'crimen-organizado',
    name: 'Crimen organizado',
    short_description:
      'Defensa en procesos seguidos bajo las reglas especiales aplicables a organizaciones criminales.',
    description: [
      'Los procesos por criminalidad organizada se rigen por reglas especiales: plazos de investigación más extensos, técnicas especiales de investigación y una discusión central sobre si existe realmente una estructura organizada o una pluralidad de intervinientes en hechos concretos.',
      'Esa distinción no es teórica. La calificación como organización criminal modifica el régimen procesal aplicable y condiciona decisiones como la prisión preventiva, por lo que discutirla desde el inicio suele ser determinante.',
      'Asumimos la defensa técnica en estos procesos con atención a la legalidad de las diligencias practicadas, al control de los plazos y a la delimitación precisa de la conducta que se atribuye a nuestro patrocinado dentro del conjunto de la imputación.',
    ],
    when_needed: [
      'La investigación califica los hechos como pertenencia a una organización criminal.',
      'Se ha dispuesto la aplicación de plazos especiales de investigación.',
      'Se practicaron diligencias cuya legalidad debe ser revisada.',
      'Existe requerimiento de prisión preventiva en un proceso de este tipo.',
      'La imputación involucra a varias personas y debe delimitarse la conducta individual.',
    ],
    process: [
      {
        step: '01',
        title: 'Estudio del expediente',
        description:
          'Revisamos la imputación y los elementos de convicción, prestando especial atención a la calificación como organización criminal.',
      },
      {
        step: '02',
        title: 'Control de legalidad',
        description:
          'Verificamos la validez de las diligencias practicadas y de las autorizaciones judiciales que las respaldan.',
      },
      {
        step: '03',
        title: 'Defensa en audiencias',
        description:
          'Intervenimos en las audiencias del proceso, incluidas las referidas a medidas de coerción personal y real.',
      },
      {
        step: '04',
        title: 'Etapa intermedia y juicio',
        description:
          'Cuestionamos la acusación en lo que corresponda y asumimos la defensa en el juicio oral.',
      },
    ],
    documents: [
      'Disposición fiscal o resolución judicial notificada.',
      'Copia del expediente o de la carpeta fiscal disponible.',
      'Documentación vinculada a los hechos imputados.',
      'Documento de identidad del patrocinado.',
      'Antecedentes de procesos relacionados, si existen.',
    ],
    content: [
      { type: 'h2', text: 'Delimitar la imputación individual' },
      {
        type: 'p',
        text: 'En procesos con varios investigados, uno de los ejes de la defensa es precisar qué conducta concreta se atribuye a cada persona. Una imputación genérica dificulta el ejercicio del derecho de defensa y puede cuestionarse por esa vía.',
      },
      { type: 'note', text: ORIENTATIVE_NOTE },
    ],
    image_url: null,
    sort_order: 3,
    is_active: true,
    seo_title: 'Defensa en procesos por crimen organizado — Abogados penalistas',
    seo_description:
      'Defensa técnica en procesos regidos por las reglas de criminalidad organizada: calificación, control de legalidad, plazos y medidas de coerción.',
    faqs: [
      {
        id: serviceFaqId(8, 1),
        service_id: serviceId(8),
        question: '¿Qué cambia si el caso se tramita como crimen organizado?',
        answer:
          'Se aplican reglas procesales especiales, entre ellas plazos de investigación más amplios y determinadas técnicas de investigación. Por eso la calificación misma suele ser objeto de discusión.',
        sort_order: 1,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(8, 2),
        service_id: serviceId(8),
        question: '¿Se puede cuestionar esa calificación?',
        answer:
          'Sí. La existencia de una organización criminal debe sustentarse con elementos concretos, y la defensa puede discutir esa calificación a lo largo del proceso.',
        sort_order: 2,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(8, 3),
        service_id: serviceId(8),
        question: '¿Cuánto puede durar la investigación?',
        answer:
          'Estos procesos admiten plazos más extensos que los ordinarios, y su duración real depende del número de investigados y de las diligencias pendientes. Es una variable que no depende del estudio.',
        sort_order: 3,
        created_at: SERVICE_TS.created_at,
      },
    ],
  },

  /* -------------------------- 09. Prisión preventiva ------------------------ */
  {
    ...SERVICE_TS,
    id: serviceId(9),
    area_id: AREA,
    slug: 'prision-preventiva',
    name: 'Prisión preventiva',
    short_description:
      'Defensa en audiencias de prisión preventiva y solicitudes de cesación, variación o apelación de la medida.',
    description: [
      'La prisión preventiva es una medida cautelar, no una condena anticipada. Para dictarla, el juez debe verificar que concurran de manera conjunta los presupuestos que la ley exige, entre ellos elementos de convicción graves y fundados, la prognosis de pena y el peligro procesal.',
      'La audiencia en la que se debate es breve y decisiva. Se resuelve sobre lo que las partes logren sustentar allí, con la documentación disponible en ese momento: arraigo domiciliario, laboral y familiar, antecedentes y circunstancias personales.',
      'Intervenimos tanto en la audiencia inicial como en las vías posteriores: apelación de la medida, solicitud de cesación cuando varían los presupuestos y pedidos de variación por medidas menos gravosas.',
    ],
    when_needed: [
      'El Ministerio Público ha requerido prisión preventiva contra usted o un familiar.',
      'Se ha dictado la medida y corresponde evaluar su apelación.',
      'Han variado las circunstancias que sustentaron la prisión preventiva.',
      'Se busca sustituirla por una medida menos gravosa.',
      'El plazo de la medida está por vencer o se ha solicitado su prolongación.',
    ],
    process: [
      {
        step: '01',
        title: 'Revisión urgente',
        description:
          'Analizamos el requerimiento fiscal y los elementos que lo sustentan. Es una etapa con plazos muy breves, de modo que el contacto temprano es determinante.',
      },
      {
        step: '02',
        title: 'Preparación del arraigo',
        description:
          'Reunimos la documentación que acredita domicilio, ocupación y vínculos familiares, elementos centrales al discutir el peligro procesal.',
      },
      {
        step: '03',
        title: 'Audiencia',
        description:
          'Asumimos la defensa en la audiencia, discutiendo cada presupuesto de la medida y proponiendo alternativas menos gravosas cuando corresponde.',
      },
      {
        step: '04',
        title: 'Vías posteriores',
        description:
          'Según el resultado, evaluamos la apelación, la solicitud de cesación o el pedido de variación de la medida.',
      },
    ],
    documents: [
      'Requerimiento fiscal notificado.',
      'Documento de identidad del investigado.',
      'Documentación de arraigo domiciliario: título de propiedad, contrato de alquiler o recibos de servicios.',
      'Documentación de arraigo laboral: contrato de trabajo, boletas o constancia de actividad.',
      'Partidas de nacimiento o matrimonio que acrediten vínculos familiares.',
    ],
    content: [
      { type: 'h2', text: 'El arraigo se acredita, no se afirma' },
      {
        type: 'p',
        text: 'En la audiencia pesa la documentación, no las declaraciones generales. Reunir con anticipación los documentos que acreditan domicilio, trabajo y familia es la preparación más útil que puede hacerse antes de la fecha.',
      },
      { type: 'note', text: ORIENTATIVE_NOTE },
    ],
    image_url: null,
    sort_order: 4,
    is_active: true,
    seo_title: 'Prisión preventiva — Defensa en audiencia y cesación',
    seo_description:
      'Defensa en audiencias de prisión preventiva: presupuestos de la medida, acreditación del arraigo, apelación, cesación y variación.',
    faqs: [
      {
        id: serviceFaqId(9, 1),
        service_id: serviceId(9),
        question: '¿Cuánto tiempo hay para preparar la audiencia?',
        answer:
          'Los plazos son muy breves y se cuentan desde la notificación del requerimiento. Por eso conviene contactar a un abogado apenas se toma conocimiento, incluso antes de tener la documentación completa.',
        sort_order: 1,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(9, 2),
        service_id: serviceId(9),
        question: '¿Se puede pedir la cesación de la medida?',
        answer:
          'Sí, cuando aparecen nuevos elementos que demuestran que ya no concurren los presupuestos que la sustentaron. Es una vía distinta de la apelación y tiene sus propios requisitos.',
        sort_order: 2,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(9, 3),
        service_id: serviceId(9),
        question: '¿Existen alternativas a la prisión preventiva?',
        answer:
          'El ordenamiento contempla medidas menos gravosas, como la comparecencia con restricciones. Su procedencia depende de los presupuestos que el juez considere acreditados en el caso concreto.',
        sort_order: 3,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(9, 4),
        service_id: serviceId(9),
        question: '¿Atienden con urgencia?',
        answer:
          'Estos casos se evalúan de forma prioritaria. Para una consulta inmediata, el canal más rápido es WhatsApp; desde ahí coordinamos la revisión del requerimiento.',
        sort_order: 4,
        created_at: SERVICE_TS.created_at,
      },
    ],
  },

  /* ---------------- 10. Delitos contra la administración pública ------------ */
  {
    ...SERVICE_TS,
    id: serviceId(10),
    area_id: AREA,
    slug: 'delitos-administracion-publica',
    name: 'Delitos contra la administración pública',
    short_description:
      'Defensa de funcionarios, servidores públicos y particulares en investigaciones por delitos contra la administración pública.',
    description: [
      'Estas investigaciones alcanzan tanto a funcionarios y servidores públicos como a particulares que intervienen en contrataciones o procedimientos administrativos. La discusión suele centrarse en la competencia funcional, en la documentación del procedimiento y en el deber concreto que se atribuye como infringido.',
      'Casi siempre son casos documentales: expedientes de contratación, informes técnicos, actas y resoluciones administrativas. Reconstruir con precisión qué decidió cada persona, en qué momento y con qué información disponible es el núcleo del trabajo de defensa.',
      'Con frecuencia coexisten con procedimientos administrativos disciplinarios o de responsabilidad ante el órgano de control, que tienen plazos y consecuencias propias y deben atenderse en paralelo.',
    ],
    when_needed: [
      'Es funcionario o servidor público y ha sido citado en una investigación.',
      'Participó como particular en una contratación pública bajo investigación.',
      'Existe un informe de control que derivó en una denuncia penal.',
      'Afronta al mismo tiempo un procedimiento administrativo disciplinario.',
      'Necesita revisar su exposición antes de suscribir o aprobar un acto.',
    ],
    process: [
      {
        step: '01',
        title: 'Delimitación funcional',
        description:
          'Identificamos las competencias efectivas del patrocinado según normativa interna, manuales de organización y documentación del procedimiento.',
      },
      {
        step: '02',
        title: 'Reconstrucción documental',
        description:
          'Ordenamos el expediente administrativo y la secuencia de actos, informes y decisiones vinculados a la imputación.',
      },
      {
        step: '03',
        title: 'Defensa en el proceso',
        description:
          'Intervenimos en las diligencias y audiencias, y atendemos en paralelo los procedimientos administrativos relacionados.',
      },
      {
        step: '04',
        title: 'Etapa intermedia y juicio',
        description:
          'Discutimos la acusación en el control correspondiente y asumimos la defensa en el juicio oral cuando el caso llega a esa etapa.',
      },
    ],
    documents: [
      'Citación, disposición fiscal o informe de control notificado.',
      'Resolución de designación en el cargo y documentación de funciones.',
      'Expediente de contratación o procedimiento administrativo involucrado.',
      'Informes técnicos, actas y resoluciones emitidas.',
      'Comunicaciones internas relacionadas con los hechos.',
    ],
    content: [
      { type: 'h2', text: 'Vía penal y vía administrativa' },
      {
        type: 'p',
        text: 'Un mismo hecho puede dar lugar a un proceso penal y a un procedimiento administrativo, que se rigen por reglas y plazos distintos. Atenderlos de forma coordinada evita que lo actuado en uno perjudique la posición en el otro.',
      },
      { type: 'note', text: ORIENTATIVE_NOTE },
    ],
    image_url: null,
    sort_order: 5,
    is_active: true,
    seo_title: 'Delitos contra la administración pública — Defensa legal',
    seo_description:
      'Defensa de funcionarios y particulares en investigaciones por delitos contra la administración pública, con atención a los procedimientos administrativos paralelos.',
    faqs: [
      {
        id: serviceFaqId(10, 1),
        service_id: serviceId(10),
        question: '¿Un particular puede ser investigado por estos delitos?',
        answer:
          'Sí. Los particulares que intervienen en procedimientos o contrataciones con el Estado pueden resultar comprendidos en la investigación según la figura que se impute.',
        sort_order: 1,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(10, 2),
        service_id: serviceId(10),
        question: '¿Qué ocurre con el procedimiento administrativo?',
        answer:
          'Avanza con sus propios plazos y puede derivar en sanciones independientes del resultado penal. Conviene atender ambos frentes de manera coordinada desde el inicio.',
        sort_order: 2,
        created_at: SERVICE_TS.created_at,
      },
      {
        id: serviceFaqId(10, 3),
        service_id: serviceId(10),
        question: '¿Qué documentación debo reunir primero?',
        answer:
          'La que acredite sus funciones efectivas y su intervención concreta: resolución de designación, manual de funciones y los actos del expediente en los que participó.',
        sort_order: 3,
        created_at: SERVICE_TS.created_at,
      },
    ],
  },
];
