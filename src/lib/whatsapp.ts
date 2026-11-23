/**
 * ---------------------------------------------------------------------------
 * WHATSAPP
 * ---------------------------------------------------------------------------
 * El sitio usa enlaces `wa.me`, que no requieren cuenta de empresa, token ni
 * servicio externo. El número y el mensaje por defecto se administran desde
 * /admin/configuracion.
 *
 * PARA CONECTAR LA API OFICIAL (WhatsApp Cloud API) MÁS ADELANTE:
 *   1. Definir WHATSAPP_PHONE_NUMBER_ID y WHATSAPP_TOKEN en el entorno.
 *   2. Implementar `sendTemplateMessage` con una llamada del lado servidor al
 *      endpoint de mensajes de la Cloud API.
 *   3. Invocarla desde las Server Actions de consultas y citas para notificar
 *      al estudio o confirmar la recepción a la persona solicitante.
 * ---------------------------------------------------------------------------
 */

export function buildWhatsappUrl(number: string, message: string) {
  return `https://wa.me/${number.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
}

/** Mensaje contextual para la página de un servicio. */
export function serviceMessage(serviceName: string) {
  return `Hola, deseo solicitar una consulta sobre ${serviceName.toLowerCase()}.`;
}

/** Mensaje contextual para la ficha de un abogado. */
export function lawyerMessage(lawyerName: string) {
  return `Hola, deseo coordinar una consulta con ${lawyerName}.`;
}

/** Mensaje contextual para un artículo del blog. */
export function articleMessage(title: string) {
  return `Hola, leí el artículo «${title}» y quisiera una consulta sobre mi caso.`;
}

/**
 * Pendiente de implementación: requiere credenciales de la Cloud API.
 * Se deja el punto de conexión definido para no dispersar la integración.
 */
export async function sendTemplateMessage(): Promise<{ ok: boolean; reason: string }> {
  return {
    ok: false,
    reason:
      'La API oficial de WhatsApp no está conectada. Configurar WHATSAPP_TOKEN y WHATSAPP_PHONE_NUMBER_ID e implementar esta función.',
  };
}
